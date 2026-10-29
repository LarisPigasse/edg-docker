// =============================================================================
// Interventi — schemi delle richieste (B10a)
// =============================================================================
import Joi from 'joi';
import { giorno } from '../schemi';
import { LIMITI_GUASTO } from './interventi';

export const guasto = Joi.object({
  titolo: Joi.string().trim().min(1).max(LIMITI_GUASTO.titolo).required(),
  descrizione: Joi.string().trim().max(LIMITI_GUASTO.descrizione).allow('', null),
  bloccaUso: Joi.boolean().default(false),
  scadeIl: giorno.allow(null),
});
