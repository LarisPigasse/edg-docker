// =============================================================================
// Dashboard — filtri (gli stessi dell'elenco delle scadenze)
// =============================================================================
import Joi from 'joi';
import { naturaFiltro as natura, tipoSoggetto, uuid } from '../schemi';

export const filtriDashboard = Joi.object({
  categoria: uuid,
  sede: uuid,
  tipo: tipoSoggetto,
  natura,
  testo: Joi.string().trim().max(64).allow(''),
});
