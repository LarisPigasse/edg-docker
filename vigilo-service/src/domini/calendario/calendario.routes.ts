// =============================================================================
// Calendario — /api/vigilo/calendario (lettura)
// =============================================================================
import { Router, Request, Response } from 'express';
import { contestoDi } from '../../core/contesto';
import { richiedi } from '../../core/middleware/permessi';
import { validateQuery } from '../../core/middleware/validate';
import { successResponse } from '../../core/utils/response';
import { filtriCalendario } from './calendario.schemas';
import { calendario } from './calendario.service';

export const calendarioRoutes = Router();

calendarioRoutes.get('/calendario', richiedi('read'), validateQuery(filtriCalendario), async (req: Request, res: Response) => {
  successResponse(res, await calendario(contestoDi(req), req.query));
});
