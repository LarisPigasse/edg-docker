// =============================================================================
// Valori strutturali di Vigilo (02-modello-dati, 04-avvisi)
// =============================================================================
// Gli elenchi decisi nell'analisi, non personalizzabili dal cliente: una sola
// fonte per i CHECK della migrazione (stessi valori), la validazione dei
// modelli e gli schemi delle API. Le categorie, i campi e i controlli invece
// sono del cliente e stanno nelle tabelle.
// =============================================================================

export const TIPI_SOGGETTO = ['veicolo', 'macchina', 'attrezzatura', 'sede', 'persona', 'azienda'] as const;
export type TipoSoggetto = (typeof TIPI_SOGGETTO)[number];

export const STATI_SOGGETTO = ['in-servizio', 'fermo', 'dismesso'] as const;
export type StatoSoggetto = (typeof STATI_SOGGETTO)[number];

export const NATURE = ['adempimento', 'manutenzione', 'abilitazione', 'documento', 'pagamento', 'promemoria'] as const;
export type Natura = (typeof NATURE)[number];

/** Natura propria delle scadenze senza controllo (passo 8): il guasto. I controlli non la usano */
export const NATURE_SCADENZA = ['riparazione'] as const;
export type NaturaScadenza = (typeof NATURE_SCADENZA)[number];
/** La natura di una scadenza come si vede: quella propria, del controllo o promemoria */
export type NaturaEffettiva = Natura | NaturaScadenza;

export const RINNOVI = ['conferma', 'tacito'] as const;
export type Rinnovo = (typeof RINNOVI)[number];

export const MOTIVI_CHIUSURA = [
  'rinnovata',
  'completata',
  'fine-ricorrenza',
  'soggetto-dismesso',
  'controllo-disattivato',
] as const;
export type MotivoChiusura = (typeof MOTIVI_CHIUSURA)[number];

export const TIPI_REGISTRAZIONE = ['esecuzione', 'rinvio', 'rinnovo-tacito'] as const;
export type TipoRegistrazione = (typeof TIPI_REGISTRAZIONE)[number];

export const STATI_REGISTRAZIONE = ['confermata', 'da-confermare', 'respinta'] as const;
export type StatoRegistrazione = (typeof STATI_REGISTRAZIONE)[number];

export const ESITI = ['positivo', 'negativo'] as const;
export type Esito = (typeof ESITI)[number];

/** Chi ha fatto il lavoro di una registrazione (passo 8) */
export const ESECUZIONI = ['interna', 'esterna', 'entrambe'] as const;
export type Esecuzione = (typeof ESECUZIONI)[number];

export const FONTI_LETTURA = ['manuale', 'registrazione', 'telematica', 'importazione'] as const;
export type FonteLettura = (typeof FONTI_LETTURA)[number];

export const ENTITA_ALLEGATO = ['soggetto', 'scadenza', 'registrazione'] as const;
export type EntitaAllegato = (typeof ENTITA_ALLEGATO)[number];

export const CANALI = ['app', 'email', 'whatsapp'] as const;
export type Canale = (typeof CANALI)[number];

export const STATI_CONSEGNA = ['in-coda', 'inviato', 'fallito', 'letto', 'risolto'] as const;
export type StatoConsegna = (typeof STATI_CONSEGNA)[number];

export const FREQUENZE_AVVISI = ['riepilogo-giornaliero', 'riepilogo-settimanale', 'subito', 'mai'] as const;
export type FrequenzaAvvisi = (typeof FREQUENZE_AVVISI)[number];

export const TIPI_VOCE_MODELLO = ['categoria', 'controllo'] as const;
export type TipoVoceModello = (typeof TIPI_VOCE_MODELLO)[number];

// -----------------------------------------------------------------------------
// Registro delle decisioni sulla libreria (ADR074)
// -----------------------------------------------------------------------------

export const CONTESTI_DECISIONE = ['avvio', 'aggiornamento'] as const;
export type ContestoDecisione = (typeof CONTESTI_DECISIONE)[number];

export const ENTITA_DECISIONE = ['categoria', 'controllo'] as const;
export type EntitaDecisione = (typeof ENTITA_DECISIONE)[number];

