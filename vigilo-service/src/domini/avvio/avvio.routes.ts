// =============================================================================
// Procedura di avvio — /api/vigilo/avvio (permesso config)
// =============================================================================
//   GET  /avvio             passo 1: modelli di settore e stato dell'avvio
//   GET  /avvio/proposta    passo 2: le voci dei modelli scelti
//   POST /avvio             passi 3-4: copia, registro delle decisioni, scadenze
// =============================================================================
import { Router, Request, Response } from 'express';
import { contestoDi } from '../../core/contesto';
import { richiedi } from '../../core/middleware/permessi';
import { validateBody, validateQuery } from '../../core/middleware/validate';
import { successResponse } from '../../core/utils/response';
import { presentaProposta, presentaRiquadro } from './avvio.presenta';
import * as schemi from './avvio.schemas';
import * as servizio from './avvio.service';

export const avvioRoutes = Router();

avvioRoutes.get('/avvio', richiedi('config'), async (req: Request, res: Response) => {
  const { riquadri, ...stato } = await servizio.statoAvvio(contestoDi(req));
  successResponse(res, { ...stato, modelli: riquadri.map(presentaRiquadro) });
});

avvioRoutes.get('/avvio/proposta', richiedi('config'), validateQuery(schemi.proposta), async (req: Request, res: Response) => {
  const modelli = req.query.modelli as unknown as string[];
  successResponse(res, presentaProposta(await servizio.proposta(contestoDi(req), modelli)));
});

avvioRoutes.post('/avvio', richiedi('config'), validateBody(schemi.avvia), async (req: Request, res: Response) => {
  const esito = await servizio.avvia(contestoDi(req), req.body);
  successResponse(res, esito, esito.primoAvvio ? 'Vigilo è pronto' : 'Voci aggiunte dalla libreria');
});
