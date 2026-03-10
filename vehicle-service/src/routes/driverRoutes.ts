import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { validateBody, validateParams, validateQuery, commonSchemas } from '../middleware/validate';
import * as driverController from '../controllers/driverController';
import { driverSchemas } from '../schemas/driverSchemas';

const router = Router();

router.get(
  '/',
  requireAuth,
  requirePermission('vehicles', 'read'),
  validateQuery(driverSchemas.listQuery),
  driverController.list
);
router.get(
  '/:id',
  requireAuth,
  requirePermission('vehicles', 'read'),
  validateParams(commonSchemas.intParam),
  driverController.getById
);
router.post(
  '/',
  requireAuth,
  requirePermission('vehicles', 'create'),
  validateBody(driverSchemas.create),
  driverController.create
);
router.put(
  '/:id',
  requireAuth,
  requirePermission('vehicles', 'update'),
  validateParams(commonSchemas.intParam),
  validateBody(driverSchemas.update),
  driverController.update
);
router.patch(
  '/:id/toggle',
  requireAuth,
  requirePermission('vehicles', 'update'),
  validateParams(commonSchemas.intParam),
  driverController.toggleActive
);
router.delete(
  '/:id',
  requireAuth,
  requirePermission('vehicles', 'delete'),
  validateParams(commonSchemas.intParam),
  driverController.remove
);

export default router;
