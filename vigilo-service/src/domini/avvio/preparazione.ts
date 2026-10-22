// =============================================================================
// Chi prepara Vigilo (ADR084, ADR087, ADR088) — regole pure
// =============================================================================
// All'attivazione EDG sceglie se Vigilo lo prepara il cliente o EDG, e i
// settori suggeriti (tenant_modules.config). Se prepara EDG, la procedura di
// avvio la fa solo un operatore EDG entrato nel tenant con l'accesso
// assistito in modalità Preparazione; dopo l'avvio ("Aggiungi dalla
// libreria") torna di chi ha il permesso di configurazione.
// =============================================================================
import type { AssistenzaUtente } from '../../core/middleware/auth';

export type ChiPrepara = 'cliente' | 'edg';

export interface Preparazione {
  chi: ChiPrepara;
  /** Settori che la procedura di avvio trova già scelti */
  modelli: string[];
}

/** Legge tenant_modules.config: senza scelte prepara il cliente, senza settori suggeriti */
export function leggiPreparazione(config: Record<string, unknown> | null | undefined): Preparazione {
  const c = config ?? {};
  const modelli = Array.isArray(c.modelli) ? c.modelli.filter((m): m is string => typeof m === 'string') : [];
  return { chi: c.preparazione === 'edg' ? 'edg' : 'cliente', modelli };
}

/** Sessione assistita in Preparazione proprio in questo tenant */
export const inPreparazioneQui = (assistenza: AssistenzaUtente | null | undefined, idTenant: number): boolean =>
  assistenza?.modo === 'preparazione' && assistenza.tenant?.id === idTenant;

/**
 * Può fare la procedura di avvio? (il permesso di configurazione si controlla a parte)
 *   - dopo il primo avvio sì: "Aggiungi dalla libreria" è del cliente;
 *   - se prepara il cliente sì;
 *   - se prepara EDG solo nella sessione assistita in Preparazione.
 */
export function puoAvviare(p: Preparazione, avviato: boolean, assistenza: AssistenzaUtente | null | undefined, idTenant: number): boolean {
  if (avviato || p.chi === 'cliente') return true;
  return inPreparazioneQui(assistenza, idTenant);
}
