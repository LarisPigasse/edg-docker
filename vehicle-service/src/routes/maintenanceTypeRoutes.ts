import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { validateBody, validateParams, commonSchemas } from '../middleware/validate';
import { createCrudHandlers } from '../utils/crudFactory';
import MaintenanceType from '../models/MaintenanceType';
import { maintenanceTypeSchemas } from '../schemas/lookupSchemas';

const router = Router();
const h = createCrudHandlers({
  model: MaintenanceType,
  resourceName: 'Tipo manutenzione',
  searchFields: ['name', 'label'],
});

router.get('/', requireAuth, requirePermission('vehicles', 'read'), h.list);
router.get('/:id', requireAuth, requirePermission('vehicles', 'read'), validateParams(commonSchemas.intParam), h.getById);
router.post('/', requireAuth, requirePermission('vehicles', 'create'), validateBody(maintenanceTypeSchemas.create), h.create);
router.put(
  '/:id',
  requireAuth,
  requirePermission('vehicles', 'update'),
  validateParams(commonSchemas.intParam),
  validateBody(maintenanceTypeSchemas.update),
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
