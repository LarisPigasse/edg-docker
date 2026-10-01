// src/modules/auth/services/ModuleError.ts

/**
 * Errore di dominio della gestione moduli (ADR047): una regola violata, con lo
 * stato HTTP da restituire e un messaggio gia' pronto per l'utente.
 * I servizi lo lanciano, il controller lo traduce in risposta e in audit
 * "tentativo rifiutato" (ADR034). Tutto il resto e' un errore imprevisto.
 */
export class ModuleError extends Error {
  constructor(
    public readonly status: 400 | 404 | 409,
    message: string
  ) {
    super(message);
    this.name = 'ModuleError';
  }
}

export const isModuleError = (err: unknown): err is ModuleError => err instanceof ModuleError;
