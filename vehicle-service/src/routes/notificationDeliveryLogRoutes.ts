// =============================================================================
// EDG Vehicle Service - Notification Delivery Log Routes
// =============================================================================
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { validateQuery } from '../middleware/validate';
import * as c from '../controllers/notificationDeliveryLogController';
import { notificationDeliveryLogSchemas } from '../schemas/transversalSchemas';

const router = Router();

router.get(
  '/',
  requireAuth,
  requirePermission('vehicles', 'read'),
  validateQuery(notificationDeliveryLogSchemas.listQuery),
  c.list
);

export default router;
