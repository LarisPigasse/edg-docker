// =============================================================================
// EDG System Service - Validation Middleware
// Validazione body/query/params con Joi
// =============================================================================
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { badRequest } from '../utils/response';

type ValidationTarget = 'body' | 'query' | 'params';

// ---------------------------------------------------------------------------
// Messaggi Joi in italiano, condivisi da TUTTE le validazioni del servizio.
//
// Joi applica prima gli eventuali `.messages()` definiti sul singolo campo di
// uno schema (più specifici, es. "Il tipo deve essere 'partner', 'cliente' o
// 'agente'"), e ripiega su questi solo per i codici di errore non
// personalizzati. Così ogni campo — anche in uno schema futuro, anche senza
// alcuna personalizzazione — ha comunque un messaggio in italiano invece del
// testo tecnico di default di Joi (es. '"provincia" length must be less than
// or equal to 4 characters long').
//
// {{#label}} è il nome del campo (impostato con `.label(...)` nello schema,
// altrimenti la chiave grezza); {{#limit}} è il vincolo numerico dell'errore
// (lunghezza massima/minima, valore minimo/massimo, ecc.).
// Sintassi completa: https://joi.dev/api/#language
// ---------------------------------------------------------------------------
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
      messages: ITALIAN_MESSAGES, // Fallback italiano per i codici di errore non personalizzati nello schema
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
