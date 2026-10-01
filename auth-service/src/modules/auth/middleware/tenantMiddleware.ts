// src/modules/auth/middleware/tenantMiddleware.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { logger } from '../../../services/logger';
import { requestActor } from '../../../services/requestActor';

/**
 * Richiede che l'account appartenga al tenant di sistema (EDG) — ADR047.
 *
 * I ruoli sono globali: un 'admin' esiste anche nei tenant dei clienti (es. il
 * tenant demo). I permessi 'sistema.moduli' e 'sistema.tenant' devono valere
 * solo per lo staff EDG, altrimenti l'admin di un cliente potrebbe attivarsi
 * moduli da solo o creare tenant. Il vincolo e' sul tenant, non su un campo
 * dell'account: un account non puo' spostarsi da solo nel tenant di sistema.
 *
 * Da usare DOPO authenticate (serve req.account.tenantId).
 * isSystem non e' modificabile via API, quindi l'esito per tenant si memorizza.
 */
export const requireSystemTenant = (tenantModel: any): RequestHandler => {
  const isSystemByTenant = new Map<number, boolean>();

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = Number((req as any).account?.tenantId);
    if (!tenantId) {
      res.status(403).json({ success: false, error: 'Accesso riservato al personale EDG' });
      return;
    }

    try {
      let isSystem = isSystemByTenant.get(tenantId);
      if (isSystem === undefined) {
        const tenant = await tenantModel.findByPk(tenantId, { attributes: ['id', 'isSystem'] });
        isSystem = !!tenant?.isSystem;
        isSystemByTenant.set(tenantId, isSystem);
      }

      if (!isSystem) {
        logger.auditFailure(
          'auth.forbidden',
          `Accesso negato a ${req.method} ${req.originalUrl}: riservato al tenant di sistema`,
          requestActor(req),
          { tenantId, path: req.originalUrl },
          'SECURITY'
        );
        res.status(403).json({ success: false, error: 'Accesso riservato al personale EDG' });
        return;
      }

      next();
    } catch (err) {
      logger.error('auth.forbidden', `Verifica tenant di sistema fallita: ${String(err)}`, { tenantId }, 'SECURITY', requestActor(req));
      res.status(500).json({ success: false, error: 'Errore interno del server' });
    }
  };
};
