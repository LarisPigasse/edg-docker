// =============================================================================
// Soggetti — /api/vigilo/soggetti (lettura: read; modifiche: write)
// L'addetto (own) legge la sua persona e i mezzi che ha assegnati (B9b)
// =============================================================================
import { Router, Request, Response } from 'express';
import { contestoDi } from '../../core/contesto';
import { richiedi } from '../../core/middleware/permessi';
import { validateBody, validateParams, validateQuery } from '../../core/middleware/validate';
import { paginaDa, rispondiLista } from '../../core/utils/lista';
import { createdResponse, noContentResponse, successResponse } from '../../core/utils/response';
import { paramUuid } from '../schemi';
import Joi from 'joi';
import { accountDi, collegaAccount, elencaAccount } from './account.service';
import { presentaSoggetto } from './soggetto.presenta';
import * as schemi from './soggetto.schemas';
import * as servizio from './soggetto.service';

export const soggettiRoutes = Router();

soggettiRoutes.get('/soggetti', richiedi('read', 'own'), validateQuery(schemi.listaSoggetti), async (req: Request, res: Response) => {
  const p = paginaDa(req.query);
  const { righe, totale } = await servizio.elencaSoggetti(contestoDi(req), req.query, p);
  rispondiLista(res, righe.map(presentaSoggetto), totale, p);
});

soggettiRoutes.get('/soggetti/:id', richiedi('read', 'own'), validateParams(paramUuid), async (req: Request, res: Response) => {
  const s = await servizio.leggiSoggetto(contestoDi(req), req.params.id);
  successResponse(res, { ...presentaSoggetto(s), account: await accountDi(s) });
});

// Account collegati alle persone (B9b): l'elenco per sceglierlo e il collegamento
soggettiRoutes.get('/account', richiedi('write'), async (req: Request, res: Response) => {
  successResponse(res, await elencaAccount(contestoDi(req)));
});

soggettiRoutes.put(
  '/soggetti/:id/account',
  richiedi('write'),
  validateParams(paramUuid),
  validateBody(Joi.object({ account: Joi.number().integer().positive().allow(null).required() })),
  async (req: Request, res: Response) => {
    const ctx = contestoDi(req);
    await collegaAccount(ctx, req.params.id, req.body.account);
    const s = await servizio.leggiSoggetto(ctx, req.params.id);
    successResponse(res, { ...presentaSoggetto(s), account: await accountDi(s) }, req.body.account ? 'Account collegato' : 'Account scollegato');
  }
);

soggettiRoutes.post('/soggetti', richiedi('write'), validateBody(schemi.creaSoggetto), async (req: Request, res: Response) => {
  const { soggetto, scadenzeCreate } = await servizio.creaSoggetto(contestoDi(req), req.body);
  createdResponse(res, { ...presentaSoggetto(soggetto), scadenzeCreate }, 'Soggetto creato');
});

soggettiRoutes.patch(
  '/soggetti/:id',
  richiedi('write'),
  validateParams(paramUuid),
  validateBody(schemi.modificaSoggetto),
  async (req: Request, res: Response) => {
    const { soggetto, ...esito } = await servizio.modificaSoggetto(contestoDi(req), req.params.id, req.body);
    successResponse(res, { ...presentaSoggetto(soggetto), ...esito }, 'Soggetto modificato');
  }
);

soggettiRoutes.post(
  '/soggetti/:id/stato',
  richiedi('write'),
  validateParams(paramUuid),
  validateBody(schemi.statoSoggetto),
  async (req: Request, res: Response) => {
    const { soggetto, ...esito } = await servizio.cambiaStato(contestoDi(req), req.params.id, req.body.stato, req.body.dal);
    successResponse(res, { ...presentaSoggetto(soggetto), ...esito }, 'Stato aggiornato');
  }
);

soggettiRoutes.delete('/soggetti/:id', richiedi('write'), validateParams(paramUuid), async (req: Request, res: Response) => {
  await servizio.eliminaSoggetto(contestoDi(req), req.params.id);
  noContentResponse(res);
});
