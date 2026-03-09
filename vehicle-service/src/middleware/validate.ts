// =============================================================================
// EDG Vehicle Service - Validation Middleware
// Validazione body/query/params con Joi
// =============================================================================
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { badRequest } from '../utils/response';

type ValidationTarget = 'body' | 'query' | 'params';

// ---------------------------------------------------------------------------
// validate(schema, target)
// Valida req[target] contro lo schema Joi
// Sostituisce req[target] con il valore validato (strip unknown fields)
// ---------------------------------------------------------------------------
export function validate(schema: Joi.Schema, target: ValidationTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[target], {
      abortEarly: false, // Raccoglie tutti gli errori
      stripUnknown: true, // Rimuove campi non definiti nello schema
      convert: true, // Converte tipi (es: string "123" → number 123)
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/['"]/g, ''),
      }));
      badRequest(res, 'Dati non validi', errors);
      return;
    }

    // Sostituisce con il valore pulito e convertito
    (req as unknown as Record<string, unknown>)[target] = value;
    next();
  };
}

// ---------------------------------------------------------------------------
// Shorthand per validazione body (il caso più comune)
// ---------------------------------------------------------------------------
export const validateBody = (schema: Joi.Schema) => validate(schema, 'body');

// ---------------------------------------------------------------------------
// Shorthand per validazione query string
// ---------------------------------------------------------------------------
export const validateQuery = (schema: Joi.Schema) => validate(schema, 'query');

// ---------------------------------------------------------------------------
// Shorthand per validazione params (es: :id, :uuid)
// ---------------------------------------------------------------------------
export const validateParams = (schema: Joi.Schema) => validate(schema, 'params');

// ---------------------------------------------------------------------------
// Schema comuni riutilizzabili
// ---------------------------------------------------------------------------
export const commonSchemas = {
  // Parametro UUID nelle route (es: GET /vehicles/:id)
  uuidParam: Joi.object({
    id: Joi.string().uuid({ version: 'uuidv4' }).required().messages({
      'string.guid': 'ID non valido: deve essere un UUID v4',
      'any.required': 'ID obbligatorio',
    }),
  }),

  // Parametro ID numerico intero
  intParam: Joi.object({
    id: Joi.number().integer().positive().required().messages({
      'number.base': 'ID non valido: deve essere un numero intero',
      'any.required': 'ID obbligatorio',
    }),
  }),

  // Query paginazione standard
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }).unknown(true), // Permette altri filtri nella query
};
