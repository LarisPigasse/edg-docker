// src/modules/auth/routes/tenant.routes.ts
import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { requirePermission, requireRoot } from '../middleware/permissionMiddleware';
import { requireSystemTenant } from '../middleware/tenantMiddleware';
import { validateBody, validateParams, commonSchemas } from '../middleware/validate';
import { createCrudHandlers } from '../utils/crudFactory';
import { tenantSchemas } from '../schemas/tenantSchemas';

/**
 * Router di gestione Tenant (menu "SISTEMA" su pro-frontend).
 *
 * ADR047: lettura, creazione, modifica e attiva/disattiva con il permesso
 * 'sistema.tenant' (admin e root); l'eliminazione resta solo a root.
 *
 * NOTA: il modello viene passato al factory, non importato — stesso pattern
 * di createAccountRouter. Vedi app.ts per l'uso.
 */
export const createTenantRouter = (Tenant: any): Router => {
  const router = Router();
  const h = createCrudHandlers({
    model: Tenant,
    resourceName: 'Tenant',
    searchFields: ['name', 'slug'],
    defaultOrder: [['name', 'ASC']],
    softDelete: true,
    protectField: 'isSystem',
  });

  const canManageTenants = requirePermission('sistema', 'tenant');

  // Solo personale EDG: i ruoli sono globali, un admin esiste anche nei tenant
  // dei clienti e non deve poter vedere o creare altri tenant (ADR047)
  router.use(authenticate, requireSystemTenant(Tenant));

  router.get('/', canManageTenants, h.list);
  router.get('/:id', canManageTenants, validateParams(commonSchemas.intParam), h.getById);
  router.post('/', canManageTenants, validateBody(tenantSchemas.create), h.create);
  router.put(
    '/:id',
    canManageTenants,
    validateParams(commonSchemas.intParam),
    validateBody(tenantSchemas.update),
    h.update
  );
  router.patch('/:id/toggle', canManageTenants, validateParams(commonSchemas.intParam), h.toggleActive);
  router.delete('/:id', requireRoot(), validateParams(commonSchemas.intParam), h.remove);

  return router;
};

export default createTenantRouter;
