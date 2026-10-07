import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requirePermission, requireRole } from '../middleware/rbac';
import { validateBody, validateParams, commonSchemas } from '../middleware/validate';
import { createCrudHandlers } from '../utils/crudFactory';
import Settore from '../models/Settore';
import { settoreSchemas } from '../schemas/settoreSchemas';

// Settori di attività (ADR059): unici per tutta la piattaforma. Li legge chi
// legge le anagrafiche (anche i tenant dei clienti, per la propria rubrica);
// li gestisce solo il personale EDG ('operatore'), come i reparti.
const router = Router();
const h = createCrudHandlers({
  model: Settore,
  resourceName: 'Settore',
  searchFields: ['settore'],
  defaultOrder: [['settore', 'ASC']],
  softDelete: true,
});

router.get('/', requireAuth, requirePermission('system', 'read'), h.list);
router.get('/:id', requireAuth, requirePermission('system', 'read'), validateParams(commonSchemas.intParam), h.getById);
router.post('/', requireAuth, requireRole('operatore'), requirePermission('system', 'create'), validateBody(settoreSchemas.create), h.create);
router.put(
  '/:id',
  requireAuth,
  requireRole('operatore'),
  requirePermission('system', 'update'),
  validateParams(commonSchemas.intParam),
  validateBody(settoreSchemas.update),
  h.update
);
router.patch(
  '/:id/toggle',
  requireAuth,
  requireRole('operatore'),
  requirePermission('system', 'update'),
  validateParams(commonSchemas.intParam),
  h.toggleActive
);
router.delete('/:id', requireAuth, requireRole('operatore'), requirePermission('system', 'delete'), validateParams(commonSchemas.intParam), h.remove);

export default router;
