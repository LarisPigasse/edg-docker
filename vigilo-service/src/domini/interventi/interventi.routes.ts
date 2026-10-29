// =============================================================================
// Interventi — /api/vigilo/... (B10a)
// =============================================================================
//   POST /soggetti/:id/guasti   segnala un guasto (write, own nel suo ambito)
// =============================================================================
import { Router, Request, Response } from 'express';
import { contestoDi } from '../../core/contesto';
import { richiedi } from '../../core/middleware/permessi';
import { validateBody, validateParams } from '../../core/middleware/validate';
import { createdResponse } from '../../core/utils/response';
import { presentaDettaglio } from '../scadenze/scadenza.routes';
import { leggiScadenza } from '../scadenze/scadenza.service';
import { paramUuid } from '../schemi';
import { segnalaGuasto } from './guasto.service';
import * as schemi from './interventi.schemas';

export const interventiRoutes = Router();

interventiRoutes.post('/soggetti/:id/guasti', richiedi('write', 'own'), validateParams(paramUuid), validateBody(schemi.guasto), async (req: Request, res: Response) => {
  const ctx = contestoDi(req);
  const { uuid, sospeso } = await segnalaGuasto(ctx, req.params.id, req.body);
  createdResponse(res, { ...presentaDettaglio(await leggiScadenza(ctx, uuid), ctx), sospeso }, sospeso ? 'Guasto segnalato: il mezzo è sospeso' : 'Guasto segnalato');
});
