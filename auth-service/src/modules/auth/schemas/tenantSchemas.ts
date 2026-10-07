// =============================================================================
// EDG Auth Service - Schema Joi: Tenant
// =============================================================================
import Joi from 'joi';

// Slug: identificativo breve usato per il mapping dominio->tenant (ADR012).
// Minuscolo, solo lettere/numeri/trattini, per restare compatibile con un
// futuro uso come subdomain.
const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Cliente dell'anagrafica EDG (ADR058): riferimento "morbido" per UUID, il
// record sta in system-service. null = nessun collegamento.
const clienteUuid = Joi.string().guid().allow(null).label('Cliente');

export const tenantSchemas = {
  create: Joi.object({
    name: Joi.string().max(128).label('Nome').required().messages({
      'any.required': 'Il nome è obbligatorio',
    }),
    slug: Joi.string().max(64).pattern(slugPattern).label('Slug').required().messages({
      'any.required': 'Lo slug è obbligatorio',
      'string.pattern.base': 'Lo slug può contenere solo lettere minuscole, numeri e trattini (es. "acme-spa")',
    }),
    clienteUuid,
    defaultLocale: Joi.string().max(5).label('Lingua di default').default('it'),
    isActive: Joi.boolean().label('Stato attivo').default(true),
    // isSystem NON è esposto: un tenant creato via API non è mai di sistema.
  }),

  update: Joi.object({
    name: Joi.string().max(128).label('Nome'),
    slug: Joi.string().max(64).pattern(slugPattern).label('Slug').messages({
      'string.pattern.base': 'Lo slug può contenere solo lettere minuscole, numeri e trattini (es. "acme-spa")',
    }),
    clienteUuid,
    defaultLocale: Joi.string().max(5).label('Lingua di default'),
    isActive: Joi.boolean().label('Stato attivo'),
    // isSystem resta immutabile anche in update: mai accettato dal client.
  }).min(1),
};
