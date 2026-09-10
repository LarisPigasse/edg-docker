// =============================================================================
// EDG System Service - Schema Joi: Reparto (tabella primitiva)
// =============================================================================
import Joi from 'joi';

export const repartoSchemas = {
  create: Joi.object({
    reparto: Joi.string().max(64).label('Nome reparto').required().messages({
      'string.max': 'Il nome reparto non può superare 64 caratteri',
      'any.required': 'Il nome reparto è obbligatorio',
    }),
    isActive: Joi.boolean().label('Stato attivo').default(true),
  }),

  update: Joi.object({
    reparto: Joi.string().max(64).label('Nome reparto'),
    isActive: Joi.boolean().label('Stato attivo'),
  }).min(1),
};
