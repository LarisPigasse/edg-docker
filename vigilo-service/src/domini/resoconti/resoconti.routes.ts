// =============================================================================
// Resoconti — /api/vigilo/resoconti (B10c)
// =============================================================================
//   GET /resoconti/spese   Spese e consumi del periodo, con il confronto con
//                          l'anno prima: lettura del tenant (read) e dati
//                          economici (costi), entrambi
// =============================================================================
import Joi from 'joi';
import { Router, Request, Response } from 'express';
import { contestoDi } from '../../core/contesto';
import { richiedi } from '../../core/middleware/permessi';
import { validateQuery } from '../../core/middleware/validate';
import { successResponse } from '../../core/utils/response';
import { giorno, tipoSoggetto, uuid } from '../schemi';
import { PERIODI } from './resoconti';
import { spese, type FiltriSpese } from './resoconti.service';

const filtri = Joi.object({
  periodo: Joi.string()
    .valid(...PERIODI)
    .default('anno'),
  dal: giorno,
  al: giorno,
  tipo: tipoSoggetto,
  sede: uuid,
  testo: Joi.string().trim().max(64).allow(''),
});

export const resocontiRoutes = Router();

resocontiRoutes.get('/resoconti/spese', richiedi('read'), richiedi('costi'), validateQuery(filtri), async (req: Request, res: Response) => {
  successResponse(res, await spese(contestoDi(req), req.query as FiltriSpese));
});
