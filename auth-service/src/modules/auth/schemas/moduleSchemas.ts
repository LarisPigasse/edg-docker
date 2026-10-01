// =============================================================================
// EDG Auth Service - Schema Joi: catalogo moduli e attivazioni (ADR047)
// =============================================================================
import Joi from 'joi';
import { KEY_PATTERN, MODULE_STATUSES } from '../types/module.types';

const keyMessages = {
  'string.pattern.base': '{{#label}} può contenere solo lettere minuscole, numeri e trattini, e inizia con una lettera',
};

const moduleKey = Joi.string().max(32).pattern(KEY_PATTERN).messages(keyMessages);

/** Stati che si possono impostare a mano ('scaduto' lo decide solo il processo di scadenza) */
const MANUAL_ACTIVATION_STATUSES = ['prova', 'attivo', 'sospeso'] as const;

export const moduleSchemas = {
  // ---------------------------------------------------------------------------
  // Parametri
  // ---------------------------------------------------------------------------
  keyParam: Joi.object({
    key: moduleKey.label('Chiave modulo').required(),
  }),

  tenantParam: Joi.object({
    tenantId: Joi.number().integer().positive().label('Tenant').required(),
  }),

  tenantKeyParams: Joi.object({
    tenantId: Joi.number().integer().positive().label('Tenant').required(),
    key: moduleKey.label('Chiave modulo').required(),
  }),

  // ---------------------------------------------------------------------------
  // Catalogo (solo root)
  // ---------------------------------------------------------------------------
  catalogCreate: Joi.object({
    key: moduleKey.label('Chiave').required(),
    name: Joi.string().trim().max(64).label('Nome').required(),
    description: Joi.string().trim().max(256).allow(null, '').label('Descrizione'),
    product: Joi.string().max(32).pattern(KEY_PATTERN).messages(keyMessages).label('Prodotto').required(),
    dependencies: Joi.array().items(moduleKey.label('Dipendenza')).unique().max(16).label('Dipendenze').default([]),
    status: Joi.string().valid(...MODULE_STATUSES).label('Stato').default('sviluppo'),
    trialDays: Joi.number().integer().min(1).max(256).label('Giorni di prova').default(32),
  }),

  // La chiave non compare: e' stabile e non si cambia mai
  catalogUpdate: Joi.object({
    name: Joi.string().trim().max(64).label('Nome'),
    description: Joi.string().trim().max(256).allow(null, '').label('Descrizione'),
    product: Joi.string().max(32).pattern(KEY_PATTERN).messages(keyMessages).label('Prodotto'),
    dependencies: Joi.array().items(moduleKey.label('Dipendenza')).unique().max(16).label('Dipendenze'),
    status: Joi.string().valid(...MODULE_STATUSES).label('Stato'),
    trialDays: Joi.number().integer().min(1).max(256).label('Giorni di prova'),
  }).min(1),

  // ---------------------------------------------------------------------------
  // Attivazioni (admin e root)
  // ---------------------------------------------------------------------------
  activationCreate: Joi.object({
    module: moduleKey.label('Modulo').required(),
    status: Joi.string().valid('prova', 'attivo').label('Stato').default('prova'),
    startsAt: Joi.date().iso().label('Inizio'),
    endsAt: Joi.date().iso().allow(null).label('Fine'),
    config: Joi.object().unknown(true).allow(null).label('Configurazione'),
    notes: Joi.string().trim().max(256).allow(null, '').label('Note'),
  }),

  activationUpdate: Joi.object({
    status: Joi.string().valid(...MANUAL_ACTIVATION_STATUSES).label('Stato'),
    startsAt: Joi.date().iso().label('Inizio'),
    endsAt: Joi.date().iso().allow(null).label('Fine'),
    config: Joi.object().unknown(true).allow(null).label('Configurazione'),
    notes: Joi.string().trim().max(256).allow(null, '').label('Note'),
  }).min(1),
};
