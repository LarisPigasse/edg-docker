// =============================================================================
// EDG System Service - Schema Joi: Settore (tabella di base, ADR059)
// =============================================================================
import Joi from 'joi';

export const settoreSchemas = {
  create: Joi.object({
    settore: Joi.string().trim().max(64).label('Settore').required().messages({
      'string.max': 'Il nome del settore non può superare 64 caratteri',
      'any.required': 'Il nome del settore è obbligatorio',
    }),
    isActive: Joi.boolean().label('Stato attivo').default(true),
  }),

  update: Joi.object({
    settore: Joi.string().trim().max(64).label('Settore'),
    isActive: Joi.boolean().label('Stato attivo'),
  }).min(1),
};
