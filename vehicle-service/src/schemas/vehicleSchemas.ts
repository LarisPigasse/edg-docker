// =============================================================================
// EDG Vehicle Service - Vehicle Schemas
// =============================================================================
import Joi from 'joi';

const currentYear = new Date().getFullYear();

export const vehicleSchemas = {
  create: Joi.object({
    categoryId: Joi.number().integer().positive().required(),
    brand: Joi.string().max(100).required(),
    model: Joi.string().max(100).required(),
    hasPlate: Joi.boolean().default(true),
    plate: Joi.string().max(20).uppercase().allow(null, '').default(null),
    vin: Joi.string().max(50).uppercase().allow(null, '').default(null),
    internalCode: Joi.string().max(50).allow(null, '').default(null),
    year: Joi.number()
      .integer()
      .min(1900)
      .max(currentYear + 1)
      .allow(null)
      .default(null),
    color: Joi.string().max(50).allow(null, '').default(null),
    fuelType: Joi.string().valid('diesel', 'petrol', 'electric', 'hybrid', 'lpg', 'cng', 'other').default('diesel'),
    emissionClass: Joi.string().max(20).allow(null, '').default(null),
    currentKm: Joi.number().integer().min(0).default(0),
    telematicsEnabled: Joi.boolean().default(false),
    telematicsProviderId: Joi.number().integer().positive().allow(null).default(null),
    telematicsVehicleId: Joi.string().max(100).allow(null, '').default(null),
    status: Joi.string().valid('active', 'maintenance', 'inactive', 'decommissioned').default('active'),
    ownershipType: Joi.string().valid('owned', 'leased', 'rented').default('owned'),
    acquisitionDate: Joi.date().iso().allow(null).default(null),
    decommissionDate: Joi.date().iso().allow(null).default(null),
    notes: Joi.string().max(2000).allow(null, '').default(null),
  })
    .custom((value, helpers) => {
      if (value.hasPlate && !value.plate) {
        return helpers.error('any.invalid');
      }
      return value;
    })
    .messages({
      'any.invalid': 'La targa è obbligatoria per mezzi con targa',
    }),

  update: Joi.object({
    categoryId: Joi.number().integer().positive(),
    brand: Joi.string().max(100),
    model: Joi.string().max(100),
    hasPlate: Joi.boolean(),
    plate: Joi.string().max(20).uppercase().allow(null, ''),
    vin: Joi.string().max(50).uppercase().allow(null, ''),
    internalCode: Joi.string().max(50).allow(null, ''),
    year: Joi.number()
      .integer()
      .min(1900)
      .max(currentYear + 1)
      .allow(null),
    color: Joi.string().max(50).allow(null, ''),
    fuelType: Joi.string().valid('diesel', 'petrol', 'electric', 'hybrid', 'lpg', 'cng', 'other'),
    emissionClass: Joi.string().max(20).allow(null, ''),
    currentKm: Joi.number().integer().min(0),
    telematicsEnabled: Joi.boolean(),
    telematicsProviderId: Joi.number().integer().positive().allow(null),
    telematicsVehicleId: Joi.string().max(100).allow(null, ''),
    status: Joi.string().valid('active', 'maintenance', 'inactive', 'decommissioned'),
    ownershipType: Joi.string().valid('owned', 'leased', 'rented'),
    acquisitionDate: Joi.date().iso().allow(null),
    decommissionDate: Joi.date().iso().allow(null),
    notes: Joi.string().max(2000).allow(null, ''),
  }).min(1),

  // PATCH /:id/status
  updateStatus: Joi.object({
    status: Joi.string().valid('active', 'maintenance', 'inactive', 'decommissioned').required(),
    notes: Joi.string().max(500).allow(null, ''),
  }),

  // Query string lista
  listQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().max(100).allow(''),
    status: Joi.string().valid('active', 'maintenance', 'inactive', 'decommissioned', 'all').default('active'),
    categoryId: Joi.number().integer().positive(),
    fuelType: Joi.string().valid('diesel', 'petrol', 'electric', 'hybrid', 'lpg', 'cng', 'other'),
    hasPlate: Joi.boolean(),
  }).unknown(false),
};
