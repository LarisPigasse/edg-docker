// src/modules/auth/routes/internal.routes.ts
// =============================================================================
// Rotte interne per gli altri servizi (ADR058) - montate su /internal
// =============================================================================
//   GET /internal/anagrafiche/:uuid/links
//       Cosa di auth-service punta a un'anagrafica di system-service:
//       { tenant: { id, name, slug } | null, accounts: number }
//       Serve a system-service prima di eliminare un'anagrafica.
//   GET /internal/tenants/:id/modules/:key        (ADR088)
//       Attivazione di un modulo per un tenant: { inForce, status, config },
//       con nome e cliente collegato del tenant (ADR089: email di Vigilo).
//       Serve ai servizi dei moduli per le impostazioni scelte da EDG (es.
//       chi prepara Vigilo). Tenant di sistema: in vigore, config null.
//   GET /internal/tenants/:id/accounts             (ADR090)
//       Account attivi del tenant con i permessi del ruolo:
//       [{ id, email, nome, permissions }]. Serve a Vigilo per l'"ufficio"
//       degli avvisi (chi ha vigilo.read o vigilo.write).
//   GET /internal/accounts?ids=1,2,3              (ADR088)
//       Nome ed email degli account (al massimo 64): [{ id, nome, email }],
//       nome = nome e cognome, altrimenti l'email (ADR081).
//
// Non passano dal gateway e richiedono il segreto dei servizi
// (requireInternalCall). Solo lettura: nessun audit.
// =============================================================================
import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { requireInternalCall } from '../middleware/internalMiddleware';
import { validateParams, validateQuery } from '../middleware/validate';
import { successResponse } from '../utils/response';
import { nomeAccount } from '../utils/assistenza';
import type { ModuleService } from '../services/ModuleService';

const uuidParam = Joi.object({ uuid: Joi.string().guid().required() });
const moduloParam = Joi.object({
  id: Joi.number().integer().positive().required(),
  key: Joi.string().max(32).pattern(/^[a-z][a-z0-9-]*$/).required(),
});
const tenantParam = Joi.object({ id: Joi.number().integer().positive().required() });
const accountsQuery = Joi.object({
  ids: Joi.string()
    .pattern(/^\d+(,\d+){0,63}$/)
    .required(),
});

export const createInternalRouter = (
  Tenant: any,
  Account: any,
  TenantModule: any,
  moduleService: ModuleService,
  Role: any,
  RolePermission: any
): Router => {
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

  router.get('/tenants/:id/modules/:key', validateParams(moduloParam), async (req: Request, res: Response) => {
    const tenantId = Number(req.params.id);
    const key = String(req.params.key);
    const [inVigore, attivazione, tenant] = await Promise.all([
      moduleService.resolveTenantModules(tenantId),
      TenantModule.findOne({ where: { tenantId, module: key }, attributes: ['status', 'config'] }),
      Tenant.findByPk(tenantId, { attributes: ['id', 'name', 'clienteUuid'] }),
    ]);
    successResponse(res, {
      tenantId,
      module: key,
      inForce: inVigore.includes('*') || inVigore.includes(key),
      status: attivazione?.status ?? null,
      config: attivazione?.config ?? null,
      tenant: tenant ? { nome: tenant.name, clienteUuid: tenant.clienteUuid ?? null } : null,
    });
  });

  router.get('/tenants/:id/accounts', validateParams(tenantParam), async (req: Request, res: Response) => {
    const righe = await Account.findAll({
      where: { tenantId: Number(req.params.id), isActive: true },
      attributes: ['id', 'email', 'firstName', 'lastName'],
      include: [{ model: Role, as: 'role', attributes: ['id'], include: [{ model: RolePermission, as: 'permissions', attributes: ['permission'] }] }],
      order: [['id', 'ASC']],
    });
    successResponse(
      res,
      righe.map((a: any) => ({
        id: a.id,
        email: a.email,
        nome: nomeAccount(a),
        permissions: (a.role?.permissions ?? []).map((p: any) => p.permission),
      }))
    );
  });

  router.get('/accounts', validateQuery(accountsQuery), async (req: Request, res: Response) => {
    const ids = [...new Set(String(req.query.ids).split(',').map(Number))];
    const righe = await Account.findAll({ where: { id: ids }, attributes: ['id', 'email', 'firstName', 'lastName'] });
    successResponse(
      res,
      righe.map((a: any) => ({ id: a.id, email: a.email, nome: nomeAccount(a) }))
    );
  });

  return router;
};

export default createInternalRouter;
