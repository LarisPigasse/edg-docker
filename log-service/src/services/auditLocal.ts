// src/services/auditLocal.ts
//
// Audit delle azioni utente svolte dentro log-service (regole e destinatari
// degli alert) — ADR034. Sottile adattatore su recordEvent (localEvents.ts):
// ricava l'attore dalla richiesta autenticata dal gateway.
import type { Request } from 'express';
import { recordEvent } from './localEvents';

export function auditLocal(
  req: Request,
  action: string,
  message: string,
  meta: Record<string, unknown> = {},
  failed = false
): void {
  const user = req.user;
  void recordEvent({
    categoria: 'DATA',
    tipo: action,
    criticita: failed ? 'warning' : 'info',
    esito: failed ? 'fallito' : 'successo',
    messaggio: message,
    dettagli: { ...meta, audit: true },
    attore: user ? { id: user.id, email: user.email, tenantId: user.tenantId } : null,
  });
}
