// =============================================================================
// Avvisi dell'utente — /api/vigilo/avvisi (qualunque permesso Vigilo)
// =============================================================================
//   GET  /avvisi             i miei avvisi in app (la campanella), con i non letti
//   POST /avvisi/letti       segna come letti tutti i miei
//   POST /avvisi/:uuid/letto segna come letto un avviso
// Sempre e solo le consegne in app dell'account del token (ADR090).
// =============================================================================
import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { contestoDi } from '../../core/contesto';
import { CAPACITA, richiedi } from '../../core/middleware/permessi';
import { validateParams, validateQuery } from '../../core/middleware/validate';
import { successResponse } from '../../core/utils/response';
import * as servizio from './avviso.service';

export const avvisiRoutes = Router();
const tutti = richiedi(...CAPACITA);

const elenco = Joi.object({
  limit: Joi.number().integer().min(1).max(128).default(32),
});
const uuidParam = Joi.object({ uuid: Joi.string().guid().required() });

avvisiRoutes.get('/avvisi', tutti, validateQuery(elenco), async (req: Request, res: Response) => {
  const { limit } = req.query as unknown as { limit: number };
  successResponse(res, await servizio.mieiAvvisi(contestoDi(req), limit));
});

avvisiRoutes.post('/avvisi/letti', tutti, async (req: Request, res: Response) => {
  successResponse(res, { letti: await servizio.segnaTuttiLetti(contestoDi(req)) });
});

avvisiRoutes.post('/avvisi/:uuid/letto', tutti, validateParams(uuidParam), async (req: Request, res: Response) => {
  successResponse(res, { letto: await servizio.segnaLetto(contestoDi(req), String(req.params.uuid)) });
});
