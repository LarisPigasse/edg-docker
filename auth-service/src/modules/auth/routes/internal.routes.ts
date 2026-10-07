// src/modules/auth/routes/internal.routes.ts
// =============================================================================
// Rotte interne per gli altri servizi (ADR058) - montate su /internal
// =============================================================================
//   GET /internal/anagrafiche/:uuid/links
//       Cosa di auth-service punta a un'anagrafica di system-service:
//       { tenant: { id, name, slug } | null, accounts: number }
//       Serve a system-service prima di eliminare un'anagrafica.
//
// Non passano dal gateway e richiedono il segreto dei servizi
// (requireInternalCall). Solo lettura: nessun audit.
// =============================================================================
import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { requireInternalCall } from '../middleware/internalMiddleware';
import { validateParams } from '../middleware/validate';
import { successResponse } from '../utils/response';

const uuidParam = Joi.object({ uuid: Joi.string().guid().required() });

export const createInternalRouter = (Tenant: any, Account: any): Router => {
  const router = Router();
  router.use(requireInternalCall);

  router.get('/anagrafiche/:uuid/links', validateParams(uuidParam), async (req: Request, res: Response) => {
    const uuid = req.params.uuid;
    const [tenant, accounts] = await Promise.all([
      Tenant.findOne({ where: { clienteUuid: uuid }, attributes: ['id', 'name', 'slug'] }),
      Account.count({ where: { entityId: uuid } }),
    ]);
    successResponse(res, { tenant: tenant ? tenant.get({ plain: true }) : null, accounts });
  });

  return router;
};

export default createInternalRouter;
