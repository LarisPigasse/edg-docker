// =============================================================================
// EDG Vehicle Service - Operative Schemas
// =============================================================================
import Joi from 'joi';

// ---------------------------------------------------------------------------
// KmReading
// ---------------------------------------------------------------------------
export const kmReadingSchemas = {
  create: Joi.object({
    vehicleId: Joi.number().integer().positive().required(),
    readingValue: Joi.number().integer().min(0).required(),
    readingDate: Joi.date().iso().max('now').required(),
    source: Joi.string().valid('manual', 'telematics_api').default('manual'),
    notes: Joi.string().max(500).allow(null, '').default(null),
  }),

  listQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    vehicleId: Joi.number().integer().positive(),
    source: Joi.string().valid('manual', 'telematics_api'),
    dateFrom: Joi.date().iso(),
    dateTo: Joi.date().iso(),
  }).unknown(false),
};

// ---------------------------------------------------------------------------
// VehicleDeadline
// ---------------------------------------------------------------------------
export const vehicleDeadlineSchemas = {
  create: Joi.object({
    vehicleId: Joi.number().integer().positive().required(),
    deadlineTypeId: Joi.number().integer().positive().required(),
    expiryDate: Joi.date().iso().required(),
    lastRenewalDate: Joi.date().iso().allow(null).default(null),
    notes: Joi.string().max(500).allow(null, '').default(null),
  }),

  update: Joi.object({
    expiryDate: Joi.date().iso(),
    lastRenewalDate: Joi.date().iso().allow(null),
    status: Joi.string().valid('valid', 'expiring', 'expired'),
    notes: Joi.string().max(500).allow(null, ''),
  }).min(1),

  // Rinnovo scadenza — endpoint dedicato PATCH /:id/renew
  renew: Joi.object({
    expiryDate: Joi.date().iso().required(),
    lastRenewalDate: Joi.date()
      .iso()
      .default(() => new Date()),
    notes: Joi.string().max(500).allow(null, ''),
  }),

  listQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    vehicleId: Joi.number().integer().positive(),
    status: Joi.string().valid('valid', 'expiring', 'expired', 'all').default('all'),
  }).unknown(false),
};

// ---------------------------------------------------------------------------
// MaintenanceSchedule
// ---------------------------------------------------------------------------
export const maintenanceScheduleSchemas = {
  create: Joi.object({
    vehicleId: Joi.number().integer().positive().required(),
    maintenanceTypeId: Joi.number().integer().positive().required(),
    lastKm: Joi.number().integer().min(0).allow(null).default(null),
    lastDate: Joi.date().iso().allow(null).default(null),
    nextKm: Joi.number().integer().min(0).allow(null).default(null),
    nextDate: Joi.date().iso().allow(null).default(null),
    notes: Joi.string().max(500).allow(null, '').default(null),
  }),

  update: Joi.object({
    lastKm: Joi.number().integer().min(0).allow(null),
    lastDate: Joi.date().iso().allow(null),
    nextKm: Joi.number().integer().min(0).allow(null),
    nextDate: Joi.date().iso().allow(null),
    status: Joi.string().valid('ok', 'due_soon', 'overdue'),
    notes: Joi.string().max(500).allow(null, ''),
  }).min(1),

  listQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    vehicleId: Joi.number().integer().positive(),
    status: Joi.string().valid('ok', 'due_soon', 'overdue', 'all').default('all'),
  }).unknown(false),
};

// ---------------------------------------------------------------------------
// MaintenanceRecord
// ---------------------------------------------------------------------------
export const maintenanceRecordSchemas = {
  create: Joi.object({
    vehicleId: Joi.number().integer().positive().required(),
    maintenanceTypeId: Joi.number().integer().positive().required(),
    scheduleId: Joi.number().integer().positive().allow(null).default(null),
    workshopId: Joi.number().integer().positive().allow(null).default(null),
    performedAt: Joi.date().iso().max('now').required(),
    kmAtService: Joi.number().integer().min(0).allow(null).default(null),
    cost: Joi.number().precision(2).min(0).allow(null).default(null),
    description: Joi.string().max(1000).allow(null, '').default(null),
    nextKm: Joi.number().integer().min(0).allow(null).default(null),
    nextDate: Joi.date().iso().allow(null).default(null),
    notes: Joi.string().max(500).allow(null, '').default(null),
  }),

  update: Joi.object({
    workshopId: Joi.number().integer().positive().allow(null),
    performedAt: Joi.date().iso().max('now'),
    kmAtService: Joi.number().integer().min(0).allow(null),
    cost: Joi.number().precision(2).min(0).allow(null),
    description: Joi.string().max(1000).allow(null, ''),
    nextKm: Joi.number().integer().min(0).allow(null),
    nextDate: Joi.date().iso().allow(null),
    notes: Joi.string().max(500).allow(null, ''),
  }).min(1),

  listQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    vehicleId: Joi.number().integer().positive(),
    maintenanceTypeId: Joi.number().integer().positive(),
    workshopId: Joi.number().integer().positive(),
    dateFrom: Joi.date().iso(),
    dateTo: Joi.date().iso(),
  }).unknown(false),
};

// ---------------------------------------------------------------------------
// VehicleAssignment
// ---------------------------------------------------------------------------
export const vehicleAssignmentSchemas = {
  create: Joi.object({
    vehicleId: Joi.number().integer().positive().required(),
    driverId: Joi.number().integer().positive().required(),
    startedAt: Joi.date()
      .iso()
      .default(() => new Date()),
    notes: Joi.string().max(500).allow(null, '').default(null),
  }),

  // Chiusura assignment — PATCH /:id/end
  end: Joi.object({
    endedAt: Joi.date()
      .iso()
      .max('now')
      .default(() => new Date()),
    notes: Joi.string().max(500).allow(null, ''),
  }),

  listQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    vehicleId: Joi.number().integer().positive(),
    driverId: Joi.number().integer().positive(),
    active: Joi.boolean(), // true = solo assignments aperti (endedAt IS NULL)
  }).unknown(false),
};

// ---------------------------------------------------------------------------
// DriverCompliance
// ---------------------------------------------------------------------------
export const driverComplianceSchemas = {
  create: Joi.object({
    driverId: Joi.number().integer().positive().required(),
    typeId: Joi.number().integer().positive().required(),
    issuedAt: Joi.date().iso().allow(null).default(null),
    expiresAt: Joi.date().iso().allow(null).default(null),
    issuingBody: Joi.string().max(150).allow(null, '').default(null),
    notes: Joi.string().max(500).allow(null, '').default(null),
  }),

  update: Joi.object({
    issuedAt: Joi.date().iso().allow(null),
    expiresAt: Joi.date().iso().allow(null),
    issuingBody: Joi.string().max(150).allow(null, ''),
    status: Joi.string().valid('valid', 'expiring', 'expired', 'not_applicable'),
    notes: Joi.string().max(500).allow(null, ''),
  }).min(1),

  // Rinnovo — PATCH /:id/renew
  renew: Joi.object({
    issuedAt: Joi.date()
      .iso()
      .default(() => new Date()),
    expiresAt: Joi.date().iso().required(),
    issuingBody: Joi.string().max(150).allow(null, ''),
    notes: Joi.string().max(500).allow(null, ''),
  }),

  listQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    driverId: Joi.number().integer().positive(),
    status: Joi.string().valid('valid', 'expiring', 'expired', 'not_applicable', 'all').default('all'),
  }).unknown(false),
};
