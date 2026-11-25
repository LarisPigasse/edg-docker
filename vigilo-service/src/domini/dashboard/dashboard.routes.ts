// =============================================================================
// Dashboard — /api/vigilo/dashboard (lettura)
// =============================================================================
import { Router, Request, Response } from 'express';
import { contestoDi } from '../../core/contesto';
import { consultato } from '../../core/services/consultazioni';
import { richiedi } from '../../core/middleware/permessi';
import { validateQuery } from '../../core/middleware/validate';
import { successResponse } from '../../core/utils/response';
import { filtriDashboard } from './dashboard.schemas';
import { dashboard } from './dashboard.service';

export const dashboardRoutes = Router();

dashboardRoutes.get('/dashboard', richiedi('read'), validateQuery(filtriDashboard), async (req: Request, res: Response) => {
  const ctx = contestoDi(req);
  successResponse(res, await dashboard(ctx, req.query));
  consultato(ctx, 'dashboard', { dettagli: { filtri: req.query } });
});
