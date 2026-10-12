// =============================================================================
// Tipi delle regole di Vigilo (02-modello-dati.md 2.2, 04-avvisi.md)
// =============================================================================
// I quattro gruppi ereditabili (cadenza, preavvisi, tolleranza, destinatari)
// hanno UNO schema, qui. Gli stessi oggetti stanno nelle colonne JSON di
// controlli e scadenze e nella libreria.
// =============================================================================
import type { Giorno } from './date';

export const UNITA_TEMPO = ['giorni', 'mesi', 'anni'] as const;
export type UnitaTempo = (typeof UNITA_TEMPO)[number];

export const UNITA_USO = ['km', 'ore'] as const;
export type UnitaUso = (typeof UNITA_USO)[number];

export interface Durata {
  valore: number;
  unita: UnitaTempo;
}

export interface Intervallo {
  valore: number;
  unita: UnitaUso;
}

/**
 * Da dove si conta la scadenza successiva:
 *   scadenza    dalla scadenza precedente (calendario fisso: bollo, RCA, rate)
 *   esecuzione  da quando si e' fatto (tagliando, visita medica)
 *   finestra    dalla scadenza se fatto entro `finestra` prima di essa,
 *               altrimenti dall'esecuzione (CQC, certificato ADR)
 */
export const ANCORAGGI = ['scadenza', 'esecuzione', 'finestra'] as const;
export type Ancoraggio = (typeof ANCORAGGI)[number];

/** Dall'eta' `oltre` del soggetto la cadenza diventa `tempo` */
export interface Fascia {
  oltre: Durata;
  tempo: Durata;
}

/**
 * Fasce d'eta' (libreria-bozza, proposta A): l'eta' si conta dalla data `da`
 * del soggetto (nascita, fabbricazione...) ed e' quella alla data da cui si
 * conta la scadenza successiva. Es. patente B: ogni 10 anni, 5 da 50 anni.
 */
export interface Fasce {
  da: string;
  elenco: Fascia[];
}

export interface Cadenza {
  /** A tempo; null = nessuna componente a tempo */
  tempo: Durata | null;
  /** A uso (km, ore); null = nessuna componente a uso */
  uso: Intervallo | null;
  /** Da dove si conta (vedi ANCORAGGI) */
  ancoraggio: Ancoraggio;
  /** Arrotonda all'ultimo giorno del mese (es. revisione) */
  fineMese: boolean;
  /** Prima scadenza diversa: dopo `tempo` dalla data `da` del soggetto (es. immatricolazione) */
  prima: { tempo: Durata; da: string } | null;
  /** Solo con ancoraggio 'finestra' (proposta B); assente = null */
  finestra?: Durata | null;
  /** La durata cambia con l'eta' del soggetto (proposta A); assente = null */
  fasce?: Fasce | null;
}

/** Nessuna componente: una tantum */
export const CADENZA_UNA_TANTUM: Cadenza = { tempo: null, uso: null, ancoraggio: 'scadenza', fineMese: false, prima: null };

export interface Preavvisi {
  /** Giorni prima della data (es. [32, 8, 1]) */
  giorni: number[];
  /** Unita' del contatore prima della soglia (es. [1024]) */
  uso: number[];
}

export interface Tolleranza {
  /** Giorni dopo la scadenza in cui il rinnovo e' ancora regolare; 0 = nessuna */
  giorni: number;
  /** Km/ore oltre la soglia; 0 = nessuna */
  uso: number;
}

export const NESSUNA_TOLLERANZA: Tolleranza = { giorni: 0, uso: 0 };

export type Destinatario =
  | { tipo: 'ufficio' | 'referente' | 'assegnatario' | 'interessato' }
  | { tipo: 'email'; email: string };

export interface Impostazioni {
  cadenza: Cadenza;
  preavvisi: Preavvisi;
  tolleranza: Tolleranza;
  destinatari: Destinatario[];
}

export const GRUPPI = ['cadenza', 'preavvisi', 'tolleranza', 'destinatari'] as const;
export type Gruppo = (typeof GRUPPI)[number];

/** Stato di una scadenza (01-dominio.md, 07-interfaccia.md 7.2) */
export const STATI = ['in-regola', 'in-scadenza', 'in-tolleranza', 'scaduta', 'da-completare'] as const;
export type Stato = (typeof STATI)[number];

/** Gravita' crescente: decide lo stato peggiore fra data e uso, e l'ordine del cruscotto */
export const GRAVITA: Record<Stato, number> = {
  'in-regola': 0,
  'da-completare': 1,
  'in-scadenza': 2,
  'in-tolleranza': 3,
  scaduta: 4,
};

/** Dove si trova una scadenza adesso, per i calcoli */
export interface PosizioneScadenza {
  scadeIl: Giorno | null;
  sogliaUso: number | null;
}
