// =============================================================================
// Parametri di log-service — dall'ambiente, con limiti invalicabili (ADR093)
// =============================================================================
// Un valore assente o non numerico vale il predefinito; uno fuori dai limiti si
// ferma al bordo e lo si scrive nel log. Il servizio non si ferma mai per un
// errore di configurazione.
// =============================================================================

export interface Limiti {
  predefinito: number;
  min: number;
  max: number;
}

/** Il valore dentro i limiti (pura) */
export const limita = (v: number, l: Limiti): number => Math.min(l.max, Math.max(l.min, v));

/** Il valore di una variabile o di un parametro di richiesta, dentro i limiti (pura) */
export function valoreLimitato(grezzo: unknown, l: Limiti): number {
  const n = typeof grezzo === 'number' ? grezzo : typeof grezzo === 'string' && grezzo.trim() !== '' ? Number(grezzo) : NaN;
  return Number.isFinite(n) ? limita(Math.round(n), l) : l.predefinito;
}

function parametro(nome: string, l: Limiti): number {
  const v = valoreLimitato(process.env[nome], l);
  if (process.env[nome] !== undefined && String(v) !== String(process.env[nome]).trim())
    console.warn(`[Parametri] ${nome}=${process.env[nome]} non valido o fuori dai limiti ${l.min}-${l.max}: vale ${v}`);
  return v;
}

export const LIMITI = {
  /** Riepilogo dell'uso di un tenant (fase 2, ADR117): giorni guardati; la richiesta può chiederne altri dentro i limiti */
  usoGiorni: { predefinito: 32, min: 1, max: 256 },
} as const satisfies Record<string, Limiti>;

export const PARAMETRI = {
  usoGiorni: parametro('LOG_USO_GIORNI', LIMITI.usoGiorni),
} as const;
