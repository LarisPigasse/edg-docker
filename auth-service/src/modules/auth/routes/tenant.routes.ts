// src/modules/auth/routes/tenant.routes.ts
import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { requireRoot } from '../middleware/permissionMiddleware';
import { validateBody, validateParams, commonSchemas } from '../middleware/validate';
import { createCrudHandlers } from '../utils/crudFactory';
import { tenantSchemas } from '../schemas/tenantSchemas';

/**
 * Router di gestione Tenant, riservato a root (menu "SISTEMA" su pro-frontend).
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

  // Tutte le route richiedono autenticazione + permesso root
  router.get('/', authenticate, requireRoot(), h.list);
  router.get('/:id', authenticate, requireRoot(), validateParams(commonSchemas.intParam), h.getById);
  router.post('/', authenticate, requireRoot(), validateBody(tenantSchemas.create), h.create);
  router.put(
    '/:id',
    authenticate,
    requireRoot(),
    validateParams(commonSchemas.intParam),
    validateBody(tenantSchemas.update),
    h.update
  );
  router.patch('/:id/toggle', authenticate, requireRoot(), validateParams(commonSchemas.intParam), h.toggleActive);
  router.delete('/:id', authenticate, requireRoot(), validateParams(commonSchemas.intParam), h.remove);

  return router;
};

export default createTenantRouter;
