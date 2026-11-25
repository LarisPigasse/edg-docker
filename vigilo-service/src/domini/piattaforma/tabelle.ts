// =============================================================================
// Dati di un tenant in Vigilo: quali tabelle e in che ordine (fase 3, ADR117)
// =============================================================================
// Due gruppi. I DATI si tolgono sempre; la CONFIGURAZIONE si tiene se si
// sceglie "solo i dati" (il tenant resta avviato, con categorie, controlli,
// impostazioni e regole degli avvisi) e si toglie con "tutto" (il tenant torna
// alla procedura di avvio). La configurazione non punta mai ai dati (i
// destinatari degli avvisi sono ruoli o email), i dati puntano alla
// configurazione (scadenze → controlli, soggetti → categorie): per questo
// prima i dati, poi la configurazione, e dentro ogni gruppo prima le figlie.
// Le tabelle comuni a tutti i tenant (libreria, tipi di fornitore) non ci sono.
// Un test controlla che ogni tabella con il tenant sia in uno dei due elenchi.
// =============================================================================

export const MODI_ELIMINAZIONE = ['tutto', 'dati'] as const;
export type ModoEliminazione = (typeof MODI_ELIMINAZIONE)[number];

/** Dati operativi, dalle figlie ai genitori */
export const TABELLE_DATI = [
  'consegne', // → avvisi
  'avvisi', // → scadenze
  'letture', // → contatori, registrazioni, rifornimenti
  'allegati', // → soggetti, scadenze, registrazioni, rifornimenti (con i file)
  'registrazioni', // → scadenze, fornitori, contatori
  'controlli_non_seguiti', // → soggetti, controlli
  'rifornimenti', // → soggetti, fornitori
  'scadenze', // → soggetti, controlli, contatori
  'contatori', // → soggetti
  'assegnazioni', // → soggetti
  'soggetti', // → categorie (e sé stessi: sede, referente)
  'fornitori', // → tipi di fornitore (comuni)
  'stime_costi',
  'costi_aziendali',
] as const;

/** Configurazione, dalle figlie ai genitori */
export const TABELLE_CONFIGURAZIONE = [
  'controlli_categorie', // → controlli, categorie
  'controlli',
  'categorie',
  'decisioni_libreria',
  'preferenze_avvisi',
  'recapiti_email',
  'impostazioni', // con l'avvio: senza, il tenant torna alla procedura di avvio
] as const;

export type TabellaTenant = (typeof TABELLE_DATI)[number] | (typeof TABELLE_CONFIGURAZIONE)[number];

/** Le tabelle da svuotare, nell'ordine giusto (pura) */
export const tabelleDaEliminare = (modo: ModoEliminazione): TabellaTenant[] =>
  modo === 'tutto' ? [...TABELLE_DATI, ...TABELLE_CONFIGURAZIONE] : [...TABELLE_DATI];

/** Che cosa resta dopo l'eliminazione, in parole (pura) */
export function cheCosaResta(modo: ModoEliminazione): string {
  return modo === 'tutto'
    ? 'Vigilo torna come appena attivato: al primo accesso ripropone la procedura di avvio.'
    : 'Restano categorie, controlli, impostazioni e regole degli avvisi: Vigilo resta avviato, senza soggetti né scadenze.';
}
