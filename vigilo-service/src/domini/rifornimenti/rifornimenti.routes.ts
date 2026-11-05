// =============================================================================
// Rifornimenti — /api/vigilo/rifornimenti (costo dei mezzi, tappa 2)
// =============================================================================
//   GET    /rifornimenti        elenco (read o own: l'addetto nel suo ambito)
//   GET    /rifornimenti/:id    uno
//   POST   /rifornimenti        nuovo (write o own nei mezzi del suo ambito)
//   PATCH  /rifornimenti/:id    correzione (write, o own se l'ha scritto lui)
//   DELETE /rifornimenti/:id    eliminazione (come la correzione)
// =============================================================================
import Joi from 'joi';
import { Router, Request, Response } from 'express';
import { contestoDi } from '../../core/contesto';
import { richiedi } from '../../core/middleware/permessi';
import { validateBody, validateParams, validateQuery } from '../../core/middleware/validate';
import { paginaDa, rispondiLista, schemaLista } from '../../core/utils/lista';
import { createdResponse, successResponse } from '../../core/utils/response';
import { giorno, paramUuid, uuid } from '../schemi';
import { VOCI_RIFORNIMENTO, type VoceRifornimento } from '../valori';
import { creaRifornimento, elencaRifornimenti, eliminaRifornimento, leggiRifornimento, modificaRifornimento, type CorpoRifornimento } from './rifornimenti.service';

const voce = Joi.string().valid(...VOCI_RIFORNIMENTO);
const campi = {
  fattoIl: giorno,
  voce,
  litri: Joi.number().allow(null),
  importo: Joi.number(),
  lettura: Joi.number().allow(null),
  fornitore: uuid.allow(null, ''),
  riferimento: Joi.string().trim().max(128).allow('', null),
  note: Joi.string().trim().max(4096).allow('', null),
};

const nuovo = Joi.object({ ...campi, soggetto: uuid.required(), fattoIl: giorno.required(), voce: voce.required(), importo: Joi.number().required() });
const modifica = Joi.object(campi).min(1);
const lista = schemaLista(['fattoIl'], 'fattoIl', { soggetto: uuid, voce, dal: giorno, al: giorno });

export const rifornimentiRoutes = Router();

rifornimentiRoutes.get('/rifornimenti', richiedi('read', 'own'), validateQuery(lista), async (req: Request, res: Response) => {
  const p = paginaDa(req.query);
  const q = req.query as { soggetto?: string; voce?: VoceRifornimento; dal?: string; al?: string };
  const { elementi, totale } = await elencaRifornimenti(contestoDi(req), q, p);
  rispondiLista(res, elementi, totale, p);
});

rifornimentiRoutes.get('/rifornimenti/:id', richiedi('read', 'own'), validateParams(paramUuid), async (req: Request, res: Response) => {
  successResponse(res, await leggiRifornimento(contestoDi(req), req.params.id));
});

rifornimentiRoutes.post('/rifornimenti', richiedi('write', 'own'), validateBody(nuovo), async (req: Request, res: Response) => {
  createdResponse(res, await creaRifornimento(contestoDi(req), req.body as CorpoRifornimento), 'Rifornimento registrato');
});

rifornimentiRoutes.patch('/rifornimenti/:id', richiedi('write', 'own'), validateParams(paramUuid), validateBody(modifica), async (req: Request, res: Response) => {
  successResponse(res, await modificaRifornimento(contestoDi(req), req.params.id, req.body as CorpoRifornimento), 'Rifornimento modificato');
});

rifornimentiRoutes.delete('/rifornimenti/:id', richiedi('write', 'own'), validateParams(paramUuid), async (req: Request, res: Response) => {
  await eliminaRifornimento(contestoDi(req), req.params.id);
  successResponse(res, null, 'Rifornimento eliminato');
});
