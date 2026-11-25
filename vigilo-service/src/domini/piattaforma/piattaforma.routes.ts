// =============================================================================
// Rotte della piattaforma: Vigilo visto da EDG Pro (fase 3, ADR117)
// =============================================================================
// Il gateway non le conta come uso del modulo (nonUso: /piattaforma).
//
//   GET    /piattaforma/libreria/modelli       settori della libreria, per l'attivazione (ADR087)
//   GET    /piattaforma/tenant/:idTenant/dati  riepilogo — personale EDG con sistema.tenant (root e admin EDG)
//   DELETE /piattaforma/tenant/:idTenant/dati  elimina   — solo root; corpo { modo: 'tutto'|'dati', conferma: idTenant }
// La conferma ripete l'id del tenant: una chiamata sbagliata non cancella niente.
// Mai in accesso assistito, mai il tenant di sistema (servizio).
// =============================================================================
import { Router, Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { contestoDi } from '../../core/contesto';
import { eRoot, soloRoot } from '../../core/middleware/permessi';
import { validateBody, validateParams } from '../../core/middleware/validate';
import { ValidationError } from '../../core/utils/errors';
import { forbidden, successResponse } from '../../core/utils/response';
import { settoriDellaLibreria } from '../libreria/libreria.service';
import { eliminaDatiTenant, riepilogoDati } from './piattaforma.service';
import { MODI_ELIMINAZIONE, type ModoEliminazione } from './tabelle';

const paramTenant = Joi.object({ idTenant: Joi.number().integer().min(1).required() });
const corpoElimina = Joi.object({
  modo: Joi.string()
    .valid(...MODI_ELIMINAZIONE)
    .required()
    .label('Che cosa eliminare'),
  conferma: Joi.number().integer().required().label('La conferma'),
});

/** Personale EDG che gestisce i tenant (root o 'sistema.tenant'), mai in assistenza */
function personaleEdgTenant(req: Request, res: Response, next: NextFunction): void {
  const u = req.user;
  const permessi = u?.permissions ?? [];
  const puo = eRoot(permessi) || permessi.includes('sistema.tenant') || permessi.includes('sistema.*');
  if (!u?.systemTenant || u.assistenza || !puo) {
    forbidden(res, 'Riservato al personale EDG che gestisce i tenant');
    return;
  }
  next();
}

export const piattaformaRoutes = Router();

piattaformaRoutes.get('/piattaforma/libreria/modelli', personaleEdgTenant, async (_req: Request, res: Response) => {
  successResponse(res, await settoriDellaLibreria());
});

piattaformaRoutes.get('/piattaforma/tenant/:idTenant/dati', personaleEdgTenant, validateParams(paramTenant), async (req: Request, res: Response) => {
  successResponse(res, await riepilogoDati(Number(req.params.idTenant)));
});

piattaformaRoutes.delete(
  '/piattaforma/tenant/:idTenant/dati',
  personaleEdgTenant,
  soloRoot(),
  validateParams(paramTenant),
  validateBody(corpoElimina),
  async (req: Request, res: Response) => {
    const idTenant = Number(req.params.idTenant);
    if (Number(req.body.conferma) !== idTenant) throw new ValidationError('La conferma non corrisponde al tenant: niente è stato eliminato');
    const esito = await eliminaDatiTenant(contestoDi(req), idTenant, req.body.modo as ModoEliminazione);
    successResponse(res, esito, 'Dati eliminati');
  }
);
