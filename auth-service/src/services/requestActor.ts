// src/services/requestActor.ts
//
// Autore di una richiesta per i log di audit (ADR034): ricavato da
// req.account, valorizzato da authenticate() (modules/auth/middleware/
// authMiddleware.ts) sulle route protette. null sulle route pubbliche.
import type { Request } from 'express';
import type { LogActor } from './logger';

export function requestActor(req: Request): LogActor | null {
  const account = (req as unknown as { account?: { accountId?: number; email?: string; tenantId?: number | null } })
    .account;
  if (account?.accountId == null) return null;
  return { id: account.accountId, email: account.email ?? null, tenantId: account.tenantId ?? null };
}
