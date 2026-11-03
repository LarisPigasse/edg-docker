// =============================================================================
// Tipi di fornitore — /api/vigilo/fornitori/tipi (F0)
// =============================================================================
//   GET    /fornitori/tipi          gli attivi (qualunque permesso Vigilo);
//                                   per root tutti, con quanti fornitori li usano
//   POST   /fornitori/tipi          nuovo tipo (root)
//   PATCH  /fornitori/tipi/:chiave  nome, attivo, ordine (root)
//   DELETE /fornitori/tipi/:chiave  solo se nessun fornitore lo usa (root)
// Va montato prima di /fornitori/:id. Joi controlla la forma; nome e limiti
// li controlla tipi.ts, con le parole per l'utente.
// =============================================================================
import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { contestoDi } from '../../core/contesto';
import { CAPACITA, eRoot, richiedi, soloRoot } from '../../core/middleware/permessi';
import { validateBody, validateParams } from '../../core/middleware/validate';
import { createdResponse, noContentResponse, successResponse } from '../../core/utils/response';
import * as servizio from './tipi.service';

export const tipiFornitoreRoutes = Router();

const paramChiave = Joi.object({ chiave: Joi.string().max(32).pattern(/^[a-z][a-z0-9-]*$/).required() });
const nome = Joi.string().max(256).label('Il nome');
const crea = Joi.object({ nome: nome.required() });
const modifica = Joi.object({ nome, attivo: Joi.boolean(), ordine: Joi.number().integer().min(0).max(4096) })
  .min(1)
  .messages({ 'object.min': 'Niente da cambiare' });

tipiFornitoreRoutes.get('/fornitori/tipi', richiedi(...CAPACITA), async (req: Request, res: Response) => {
  successResponse(res, await servizio.elencaTipi(eRoot(req.user?.permissions) && !req.user?.assistenza));
});

tipiFornitoreRoutes.post('/fornitori/tipi', soloRoot(), validateBody(crea), async (req: Request, res: Response) => {
  createdResponse(res, await servizio.creaTipo(contestoDi(req), req.body.nome), 'Tipo di fornitore creato');
});

tipiFornitoreRoutes.patch('/fornitori/tipi/:chiave', soloRoot(), validateParams(paramChiave), validateBody(modifica), async (req: Request, res: Response) => {
  successResponse(res, await servizio.modificaTipo(contestoDi(req), req.params.chiave, req.body), 'Tipo di fornitore modificato');
});

tipiFornitoreRoutes.delete('/fornitori/tipi/:chiave', soloRoot(), validateParams(paramChiave), async (req: Request, res: Response) => {
  await servizio.eliminaTipo(contestoDi(req), req.params.chiave);
  noContentResponse(res);
});
