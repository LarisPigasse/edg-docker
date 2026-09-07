// =============================================================================
// EDG System Service - Schema Joi: Anagrafica (partner / cliente / agente)
// =============================================================================
import Joi from 'joi';

export const anagraficaSchemas = {
  create: Joi.object({
    tipo: Joi.string().valid('partner', 'cliente', 'agente').required().messages({
      'any.only': "Il tipo deve essere 'partner', 'cliente' o 'agente'",
      'any.required': 'Il tipo è obbligatorio',
    }),
    idTenant: Joi.number().integer().positive().required().messages({
      'any.required': 'Il tenant è obbligatorio',
    }),
    ragioneSociale: Joi.string().max(256).required().messages({
      'any.required': 'La ragione sociale è obbligatoria',
    }),
    partitaIva: Joi.string().max(32).allow(null, '').default(null),
    codiceFiscale: Joi.string().max(32).allow(null, '').default(null),
    indirizzo: Joi.string().max(256).allow(null, '').default(null),
    cap: Joi.string().max(16).allow(null, '').default(null),
    citta: Joi.string().max(128).allow(null, '').default(null),
    provincia: Joi.string().max(4).allow(null, '').default(null),
    telefono: Joi.string().max(64).allow(null, '').default(null),
    email: Joi.string().email().max(64).allow(null, '').default(null),
    referente: Joi.string().max(64).allow(null, '').default(null),
    note: Joi.string().allow(null, '').default(null),
    isActive: Joi.boolean().default(true),
  }),

  update: Joi.object({
    tipo: Joi.string().valid('partner', 'cliente', 'agente'),
    idTenant: Joi.number().integer().positive(),
    ragioneSociale: Joi.string().max(256),
    partitaIva: Joi.string().max(32).allow(null, ''),
    codiceFiscale: Joi.string().max(32).allow(null, ''),
    indirizzo: Joi.string().max(256).allow(null, ''),
    cap: Joi.string().max(16).allow(null, ''),
    citta: Joi.string().max(128).allow(null, ''),
    provincia: Joi.string().max(4).allow(null, ''),
    telefono: Joi.string().max(64).allow(null, ''),
    email: Joi.string().email().max(64).allow(null, ''),
    referente: Joi.string().max(64).allow(null, ''),
    note: Joi.string().allow(null, ''),
    isActive: Joi.boolean(),
  }).min(1),
};
