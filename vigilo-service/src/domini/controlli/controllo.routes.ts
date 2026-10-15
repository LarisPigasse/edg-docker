// =============================================================================
// Controlli — /api/vigilo/controlli (lettura: read; modifiche: config)
// =============================================================================
import { Router, Request, Response } from 'express';
import { contestoDi } from '../../core/contesto';
import { richiedi } from '../../core/middleware/permessi';
import { validateBody, validateParams, validateQuery } from '../../core/middleware/validate';
import { paginaDa, rispondiLista } from '../../core/utils/lista';
import { createdResponse, noContentResponse, successResponse } from '../../core/utils/response';
import { paramUuid } from '../schemi';
import { presentaControllo } from './controllo.presenta';
import * as schemi from './controllo.schemas';
import * as servizio from './controllo.service';

export const controlliRoutes = Router();

controlliRoutes.get('/controlli', richiedi('read'), validateQuery(schemi.listaControlli), async (req: Request, res: Response) => {
  const p = paginaDa(req.query);
  const { righe, totale } = await servizio.elencaControlli(contestoDi(req), req.query, p);
  rispondiLista(res, righe.map(presentaControllo), totale, p);
});

controlliRoutes.get('/controlli/:id', richiedi('read'), validateParams(paramUuid), async (req: Request, res: Response) => {
  successResponse(res, presentaControllo(await servizio.leggiControllo(contestoDi(req), req.params.id)));
});

controlliRoutes.post('/controlli', richiedi('config'), validateBody(schemi.creaControllo), async (req: Request, res: Response) => {
  const { controllo, scadenzeCreate } = await servizio.creaControllo(contestoDi(req), req.body);
  createdResponse(res, { ...presentaControllo(controllo), scadenzeCreate }, 'Controllo creato');
});

controlliRoutes.patch(
  '/controlli/:id',
  richiedi('config'),
  validateParams(paramUuid),
  validateBody(schemi.modificaControllo),
  async (req: Request, res: Response) => {
    const { controllo, ...esito } = await servizio.modificaControllo(contestoDi(req), req.params.id, req.body);
    successResponse(res, { ...presentaControllo(controllo), ...esito }, 'Controllo modificato');
  }
);

controlliRoutes.delete('/controlli/:id', richiedi('config'), validateParams(paramUuid), async (req: Request, res: Response) => {
  await servizio.eliminaControllo(contestoDi(req), req.params.id);
  noContentResponse(res);
});
