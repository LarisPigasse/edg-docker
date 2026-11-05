// =============================================================================
// EDG Auth Service - Schema Joi: accesso assistito (ADR085)
// =============================================================================
import Joi from 'joi';
import { MODI_ASSISTENZA } from '../types/assistenza.types';
import { LIMITI_ACCESSI_CLIENTE } from '../utils/assistenza';

export const assistenzaSchemas = {
  apri: Joi.object({
    tenantId: Joi.number().integer().positive().label('Tenant').required(),
    modo: Joi.string().valid(...MODI_ASSISTENZA).label('Modalità').required(),
    motivo: Joi.string().trim().min(4).max(256).label('Motivo').required(),
    /** AA4: in Assistenza l'account di cui si vede la vista; in Preparazione non c'e' */
    perConto: Joi.number()
      .integer()
      .positive()
      .label('Account')
      .when('modo', { is: 'assistenza', then: Joi.required(), otherwise: Joi.forbidden() }),
  }),

  /** AA4: gli account del tenant fra cui scegliere */
  accountTenant: Joi.object({
    tenantId: Joi.number().integer().positive().label('Tenant').required(),
  }),

  /** Codice monouso: 32 byte in base64url = 43 caratteri */
  scambio: Joi.object({
    codice: Joi.string()
      .length(43)
      .pattern(/^[A-Za-z0-9_-]+$/)
      .label('Codice')
      .required(),
  }),

  elenco: Joi.object({
    aperte: Joi.boolean().default(false),
    limit: Joi.number().integer().min(1).max(256).default(64),
  }),

  /** AA5: quanti accessi mostrare al cliente */
  nelMioTenant: Joi.object({
    limit: Joi.number().integer().min(1).max(LIMITI_ACCESSI_CLIENTE.massimo).default(LIMITI_ACCESSI_CLIENTE.predefiniti),
  }),

  idParam: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
};
