// =============================================================================
// Aggiornamenti della libreria — /api/vigilo/aggiornamenti (B10b, ADR074)
// =============================================================================
//   GET  /aggiornamenti                          voci da decidere (config)
//   POST /aggiornamenti/:entita/:id/visto        prima apertura (config)
//   POST /aggiornamenti/:entita/:id              decisione (config)
//   GET  /aggiornamenti/:entita/:id/storico      registro della voce (read)
// :entita = categoria | controllo. Joi controlla la forma; le scelte le
// controlla scelteComplete (aggiornamenti.ts), con le parole per l'utente.
// =============================================================================
import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { contestoDi } from '../../core/contesto';
import { richiedi } from '../../core/middleware/permessi';
import { validateBody, validateParams } from '../../core/middleware/validate';
import { successResponse } from '../../core/utils/response';
import { uuid } from '../schemi';
import { ENTITA_DECISIONE, type EntitaDecisione } from '../valori';
import { dopo } from '../avvisi/immediati.service';
import * as servizio from './aggiornamenti.service';
import { chiudiSeFinito } from './avviso.service';

export const aggiornamentiRoutes = Router();
const config = richiedi('config');

const paramVoce = Joi.object({ entita: Joi.string().valid(...ENTITA_DECISIONE).required(), id: uuid.required() });
const decisione = Joi.object({
  versione: Joi.number().integer().min(1).required().label('La versione'),
  scelte: Joi.object().pattern(Joi.string().max(64), Joi.string().max(16)).max(32).label('Le scelte'),
  ritiro: Joi.string().valid('tieni', 'disattiva').label('La scelta sulla voce ritirata'),
});

const voce = (req: Request) => [req.params.entita as EntitaDecisione, req.params.id] as const;

aggiornamentiRoutes.get('/aggiornamenti', config, async (req: Request, res: Response) => {
  successResponse(res, await servizio.elencaAggiornamenti(contestoDi(req)));
});

aggiornamentiRoutes.post('/aggiornamenti/:entita/:id/visto', config, validateParams(paramVoce), async (req: Request, res: Response) => {
  successResponse(res, await servizio.segnaVisto(contestoDi(req), ...voce(req)));
});

aggiornamentiRoutes.post(
  '/aggiornamenti/:entita/:id',
  config,
  validateParams(paramVoce),
  validateBody(decisione),
  async (req: Request, res: Response) => {
    const ctx = contestoDi(req);
    const esito = await servizio.decidi(ctx, ...voce(req), req.body as servizio.Decisione);
    // l'ultima voce decisa chiude l'avviso della libreria (dopo il commit, senza far fallire la richiesta)
    dopo('libreria', () => chiudiSeFinito(ctx.idTenant));
    successResponse(res, esito, esito.esito === 'rifiutato' ? 'Tenuti i tuoi valori' : 'Aggiornamento applicato');
  }
);

aggiornamentiRoutes.get('/aggiornamenti/:entita/:id/storico', richiedi('read'), validateParams(paramVoce), async (req: Request, res: Response) => {
  successResponse(res, await servizio.storicoLibreria(contestoDi(req), ...voce(req)));
});
