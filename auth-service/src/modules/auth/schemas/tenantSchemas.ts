// =============================================================================
// EDG Auth Service - Schema Joi: Tenant
// =============================================================================
import Joi from 'joi';
import { KEY_PATTERN } from '../types/module.types';

// Slug: identificativo breve usato per il mapping dominio->tenant (ADR012).
// Minuscolo, solo lettere/numeri/trattini, per restare compatibile con un
// futuro uso come subdomain.
const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Settore di attivita' (ADR047): chiave libera, valori ancora da definire
// (es. trasportatore, agricola, movimento-terra). Vale per tutti i moduli.
const sector = Joi.string()
  .max(32)
  .pattern(KEY_PATTERN)
  .allow(null)
  .label('Settore')
  .messages({ 'string.pattern.base': 'Il settore può contenere solo lettere minuscole, numeri e trattini (es. "movimento-terra")' });

export const tenantSchemas = {
  create: Joi.object({
    name: Joi.string().max(128).label('Nome').required().messages({
      'any.required': 'Il nome è obbligatorio',
    }),
    slug: Joi.string().max(64).pattern(slugPattern).label('Slug').required().messages({
      'any.required': 'Lo slug è obbligatorio',
      'string.pattern.base': 'Lo slug può contenere solo lettere minuscole, numeri e trattini (es. "acme-spa")',
    }),
    sector,
    defaultLocale: Joi.string().max(5).label('Lingua di default').default('it'),
    isActive: Joi.boolean().label('Stato attivo').default(true),
    // isSystem NON è esposto: un tenant creato via API non è mai di sistema.
  }),

  update: Joi.object({
    name: Joi.string().max(128).label('Nome'),
    slug: Joi.string().max(64).pattern(slugPattern).label('Slug').messages({
      'string.pattern.base': 'Lo slug può contenere solo lettere minuscole, numeri e trattini (es. "acme-spa")',
    }),
    sector,
    defaultLocale: Joi.string().max(5).label('Lingua di default'),
    isActive: Joi.boolean().label('Stato attivo'),
    // isSystem resta immutabile anche in update: mai accettato dal client.
  }).min(1),
};
