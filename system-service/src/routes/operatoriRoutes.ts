import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { validateBody, validateParams, commonSchemas } from '../middleware/validate';
import { createCrudHandlers } from '../utils/crudFactory';
import Operatore from '../models/Operatore';
import { operatoreSchemas } from '../schemas/operatoreSchemas';

const router = Router();
const h = createCrudHandlers({
  model: Operatore,
  resourceName: 'Operatore',
  searchFields: ['nome', 'cognome', 'email'],
  defaultOrder: [
    ['cognome', 'ASC'],
    ['nome', 'ASC'],
  ],
  softDelete: true,
  listFilters: query => {
    const where: Record<string, unknown> = {};
    if (query.idReparto) where.idReparto = Number(query.idReparto);
    return where;
  },
});

router.get('/', requireAuth, requirePermission('system', 'read'), h.list);
router.get('/:id', requireAuth, requirePermission('system', 'read'), validateParams(commonSchemas.intParam), h.getById);
router.post('/', requireAuth, requirePermission('system', 'create'), validateBody(operatoreSchemas.create), h.create);
router.put(
  '/:id',
  requireAuth,
  requirePermission('system', 'update'),
  validateParams(commonSchemas.intParam),
  validateBody(operatoreSchemas.update),
  h.update
);
router.patch(
  '/:id/toggle',
  requireAuth,
  requirePermission('system', 'update'),
  validateParams(commonSchemas.intParam),
  h.toggleActive
);
router.delete('/:id', requireAuth, requirePermission('system', 'delete'), validateParams(commonSchemas.intParam), h.remove);

export default router;
