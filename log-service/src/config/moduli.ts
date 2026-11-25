// =============================================================================
// Modulo di un evento (fase 1 dei log, passo 1b)
// =============================================================================
// Ogni evento porta il modulo della piattaforma a cui appartiene (es. 'vigilo'),
// per filtrare i log per modulo. Lo dice chi scrive l'evento (campo `modulo`,
// es. il gateway per gli accessi); se manca lo si ricava dal servizio che lo
// ha scritto (azione.entita) con questa tabella. Gli eventi senza modulo sono
// della piattaforma (autenticazione, sistema, email, backup, ...).
// Un servizio nuovo di un modulo = una riga qui (come config/serviceRoutes.js
// del gateway, da cui viene la corrispondenza).
// =============================================================================

/** Servizio (nome del container) → chiave del modulo nel catalogo di auth-service */
export const MODULO_DEL_SERVIZIO: Readonly<Record<string, string>> = Object.freeze({
  'vigilo-service': 'vigilo',
  // vecchio Vigilo, da togliere con vehicle-service (ADR060)
  'vehicle-service': 'vigilo',
});

/** Valore del filtro per gli eventi senza modulo */
export const PIATTAFORMA = 'piattaforma';

/** Forma di una chiave di modulo: minuscole, cifre e trattini, al massimo 32 caratteri */
const CHIAVE = /^[a-z][a-z0-9-]{0,31}$/;

/** La chiave se valida, altrimenti null (pura) */
export function chiaveModulo(valore: unknown): string | null {
  return typeof valore === 'string' && CHIAVE.test(valore) && valore !== PIATTAFORMA ? valore : null;
}

/**
 * Modulo di un evento (pura): quello dichiarato da chi scrive se valido,
 * altrimenti quello del servizio, altrimenti null (piattaforma).
 */
export function moduloEvento(dichiarato: unknown, servizio: unknown): string | null {
  return chiaveModulo(dichiarato) ?? (typeof servizio === 'string' ? (MODULO_DEL_SERVIZIO[servizio] ?? null) : null);
}
