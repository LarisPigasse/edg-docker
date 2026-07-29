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
    dateFrom: Joi.date().iso(),
    dateTo: Joi.date().iso(),
  }).unknown(false),
};

// ---------------------------------------------------------------------------
// NotificationDeliveryLog — tracciamento invii email per destinatario
// ---------------------------------------------------------------------------
export const notificationDeliveryLogSchemas = {
  listQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    notificationId: Joi.number().integer().positive(),
    status: Joi.string().valid('sent', 'failed'),
    dateFrom: Joi.date().iso(),
    dateTo: Joi.date().iso(),
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

// ─────────────────────────────────────────────────────────────────────────────
// AlertRecipient — destinatari degli avvisi via email, con preferenze per tipo
// ─────────────────────────────────────────────────────────────────────────────

const alertPreferenceItemSchema = Joi.object({
  deadlineTypeId: Joi.number().integer().positive().allow(null),
  maintenanceTypeId: Joi.number().integer().positive().allow(null),
  complianceTypeId: Joi.number().integer().positive().allow(null),
})
  .custom((value, helpers) => {
    const count = [value.deadlineTypeId, value.maintenanceTypeId, value.complianceTypeId].filter(v => v != null).length;
    if (count !== 1) return helpers.error('any.invalid');
    return value;
  })
  .messages({ 'any.invalid': 'Ogni preferenza deve indicare esattamente un tipo (scadenza, manutenzione o conformità)' });

export const alertRecipientSchemas = {
  create: Joi.object({
    email: Joi.string().email().max(150).required(),
    name: Joi.string().max(150).allow(null, '').default(null),
    receivesAll: Joi.boolean().default(false),
    isActive: Joi.boolean().default(true),
    preferences: Joi.array().items(alertPreferenceItemSchema).default([]),
  }),

  update: Joi.object({
    email: Joi.string().email().max(150),
    name: Joi.string().max(150).allow(null, ''),
    receivesAll: Joi.boolean(),
    isActive: Joi.boolean(),
    preferences: Joi.array().items(alertPreferenceItemSchema),
  }).min(1),

  listQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    isActive: Joi.boolean(),
  }).unknown(false),
};
