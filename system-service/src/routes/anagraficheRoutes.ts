import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { validateBody, validateParams, commonSchemas } from '../middleware/validate';
import { createCrudHandlers } from '../utils/crudFactory';
import Anagrafica from '../models/Anagrafica';
import { anagraficaSchemas } from '../schemas/anagraficaSchemas';

const router = Router();
const h = createCrudHandlers({
  model: Anagrafica,
  resourceName: 'Anagrafica',
  searchFields: ['ragioneSociale', 'partitaIva', 'codiceFiscale', 'referente'],
  defaultOrder: [['ragioneSociale', 'ASC']],
  softDelete: true,
  // ADR021: isolamento multi-tenant. Per account non-operatore, idTenant è
  // sempre forzato lato server (vedi crudFactory) — il filtro qui sotto
  // resta utile solo per gli operatori, che possono filtrare esplicitamente
  // per tenant tramite query string.
  listFilters: query => {
    const where: Record<string, unknown> = {};
    if (query.tipo) where.tipo = query.tipo;
    if (query.idTenant) where.idTenant = Number(query.idTenant);
    return where;
  },
  tenantScoped: true,
});

router.get('/', requireAuth, requirePermission('system', 'read'), h.list);
router.get('/:id', requireAuth, requirePermission('system', 'read'), validateParams(commonSchemas.intParam), h.getById);
router.post('/', requireAuth, requirePermission('system', 'create'), validateBody(anagraficaSchemas.create), h.create);
router.put(
  '/:id',
  requireAuth,
  requirePermission('system', 'update'),
  validateParams(commonSchemas.intParam),
  validateBody(anagraficaSchemas.update),
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
