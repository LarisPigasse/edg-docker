// src/modules/auth/routes/module.routes.ts
// =============================================================================
// Gestione moduli (ADR047)
// =============================================================================
//   /auth/modules                          catalogo
//     GET    /            sistema.moduli    (admin e root: serve per scegliere cosa attivare)
//     GET    /:key        sistema.moduli
//     POST   /            root
//     PUT    /:key        root
//     DELETE /:key        root              (solo se mai attivato: altrimenti si dismette)
//
//   /auth/tenants/:tenantId/modules        attivazioni di un tenant
//     GET    /            sistema.moduli    catalogo + attivazione + "in vigore"
//     POST   /            sistema.moduli    attiva (prova o attivo)
//     PUT    /:key        sistema.moduli    stato, periodo, config, note
//
//   Tutte le rotte: solo account del tenant di sistema (requireSystemTenant),
//   perche' i ruoli sono globali e un admin esiste anche nei tenant dei clienti.
// =============================================================================
import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { requirePermission, requireRoot } from '../middleware/permissionMiddleware';
import { requireSystemTenant } from '../middleware/tenantMiddleware';
import { validateBody, validateParams } from '../middleware/validate';
import { moduleSchemas } from '../schemas/moduleSchemas';
import { ModuleController } from '../controllers/ModuleController';

const canManageModules = requirePermission('sistema', 'moduli');

export const createModuleCatalogRouter = (controller: ModuleController, tenantModel: any): Router => {
  const router = Router();
  router.use(authenticate, requireSystemTenant(tenantModel));

  router.get('/', canManageModules, controller.listCatalog);
  router.get('/:key', canManageModules, validateParams(moduleSchemas.keyParam), controller.getCatalog);
  router.post('/', requireRoot(), validateBody(moduleSchemas.catalogCreate), controller.createCatalog);
  router.put(
    '/:key',
    requireRoot(),
    validateParams(moduleSchemas.keyParam),
    validateBody(moduleSchemas.catalogUpdate),
    controller.updateCatalog
  );
  router.delete('/:key', requireRoot(), validateParams(moduleSchemas.keyParam), controller.removeCatalog);

  return router;
};

/** Montato su /auth/tenants/:tenantId/modules (mergeParams per leggere :tenantId) */
export const createTenantModuleRouter = (controller: ModuleController, tenantModel: any): Router => {
  const router = Router({ mergeParams: true });
  router.use(authenticate, requireSystemTenant(tenantModel));

  router.get('/', canManageModules, validateParams(moduleSchemas.tenantParam), controller.listForTenant);
  router.post(
    '/',
    canManageModules,
    validateParams(moduleSchemas.tenantParam),
    validateBody(moduleSchemas.activationCreate),
    controller.activate
  );
  router.put(
    '/:key',
    canManageModules,
    validateParams(moduleSchemas.tenantKeyParams),
    validateBody(moduleSchemas.activationUpdate),
    controller.updateActivation
  );

  return router;
};
