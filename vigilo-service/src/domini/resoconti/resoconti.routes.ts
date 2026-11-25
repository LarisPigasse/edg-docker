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
//   GET /resoconti/mezzi/:id/andamento   i costi del mezzo mese per mese
//                          (anche "da quando c'è"; read e costi; 2026-11-16)
//   GET /resoconti/fornitori   interventi e costi per fornitore nel periodo
//                          (tutti, un tipo o uno; read e costi; 2026-11-12)
// =============================================================================
import Joi from 'joi';
import { Router, Request, Response } from 'express';
import { contestoDi } from '../../core/contesto';
import { consultato } from '../../core/services/consultazioni';
import { nomeSoggetto } from '../consultazioni';
import { richiedi } from '../../core/middleware/permessi';
import { validateParams, validateQuery } from '../../core/middleware/validate';
import { successResponse } from '../../core/utils/response';
import { intestazioneNome } from '../allegati/allegati';
import { giorno, paramUuid, tipoSoggetto, uuid } from '../schemi';
import { PERIODI } from './resoconti';
import { interventiFornitori, righeCsv, spese, type FiltriFornitori, type FiltriSpese } from './resoconti.service';
import { andamentoMezzo, anteprimaPossesso, costoMezzi, type FiltriAndamento, type FiltriMezzi, type RichiestaAnteprima } from './mezzi.service';
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

/** L'andamento dei costi di un mezzo: gli ultimi 12 mesi chiusi (predefinito), i periodi di Spese e consumi e "da quando c'è" */
const filtriAndamento = Joi.object({
  periodo: Joi.string()
    .valid('chiusi', ...PERIODI, 'inizio')
    .default('chiusi'),
  dal: giorno,
  al: giorno,
});

/** Interventi e costi per fornitore: il periodo (ultimi 12 mesi se manca) e un fornitore o un tipo */
const filtriFornitori = Joi.object({
  periodo: Joi.string()
    .valid(...PERIODI)
    .default('12m'),
  dal: giorno,
  al: giorno,
  fornitore: uuid,
  tipoFornitore: Joi.string().trim().max(64),
});

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
  const ctx = contestoDi(req);
  const q = req.query as FiltriMezzi;
  successResponse(res, await costoMezzi(ctx, q));
  // il costo di un solo mezzo lo chiedono la scheda, l'esportazione e la stima: conta solo il report
  if (!q.soggetto) consultato(ctx, 'resoconto-mezzi', { dettagli: { filtri: req.query } });
});

resocontiRoutes.get(
  '/resoconti/mezzi/:id/andamento',
  richiedi('read'),
  richiedi('costi'),
  validateParams(paramUuid),
  validateQuery(filtriAndamento),
  async (req: Request, res: Response) => {
    const ctx = contestoDi(req);
    successResponse(res, await andamentoMezzo(ctx, req.params.id, req.query as FiltriAndamento));
    consultato(ctx, 'andamento-mezzo', { id: req.params.id, nome: () => nomeSoggetto(ctx.idTenant, req.params.id), dettagli: { filtri: req.query } });
  }
);

resocontiRoutes.get('/resoconti/possesso/anteprima', richiedi('read'), richiedi('costi'), validateQuery(anteprima), async (req: Request, res: Response) => {
  const q = { ...(req.query as RichiestaAnteprima) };
  if ((q.dal as unknown) === '') q.dal = null;
  successResponse(res, await anteprimaPossesso(contestoDi(req), q));
});

resocontiRoutes.get('/resoconti/spese/righe.csv', richiedi('read'), richiedi('costi'), validateQuery(filtri), async (req: Request, res: Response) => {
  const ctx = contestoDi(req);
  const csv = await righeCsv(ctx, req.query as FiltriSpese);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', intestazioneNome(csv.nome, false));
  res.setHeader('Cache-Control', 'no-store');
  res.send(csv.testo);
  consultato(ctx, 'csv-spese', { dettagli: { filtri: req.query, file: csv.nome } });
});

resocontiRoutes.get('/resoconti/fornitori', richiedi('read'), richiedi('costi'), validateQuery(filtriFornitori), async (req: Request, res: Response) => {
  const ctx = contestoDi(req);
  successResponse(res, await interventiFornitori(ctx, req.query as FiltriFornitori));
  consultato(ctx, 'resoconto-fornitori', { dettagli: { filtri: req.query } });
});

resocontiRoutes.get('/resoconti/spese', richiedi('read'), richiedi('costi'), validateQuery(filtri), async (req: Request, res: Response) => {
  const ctx = contestoDi(req);
  successResponse(res, await spese(ctx, req.query as FiltriSpese));
  consultato(ctx, 'resoconto-spese', { dettagli: { filtri: req.query } });
});
