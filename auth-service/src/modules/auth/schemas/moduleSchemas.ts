// =============================================================================
// EDG Auth Service - Schema Joi: catalogo moduli e attivazioni (ADR047)
// =============================================================================
import Joi from 'joi';
import { BRAND_MODES, KEY_PATTERN, MODULE_STATUSES } from '../types/module.types';

const keyMessages = {
  'string.pattern.base': '{{#label}} può contenere solo lettere minuscole, numeri e trattini, e inizia con una lettera',
};

const moduleKey = Joi.string().max(32).pattern(KEY_PATTERN).messages(keyMessages);

/** Un elemento grafico (ADR054): immagine del frontend o testo con classi Tailwind */
const brandElement = Joi.object({
  mode: Joi.string().valid(...BRAND_MODES).label('Tipo').required(),
  text: Joi.string().trim().max(64).allow(null, '').label('Testo'),
  // Classi Tailwind: solo caratteri ammessi nei nomi di classe, separati da spazi
  classes: Joi.string()
    .trim()
    .max(256)
    .pattern(/^[a-zA-Z0-9\s\-:/.\[\]#%_!]*$/)
    .allow(null, '')
    .label('Classi')
    .messages({ 'string.pattern.base': 'Le classi possono contenere solo lettere, cifre e i simboli - : / . [ ] # % _ !' }),
});

/** Versione major.minor.patch (ADR057) */
const version = Joi.string()
  .max(16)
  .pattern(/^\d{1,4}\.\d{1,4}\.\d{1,4}$/)
  .label('Versione')
  .messages({ 'string.pattern.base': '{{#label}} nel formato major.minor.patch (es. 1.2.0)' });

const branding = Joi.object({ icon: brandElement, logo: brandElement, title: brandElement })
  .allow(null)
  .label('Aspetto');

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
    showcase: Joi.boolean().label('In vetrina').default(false),
    trialDays: Joi.number().integer().min(1).max(256).label('Giorni di prova').default(32),
    version: version.default('1.0.0'),
    branding,
  }),

  // La chiave non compare: e' stabile e non si cambia mai
  catalogUpdate: Joi.object({
    name: Joi.string().trim().max(64).label('Nome'),
    description: Joi.string().trim().max(256).allow(null, '').label('Descrizione'),
    product: Joi.string().max(32).pattern(KEY_PATTERN).messages(keyMessages).label('Prodotto'),
    dependencies: Joi.array().items(moduleKey.label('Dipendenza')).unique().max(16).label('Dipendenze'),
    status: Joi.string().valid(...MODULE_STATUSES).label('Stato'),
    showcase: Joi.boolean().label('In vetrina'),
    trialDays: Joi.number().integer().min(1).max(256).label('Giorni di prova'),
    version,
    branding,
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
