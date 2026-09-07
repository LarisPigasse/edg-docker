// =============================================================================
// EDG System Service - Schema Joi: Reparto (tabella primitiva)
// =============================================================================
import Joi from 'joi';

export const repartoSchemas = {
  create: Joi.object({
    reparto: Joi.string().max(64).required().messages({
      'string.max': 'Il nome reparto non può superare 64 caratteri',
      'any.required': 'Il nome reparto è obbligatorio',
    }),
    isActive: Joi.boolean().default(true),
  }),

  update: Joi.object({
    reparto: Joi.string().max(64),
    isActive: Joi.boolean(),
  }).min(1),
};
