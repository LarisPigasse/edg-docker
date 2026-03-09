// =============================================================================
// EDG Vehicle Service - Lookup Schemas
// Schemi Joi per le 6 tabelle di configurazione
// =============================================================================
import Joi from 'joi';

// ---------------------------------------------------------------------------
// VehicleCategory
// ---------------------------------------------------------------------------
export const vehicleCategorySchemas = {
  create: Joi.object({
    name: Joi.string().max(50).required().messages({
      'string.max': 'Il nome non può superare 50 caratteri',
      'any.required': 'Il nome è obbligatorio',
    }),
    label: Joi.string().max(100).required(),
    description: Joi.string().max(500).allow(null, '').default(null),
    requiresPlate: Joi.boolean().default(true),
    requiresTachograph: Joi.boolean().default(false),
    regulationType: Joi.string().valid('highway_code', 'dlgs_81_08', 'both').default('highway_code'),
    sortOrder: Joi.number().integer().min(0).default(0),
    isActive: Joi.boolean().default(true),
  }),

  update: Joi.object({
    name: Joi.string().max(50),
    label: Joi.string().max(100),
    description: Joi.string().max(500).allow(null, ''),
    requiresPlate: Joi.boolean(),
    requiresTachograph: Joi.boolean(),
    regulationType: Joi.string().valid('highway_code', 'dlgs_81_08', 'both'),
    sortOrder: Joi.number().integer().min(0),
    isActive: Joi.boolean(),
  }).min(1),
};

// ---------------------------------------------------------------------------
// TelematicsProvider
// ---------------------------------------------------------------------------
export const telematicsProviderSchemas = {
  create: Joi.object({
    name: Joi.string().max(100).required(),
    apiEndpoint: Joi.string().uri().max(500).allow(null, '').default(null),
    apiKey: Joi.string().max(255).allow(null, '').default(null),
    apiSecret: Joi.string().max(255).allow(null, '').default(null),
    dataFormat: Joi.string().valid('json', 'xml').default('json'),
    pollingMinutes: Joi.number().integer().min(1).max(1440).default(15),
    notes: Joi.string().max(1000).allow(null, '').default(null),
    isActive: Joi.boolean().default(true),
  }),

  update: Joi.object({
    name: Joi.string().max(100),
    apiEndpoint: Joi.string().uri().max(500).allow(null, ''),
    apiKey: Joi.string().max(255).allow(null, ''),
    apiSecret: Joi.string().max(255).allow(null, ''),
    dataFormat: Joi.string().valid('json', 'xml'),
    pollingMinutes: Joi.number().integer().min(1).max(1440),
    notes: Joi.string().max(1000).allow(null, ''),
    isActive: Joi.boolean(),
  }).min(1),
};

// ---------------------------------------------------------------------------
// Workshop
// ---------------------------------------------------------------------------
export const workshopSchemas = {
  create: Joi.object({
    name: Joi.string().max(150).required(),
    address: Joi.string().max(255).allow(null, '').default(null),
    city: Joi.string().max(100).allow(null, '').default(null),
    postalCode: Joi.string().max(10).allow(null, '').default(null),
    phone: Joi.string().max(30).allow(null, '').default(null),
    email: Joi.string().email().max(150).allow(null, '').default(null),
    specialization: Joi.string().max(255).allow(null, '').default(null),
    notes: Joi.string().max(1000).allow(null, '').default(null),
    isActive: Joi.boolean().default(true),
  }),

  update: Joi.object({
    name: Joi.string().max(150),
    address: Joi.string().max(255).allow(null, ''),
    city: Joi.string().max(100).allow(null, ''),
    postalCode: Joi.string().max(10).allow(null, ''),
    phone: Joi.string().max(30).allow(null, ''),
    email: Joi.string().email().max(150).allow(null, ''),
    specialization: Joi.string().max(255).allow(null, ''),
    notes: Joi.string().max(1000).allow(null, ''),
    isActive: Joi.boolean(),
  }).min(1),
};

