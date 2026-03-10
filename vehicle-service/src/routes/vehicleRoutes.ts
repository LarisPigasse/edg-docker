import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { validateBody, validateParams, validateQuery, commonSchemas } from '../middleware/validate';
import * as vehicleController from '../controllers/vehicleController';
import { vehicleSchemas } from '../schemas/vehicleSchemas';

const router = Router();

router.get(
  '/',
  requireAuth,
  requirePermission('vehicles', 'read'),
  validateQuery(vehicleSchemas.listQuery),
  vehicleController.list
);
router.get(
  '/:id',
  requireAuth,
  requirePermission('vehicles', 'read'),
  validateParams(commonSchemas.intParam),
  vehicleController.getById
);
router.post(
  '/',
  requireAuth,
  requirePermission('vehicles', 'create'),
  validateBody(vehicleSchemas.create),
  vehicleController.create
);
router.put(
  '/:id',
  requireAuth,
  requirePermission('vehicles', 'update'),
  validateParams(commonSchemas.intParam),
  validateBody(vehicleSchemas.update),
  vehicleController.update
);
router.patch(
  '/:id/status',
  requireAuth,
  requirePermission('vehicles', 'update'),
  validateParams(commonSchemas.intParam),
  validateBody(vehicleSchemas.updateStatus),
  vehicleController.updateStatus
);
router.delete(
  '/:id',
  requireAuth,
  requirePermission('vehicles', 'delete'),
  validateParams(commonSchemas.intParam),
  vehicleController.remove
);

export default router;
