// =============================================================================
// Categorie — /api/vigilo/categorie (lettura: read; modifiche: config)
// =============================================================================
import { Router, Request, Response } from 'express';
import { contestoDi } from '../../core/contesto';
import { richiedi } from '../../core/middleware/permessi';
import { validateBody, validateParams, validateQuery } from '../../core/middleware/validate';
import { paginaDa, rispondiLista } from '../../core/utils/lista';
import { createdResponse, noContentResponse, successResponse } from '../../core/utils/response';
import { paramUuid } from '../schemi';
import { presentaCategoria } from './categoria.presenta';
import * as schemi from './categoria.schemas';
import * as servizio from './categoria.service';

export const categorieRoutes = Router();

categorieRoutes.get('/categorie', richiedi('read'), validateQuery(schemi.listaCategorie), async (req: Request, res: Response) => {
  const p = paginaDa(req.query);
  const { righe, totale } = await servizio.elencaCategorie(contestoDi(req), req.query, p);
  rispondiLista(res, righe.map(presentaCategoria), totale, p);
});

categorieRoutes.get('/categorie/:id', richiedi('read'), validateParams(paramUuid), async (req: Request, res: Response) => {
  successResponse(res, presentaCategoria(await servizio.leggiCategoria(contestoDi(req), req.params.id)));
});

categorieRoutes.post('/categorie', richiedi('config'), validateBody(schemi.creaCategoria), async (req: Request, res: Response) => {
  createdResponse(res, presentaCategoria(await servizio.creaCategoria(contestoDi(req), req.body)), 'Categoria creata');
});

categorieRoutes.patch(
  '/categorie/:id',
  richiedi('config'),
  validateParams(paramUuid),
  validateBody(schemi.modificaCategoria),
  async (req: Request, res: Response) => {
    successResponse(res, presentaCategoria(await servizio.modificaCategoria(contestoDi(req), req.params.id, req.body)), 'Categoria modificata');
  }
);

categorieRoutes.delete('/categorie/:id', richiedi('config'), validateParams(paramUuid), async (req: Request, res: Response) => {
  await servizio.eliminaCategoria(contestoDi(req), req.params.id);
  noContentResponse(res);
});
