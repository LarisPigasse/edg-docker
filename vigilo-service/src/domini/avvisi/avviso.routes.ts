// =============================================================================
// Avvisi dell'utente — /api/vigilo/avvisi (qualunque permesso Vigilo)
// =============================================================================
//   GET    /avvisi              i miei avvisi in app: la campanella e la pagina
//                               "I miei avvisi" (offset, stato, tipo di soggetto)
//   POST   /avvisi/letti        segna come letti tutti i miei
//   POST   /avvisi/:uuid/letto  segna come letto un avviso
//   GET    /avvisi/preferenze   le mie preferenze, con le regole del tenant e le sedi
//   PUT    /avvisi/preferenze   le salva
//   DELETE /avvisi/preferenze   torna ai predefiniti
//   GET    /scadenze/:id/destinatari  chi riceve gli avvisi della scadenza, con
//                               i nomi (vigilo.read, B8d-3)
// Sempre e solo le consegne in app e le preferenze dell'account del token
// (ADR090, B8d-1).
// =============================================================================
import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { contestoDi } from '../../core/contesto';
import { CAPACITA, richiedi } from '../../core/middleware/permessi';
import { validateBody, validateParams, validateQuery } from '../../core/middleware/validate';
import { successResponse } from '../../core/utils/response';
import { paramUuid } from '../schemi';
import { FREQUENZE_AVVISI, TIPI_SOGGETTO } from '../valori';
import { anteprimaScadenza } from './anteprima.service';
import * as servizio from './avviso.service';
import * as preferenze from './preferenze.service';
import { LIMITI_PREFERENZE } from './preferenze';

export const avvisiRoutes = Router();
const tutti = richiedi(...CAPACITA);

const elenco = Joi.object({
  limit: Joi.number().integer().min(1).max(128).default(32),
  offset: Joi.number().integer().min(0).default(0),
  stato: Joi.string().valid(...servizio.STATI_ELENCO).default('tutti'),
  tipo: Joi.string().valid(...TIPI_SOGGETTO),
});
const uuidParam = Joi.object({ uuid: Joi.string().guid().required() });

const schedaPreferenze = Joi.object({
  frequenza: Joi.string().valid(...FREQUENZE_AVVISI).required().label('La frequenza delle email'),
  urgentiSubito: Joi.boolean().required().label('Urgenti subito'),
  filtri: Joi.object({
    tipi: Joi.array().items(Joi.string().valid(...TIPI_SOGGETTO)).unique().default([]).label('I tipi di soggetto'),
    sedi: Joi.array()
      .items(Joi.string().guid())
      .unique()
      .max(LIMITI_PREFERENZE.sedi)
      .default([])
      .label('Le sedi')
      .messages({ 'array.max': `Si possono scegliere al massimo ${LIMITI_PREFERENZE.sedi} sedi` }),
  }).default({ tipi: [], sedi: [] }),
});

avvisiRoutes.get('/avvisi', tutti, validateQuery(elenco), async (req: Request, res: Response) => {
  successResponse(res, await servizio.mieiAvvisi(contestoDi(req), req.query as unknown as servizio.RicercaAvvisi));
});

avvisiRoutes.post('/avvisi/letti', tutti, async (req: Request, res: Response) => {
  successResponse(res, { letti: await servizio.segnaTuttiLetti(contestoDi(req)) });
});

avvisiRoutes.post('/avvisi/:uuid/letto', tutti, validateParams(uuidParam), async (req: Request, res: Response) => {
  successResponse(res, { letto: await servizio.segnaLetto(contestoDi(req), String(req.params.uuid)) });
});

avvisiRoutes.get('/avvisi/preferenze', tutti, async (req: Request, res: Response) => {
  successResponse(res, await preferenze.miePreferenze(contestoDi(req)));
});

avvisiRoutes.put('/avvisi/preferenze', tutti, validateBody(schedaPreferenze), async (req: Request, res: Response) => {
  successResponse(res, await preferenze.salvaPreferenze(contestoDi(req), req.body as preferenze.PreferenzeUtente));
});

avvisiRoutes.delete('/avvisi/preferenze', tutti, async (req: Request, res: Response) => {
  successResponse(res, await preferenze.ripristinaPreferenze(contestoDi(req)));
});

avvisiRoutes.get('/scadenze/:id/destinatari', richiedi('read'), validateParams(paramUuid), async (req: Request, res: Response) => {
  successResponse(res, await anteprimaScadenza(contestoDi(req), String(req.params.id)));
});
