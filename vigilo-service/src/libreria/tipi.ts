// =============================================================================
// Libreria EDG — forma dei file (03-libreria-avvio, libreria-bozza.md)
// =============================================================================
// La libreria vive in file versionati (questa cartella) e all'avvio si
// sincronizza nelle tabelle libreria_* (sincronizza.ts). L'app legge SOLO le
// tabelle: un futuro editor in pro-frontend scrivera' li', e questi file
// resteranno il contenuto iniziale.
//
// Regola d'oro: chi cambia il contenuto di una voce ne aumenta la `versione`
// e scrive la `novita` (controllati dai test con versioni.json e dalla
// sincronizzazione): il cliente vede il perche' e la sua scelta resta nel
// registro delle decisioni (ADR074).
// =============================================================================
import type { UnitaUso, Cadenza, Destinatario, Preavvisi, Tolleranza } from '../regole';
import type { CampoAggiuntivo, Natura, RegoleRegistrazione, Rinnovo, TipoSoggetto } from '../domini/valori';

/** I modelli di settore (03-libreria-avvio 3.3) */
export const CHIAVI_MODELLO = ['base', 'trasporto', 'logistica', 'agricoltura', 'edilizia'] as const;
export type ChiaveModello = (typeof CHIAVI_MODELLO)[number];

/**
 * In quali modelli compare una voce: true = preselezionata nella procedura
 * di avvio, false = proposta ma non spuntata.
 */
export type Appartenenza = Partial<Record<ChiaveModello, boolean>>;

export interface VoceCategoria {
  chiave: string;
  tipoSoggetto: TipoSoggetto;
  nome: string;
  descrizione?: string;
  /** Nome di un'icona lucide (registro icone di @edg/ui) */
  icona?: string;
  campi?: CampoAggiuntivo[];
  contatori?: UnitaUso[];
  modelli: Appartenenza;
  versione: number;
  /** Dalla versione 2: che cosa cambia e perche' (lo vede il cliente nella proposta, ADR074) */
  novita?: string;
  ritirata?: boolean;
}

export interface VoceControllo {
  chiave: string;
  /** Codice della bozza (V01, F12...): solo per ritrovare la voce nella documentazione */
  codice: string;
  nome: string;
  descrizione?: string;
  natura: Natura;
  tipoSoggetto: TipoSoggetto;
  /** Chiavi delle categorie della libreria; vuoto = tutti i soggetti del tipo */
  categorie: string[];
  automatico: boolean;
  cadenza: Cadenza;
  preavvisi: Preavvisi;
  tolleranza: Tolleranza;
  destinatari: Destinatario[];
  rinnovo?: Rinnovo;
  rinviabile?: boolean;
  registrazione?: RegoleRegistrazione;
  riferimentoNormativo?: string;
  note?: string;
  modelli: Appartenenza;
  versione: number;
  /** Dalla versione 2: che cosa cambia e perche' (lo vede il cliente nella proposta, ADR074) */
  novita?: string;
  ritirato?: boolean;
}

export interface VoceModello {
  chiave: ChiaveModello;
  nome: string;
  descrizione: string;
  icona: string;
  ordine: number;
  sempreProposto: boolean;
  versione: number;
}

export interface Libreria {
  modelli: VoceModello[];
  categorie: VoceCategoria[];
  controlli: VoceControllo[];
}
