// =============================================================================
// Audit delle modifiche ai dati (ADR039): prima/dopo verso log-service
// =============================================================================
import type { Contesto } from '../contesto';
import { logger, snapshot } from './logger';

/**
 * Registra una modifica: creazione (solo dopo), modifica (prima e dopo),
 * eliminazione (solo prima). `azione` come 'vigilo.controllo.modificato'.
 */
export function traccia(ctx: Contesto, azione: string, messaggio: string, prima: unknown, dopo: unknown, meta: Record<string, unknown> = {}): void {
  logger.auditChange(azione, messaggio, ctx.utente, { precedente: snapshot(prima), nuovo: snapshot(dopo) }, { tenantId: ctx.idTenant, ...meta });
}