/** avvio: incluso/escluso; aggiornamento: accettato/parziale/rifiutato */
export const ESITI_DECISIONE = ['incluso', 'escluso', 'accettato', 'parziale', 'rifiutato'] as const;
export type EsitoDecisione = (typeof ESITI_DECISIONE)[number];

/** Un campo di un aggiornamento: il valore del cliente, quello proposto e quale ha scelto */
export interface CampoDecisione {
  campo: string;
  mio: unknown;
  libreria: unknown;
  scelto: 'mio' | 'libreria';
}

// -----------------------------------------------------------------------------
// Date dei soggetti (libreria-bozza, proposta C)
// -----------------------------------------------------------------------------

/** Una data nei `dati` del soggetto: da qui partono prime scadenze e fasce d'eta' */
export interface DataSoggetto {
  chiave: string;
  etichetta: string;
  /** Con la preposizione, per le frasi delle cadenze: "dall'immatricolazione" */
  da: string;
}

const FABBRICAZIONE: DataSoggetto = { chiave: 'fabbricazione', etichetta: 'Fabbricazione', da: 'dalla fabbricazione' };
const MESSA_IN_SERVIZIO: DataSoggetto = { chiave: 'messaInServizio', etichetta: 'Messa in servizio', da: 'dalla messa in servizio' };

/**
 * Le date che ogni tipo di soggetto porta nei `dati` (schema fisso nel
 * codice, passo 2). La libreria puo' usare in `prima.da` e `fasce.da` solo
 * queste chiavi (controllo alla sincronizzazione, blocco B4).
 */
export const DATE_SOGGETTO: Record<TipoSoggetto, readonly DataSoggetto[]> = {
  veicolo: [{ chiave: 'immatricolazione', etichetta: 'Immatricolazione', da: "dall'immatricolazione" }],
  macchina: [FABBRICAZIONE, MESSA_IN_SERVIZIO],
  attrezzatura: [FABBRICAZIONE, MESSA_IN_SERVIZIO],
  sede: [
    {
      chiave: 'conformitaImpianto',
      etichetta: "Dichiarazione di conformità dell'impianto elettrico",
      da: "dalla dichiarazione di conformità dell'impianto",
    },
  ],
  persona: [
    { chiave: 'nascita', etichetta: 'Data di nascita', da: 'dalla nascita' },
    { chiave: 'assunzione', etichetta: 'Assunzione', da: "dall'assunzione" },
  ],
  azienda: [],
};

/** Le etichette "da..." di un tipo, per descriviCadenza */
export const etichetteDate = (tipo: TipoSoggetto): Record<string, string> =>
  Object.fromEntries(DATE_SOGGETTO[tipo].map(d => [d.chiave, d.da]));

// -----------------------------------------------------------------------------
// Forme delle colonne JSON proprie dei domini (i 4 gruppi ereditabili sono in
// regole/tipi.ts)
// -----------------------------------------------------------------------------

/** Campo aggiuntivo di una categoria (02-modello-dati, categorie.campi) */
export interface CampoAggiuntivo {
  chiave: string;
  etichetta: string;
  tipo: 'testo' | 'numero' | 'data' | 'elenco' | 'si-no';
  opzioni?: string[];
  obbligatorio: boolean;
  ordine: number;
}

/** Per ogni dato della registrazione: obbligatorio, facoltativo o nascosto */
export type Richiesta = 'obbligatorio' | 'facoltativo' | 'nascosto';
export type DatoRegistrazione = 'importo' | 'fornitore' | 'riferimento' | 'lettura' | 'allegato' | 'manodopera';
export type RegoleRegistrazione = Partial<Record<DatoRegistrazione, Richiesta>>;

/** Una riga di manodopera interna (passo 8): costoOrario copiato al momento della registrazione */
export interface RigaManodopera {
  /** La persona (soggetto) che ha lavorato; null = "dipendente", con il costo predefinito */
  idPersona: number | null;
  /** Il nome della persona, copiato come il costo: lo storico resta leggibile */
  nome: string | null;
  ore: number;
  /** €/h applicato, null se non c'era nessun costo (né della persona né predefinito) */
  costoOrario: number | null;
}

/** Fotografia dei valori copiati dalla libreria (passo 3.6) */
export type Origine = Record<string, unknown>;
