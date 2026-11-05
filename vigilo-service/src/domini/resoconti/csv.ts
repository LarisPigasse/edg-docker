// =============================================================================
// Resoconti — CSV delle registrazioni (regole pure)
// =============================================================================
// Il dettaglio delle spese del periodo (registrazioni e rifornimenti) in un CSV che Excel in italiano apre
// bene con un doppio clic: UTF-8 con BOM, punto e virgola, virgola decimale,
// date gg/mm/aaaa, righe con CRLF. Le celle di testo si proteggono dalle
// formule (una cella che comincia con = + - @ diventerebbe un calcolo in
// Excel): si fanno precedere da un apostrofo.
// =============================================================================
import type { Giorno } from '../../regole';
import type { Esecuzione, TipoSoggetto } from '../valori';
import type { NaturaResoconto } from './resoconti';

export const NATURA_CSV: Record<NaturaResoconto, string> = {
  adempimento: 'Adempimento',
  manutenzione: 'Manutenzione',
  abilitazione: 'Abilitazione',
  documento: 'Documento',
  pagamento: 'Pagamento',
  promemoria: 'Promemoria',
  riparazione: 'Riparazione',
  uso: 'Uso (rifornimenti)',
};

export const TIPO_CSV: Record<TipoSoggetto, string> = {
  veicolo: 'Veicolo',
  macchina: 'Macchina',
  attrezzatura: 'Attrezzatura',
  sede: 'Sede',
  persona: 'Persona',
  azienda: 'Azienda',
};

export const ESECUZIONE_CSV: Record<Esecuzione, string> = {
  interna: 'Interna',
  esterna: 'Esterna',
  entrambe: 'Interna ed esterna',
};

/** Una riga del dettaglio, già con i valori da scrivere */
export interface RigaCsv {
  giorno: Giorno;
  soggetto: string | null;
  identificativo: string | null;
  tipo: TipoSoggetto | null;
  sede: string | null;
  /** La scadenza, o la voce del rifornimento */
  scadenza: string;
  natura: NaturaResoconto;
  esecuzione: Esecuzione | null;
  fornitore: string | null;
  tipoFornitore: string | null;
  riferimento: string | null;
  /** Solo rifornimenti di carburante e AdBlue */
  litri: number | null;
  importo: number;
  ore: number;
  manodopera: number;
}

export const INTESTAZIONI_CSV = [
  'Data',
  'Soggetto',
  'Targa o codice',
  'Tipo',
  'Sede',
  'Scadenza',
  'Natura',
  'Eseguita',
  'Fornitore',
  'Tipo di fornitore',
  'Riferimento',
  'Litri',
  'Importo (€)',
  'Ore di manodopera',
  'Costo della manodopera (€)',
  'Totale (€)',
] as const;

const SEPARATORE = ';';
const A_CAPO = '\r\n';
const BOM = '﻿';

/** Una cella di testo: protetta dalle formule e tra virgolette se serve */
export function cellaCsv(valore: string | null | undefined): string {
  if (valore == null || valore === '') return '';
  const sicuro = /^[=+\-@\t\r]/.test(valore) ? `'${valore}` : valore;
  return /[;"\r\n]/.test(sicuro) ? `"${sicuro.replace(/"/g, '""')}"` : sicuro;
}

/**
 * Un codice (targa, partita IVA, codice fiscale): se è fatto di sole cifre e
 * comincia con zero o è lungo, Excel lo trasformerebbe in numero perdendo gli
 * zeri o le ultime cifre; ="…" lo tiene come testo.
 */
export function codiceCsv(valore: string | null | undefined): string {
  if (valore && /^\d+$/.test(valore) && (valore.startsWith('0') || valore.length > 15)) return `="${valore}"`;
  return cellaCsv(valore);
}

/** Un numero all'italiana, senza separatore delle migliaia: 1492,5 → "1492,50" */
export const numeroCsv = (n: number, decimali = 2): string => n.toFixed(decimali).replace('.', ',');

/** "2026-11-04" → "04/11/2026" */
export const dataCsv = (g: Giorno): string => `${g.slice(8, 10)}/${g.slice(5, 7)}/${g.slice(0, 4)}`;

/** Il file intero, con il BOM in testa */
export function testoCsv(righe: RigaCsv[]): string {
  const corpo = righe.map(r =>
    [
      dataCsv(r.giorno),
      cellaCsv(r.soggetto),
      codiceCsv(r.identificativo),
      r.tipo ? TIPO_CSV[r.tipo] : '',
      cellaCsv(r.sede),
      cellaCsv(r.scadenza),
      NATURA_CSV[r.natura] ?? r.natura,
      r.esecuzione ? ESECUZIONE_CSV[r.esecuzione] : '',
      cellaCsv(r.fornitore),
      cellaCsv(r.tipoFornitore),
      cellaCsv(r.riferimento),
      r.litri ? numeroCsv(r.litri) : '',
      r.importo ? numeroCsv(r.importo) : '',
      r.ore ? numeroCsv(r.ore) : '',
      r.manodopera ? numeroCsv(r.manodopera) : '',
      numeroCsv(r.importo + r.manodopera),
    ].join(SEPARATORE)
  );
  return BOM + [INTESTAZIONI_CSV.join(SEPARATORE), ...corpo].join(A_CAPO) + A_CAPO;
}

/** "spese-vigilo-2026-01-01-2026-11-04.csv" */
export const nomeFileCsv = (p: { dal: Giorno; al: Giorno }): string => `spese-vigilo-${p.dal}-${p.al}.csv`;
