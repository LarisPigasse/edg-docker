// =============================================================================
// EDG Log Service - RBAC Middleware
// Controllo permessi basato su modulo.azione (es: sistema.logs), stesso
// schema di system-service (src/middleware/rbac.ts). I permessi arrivano da
// x-user-data iniettato dal gateway (vedi middleware/auth.ts — requireAuth
// va sempre eseguito prima di requirePermission).
// =============================================================================
import { Request, Response, NextFunction } from 'express';

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
