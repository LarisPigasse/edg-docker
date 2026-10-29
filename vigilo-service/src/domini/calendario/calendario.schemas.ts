// =============================================================================
// Calendario — periodo e filtri (gli stessi della dashboard e dell'elenco)
// =============================================================================
import Joi from 'joi';
import { giorno, naturaFiltro as natura, tipoSoggetto, uuid } from '../schemi';

export const filtriCalendario = Joi.object({
  dal: giorno.label('Dal').required(),
  al: giorno.label('Al').required(),
  categoria: uuid,
  sede: uuid,
  tipo: tipoSoggetto,
  natura,
  testo: Joi.string().trim().max(64).allow(''),
  // uno o piu' controlli (stesso nome = una voce), come nell'elenco
  controllo: Joi.string().pattern(/^[0-9a-f-]{36}(,[0-9a-f-]{36}){0,31}$/i),
});
