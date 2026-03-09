import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { validateBody, validateParams, commonSchemas } from '../middleware/validate';
import { createCrudHandlers } from '../utils/crudFactory';
import TelematicsProvider from '../models/TelematicsProvider';
import { telematicsProviderSchemas } from '../schemas/lookupSchemas';

const router = Router();
const h = createCrudHandlers({
  model: TelematicsProvider,
  resourceName: 'Provider telematico',
  searchFields: ['name'],
});

router.get('/', requireAuth, requirePermission('vehicles', 'read'), h.list);
router.get('/:id', requireAuth, requirePermission('vehicles', 'read'), validateParams(commonSchemas.intParam), h.getById);
router.post(
  '/',
  requireAuth,
  requirePermission('vehicles', 'create'),
  validateBody(telematicsProviderSchemas.create),
  h.create
);
router.put(
  '/:id',
  requireAuth,
  requirePermission('vehicles', 'update'),
  validateParams(commonSchemas.intParam),
  validateBody(telematicsProviderSchemas.update),
  h.update
);
router.patch(
  '/:id/toggle',
  requireAuth,
  requirePermission('vehicles', 'update'),
  validateParams(commonSchemas.intParam),
  h.toggleActive
);
router.delete('/:id', requireAuth, requirePermission('vehicles', 'delete'), validateParams(commonSchemas.intParam), h.remove);

export default router;
