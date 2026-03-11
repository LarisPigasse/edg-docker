// =============================================================================
// EDG Vehicle Service - Attachment Routes
// =============================================================================
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { validateBody, validateParams, validateQuery, commonSchemas } from '../middleware/validate';
import { upload } from '../middleware/upload';
import * as c from '../controllers/attachmentController';
import { attachmentSchemas } from '../schemas/transversalSchemas';

const router = Router();

router.get('/', requireAuth, requirePermission('vehicles', 'read'), validateQuery(attachmentSchemas.listQuery), c.list);
router.get('/:id', requireAuth, requirePermission('vehicles', 'read'), validateParams(commonSchemas.intParam), c.getById);
router.get(
  '/:id/download',
  requireAuth,
  requirePermission('vehicles', 'read'),
  validateParams(commonSchemas.intParam),
  c.download
);
router.post(
  '/',
  requireAuth,
  requirePermission('vehicles', 'update'),
  upload.single('file'),
  validateBody(attachmentSchemas.create),
  c.upload
);
router.delete('/:id', requireAuth, requirePermission('vehicles', 'delete'), validateParams(commonSchemas.intParam), c.remove);

export default router;
