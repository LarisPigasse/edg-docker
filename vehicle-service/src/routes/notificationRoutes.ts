// =============================================================================
// EDG Vehicle Service - Notification Routes
// =============================================================================
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { validateBody, validateParams, validateQuery, commonSchemas } from '../middleware/validate';
import * as c from '../controllers/notificationController';
import { notificationSchemas } from '../schemas/transversalSchemas';

const router = Router();

router.get('/', requireAuth, requirePermission('vehicles', 'read'), validateQuery(notificationSchemas.listQuery), c.list);
router.get('/unread-count', requireAuth, requirePermission('vehicles', 'read'), c.unreadCount);
router.get('/:id', requireAuth, requirePermission('vehicles', 'read'), validateParams(commonSchemas.intParam), c.getById);
router.post('/', requireAuth, requirePermission('vehicles', 'create'), validateBody(notificationSchemas.create), c.create);
router.patch(
  '/:id/read',
  requireAuth,
  requirePermission('vehicles', 'read'),
  validateParams(commonSchemas.intParam),
  c.markRead
);
router.patch('/read-all', requireAuth, requirePermission('vehicles', 'read'), c.markAllRead);
router.patch(
  '/:id/archive',
  requireAuth,
  requirePermission('vehicles', 'update'),
  validateParams(commonSchemas.intParam),
  c.archive
);
router.delete('/:id', requireAuth, requirePermission('vehicles', 'delete'), validateParams(commonSchemas.intParam), c.remove);

export default router;
