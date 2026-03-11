// =============================================================================
// EDG Vehicle Service - Transversal Schemas
// =============================================================================
import Joi from 'joi';

// ---------------------------------------------------------------------------
// Notification
// ---------------------------------------------------------------------------
export const notificationSchemas = {
  // Creazione manuale (admin/sistema)
  create: Joi.object({
    vehicleId: Joi.number().integer().positive().allow(null).default(null),
    driverId: Joi.number().integer().positive().allow(null).default(null),
    entityType: Joi.string()
      .valid('vehicle_deadline', 'maintenance_schedule', 'driver_compliance', 'km_threshold', 'system')
      .required(),
    entityId: Joi.number().integer().positive().allow(null).default(null),
    type: Joi.string().valid('deadline', 'maintenance', 'km_threshold', 'driver_compliance', 'system').required(),
    severity: Joi.string().valid('info', 'warning', 'critical').required(),
    title: Joi.string().max(200).required(),
    message: Joi.string().max(1000).required(),
  }),

  listQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    vehicleId: Joi.number().integer().positive(),
    driverId: Joi.number().integer().positive(),
    type: Joi.string().valid('deadline', 'maintenance', 'km_threshold', 'driver_compliance', 'system'),
    severity: Joi.string().valid('info', 'warning', 'critical'),
    isRead: Joi.boolean(),
    isArchived: Joi.boolean().default(false),
  }).unknown(false),
};

// ---------------------------------------------------------------------------
// Attachment — la validazione del file avviene in multer, qui solo metadata
// ---------------------------------------------------------------------------
export const attachmentSchemas = {
  create: Joi.object({
    entityType: Joi.string()
      .valid('vehicle', 'driver', 'vehicle_deadline', 'maintenance_record', 'driver_compliance')
      .required(),
    entityId: Joi.number().integer().positive().required(),
    description: Joi.string().max(500).allow(null, '').default(null),
  }),

  listQuery: Joi.object({
    entityType: Joi.string()
      .valid('vehicle', 'driver', 'vehicle_deadline', 'maintenance_record', 'driver_compliance')
      .required(),
    entityId: Joi.number().integer().positive().required(),
  }).unknown(false),
};
