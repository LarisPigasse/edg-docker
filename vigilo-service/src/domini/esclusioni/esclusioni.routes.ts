// =============================================================================
// Controlli non seguiti — /api/vigilo/soggetti/:id/controlli (2026-11-11)
// =============================================================================
//   GET  /soggetti/:id/controlli                          controlli del soggetto, se si seguono, e
//                                                         lo storico delle decisioni (read o own)
//   POST /soggetti/:id/controlli/:controllo/non-seguire   { motivo } obbligatorio (write)
//   POST /soggetti/:id/controlli/:controllo/riprendi      { nota } facoltativa (write)
//   GET  /controlli-non-seguiti?quali=in-corso|tutte      tutte le decisioni del tenant, per il
//                                                         report di Configurazione (read, ufficio)
// =============================================================================
import Joi from 'joi';
import { Router, Request, Response } from 'express';
import { contestoDi } from '../../core/contesto';
import { richiedi } from '../../core/middleware/permessi';
import { validateBody, validateParams, validateQuery } from '../../core/middleware/validate';
import { successResponse } from '../../core/utils/response';
import { paramUuid, uuid } from '../schemi';
import { LIMITI_ESCLUSIONE } from './esclusioni';
import { controlliDelSoggetto, elencoNonSeguiti, nonSeguire, riprendi, type QualiDecisioni } from './esclusioni.service';

const paramCoppia = Joi.object({ id: uuid.required(), controllo: uuid.required() });
const corpoNonSeguire = Joi.object({ motivo: Joi.string().trim().min(LIMITI_ESCLUSIONE.motivo.min).max(LIMITI_ESCLUSIONE.motivo.max).required().label('Il motivo') });
const corpoRiprendi = Joi.object({ nota: Joi.string().trim().max(LIMITI_ESCLUSIONE.motivo.max).allow('', null).label('La nota') });

const queryReport = Joi.object({ quali: Joi.string().valid('in-corso', 'tutte').default('in-corso') });

export const esclusioniRoutes = Router();

esclusioniRoutes.get('/controlli-non-seguiti', richiedi('read'), validateQuery(queryReport), async (req: Request, res: Response) => {
  successResponse(res, await elencoNonSeguiti(contestoDi(req), req.query.quali as QualiDecisioni));
});

esclusioniRoutes.get('/soggetti/:id/controlli', richiedi('read', 'own'), validateParams(paramUuid), async (req: Request, res: Response) => {
  successResponse(res, await controlliDelSoggetto(contestoDi(req), req.params.id));
});

esclusioniRoutes.post(
  '/soggetti/:id/controlli/:controllo/non-seguire',
  richiedi('write'),
  validateParams(paramCoppia),
  validateBody(corpoNonSeguire),
  async (req: Request, res: Response) => {
    const esito = await nonSeguire(contestoDi(req), req.params.id, req.params.controllo, req.body.motivo);
    successResponse(res, esito, 'Il controllo non si segue più per questo soggetto');
  }
);

esclusioniRoutes.post(
  '/soggetti/:id/controlli/:controllo/riprendi',
  richiedi('write'),
  validateParams(paramCoppia),
  validateBody(corpoRiprendi),
  async (req: Request, res: Response) => {
    const esito = await riprendi(contestoDi(req), req.params.id, req.params.controllo, req.body.nota);
    successResponse(res, esito, 'Il controllo si segue di nuovo');
  }
);
