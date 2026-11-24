// =============================================================================
// Analisi — rotte (2026-11-23)
// =============================================================================
//   GET   /analisi          gli indicatori dell'azienda e i segnali (read e costi)
//   PATCH /analisi/soglie   le soglie dei segnali (config e costi; 2026-11-23)
// =============================================================================
import { Router, type Request, type Response } from 'express';
import { contestoDi } from '../../core/contesto';
import { richiedi } from '../../core/middleware/permessi';
import { successResponse } from '../../core/utils/response';
import Joi from 'joi';
import { validateBody } from '../../core/middleware/validate';
import { LIMITI_ANALISI } from '../impostazioni/limiti';
import { cambiaSoglie, leggiAnalisi } from './analisi.service';

export const analisiRoutes = Router();

analisiRoutes.get('/analisi', richiedi('read'), richiedi('costi'), async (req: Request, res: Response) => {
  successResponse(res, await leggiAnalisi(contestoDi(req)));
});

const corpoSoglie = Joi.object(
  Object.fromEntries(Object.entries(LIMITI_ANALISI).map(([k, l]) => [k, Joi.number().integer().min(l.min).max(l.max)]))
).min(1);

analisiRoutes.patch('/analisi/soglie', richiedi('config'), richiedi('costi'), validateBody(corpoSoglie), async (req: Request, res: Response) => {
  successResponse(res, await cambiaSoglie(contestoDi(req), req.body), 'Soglie salvate');
});
