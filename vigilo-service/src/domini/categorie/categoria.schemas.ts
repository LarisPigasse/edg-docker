// =============================================================================
// Categorie — schemi delle richieste
// =============================================================================
import Joi from 'joi';
import { schemaLista } from '../../core/utils/lista';
import { campoAggiuntivo, tipoSoggetto } from '../schemi';

const campi = Joi.array().items(campoAggiuntivo).max(64).unique('chiave');
const contatori = Joi.array().items(Joi.string().valid('km', 'ore')).max(2).unique();

export const creaCategoria = Joi.object({
  tipoSoggetto: tipoSoggetto.required(),
  nome: Joi.string().trim().min(1).max(128).required(),
  descrizione: Joi.string().trim().max(1024).allow('', null),
  icona: Joi.string().trim().max(32).allow('', null),
  ordine: Joi.number().integer().min(0).max(1024),
  attiva: Joi.boolean(),
  campi,
  contatori,
});

export const modificaCategoria = creaCategoria.fork(['tipoSoggetto', 'nome'], s => s.optional()).min(1);

export const listaCategorie = schemaLista(['ordine', 'nome', 'tipoSoggetto', 'creataIl'], 'ordine', {
  tipo: tipoSoggetto,
  attiva: Joi.boolean(),
});
