// =============================================================================
// Dashboard — /api/vigilo/dashboard (lettura)
// =============================================================================
import { Router, Request, Response } from 'express';
import { contestoDi } from '../../core/contesto';
import { richiedi } from '../../core/middleware/permessi';
import { validateQuery } from '../../core/middleware/validate';
import { successResponse } from '../../core/utils/response';
import { filtriDashboard } from './dashboard.schemas';
import { dashboard } from './dashboard.service';

export const dashboardRoutes = Router();

dashboardRoutes.get('/dashboard', richiedi('read'), validateQuery(filtriDashboard), async (req: Request, res: Response) => {
  successResponse(res, await dashboard(contestoDi(req), req.query));
});
