// =============================================================================
// Assegnazioni — /api/vigilo/assegnazioni (lettura: read; modifiche: write)
// =============================================================================
import Joi from 'joi';
import { Router, Request, Response } from 'express';
import { contestoDi } from '../../core/contesto';
import { richiedi } from '../../core/middleware/permessi';
import { validateBody, validateParams, validateQuery } from '../../core/middleware/validate';
import { paginaDa, rispondiLista, schemaLista } from '../../core/utils/lista';
import { createdResponse, noContentResponse, successResponse } from '../../core/utils/response';
import { giorno, paramUuid, uuid } from '../schemi';
import type { Assegnazione } from './assegnazione.model';
import * as servizio from './assegnazione.service';
import { riferimentoSoggetto } from './soggetto.presenta';

const presenta = (a: Assegnazione) => ({
  uuid: a.uuidAssegnazione,
  soggetto: a.soggetto ? riferimentoSoggetto(a.soggetto) : null,
  persona: a.persona ? riferimentoSoggetto(a.persona) : null,
  dal: a.dal,
  al: a.al ?? null,
  note: a.note ?? null,
});

const lista = schemaLista(['dal'], 'dal', { soggetto: uuid, persona: uuid, inCorso: Joi.boolean() });
const crea = Joi.object({ soggetto: uuid.required(), persona: uuid.required(), dal: giorno.required(), al: giorno.allow(null), note: Joi.string().trim().max(1024).allow('', null) });
const modifica = Joi.object({ dal: giorno, al: giorno.allow(null), note: Joi.string().trim().max(1024).allow('', null) }).min(1);

export const assegnazioniRoutes = Router();

assegnazioniRoutes.get('/assegnazioni', richiedi('read'), validateQuery(lista), async (req: Request, res: Response) => {
  const p = paginaDa(req.query);
  const { righe, totale } = await servizio.elencaAssegnazioni(contestoDi(req), req.query, p);
  rispondiLista(res, righe.map(presenta), totale, p);
});

assegnazioniRoutes.post('/assegnazioni', richiedi('write'), validateBody(crea), async (req: Request, res: Response) => {
  createdResponse(res, presenta(await servizio.creaAssegnazione(contestoDi(req), req.body)), 'Assegnazione creata');
});

assegnazioniRoutes.patch('/assegnazioni/:id', richiedi('write'), validateParams(paramUuid), validateBody(modifica), async (req: Request, res: Response) => {
  successResponse(res, presenta(await servizio.modificaAssegnazione(contestoDi(req), req.params.id, req.body)), 'Assegnazione modificata');
});

assegnazioniRoutes.delete('/assegnazioni/:id', richiedi('write'), validateParams(paramUuid), async (req: Request, res: Response) => {
  await servizio.eliminaAssegnazione(contestoDi(req), req.params.id);
  noContentResponse(res);
});
