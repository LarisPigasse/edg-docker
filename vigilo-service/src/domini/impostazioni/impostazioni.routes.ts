// =============================================================================
// Regole degli avvisi del tenant — /api/vigilo/impostazioni/avvisi (B8d-2)
// =============================================================================
//   GET    /impostazioni/avvisi  le regole in vigore, le predefinite e i limiti
//                                (qualunque permesso Vigilo)
//   PATCH  /impostazioni/avvisi  modifica parziale (vigilo.config)
//   DELETE /impostazioni/avvisi  torna ai predefiniti (vigilo.config)
//   GET    /impostazioni/interventi  costo orario (solo vigilo.costi) e giorni
//                                    per riparare (vigilo.config o vigilo.costi)
//   PATCH  /impostazioni/interventi  modifica parziale (vigilo.config; il costo
//                                    anche vigilo.costi) — passo 8
// Joi controlla la forma; i limiti li controlla erroriAvvisi/erroriInterventi
// (limiti.ts), una sola fonte con le parole per l'utente.
// =============================================================================
import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { contestoDi } from '../../core/contesto';
import { CAPACITA, richiedi } from '../../core/middleware/permessi';
import { validateBody } from '../../core/middleware/validate';
import { successResponse } from '../../core/utils/response';
import type { RegoleAvvisi, RegoleInterventi } from './limiti';
import * as servizio from './impostazioni.service';
import * as interventi from './interventi.service';

export const impostazioniRoutes = Router();
const tutti = richiedi(...CAPACITA);
const config = richiedi('config');

const orario = Joi.string().max(5);
const modifica = Joi.object({
  orarioRiepilogo: orario.label("L'orario del riepilogo"),
  giorniLavorativi: Joi.array().items(Joi.number().integer()).max(7).label('I giorni lavorativi'),
  intervalloRichiami: Joi.number().integer().label('Il richiamo delle scadute'),
  silenzio: Joi.object({ dalle: orario.required(), alle: orario.required() }).label('Il silenzio notturno'),
})
  .min(1)
  .messages({ 'object.min': 'Nessuna regola da cambiare' });

impostazioniRoutes.get('/impostazioni/avvisi', tutti, async (req: Request, res: Response) => {
  successResponse(res, await servizio.leggiRegole(contestoDi(req)));
});

impostazioniRoutes.patch('/impostazioni/avvisi', config, validateBody(modifica), async (req: Request, res: Response) => {
  successResponse(res, await servizio.cambiaRegole(contestoDi(req), req.body as Partial<RegoleAvvisi>));
});

impostazioniRoutes.delete('/impostazioni/avvisi', config, async (req: Request, res: Response) => {
  successResponse(res, await servizio.ripristinaRegole(contestoDi(req)));
});

const modificaInterventi = Joi.object({
  costoOrario: Joi.number().allow(null).label('Il costo orario'),
  giorniRiparazione: Joi.number().integer().label('I giorni per riparare'),
})
  .min(1)
  .messages({ 'object.min': 'Nessuna regola da cambiare' });

impostazioniRoutes.get('/impostazioni/interventi', richiedi('config', 'costi'), async (req: Request, res: Response) => {
  successResponse(res, await interventi.leggiInterventi(contestoDi(req)));
});

impostazioniRoutes.patch('/impostazioni/interventi', config, validateBody(modificaInterventi), async (req: Request, res: Response) => {
  successResponse(res, await interventi.cambiaInterventi(contestoDi(req), req.body as Partial<RegoleInterventi>), 'Regole degli interventi aggiornate');
});
