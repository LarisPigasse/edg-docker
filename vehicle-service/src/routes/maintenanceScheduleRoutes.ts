import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { validateBody, validateParams, validateQuery, commonSchemas } from '../middleware/validate';
import * as c from '../controllers/maintenanceScheduleController';
import { maintenanceScheduleSchemas } from '../schemas/operativeSchemas';

const router = Router();
router.get(
  '/',
  requireAuth,
  requirePermission('vehicles', 'read'),
  validateQuery(maintenanceScheduleSchemas.listQuery),
  c.list
);
router.get('/:id', requireAuth, requirePermission('vehicles', 'read'), validateParams(commonSchemas.intParam), c.getById);
router.put(
  '/:id',
  requireAuth,
  requirePermission('vehicles', 'update'),
  validateParams(commonSchemas.intParam),
  validateBody(maintenanceScheduleSchemas.update),
  c.update
);
export default router;
