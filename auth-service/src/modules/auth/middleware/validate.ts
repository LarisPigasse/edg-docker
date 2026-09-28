// =============================================================================
// EDG Auth Service - Validation Middleware
// Validazione body/query/params con Joi, stesso pattern di system-service
// (messaggi in italiano condivisi, strip dei campi sconosciuti).
// =============================================================================
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { badRequest } from '../utils/response';

type ValidationTarget = 'body' | 'query' | 'params';

const ITALIAN_MESSAGES: Record<string, string> = {
  'any.required': '{{#label}} è obbligatorio',
  'any.only': '{{#label}} non è tra i valori consentiti',
  'any.invalid': '{{#label}} non è valido',
  'string.base': '{{#label}} deve essere un testo',
  'string.empty': '{{#label}} non può essere vuoto',
  'string.max': '{{#label}} non può superare {{#limit}} caratteri',
  'string.min': '{{#label}} deve avere almeno {{#limit}} caratteri',
  'string.length': '{{#label}} deve essere lungo esattamente {{#limit}} caratteri',
  'string.email': '{{#label}} deve essere un indirizzo email valido',
  'string.guid': '{{#label}} deve essere un identificativo valido',
  'string.pattern.base': '{{#label}} non è nel formato corretto',
  'number.base': '{{#label}} deve essere un numero',
  'number.integer': '{{#label}} deve essere un numero intero',
  'number.positive': '{{#label}} deve essere un numero positivo',
  'number.min': '{{#label}} deve essere almeno {{#limit}}',
  'number.max': '{{#label}} non può superare {{#limit}}',
  'boolean.base': '{{#label}} deve essere vero o falso',
  'date.base': '{{#label}} deve essere una data valida',
  'array.base': '{{#label}} deve essere un elenco',
  'array.min': '{{#label}} deve contenere almeno {{#limit}} elemento/i',
  'object.base': '{{#label}} non è valido',
  'object.unknown': '{{#label}} non è un campo consentito',
};

export function validate(schema: Joi.Schema, target: ValidationTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
      messages: ITALIAN_MESSAGES,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/['"]/g, ''),
      }));
      badRequest(res, 'Dati non validi', errors);
      return;
    }

    (req as unknown as Record<string, unknown>)[target] = value;
    next();
  };
}

export const validateBody = (schema: Joi.Schema) => validate(schema, 'body');
export const validateQuery = (schema: Joi.Schema) => validate(schema, 'query');
export const validateParams = (schema: Joi.Schema) => validate(schema, 'params');

export const commonSchemas = {
  intParam: Joi.object({
    id: Joi.number().integer().positive().required().messages({
      'number.base': 'ID non valido: deve essere un numero intero',
      'any.required': 'ID obbligatorio',
    }),
  }),

  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }).unknown(true),
};
