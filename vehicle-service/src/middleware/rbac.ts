// =============================================================================
// EDG Vehicle Service - RBAC Middleware
// Controllo permessi basato su modulo.azione (es: vehicles.read)
// I permessi arrivano da x-user-data iniettato dal gateway
// =============================================================================
import { Request, Response, NextFunction } from 'express';
import { forbidden, unauthorized } from '../utils/response';

// ---------------------------------------------------------------------------
// requirePermission(module, action)
// Verifica che req.user abbia il permesso "module.action"
// Supporta wildcard: "*" (superuser), "module.*" (accesso completo al modulo)
// Supporta negazione: "!module.action" (nega esplicitamente)
// ---------------------------------------------------------------------------
export function requirePermission(module: string, action: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      unauthorized(res);
      return;
    }

    const permissions: string[] = req.user.permissions || [];
    const target = `${module}.${action}`;

    // Nega esplicita — ha priorità su tutto
    if (
      permissions.includes(`!${target}`) ||
      permissions.includes(`!${module}.*`) ||
      permissions.includes('!*')
    ) {
      forbidden(res, `Permesso negato: ${target}`);
      return;
    }

    // Wildcard globale
    if (permissions.includes('*')) {
      next();
      return;
    }

    // Wildcard modulo
    if (permissions.includes(`${module}.*`)) {
      next();
      return;
    }

    // Permesso specifico
    if (permissions.includes(target)) {
      next();
      return;
    }

    forbidden(res, `Permesso mancante: ${target}`);
  };
}

// ---------------------------------------------------------------------------
// requireRole(role)
// Verifica che req.user abbia il ruolo specificato
// Accetta array per permettere più ruoli validi
// ---------------------------------------------------------------------------
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      unauthorized(res);
      return;
    }

    if (!roles.includes(req.user.role)) {
      forbidden(res, `Ruolo richiesto: ${roles.join(' o ')}`);
      return;
    }

    next();
  };
}

// ---------------------------------------------------------------------------
// requireSelfOrPermission(module, action)
// Permette se l'utente accede alla propria risorsa (uuid match)
// oppure se ha il permesso specificato
// ---------------------------------------------------------------------------
export function requireSelfOrPermission(module: string, action: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      unauthorized(res);
      return;
    }

    // L'utente accede alla propria risorsa
    if (req.params.id && req.params.id === req.user.uuid) {
      next();
      return;
    }

    // Altrimenti verifica il permesso
    const permissions: string[] = req.user.permissions || [];
    const target = `${module}.${action}`;

    if (
      permissions.includes('*') ||
      permissions.includes(`${module}.*`) ||
      permissions.includes(target)
    ) {
      next();
      return;
    }

    forbidden(res, `Permesso mancante: ${target}`);
  };
}
