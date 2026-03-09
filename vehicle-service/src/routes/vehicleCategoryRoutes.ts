import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { validateBody, validateParams, commonSchemas } from '../middleware/validate';
import { createCrudHandlers } from '../utils/crudFactory';
import VehicleCategory from '../models/VehicleCategory';
import { vehicleCategorySchemas } from '../schemas/lookupSchemas';

const router = Router();
const h = createCrudHandlers({
  model: VehicleCategory,
  resourceName: 'Categoria veicolo',
  searchFields: ['name', 'label'],
});

router.get('/', requireAuth, requirePermission('vehicles', 'read'), h.list);
router.get('/:id', requireAuth, requirePermission('vehicles', 'read'), validateParams(commonSchemas.intParam), h.getById);
router.post('/', requireAuth, requirePermission('vehicles', 'create'), validateBody(vehicleCategorySchemas.create), h.create);
router.put(
  '/:id',
  requireAuth,
  requirePermission('vehicles', 'update'),
  validateParams(commonSchemas.intParam),
  validateBody(vehicleCategorySchemas.update),
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
