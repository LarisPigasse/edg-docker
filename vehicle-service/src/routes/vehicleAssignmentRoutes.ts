import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { validateBody, validateParams, validateQuery, commonSchemas } from '../middleware/validate';
import Joi from 'joi';
import * as c from '../controllers/vehicleAssignmentController';
import { vehicleAssignmentSchemas } from '../schemas/operativeSchemas';

const router = Router();
router.get('/', requireAuth, requirePermission('vehicles', 'read'), validateQuery(vehicleAssignmentSchemas.listQuery), c.list);
router.get('/:id', requireAuth, requirePermission('vehicles', 'read'), validateParams(commonSchemas.intParam), c.getById);
router.get(
  '/vehicle/:vehicleId/current',
  requireAuth,
  requirePermission('vehicles', 'read'),
  validateParams(Joi.object({ vehicleId: Joi.number().integer().positive().required() })),
  c.getCurrent
);
router.post('/', requireAuth, requirePermission('vehicles', 'create'), validateBody(vehicleAssignmentSchemas.create), c.create);
router.patch(
  '/:id/end',
  requireAuth,
  requirePermission('vehicles', 'update'),
  validateParams(commonSchemas.intParam),
  validateBody(vehicleAssignmentSchemas.end),
  c.end
);
export default router;
