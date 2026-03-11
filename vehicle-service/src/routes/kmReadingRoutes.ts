import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { validateBody, validateParams, validateQuery, commonSchemas } from '../middleware/validate';
import * as c from '../controllers/kmReadingController';
import { kmReadingSchemas } from '../schemas/operativeSchemas';

const router = Router();
router.get('/', requireAuth, requirePermission('vehicles', 'read'), validateQuery(kmReadingSchemas.listQuery), c.list);
router.get('/:id', requireAuth, requirePermission('vehicles', 'read'), validateParams(commonSchemas.intParam), c.getById);
router.post('/', requireAuth, requirePermission('vehicles', 'update'), validateBody(kmReadingSchemas.create), c.create);
export default router;
