// =============================================================================
// EDG Vehicle Service - Auth Middleware
// Verifica x-gateway-secret e deserializza x-user-data iniettato dal gateway
// NON gestisce JWT - la validazione JWT è responsabilità del gateway
//
// Il gateway invia x-user-data come JSON stringificato con i campi:
// { accountId, email, accountType, roleId, permissions }
// =============================================================================
import { Request, Response, NextFunction } from 'express';
import { unauthorized, forbidden } from '../utils/response';

// ---------------------------------------------------------------------------
// Interfaccia allineata con gatewayHeaders.js
// ---------------------------------------------------------------------------
export interface GatewayUser {
  id: number; // = accountId dal gateway
  uuid?: string; // non inviato dal gateway, opzionale
  email: string;
  role: string; // = accountType dal gateway
  roleId: number;
  permissions: string[];
}

declare global {
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
  // 1. Verifica gateway secret
  const gatewaySecret = req.headers['x-gateway-secret'];
  const expectedSecret = process.env.GATEWAY_SECRET;

  if (!expectedSecret || gatewaySecret !== expectedSecret) {
    forbidden(res, 'Richiesta non autorizzata');
    return;
  }

  // 2. Deserializza x-user-data (JSON semplice inviato dal gateway)
  const rawUserData = req.headers['x-user-data'];
  if (!rawUserData || typeof rawUserData !== 'string') {
    unauthorized(res, 'Dati utente mancanti');
    return;
  }

  try {
    const parsed = JSON.parse(rawUserData);

    if (!parsed.accountId || !parsed.email) {
      unauthorized(res, 'Dati utente non validi');
      return;
    }

    // Normalizza i campi del gateway verso l'interfaccia interna
    req.user = {
      id: parsed.accountId,
      email: parsed.email,
      role: parsed.accountType || 'unknown',
      roleId: parsed.roleId,
      permissions: parsed.permissions || [],
    };

    next();
  } catch {
    unauthorized(res, 'Impossibile leggere i dati utente');
  }
}

// ---------------------------------------------------------------------------
// Middleware: solo gateway secret (senza utente — per route interne)
// ---------------------------------------------------------------------------
export function requireGatewaySecret(req: Request, res: Response, next: NextFunction): void {
  const gatewaySecret = req.headers['x-gateway-secret'];
  const expectedSecret = process.env.GATEWAY_SECRET;

  if (!expectedSecret || gatewaySecret !== expectedSecret) {
    forbidden(res, 'Richiesta non autorizzata');
    return;
  }

  next();
}
