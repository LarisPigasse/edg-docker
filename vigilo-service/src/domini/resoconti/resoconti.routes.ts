// =============================================================================
// Resoconti — /api/vigilo/resoconti (B10c)
// =============================================================================
//   GET /resoconti/spese   Spese e consumi del periodo, con il confronto con
//                          l'anno prima: lettura del tenant (read) e dati
//                          economici (costi), entrambi
//   GET /resoconti/spese/righe.csv   il dettaglio delle stesse spese in CSV
//                          per Excel (stessi filtri e permessi)
//   GET /resoconti/mezzi   costo stimato dei mezzi (possesso, manutenzione e
//                          guasti, unità, confronto con la categoria)
//   GET /resoconti/possesso/anteprima   quota mensile, errori e avviso morbido
//                          mentre si scrive il costo di possesso
// =============================================================================
import Joi from 'joi';
import { Router, Request, Response } from 'express';
import { contestoDi } from '../../core/contesto';
import { richiedi } from '../../core/middleware/permessi';
import { validateQuery } from '../../core/middleware/validate';
import { successResponse } from '../../core/utils/response';
import { intestazioneNome } from '../allegati/allegati';
import { giorno, tipoSoggetto, uuid } from '../schemi';
import { PERIODI } from './resoconti';
import { righeCsv, spese, type FiltriSpese } from './resoconti.service';
import { anteprimaPossesso, costoMezzi, type FiltriMezzi, type RichiestaAnteprima } from './mezzi.service';
import { MODI_POSSESSO } from '../soggetti/possesso';

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

const filtriMezzi = filtri.keys({ soggetto: uuid });

const anteprima = Joi.object({
  modo: Joi.string().valid(...MODI_POSSESSO),
  prezzo: Joi.number(),
  anni: Joi.number(),
  valoreFinale: Joi.number(),
  canone: Joi.number(),
  dal: giorno.allow(null, ''),
  categoria: uuid,
  escludi: uuid,
});

export const resocontiRoutes = Router();

resocontiRoutes.get('/resoconti/mezzi', richiedi('read'), richiedi('costi'), validateQuery(filtriMezzi), async (req: Request, res: Response) => {
  successResponse(res, await costoMezzi(contestoDi(req), req.query as FiltriMezzi));
});

resocontiRoutes.get('/resoconti/possesso/anteprima', richiedi('read'), richiedi('costi'), validateQuery(anteprima), async (req: Request, res: Response) => {
  const q = { ...(req.query as RichiestaAnteprima) };
  if ((q.dal as unknown) === '') q.dal = null;
  successResponse(res, await anteprimaPossesso(contestoDi(req), q));
});

resocontiRoutes.get('/resoconti/spese/righe.csv', richiedi('read'), richiedi('costi'), validateQuery(filtri), async (req: Request, res: Response) => {
  const csv = await righeCsv(contestoDi(req), req.query as FiltriSpese);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', intestazioneNome(csv.nome, false));
  res.setHeader('Cache-Control', 'no-store');
  res.send(csv.testo);
});

resocontiRoutes.get('/resoconti/spese', richiedi('read'), richiedi('costi'), validateQuery(filtri), async (req: Request, res: Response) => {
  successResponse(res, await spese(contestoDi(req), req.query as FiltriSpese));
});
