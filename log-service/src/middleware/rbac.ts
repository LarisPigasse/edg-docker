// =============================================================================
// EDG Log Service - RBAC Middleware
// Controllo permessi basato su modulo.azione (es: sistema.logs), stesso
// schema di system-service (src/middleware/rbac.ts). I permessi arrivano da
// x-user-data iniettato dal gateway (vedi middleware/auth.ts — requireAuth
// va sempre eseguito prima di requirePermission).
// =============================================================================
import { Request, Response, NextFunction } from 'express';

// ---------------------------------------------------------------------------
// Moduli riservati al personale EDG (ADR051)
// I ruoli sono globali: un admin esiste anche nei tenant dei clienti. I
// permessi 'sistema.*' (log, salute, riepilogo, allarmi di tutta la
// piattaforma) valgono solo per gli account del tenant di sistema, indicati
// dal campo systemTenant del JWT. Token senza il campo (emessi prima) = no.
// ---------------------------------------------------------------------------
const SYSTEM_TENANT_MODULES = new Set(['sistema']);

// ---------------------------------------------------------------------------
// requirePermission(module, action)
// Verifica che req.user abbia il permesso "module.action".
// Supporta wildcard: "*" (superuser), "module.*" (accesso completo al modulo)
// Supporta negazione: "!module.action" (nega esplicitamente)
// ---------------------------------------------------------------------------
export function requirePermission(module: string, action: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Autenticazione richiesta' });
      return;
    }

    const permissions: string[] = req.user.permissions || [];
    const target = `${module}.${action}`;

    if (SYSTEM_TENANT_MODULES.has(module) && req.user.systemTenant !== true) {
      res.status(403).json({ message: 'Accesso riservato al personale EDG' });
      return;
    }

    // Nega esplicita — ha priorita' su tutto
    if (
      permissions.includes(`!${target}`) ||
      permissions.includes(`!${module}.*`) ||
      permissions.includes('!*')
    ) {
      res.status(403).json({ message: `Permesso negato: ${target}` });
      return;
    }

    if (
      permissions.includes('*') ||
      permissions.includes(`${module}.*`) ||
      permissions.includes(target)
    ) {
      next();
      return;
    }

    res.status(403).json({ message: `Permesso mancante: ${target}` });
  };
}
