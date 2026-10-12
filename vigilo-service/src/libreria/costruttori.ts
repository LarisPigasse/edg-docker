// =============================================================================
// Libreria EDG — mattoncini per scrivere le voci in poche righe
// =============================================================================
// Valori legali esatti come nella norma; valori liberi in potenze di 2
// (libreria-bozza 1.1). I profili dei preavvisi sono quelli della 1.2.
// =============================================================================
import type { Ancoraggio, Cadenza, Destinatario, Durata, Fascia, Intervallo, Preavvisi, Tolleranza } from '../regole';
import type { TipoSoggetto } from '../domini/valori';
import type { Appartenenza, ChiaveModello, VoceCategoria, VoceControllo } from './tipi';

export const giorni = (valore: number): Durata => ({ valore, unita: 'giorni' });
export const mesi = (valore: number): Durata => ({ valore, unita: 'mesi' });
export const anni = (valore: number): Durata => ({ valore, unita: 'anni' });
export const km = (valore: number): Intervallo => ({ valore, unita: 'km' });
export const ore = (valore: number): Intervallo => ({ valore, unita: 'ore' });

interface OpzioniCadenza {
  uso?: Intervallo;
  /** Predefinito: dall'esecuzione */
  da?: Ancoraggio;
  fineMese?: boolean;
  prima?: { tempo: Durata; da: string };
  finestra?: Durata;
  fasce?: { da: string; elenco: Fascia[] };
}

/** Ogni `tempo` (null = solo a uso) */
export function ogni(tempo: Durata | null, o: OpzioniCadenza = {}): Cadenza {
  return {
    tempo,
    uso: o.uso ?? null,
    ancoraggio: o.da ?? 'esecuzione',
    fineMese: o.fineMese ?? false,
    prima: o.prima ?? null,
    ...(o.finestra ? { finestra: o.finestra } : {}),
    ...(o.fasce ? { fasce: o.fasce } : {}),
  };
}

/** Una tantum: la data arriva da `prima` o la sceglie il cliente */
export const unaTantum = (prima?: { tempo: Durata; da: string }): Cadenza => ({
  tempo: null,
  uso: null,
  ancoraggio: 'esecuzione',
  fineMese: false,
  prima: prima ?? null,
});

/** Fascia d'eta': da `oltre` la cadenza diventa `tempo` */
export const da = (oltre: Durata, tempo: Durata): Fascia => ({ oltre, tempo });

// -----------------------------------------------------------------------------
// Preavvisi (libreria-bozza 1.2)
// -----------------------------------------------------------------------------
const profilo = (giorni: number[], uso: number[] = []): Preavvisi => ({ giorni, uso });

export const PREAVVISI = {
  /** cicli brevi */
  breve: (uso: number[] = []) => profilo([8, 1], uso),
  /** pagamenti, polizze, promemoria, semestrali */
  normale: (uso: number[] = []) => profilo([32, 8, 1], uso),
  /** serve prenotare: revisioni, verifiche, visite, corsi */
  prenota: (uso: number[] = []) => profilo([64, 32, 8], uso),
  /** pratiche lunghe */
  lungo: (uso: number[] = []) => profilo([128, 64, 32], uso),
  /** su misura */
  giorni: (...g: number[]) => profilo(g),
};

/** Preavvisi a uso (libreria-bozza 1.2) */
export const USO = {
  leggeri: [2048, 512],
  pesanti: [4096, 1024],
  ore: [64, 16],
};

// -----------------------------------------------------------------------------
// Tolleranza
// -----------------------------------------------------------------------------
export const NESSUNA: Tolleranza = { giorni: 0, uso: 0 };
export const tolleranzaGiorni = (g: number): Tolleranza => ({ giorni: g, uso: 0 });

// -----------------------------------------------------------------------------
// Destinatari predefiniti per tipo (libreria-bozza 1.3)
// -----------------------------------------------------------------------------
const UFFICIO: Destinatario = { tipo: 'ufficio' };

export const DESTINATARI: Record<TipoSoggetto, Destinatario[]> = {
  veicolo: [UFFICIO, { tipo: 'assegnatario' }],
  macchina: [UFFICIO, { tipo: 'assegnatario' }],
  persona: [UFFICIO, { tipo: 'interessato' }],
  attrezzatura: [UFFICIO, { tipo: 'referente' }],
  sede: [UFFICIO, { tipo: 'referente' }],
  azienda: [UFFICIO],
};

// -----------------------------------------------------------------------------
// Voci
// -----------------------------------------------------------------------------

const LETTERE: Record<string, ChiaveModello> = { B: 'base', T: 'trasporto', L: 'logistica', A: 'agricoltura', E: 'edilizia' };

/**
 * Appartenenza ai modelli scritta come nella bozza: 'B T✓ L' = base e
 * logistica proposti, trasporto preselezionato.
 */
export function m(testo: string): Appartenenza {
  const risultato: Appartenenza = {};
  for (const pezzo of testo.trim().split(/\s+/)) {
    const chiave = LETTERE[pezzo[0]];
    if (!chiave || pezzo.length > 2 || (pezzo.length === 2 && pezzo[1] !== '✓')) throw new Error(`Modello non valido: "${pezzo}"`);
    risultato[chiave] = pezzo.endsWith('✓');
  }
  return risultato;
}

type BozzaControllo = Omit<VoceControllo, 'tipoSoggetto' | 'automatico' | 'tolleranza' | 'destinatari' | 'versione'> &
  Partial<Pick<VoceControllo, 'automatico' | 'tolleranza' | 'destinatari' | 'versione'>>;

/** Controlli di un tipo con i predefiniti: automatico, nessuna tolleranza, destinatari del tipo, versione 1 */
export const controlliDi =
  (tipoSoggetto: TipoSoggetto) =>
  (b: BozzaControllo): VoceControllo => ({
    tipoSoggetto,
    automatico: true,
    tolleranza: NESSUNA,
    destinatari: DESTINATARI[tipoSoggetto],
    versione: 1,
    ...b,
  });

type BozzaCategoria = Omit<VoceCategoria, 'tipoSoggetto' | 'versione'> & Partial<Pick<VoceCategoria, 'versione'>>;

export const categorieDi =
  (tipoSoggetto: TipoSoggetto) =>
  (b: BozzaCategoria): VoceCategoria => ({ tipoSoggetto, versione: 1, ...b });
