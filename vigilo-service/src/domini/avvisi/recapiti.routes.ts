// =============================================================================
// Rotte pubbliche dei recapiti — /api/vigilo/pubblico/recapiti (B8d-4, ADR098)
// =============================================================================
//   GET /pubblico/recapiti/:codice   tenant, email mascherata, se è escluso
//   PUT /pubblico/recapiti/:codice   { escluso: boolean }: non ricevere più
//                                    gli avvisi, o riceverli di nuovo
// Senza utente: arrivano dal gateway (segreto) senza JWT, con un limite di
// richieste per IP. Il codice del collegamento è la sola credenziale.
// =============================================================================
import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { validateBody } from '../../core/middleware/validate';
import { successResponse } from '../../core/utils/response';
import { cambiaRecapito, leggiRecapito } from './recapiti.service';

export const recapitiRoutes = Router();

recapitiRoutes.get('/recapiti/:codice', async (req: Request, res: Response) => {
  successResponse(res, await leggiRecapito(req.params.codice));
});

recapitiRoutes.put('/recapiti/:codice', validateBody(Joi.object({ escluso: Joi.boolean().required() })), async (req: Request, res: Response) => {
  const s = await cambiaRecapito(req.params.codice, req.body.escluso);
  successResponse(res, s, s.escluso ? 'Non riceverai più questi avvisi' : 'Riceverai di nuovo questi avvisi');
});
