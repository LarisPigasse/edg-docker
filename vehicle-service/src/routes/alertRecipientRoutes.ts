import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { validateBody, validateQuery, validateParams, commonSchemas } from '../middleware/validate';
import { alertRecipientSchemas } from '../schemas/transversalSchemas';
import * as alertRecipientController from '../controllers/alertRecipientController';

const router = Router();

router.get(
  '/',
  requireAuth,
  requirePermission('vehicles', 'read'),
  validateQuery(alertRecipientSchemas.listQuery),
  alertRecipientController.list
);
router.get(
  '/:id',
  requireAuth,
  requirePermission('vehicles', 'read'),
  validateParams(commonSchemas.intParam),
  alertRecipientController.getById
);
router.post(
  '/',
  requireAuth,
  requirePermission('vehicles', 'create'),
  validateBody(alertRecipientSchemas.create),
  alertRecipientController.create
);
router.put(
  '/:id',
  requireAuth,
  requirePermission('vehicles', 'update'),
  validateParams(commonSchemas.intParam),
  validateBody(alertRecipientSchemas.update),
  alertRecipientController.update
);
router.delete(
  '/:id',
  requireAuth,
  requirePermission('vehicles', 'delete'),
  validateParams(commonSchemas.intParam),
  alertRecipientController.remove
);

export default router;
