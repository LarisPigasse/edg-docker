// =============================================================================
// Contatori e letture — /api/vigilo/... (lettura: read; modifiche: write)
// =============================================================================
import Joi from 'joi';
import { Router, Request, Response } from 'express';
import { contestoDi } from '../../core/contesto';
import { richiedi } from '../../core/middleware/permessi';
import { validateBody, validateParams, validateQuery } from '../../core/middleware/validate';
import { paginaDa, rispondiLista, schemaLista } from '../../core/utils/lista';
import { createdResponse, successResponse } from '../../core/utils/response';
import { giorno, paramUuid } from '../schemi';
import { presentaContatore } from '../soggetti/soggetto.presenta';
import type { Lettura } from './lettura.model';
import * as servizio from './contatore.service';

const presentaLettura = (l: Lettura) => ({
  uuid: l.uuidLettura,
  valore: l.valore,
  lettoIl: l.lettoIl,
  fonte: l.fonte,
  anomala: l.anomala,
  note: l.note ?? null,
  registrataIl: l.createdAt,
});

const nuovoContatore = Joi.object({ unita: Joi.string().valid('km', 'ore').required(), nome: Joi.string().trim().max(64).allow('') });
const nuovaLettura = Joi.object({
  valore: Joi.number().integer().min(0).max(1 << 30).required(),
  lettoIl: giorno,
  note: Joi.string().trim().max(256).allow('', null),
});
const lista = schemaLista(['lettoIl'], 'lettoIl').keys({ verso: Joi.string().valid('asc', 'desc').default('desc') });

export const contatoriRoutes = Router();

contatoriRoutes.post('/soggetti/:id/contatori', richiedi('write'), validateParams(paramUuid), validateBody(nuovoContatore), async (req: Request, res: Response) => {
  createdResponse(res, presentaContatore(await servizio.aggiungiContatore(contestoDi(req), req.params.id, req.body)), 'Contatore aggiunto');
});

contatoriRoutes.get('/contatori/:id/letture', richiedi('read'), validateParams(paramUuid), validateQuery(lista), async (req: Request, res: Response) => {
  const p = paginaDa(req.query);
  const { righe, totale } = await servizio.elencaLetture(contestoDi(req), req.params.id, p);
  rispondiLista(res, righe.map(presentaLettura), totale, p);
});

contatoriRoutes.post('/contatori/:id/letture', richiedi('write'), validateParams(paramUuid), validateBody(nuovaLettura), async (req: Request, res: Response) => {
  const { lettura, contatore } = await servizio.nuovaLettura(contestoDi(req), req.params.id, req.body);
  createdResponse(
    res,
    { lettura: presentaLettura(lettura), contatore: presentaContatore(contatore) },
    lettura.anomala ? 'Lettura registrata, ma è minore di una precedente: controllala' : 'Lettura registrata'
  );
});

contatoriRoutes.delete('/letture/:id', richiedi('write'), validateParams(paramUuid), async (req: Request, res: Response) => {
  successResponse(res, presentaContatore(await servizio.eliminaLettura(contestoDi(req), req.params.id)), 'Lettura eliminata');
});
