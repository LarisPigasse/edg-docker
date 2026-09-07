import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { validateBody, validateParams, commonSchemas } from '../middleware/validate';
import { createCrudHandlers } from '../utils/crudFactory';
import Reparto from '../models/Reparto';
import { repartoSchemas } from '../schemas/repartoSchemas';

const router = Router();
const h = createCrudHandlers({
  model: Reparto,
  resourceName: 'Reparto',
  searchFields: ['reparto'],
  defaultOrder: [['reparto', 'ASC']],
  softDelete: true,
});

router.get('/', requireAuth, requirePermission('system', 'read'), h.list);
router.get('/:id', requireAuth, requirePermission('system', 'read'), validateParams(commonSchemas.intParam), h.getById);
router.post('/', requireAuth, requirePermission('system', 'create'), validateBody(repartoSchemas.create), h.create);
router.put(
  '/:id',
  requireAuth,
  requirePermission('system', 'update'),
  validateParams(commonSchemas.intParam),
  validateBody(repartoSchemas.update),
  h.update
);
router.patch(
  '/:id/toggle',
  requireAuth,
  requirePermission('system', 'update'),
  validateParams(commonSchemas.intParam),
  h.toggleActive
);
router.delete('/:id', requireAuth, requirePermission('system', 'delete'), validateParams(commonSchemas.intParam), h.remove);

export default router;
