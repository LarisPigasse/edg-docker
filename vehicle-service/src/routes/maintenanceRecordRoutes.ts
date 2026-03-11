import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { validateBody, validateParams, validateQuery, commonSchemas } from '../middleware/validate';
import * as c from '../controllers/maintenanceRecordController';
import { maintenanceRecordSchemas } from '../schemas/operativeSchemas';

const router = Router();
router.get('/', requireAuth, requirePermission('vehicles', 'read'), validateQuery(maintenanceRecordSchemas.listQuery), c.list);
router.get('/:id', requireAuth, requirePermission('vehicles', 'read'), validateParams(commonSchemas.intParam), c.getById);
router.post('/', requireAuth, requirePermission('vehicles', 'create'), validateBody(maintenanceRecordSchemas.create), c.create);
router.put(
  '/:id',
  requireAuth,
  requirePermission('vehicles', 'update'),
  validateParams(commonSchemas.intParam),
  validateBody(maintenanceRecordSchemas.update),
  c.update
);
router.delete('/:id', requireAuth, requirePermission('vehicles', 'delete'), validateParams(commonSchemas.intParam), c.remove);
export default router;
