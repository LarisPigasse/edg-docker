// =============================================================================
// Interventi: guasti, manodopera e costi (passo 8, B10a) — regole pure
// =============================================================================
//   naturaEffettiva     la natura come si vede: della scadenza (riparazione),
//                       del controllo, altrimenti promemoria
//   entroProposto       un guasto che blocca l'uso: oggi; altrimenti tra
//                       `giorniRiparazione` giorni (parametro del tenant)
//   erroriManodopera    righe persona + ore: al massimo 8, ore a quarti d'ora
//   costoOrarioDi       quello della persona, altrimenti il predefinito
//   costoManodopera     somma di ore × costo orario copiato nella riga
//   costoTotale         importo + manodopera
//   manodoperaPredefinita  se il controllo non dice altro: facoltativa per
//                       manutenzioni, riparazioni e adempimenti, nascosta per
//                       pagamenti, documenti, abilitazioni e promemoria
// Il guasto (B10a passo 2): su quali soggetti, il suo avviso immediato (che
// sostituisce i preavvisi: un guasto è già da fare) e quando il mezzo torna
// in servizio.
// =============================================================================
import { aggiungiGiorni, type Giorno } from '../../regole';
import type { Esecuzione, Natura, NaturaEffettiva, NaturaScadenza, Richiesta, RigaManodopera, StatoSoggetto, TipoSoggetto } from '../valori';

export const LIMITI_MANODOPERA = {
  /** Righe di manodopera per registrazione */
  righe: 8,
  /** Ore per riga, al massimo */
  oreMassime: 1024,
  /** Le ore si contano a quarti d'ora */
  passoOre: 0.25,
} as const;

/** La natura di una scadenza come si vede */
export const naturaEffettiva = (s: { natura?: NaturaScadenza | null }, controllo: { natura: Natura } | null | undefined): NaturaEffettiva =>
  s.natura ?? controllo?.natura ?? 'promemoria';

/** Il giorno proposto per riparare un guasto */
export const entroProposto = (bloccaUso: boolean, giorniRiparazione: number, oggi: Giorno): Giorno =>
  bloccaUso ? oggi : aggiungiGiorni(oggi, giorniRiparazione);

const multiplo = (n: number, passo: number) => Math.abs(Math.round(n / passo) * passo - n) < 1e-9;

/** Gli errori di un elenco di righe di manodopera (vuoto = valido), con parole per l'utente */
export function erroriManodopera(righe: { idPersona: number | null; ore: number }[]): string[] {
  const errori: string[] = [];
  const { righe: massimo, oreMassime, passoOre } = LIMITI_MANODOPERA;
  if (righe.length > massimo) errori.push(`Al massimo ${massimo} righe di manodopera`);
  if (righe.some(r => typeof r.ore !== 'number' || !Number.isFinite(r.ore) || r.ore <= 0 || r.ore > oreMassime))
    errori.push(`Le ore di ogni riga vanno da un quarto d'ora a ${oreMassime}`);
  else if (righe.some(r => !multiplo(r.ore, passoOre))) errori.push("Le ore si contano a quarti d'ora (es. 1,25)");
  const persone = righe.map(r => r.idPersona).filter((x): x is number => x != null);
  if (new Set(persone).size !== persone.length) errori.push('La stessa persona compare in due righe: somma le ore');
  return errori;
}

/** Il costo orario da copiare nella riga: della persona, altrimenti il predefinito (null = nessuno) */
export const costoOrarioDi = (persona: { costoOrario: number | null } | null | undefined, predefinito: number | null): number | null =>
  persona?.costoOrario ?? predefinito;

const centesimi = (n: number) => Math.round(n * 100) / 100;

/** Il costo della manodopera: le righe senza costo orario non contano (null se nessuna ha un costo) */
export function costoManodopera(righe: RigaManodopera[] | null | undefined): number | null {
  const conCosto = (righe ?? []).filter(r => r.costoOrario != null);
  return conCosto.length ? centesimi(conCosto.reduce((t, r) => t + r.ore * r.costoOrario!, 0)) : null;
}

/** Ore di manodopera in tutto (0 se nessuna riga) */
export const oreManodopera = (righe: RigaManodopera[] | null | undefined): number => (righe ?? []).reduce((t, r) => t + r.ore, 0);

/** Importo + manodopera; null se non c'è né l'uno né l'altra */
export function costoTotale(importo: number | null | undefined, righe: RigaManodopera[] | null | undefined): number | null {
  const m = costoManodopera(righe);
  if (importo == null && m == null) return null;
  return centesimi((importo ?? 0) + (m ?? 0));
}

/** Chi ha fatto il lavoro: quello scelto, altrimenti dedotto (manodopera → interna, fornitore → esterna, tutti e due → entrambe) */
export function deduciEsecuzione(scelta: Esecuzione | null | undefined, righeManodopera: number, conFornitore: boolean): Esecuzione | null {
  if (scelta) return scelta;
  if (righeManodopera && conFornitore) return 'entrambe';
  if (righeManodopera) return 'interna';
  return conFornitore ? 'esterna' : null;
}

/** La manodopera nel modulo Registra, se il controllo non dice altro */
export const manodoperaPredefinita = (natura: NaturaEffettiva): Richiesta =>
  natura === 'manutenzione' || natura === 'riparazione' || natura === 'adempimento' ? 'facoltativo' : 'nascosto';

// --- il guasto ---

/** I soggetti su cui si segnala un guasto (non persone e azienda) */
export const TIPI_CON_GUASTI: readonly TipoSoggetto[] = ['veicolo', 'macchina', 'attrezzatura', 'sede'];

export const LIMITI_GUASTO = {
  titolo: 160,
  descrizione: 4096,
} as const;

export const eventoGuasto = (idScadenza: number): string => `guasto:${idScadenza}`;

/** Lo stato nel testo dell'avviso: "guasto segnalato da Mario Rossi, blocca l'uso" */
export const statoGuasto = (chi: string | null, bloccaUso: boolean): string =>
  `guasto segnalato${chi ? ` da ${chi}` : ''}${bloccaUso ? ', blocca l’uso' : ''}`;

/** Un guasto non ha preavvisi: l'avviso nasce con lui; restano scaduta e richiami se resta indietro */
export const senzaPreavvisi = (natura: NaturaScadenza | null | undefined, tipoEvento: string): boolean =>
  natura === 'riparazione' && tipoEvento.startsWith('preavviso');

/** Riparato un guasto che bloccava il mezzo: torna in servizio solo se era sospeso e non ce ne sono altri che lo bloccano */
export const daRimettereInServizio = (g: { natura?: NaturaScadenza | null; bloccaUso?: boolean }, statoSoggetto: StatoSoggetto, altriBloccanti: number): boolean =>
  g.natura === 'riparazione' && !!g.bloccaUso && statoSoggetto === 'fermo' && altriBloccanti === 0;
