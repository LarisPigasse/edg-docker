// =============================================================================
// Parametri della piattaforma (ADR093)
// =============================================================================
// Valori che decide EDG, non il cliente: si cambiano con le variabili
// d'ambiente del servizio (docker-compose). Ognuno ha un predefinito e limiti
// che non si possono superare: un valore fuori limite si riporta dentro e si
// scrive nel log, un valore non numerico vale il predefinito. Il servizio non
// si ferma per un errore di configurazione.
// I valori che decide il cliente stanno nelle impostazioni del tenant
// (domini/impostazioni/limiti.ts); i limiti fissi (es. 128 voci per
// richiesta) restano costanti con un nome nel codice che li usa.
// =============================================================================

export interface Limiti {
  predefinito: number;
  min: number;
  max: number;
}

/** Il valore dentro i limiti (pura) */
export const limita = (valore: number, min: number, max: number): number => Math.min(max, Math.max(min, valore));

/** Il valore della variabile, dentro i limiti */
export function parametro(nome: string, l: Limiti, env: NodeJS.ProcessEnv = process.env): number {
  const grezzo = env[nome];
  if (grezzo === undefined || grezzo.trim() === '') return l.predefinito;
  const n = Number(grezzo);
  if (!Number.isFinite(n)) {
    console.warn(`[Parametri] ${nome}="${grezzo}" non è un numero: vale ${l.predefinito}`);
    return l.predefinito;
  }
  const v = limita(Math.round(n), l.min, l.max);
  if (v !== n) console.warn(`[Parametri] ${nome}=${grezzo} fuori dai limiti ${l.min}-${l.max}: vale ${v}`);
  return v;
}

export const LIMITI_PIATTAFORMA = {
  /** Ogni quanti minuti si cercano le email degli avvisi da mandare */
  giroEmailMinuti: { predefinito: 16, min: 4, max: 64 },
  /** Tentativi di invio di un'email prima di "fallito" */
  tentativiEmail: { predefinito: 4, min: 1, max: 8 },
  /** Righe lette per blocco nei giri su scadenze e consegne */
  lotto: { predefinito: 512, min: 64, max: 2048 },
  /** Attesa dopo una modifica prima di generare gli avvisi del tenant (ms) */
  attesaModificaMs: { predefinito: 4096, min: 1024, max: 16384 },
  /** Dimensione massima di un documento caricato (MB, B9a) */
  allegatoMb: { predefinito: 16, min: 1, max: 64 },
  /** Uso minimo nel periodo per mostrare il costo per km (B10c) */
  sogliaKm: { predefinito: 512, min: 64, max: 4096 },
  /** Uso minimo nel periodo per mostrare il costo per ora (B10c) */
  sogliaOre: { predefinito: 32, min: 8, max: 256 },
  /** Righe al massimo nel CSV delle spese: oltre si restringono periodo o filtri */
  esportaRighe: { predefinito: 16384, min: 1024, max: 65536 },
  /** Costo dei mezzi: oltre questa percentuale sopra la media della categoria il mezzo è segnalato */
  scostamentoPercento: { predefinito: 32, min: 8, max: 128 },
} as const satisfies Record<string, Limiti>;

export const PARAMETRI = {
  giroEmailMinuti: parametro('VIGILO_GIRO_EMAIL_MINUTI', LIMITI_PIATTAFORMA.giroEmailMinuti),
  tentativiEmail: parametro('VIGILO_TENTATIVI_EMAIL', LIMITI_PIATTAFORMA.tentativiEmail),
  lotto: parametro('VIGILO_LOTTO', LIMITI_PIATTAFORMA.lotto),
  attesaModificaMs: parametro('VIGILO_ATTESA_MODIFICA_MS', LIMITI_PIATTAFORMA.attesaModificaMs),
  allegatoMb: parametro('VIGILO_ALLEGATO_MB', LIMITI_PIATTAFORMA.allegatoMb),
  sogliaKm: parametro('VIGILO_SOGLIA_KM', LIMITI_PIATTAFORMA.sogliaKm),
  sogliaOre: parametro('VIGILO_SOGLIA_ORE', LIMITI_PIATTAFORMA.sogliaOre),
  esportaRighe: parametro('VIGILO_ESPORTA_RIGHE', LIMITI_PIATTAFORMA.esportaRighe),
  scostamentoPercento: parametro('VIGILO_SCOSTAMENTO_PERCENTO', LIMITI_PIATTAFORMA.scostamentoPercento),
} as const;
