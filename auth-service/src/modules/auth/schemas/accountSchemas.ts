// =============================================================================
// EDG Auth Service - Schema Joi: Account
// =============================================================================
import Joi from 'joi';

// La robustezza della password (maiuscola/minuscola/numero) è verificata dal
// controller con PasswordUtils.validate() — stessa regola di registrazione e
// reset — per non duplicare la regex in due punti. Qui solo un controllo di
// base (lunghezza minima) prima di arrivarci.
const ACCOUNT_TYPES = ['operatore', 'cliente'] as const;

export const accountSchemas = {
  create: Joi.object({
    email: Joi.string().max(256).email().label('Email').required().messages({
      'any.required': "L'email è obbligatoria",
    }),
    password: Joi.string().min(8).label('Password').required().messages({
      'any.required': 'La password è obbligatoria',
    }),
    roleId: Joi.number().integer().positive().label('Ruolo').required().messages({
      'any.required': 'Il ruolo è obbligatorio',
    }),
    tenantId: Joi.number().integer().positive().label('Tenant').required().messages({
      'any.required': 'Il tenant è obbligatorio',
    }),
    accountType: Joi.string()
      .valid(...ACCOUNT_TYPES)
      .label('Tipo account')
      .required()
      .messages({
        'any.required': 'Il tipo account è obbligatorio',
        'any.only': 'Tipo account non valido (operatore o cliente)',
      }),
    entityId: Joi.string().guid().label('Entità collegata').allow(null),
  }),

  update: Joi.object({
    email: Joi.string().max(256).email().label('Email'),
    // Password opzionale: valorizzata solo se root sceglie di cambiarla —
    // vuota/assente = non toccarla (vedi AccountController.updateAccount).
    password: Joi.string().min(8).label('Password'),
    roleId: Joi.number().integer().positive().label('Ruolo'),
    tenantId: Joi.number().integer().positive().label('Tenant'),
    accountType: Joi.string()
      .valid(...ACCOUNT_TYPES)
      .label('Tipo account')
      .messages({ 'any.only': 'Tipo account non valido (operatore o cliente)' }),
    entityId: Joi.string().guid().label('Entità collegata').allow(null),
    // isActive NON è esposto in update: si cambia solo con PATCH /:id/toggle,
    // che applica anche revoca sessioni e blacklist Redis.
  }).min(1),
};
