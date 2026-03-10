// =============================================================================
// EDG Vehicle Service - Driver Schemas
// =============================================================================
import Joi from 'joi';

export const driverSchemas = {
  create: Joi.object({
    firstName: Joi.string().max(100).required(),
    lastName: Joi.string().max(100).required(),
    fiscalCode: Joi.string().length(16).uppercase().allow(null, '').default(null),
    birthDate: Joi.date().iso().max('now').allow(null).default(null),
    phone: Joi.string().max(50).allow(null, '').default(null),
    email: Joi.string().email().max(200).allow(null, '').default(null),
    address: Joi.string().max(300).allow(null, '').default(null),
    city: Joi.string().max(100).allow(null, '').default(null),
    hireDate: Joi.date().iso().allow(null).default(null),
    terminationDate: Joi.date().iso().allow(null).default(null),
    authUserId: Joi.number().integer().positive().allow(null).default(null),
    isActive: Joi.boolean().default(true),
    notes: Joi.string().max(2000).allow(null, '').default(null),
  }),

  update: Joi.object({
    firstName: Joi.string().max(100),
    lastName: Joi.string().max(100),
    fiscalCode: Joi.string().length(16).uppercase().allow(null, ''),
    birthDate: Joi.date().iso().max('now').allow(null),
    phone: Joi.string().max(50).allow(null, ''),
    email: Joi.string().email().max(200).allow(null, ''),
    address: Joi.string().max(300).allow(null, ''),
    city: Joi.string().max(100).allow(null, ''),
    hireDate: Joi.date().iso().allow(null),
    terminationDate: Joi.date().iso().allow(null),
    authUserId: Joi.number().integer().positive().allow(null),
    isActive: Joi.boolean(),
    notes: Joi.string().max(2000).allow(null, ''),
  }).min(1),

  // Query string lista
  listQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().max(100).allow(''),
    active: Joi.boolean().default(true),
    city: Joi.string().max(100).allow(''),
  }).unknown(false),
};
