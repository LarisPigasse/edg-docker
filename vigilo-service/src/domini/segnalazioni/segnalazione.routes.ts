// =============================================================================
// Segnalazioni dell'addetto — /api/vigilo/... (B9c, ADR101)
// =============================================================================
//   POST   /scadenze/:id/segnalazioni     l'addetto segnala "fatto" (own)
//   DELETE /segnalazioni/:id              la ritira, finché aspetta (own)
//   POST   /segnalazioni/:id/conferma     l'ufficio conferma, con correzioni (write)
//   POST   /segnalazioni/:id/rifiuto      l'ufficio la respinge, con il motivo (write)
// =============================================================================
import { Router, Request, Response } from 'express';
import { contestoDi } from '../../core/contesto';
import { richiedi } from '../../core/middleware/permessi';
import { validateBody, validateParams } from '../../core/middleware/validate';
import { createdResponse, noContentResponse, successResponse } from '../../core/utils/response';
import { paramUuid } from '../schemi';
import { presentaEsecuzione, presentaRegistrazione } from '../scadenze/scadenza.presenta';
import * as schemi from '../scadenze/scadenza.schemas';
import * as servizio from './segnalazione.service';

export const segnalazioniRoutes = Router();

segnalazioniRoutes.post('/scadenze/:id/segnalazioni', richiedi('own'), validateParams(paramUuid), validateBody(schemi.segnalazione), async (req: Request, res: Response) => {
  const ctx = contestoDi(req);
  createdResponse(res, presentaRegistrazione(await servizio.segnala(ctx, req.params.id, req.body), ctx), 'Segnalazione inviata: l’ufficio la confermerà');
});

segnalazioniRoutes.delete('/segnalazioni/:id', richiedi('own'), validateParams(paramUuid), async (req: Request, res: Response) => {
  await servizio.ritira(contestoDi(req), req.params.id);
  noContentResponse(res);
});

segnalazioniRoutes.post('/segnalazioni/:id/conferma', richiedi('write'), validateParams(paramUuid), validateBody(schemi.conferma), async (req: Request, res: Response) => {
  const ctx = contestoDi(req);
  successResponse(res, presentaEsecuzione(ctx, await servizio.conferma(ctx, req.params.id, req.body)), 'Segnalazione confermata');
});

segnalazioniRoutes.post('/segnalazioni/:id/rifiuto', richiedi('write'), validateParams(paramUuid), validateBody(schemi.rifiuto), async (req: Request, res: Response) => {
  const ctx = contestoDi(req);
  successResponse(res, presentaRegistrazione(await servizio.respingi(ctx, req.params.id, req.body.motivo), ctx), 'Segnalazione respinta');
});
