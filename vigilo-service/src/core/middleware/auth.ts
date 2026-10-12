// =============================================================================
// EDG Vigilo Service - Autenticazione dal gateway
// =============================================================================
// Il JWT lo valida il gateway (ADR060), che inoltra:
//   x-gateway-secret  prova che la richiesta viene dal gateway
//   x-user-data       JSON con accountId, email, tenantId, roleId,
//                     permissions, modules, systemTenant, sessionId
// Qui si verifica il segreto e si legge l'utente. Il TENANT viene SEMPRE da
// qui, mai da parametri o corpo della richiesta (ADR068).
// =============================================================================
import { Request, Response, NextFunction } from 'express';
import { unauthorized, forbidden } from '../utils/response';
import { setCurrentAccount } from '../services/requestContext';

export interface GatewayUser {
  /** accountId dal gateway */
  id: number;
  email: string;
  /** accountType dal gateway */
  role: string;
  tenantId: number | null;
  roleId: number;
  permissions: string[];
  /** Personale EDG (tenant di sistema), dal JWT firmato (ADR051) */
  systemTenant: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: GatewayUser;
    }
  }
}

const gatewaySecretOk = (req: Request): boolean => {
  const expected = process.env.GATEWAY_SECRET;
  return Boolean(expected) && req.headers['x-gateway-secret'] === expected;
};

/** Richiesta dal gateway con un utente valido */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!gatewaySecretOk(req)) {
    forbidden(res, 'Richiesta non autorizzata');
    return;
  }

  const raw = req.headers['x-user-data'];
  if (!raw || typeof raw !== 'string') {
    unauthorized(res, 'Dati utente mancanti');
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed.accountId || !parsed.email) {
      unauthorized(res, 'Dati utente non validi');
      return;
    }
    req.user = {
      id: parsed.accountId,
      email: parsed.email,
      role: parsed.accountType || 'unknown',
      tenantId: parsed.tenantId ?? null,
      roleId: parsed.roleId,
      permissions: Array.isArray(parsed.permissions) ? parsed.permissions : [],
      systemTenant: parsed.systemTenant === true,
    };
    setCurrentAccount(req.user.id);
    next();
  } catch {
    unauthorized(res, 'Impossibile leggere i dati utente');
  }
}

/** Tutti i dati di Vigilo sono di un tenant: senza tenant non si entra */
export function requireTenant(req: Request, res: Response, next: NextFunction): void {
  if (!req.user?.tenantId) {
    forbidden(res, 'Account senza tenant: Vigilo non disponibile');
    return;
  }
  next();
}

/** Solo il segreto del gateway, senza utente (rotte di servizio) */
export function requireGatewaySecret(req: Request, res: Response, next: NextFunction): void {
  if (!gatewaySecretOk(req)) {
    forbidden(res, 'Richiesta non autorizzata');
    return;
  }
  next();
}
