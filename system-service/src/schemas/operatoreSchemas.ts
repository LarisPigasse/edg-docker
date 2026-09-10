// =============================================================================
// EDG System Service - Schema Joi: Operatore
// =============================================================================
import Joi from 'joi';

export const operatoreSchemas = {
  create: Joi.object({
    nome: Joi.string().max(64).label('Nome').required().messages({
      'any.required': 'Il nome è obbligatorio',
    }),
    cognome: Joi.string().max(64).label('Cognome').required().messages({
      'any.required': 'Il cognome è obbligatorio',
    }),
    idReparto: Joi.number().integer().positive().label('Reparto').required().messages({
      'any.required': 'Il reparto è obbligatorio',
    }),
    telefono: Joi.string().max(64).label('Telefono').allow(null, '').default(null),
    email: Joi.string().email().max(64).label('Email').allow(null, '').default(null),
    isActive: Joi.boolean().label('Stato attivo').default(true),
  }),

  update: Joi.object({
    nome: Joi.string().max(64).label('Nome'),
    cognome: Joi.string().max(64).label('Cognome'),
    idReparto: Joi.number().integer().positive().label('Reparto'),
    telefono: Joi.string().max(64).label('Telefono').allow(null, ''),
    email: Joi.string().email().max(64).label('Email').allow(null, ''),
    isActive: Joi.boolean().label('Stato attivo'),
  }).min(1),
};
