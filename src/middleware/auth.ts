// =============================================================================
// EDG Log Service - Auth Middleware
// Verifica x-gateway-secret e deserializza x-user-data iniettato dal gateway.
// NON gestisce JWT: la validazione JWT e' responsabilita' del gateway.
//
// Stesso identico schema di system-service (src/middleware/auth.ts): il
// gateway invia x-user-data come JSON stringificato con i campi
// { accountId, email, accountType, tenantId, roleId, permissions }.
//
// NOTA: log-service non ha un utils/response.ts condiviso (a differenza di
// system-service/auth-service) — le risposte qui seguono lo stesso formato
// piatto { message } gia' usato ovunque in questo servizio (vedi
// controllers/logController.ts), non introduco un formato nuovo.
// =============================================================================
import { Request, Response, NextFunction } from 'express';

// ---------------------------------------------------------------------------
// Interfaccia allineata con gatewayHeaders.js / system-service
// ---------------------------------------------------------------------------
export interface GatewayUser {
  id: number; // = accountId dal gateway
  email: string;
  role: string; // = accountType dal gateway
  tenantId: number | null;
  roleId: number;
  permissions: string[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: GatewayUser;
    }
  }
}

// ---------------------------------------------------------------------------
// Middleware: verifica gateway secret + deserializza utente
// ---------------------------------------------------------------------------
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // 1. Verifica gateway secret — impedisce chiamate dirette al servizio con
  //    header x-user-data forgiati, bypassando il gateway.
  const gatewaySecret = req.headers['x-gateway-secret'];
  const expectedSecret = process.env.GATEWAY_SECRET;

  if (!expectedSecret || gatewaySecret !== expectedSecret) {
    res.status(403).json({ message: 'Richiesta non autorizzata' });
    return;
  }

  // 2. Deserializza x-user-data
  const rawUserData = req.headers['x-user-data'];
  if (!rawUserData || typeof rawUserData !== 'string') {
    res.status(401).json({ message: 'Dati utente mancanti' });
    return;
  }

  try {
    const parsed = JSON.parse(rawUserData);

    if (!parsed.accountId || !parsed.email) {
      res.status(401).json({ message: 'Dati utente non validi' });
      return;
    }

    req.user = {
      id: parsed.accountId,
      email: parsed.email,
      role: parsed.accountType || 'unknown',
      tenantId: parsed.tenantId ?? null,
      roleId: parsed.roleId,
      permissions: parsed.permissions || [],
    };

    next();
  } catch {
    res.status(401).json({ message: 'Impossibile leggere i dati utente' });
  }
}