// ---------------------------------------------------------------------------
// DeadlineType
// ---------------------------------------------------------------------------
export const deadlineTypeSchemas = {
  create: Joi.object({
    name: Joi.string().max(50).required(),
    label: Joi.string().max(100).required(),
    description: Joi.string().max(500).allow(null, '').default(null),
    appliesToCategories: Joi.array().items(Joi.number().integer().positive()).allow(null).default(null),
    alertDays1: Joi.number().integer().min(1).default(30),
    alertDays2: Joi.number().integer().min(1).default(15),
    alertDays3: Joi.number().integer().min(1).default(7),
    isRecurring: Joi.boolean().default(false),
    recurrenceMonths: Joi.number().integer().min(1).allow(null).default(null),
    sortOrder: Joi.number().integer().min(0).default(0),
    isActive: Joi.boolean().default(true),
  }),

  update: Joi.object({
    name: Joi.string().max(50),
    label: Joi.string().max(100),
    description: Joi.string().max(500).allow(null, ''),
    appliesToCategories: Joi.array().items(Joi.number().integer().positive()).allow(null),
    alertDays1: Joi.number().integer().min(1),
    alertDays2: Joi.number().integer().min(1),
    alertDays3: Joi.number().integer().min(1),
    isRecurring: Joi.boolean(),
    recurrenceMonths: Joi.number().integer().min(1).allow(null),
    sortOrder: Joi.number().integer().min(0),
    isActive: Joi.boolean(),
  }).min(1),
};

// ---------------------------------------------------------------------------
// MaintenanceType
// ---------------------------------------------------------------------------
export const maintenanceTypeSchemas = {
  create: Joi.object({
    name: Joi.string().max(50).required(),
    label: Joi.string().max(100).required(),
    description: Joi.string().max(500).allow(null, '').default(null),
    appliesToCategories: Joi.array().items(Joi.number().integer().positive()).allow(null).default(null),
    kmThreshold: Joi.number().integer().min(1).allow(null).default(null),
    daysThreshold: Joi.number().integer().min(1).allow(null).default(null),
    alertKmBefore: Joi.number().integer().min(1).allow(null).default(null),
    alertDaysBefore: Joi.number().integer().min(1).allow(null).default(null),
    sortOrder: Joi.number().integer().min(0).default(0),
    isActive: Joi.boolean().default(true),
  })
    .custom((value, helpers) => {
      if (value.kmThreshold === null && value.daysThreshold === null) {
        return helpers.error('any.invalid');
      }
      return value;
    })
    .messages({
      'any.invalid': 'Almeno una soglia (km o giorni) deve essere definita',
    }),

  update: Joi.object({
    name: Joi.string().max(50),
    label: Joi.string().max(100),
    description: Joi.string().max(500).allow(null, ''),
    appliesToCategories: Joi.array().items(Joi.number().integer().positive()).allow(null),
    kmThreshold: Joi.number().integer().min(1).allow(null),
    daysThreshold: Joi.number().integer().min(1).allow(null),
    alertKmBefore: Joi.number().integer().min(1).allow(null),
    alertDaysBefore: Joi.number().integer().min(1).allow(null),
    sortOrder: Joi.number().integer().min(0),
    isActive: Joi.boolean(),
  }).min(1),
};

// ---------------------------------------------------------------------------
// DriverComplianceType
// ---------------------------------------------------------------------------
export const driverComplianceTypeSchemas = {
  create: Joi.object({
    name: Joi.string().max(50).required(),
    label: Joi.string().max(100).required(),
    category: Joi.string().valid('license', 'medical', 'training', 'other').required(),
    description: Joi.string().max(500).allow(null, '').default(null),
    alertDays1: Joi.number().integer().min(1).default(90),
    alertDays2: Joi.number().integer().min(1).default(30),
    alertDays3: Joi.number().integer().min(1).default(7),
    isRenewable: Joi.boolean().default(true),
    hasExpiry: Joi.boolean().default(true),
    issuingBody: Joi.string().max(150).allow(null, '').default(null),
    sortOrder: Joi.number().integer().min(0).default(0),
    isActive: Joi.boolean().default(true),
  }),

  update: Joi.object({
    name: Joi.string().max(50),
    label: Joi.string().max(100),
    category: Joi.string().valid('license', 'medical', 'training', 'other'),
    description: Joi.string().max(500).allow(null, ''),
    alertDays1: Joi.number().integer().min(1),
    alertDays2: Joi.number().integer().min(1),
    alertDays3: Joi.number().integer().min(1),
    isRenewable: Joi.boolean(),
    hasExpiry: Joi.boolean(),
    issuingBody: Joi.string().max(150).allow(null, ''),
    sortOrder: Joi.number().integer().min(0),
    isActive: Joi.boolean(),
  }).min(1),
};
