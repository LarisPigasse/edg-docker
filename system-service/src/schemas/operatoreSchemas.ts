// =============================================================================
// EDG System Service - Schema Joi: Operatore
// =============================================================================
import Joi from 'joi';

export const operatoreSchemas = {
  create: Joi.object({
    nome: Joi.string().max(64).required().messages({
      'any.required': 'Il nome è obbligatorio',
    }),
    cognome: Joi.string().max(64).required().messages({
      'any.required': 'Il cognome è obbligatorio',
    }),
    idReparto: Joi.number().integer().positive().required().messages({
      'any.required': 'Il reparto è obbligatorio',
    }),
    telefono: Joi.string().max(64).allow(null, '').default(null),
    email: Joi.string().email().max(64).allow(null, '').default(null),
    isActive: Joi.boolean().default(true),
  }),

  update: Joi.object({
    nome: Joi.string().max(64),
    cognome: Joi.string().max(64),
    idReparto: Joi.number().integer().positive(),
    telefono: Joi.string().max(64).allow(null, ''),
    email: Joi.string().email().max(64).allow(null, ''),
    isActive: Joi.boolean(),
  }).min(1),
};
