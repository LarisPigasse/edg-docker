// =============================================================================
// EDG System Service - Schema Joi: Anagrafica (partner / cliente / agente)
// =============================================================================
import Joi from 'joi';

export const anagraficaSchemas = {
  create: Joi.object({
    tipo: Joi.string().valid('partner', 'cliente', 'agente').label('Tipo').required().messages({
      'any.only': "Il tipo deve essere 'partner', 'cliente' o 'agente'",
      'any.required': 'Il tipo è obbligatorio',
    }),
    idTenant: Joi.number().integer().positive().label('Tenant').required().messages({
      'any.required': 'Il tenant è obbligatorio',
    }),
    ragioneSociale: Joi.string().max(256).label('Ragione sociale').required().messages({
      'any.required': 'La ragione sociale è obbligatoria',
    }),
    partitaIva: Joi.string().max(32).label('Partita IVA').allow(null, '').default(null),
    codiceFiscale: Joi.string().max(32).label('Codice fiscale').allow(null, '').default(null),
    indirizzo: Joi.string().max(256).label('Indirizzo').allow(null, '').default(null),
    cap: Joi.string().max(16).label('CAP').allow(null, '').default(null),
    citta: Joi.string().max(128).label('Città').allow(null, '').default(null),
    provincia: Joi.string().max(4).label('Sigla provincia').allow(null, '').default(null),
    telefono: Joi.string().max(64).label('Telefono').allow(null, '').default(null),
    email: Joi.string().email().max(64).label('Email').allow(null, '').default(null),
    referente: Joi.string().max(64).label('Referente').allow(null, '').default(null),
    note: Joi.string().label('Note').allow(null, '').default(null),
    isActive: Joi.boolean().label('Stato attivo').default(true),
  }),

  update: Joi.object({
    tipo: Joi.string().valid('partner', 'cliente', 'agente').label('Tipo'),
    idTenant: Joi.number().integer().positive().label('Tenant'),
    ragioneSociale: Joi.string().max(256).label('Ragione sociale'),
    partitaIva: Joi.string().max(32).label('Partita IVA').allow(null, ''),
    codiceFiscale: Joi.string().max(32).label('Codice fiscale').allow(null, ''),
    indirizzo: Joi.string().max(256).label('Indirizzo').allow(null, ''),
    cap: Joi.string().max(16).label('CAP').allow(null, ''),
    citta: Joi.string().max(128).label('Città').allow(null, ''),
    provincia: Joi.string().max(4).label('Sigla provincia').allow(null, ''),
    telefono: Joi.string().max(64).label('Telefono').allow(null, ''),
    email: Joi.string().email().max(64).label('Email').allow(null, ''),
    referente: Joi.string().max(64).label('Referente').allow(null, ''),
    note: Joi.string().label('Note').allow(null, ''),
    isActive: Joi.boolean().label('Stato attivo'),
  }).min(1),
};
