// src/types/eventCategories.ts

/**
 * Categorie principali degli eventi di audit trail
 */
export enum EventCategory {
  AUTH = "AUTH",           // Eventi di autenticazione e autorizzazione
  DATA = "DATA",           // Operazioni CRUD su entità di business
  EMAIL = "EMAIL",         // Tracking email inviate/fallite
  SYSTEM = "SYSTEM",       // Eventi di sistema e processi automatici
  AUDIT = "AUDIT",         // Eventi di auditing e compliance
  SECURITY = "SECURITY",   // Eventi di sicurezza e accessi
}

/**
 * Livelli di criticità degli eventi
 */
export enum EventSeverity {
  INFO = "info",           // Operazioni normali
  WARNING = "warning",     // Situazioni anomale ma non critiche
  ERROR = "error",         // Errori che impediscono operazioni
  CRITICAL = "critical",   // Errori critici che richiedono intervento immediato
}

/**
 * Sottocategorie per AUTH
 */
export enum AuthEventType {
  LOGIN_SUCCESS = "login_success",
  LOGIN_FAILED = "login_failed",
  LOGOUT = "logout",
  PASSWORD_RESET_REQUEST = "password_reset_request",
  PASSWORD_RESET_COMPLETE = "password_reset_complete",
  PASSWORD_CHANGE = "password_change",
  TOKEN_REFRESH = "token_refresh",
  TOKEN_REVOKED = "token_revoked",
  SESSION_EXPIRED = "session_expired",
  MFA_ENABLED = "mfa_enabled",
  MFA_DISABLED = "mfa_disabled",
  MFA_CHALLENGE_SUCCESS = "mfa_challenge_success",
  MFA_CHALLENGE_FAILED = "mfa_challenge_failed",
}

/**
 * Sottocategorie per DATA
 */
export enum DataEventType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  RESTORE = "restore",
  BULK_CREATE = "bulk_create",
  BULK_UPDATE = "bulk_update",
  BULK_DELETE = "bulk_delete",
  IMPORT = "import",
  EXPORT = "export",
}

/**
 * Sottocategorie per EMAIL
 */
export enum EmailEventType {
  SENT = "sent",
  DELIVERED = "delivered",
  FAILED = "failed",
  BOUNCED = "bounced",
  OPENED = "opened",
  CLICKED = "clicked",
  UNSUBSCRIBED = "unsubscribed",
  SPAM_REPORTED = "spam_reported",
}

/**
 * Sottocategorie per SYSTEM
 */
export enum SystemEventType {
  STARTUP = "startup",
  SHUTDOWN = "shutdown",
  CRON_JOB_START = "cron_job_start",
  CRON_JOB_COMPLETE = "cron_job_complete",
  CRON_JOB_FAILED = "cron_job_failed",
  BATCH_PROCESS_START = "batch_process_start",
  BATCH_PROCESS_COMPLETE = "batch_process_complete",
  BATCH_PROCESS_FAILED = "batch_process_failed",
  API_CALL_EXTERNAL = "api_call_external",
  WEBHOOK_RECEIVED = "webhook_received",
  WEBHOOK_SENT = "webhook_sent",
  DATABASE_BACKUP = "database_backup",
  DATABASE_RESTORE = "database_restore",
}

/**
 * Sottocategorie per AUDIT
 */
export enum AuditEventType {
  PERMISSION_GRANTED = "permission_granted",
  PERMISSION_REVOKED = "permission_revoked",
  ROLE_ASSIGNED = "role_assigned",
  ROLE_REMOVED = "role_removed",
  CONFIGURATION_CHANGE = "configuration_change",
  POLICY_VIOLATION = "policy_violation",
  COMPLIANCE_CHECK = "compliance_check",
  DATA_ACCESS = "data_access",
  SENSITIVE_DATA_ACCESS = "sensitive_data_access",
}

/**
 * Sottocategorie per SECURITY
 */
export enum SecurityEventType {
  SUSPICIOUS_ACTIVITY = "suspicious_activity",
  BRUTE_FORCE_ATTEMPT = "brute_force_attempt",
  IP_BLOCKED = "ip_blocked",
  RATE_LIMIT_EXCEEDED = "rate_limit_exceeded",
  UNAUTHORIZED_ACCESS = "unauthorized_access",
  DATA_BREACH_ATTEMPT = "data_breach_attempt",
  ENCRYPTION_KEY_ROTATION = "encryption_key_rotation",
}

/**
 * Unione di tutti i tipi di evento
 */
export type EventType =
  | AuthEventType
  | DataEventType
  | EmailEventType
  | SystemEventType
  | AuditEventType
  | SecurityEventType;

/**
 * Metadata specifici per eventi AUTH
 */
export interface AuthEventMetadata {
  userId?: string;
  username?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  sessionId?: string;
  failureReason?: string;
  mfaMethod?: "totp" | "sms" | "email";
}

/**
 * Metadata specifici per eventi DATA
 */
export interface DataEventMetadata {
  entityType: string;
  entityId: string;
  entityName?: string;
  fieldsChanged?: string[];
  recordsAffected?: number;
  parentEntity?: {
    type: string;
    id: string;
  };
}

/**
 * Metadata specifici per eventi EMAIL
 */
export interface EmailEventMetadata {
  emailId?: string;
  recipient: string;
  subject: string;
  template?: string;
  provider?: string;
  bounceType?: "hard" | "soft";
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Metadata specifici per eventi SYSTEM
 */
export interface SystemEventMetadata {
  processName?: string;
  processId?: string;
  duration?: number;
  recordsProcessed?: number;
  externalService?: string;
  apiEndpoint?: string;
  statusCode?: number;
  backupLocation?: string;
}

/**
 * Metadata specifici per eventi AUDIT
 */
export interface AuditEventMetadata {
  targetUserId?: string;
  targetUserEmail?: string;
  permission?: string;
  role?: string;
  configurationKey?: string;
  oldValue?: any;
  newValue?: any;
  policyName?: string;
  violationType?: string;
  dataType?: string;
  accessReason?: string;
}

/**
 * Metadata specifici per eventi SECURITY
 */
export interface SecurityEventMetadata {
  threatLevel?: "low" | "medium" | "high" | "critical";
  attackType?: string;
  blockedIp?: string;
  attemptCount?: number;
  resourceAccessed?: string;
  mitigationAction?: string;
}

/**
 * Metadata unificati - supporta tutti i tipi
 */
export type EventMetadata =
  | AuthEventMetadata
  | DataEventMetadata
  | EmailEventMetadata
  | SystemEventMetadata
  | AuditEventMetadata
  | SecurityEventMetadata
  | Record<string, any>;

/**
 * Interfaccia completa per un evento standardizzato
 */
export interface StandardizedEvent {
  categoria: EventCategory;
  sottoCategoria: EventType;
  criticita: EventSeverity;
  metadata: EventMetadata;
}

/**
 * Mapping categoria -> tipi di evento validi
 */
export const CATEGORY_EVENT_TYPES: Record<EventCategory, readonly EventType[]> = {
  [EventCategory.AUTH]: Object.values(AuthEventType),
  [EventCategory.DATA]: Object.values(DataEventType),
  [EventCategory.EMAIL]: Object.values(EmailEventType),
  [EventCategory.SYSTEM]: Object.values(SystemEventType),
  [EventCategory.AUDIT]: Object.values(AuditEventType),
  [EventCategory.SECURITY]: Object.values(SecurityEventType),
};

/**
 * Helper: determina la categoria da un tipo di evento
 */
export function getCategoryFromEventType(eventType: EventType): EventCategory | null {
  for (const [category, types] of Object.entries(CATEGORY_EVENT_TYPES)) {
    if (types.includes(eventType)) {
      return category as EventCategory;
    }
  }
  return null;
}

/**
 * Helper: valida che un tipo di evento appartenga a una categoria
 */
export function isValidEventTypeForCategory(
  category: EventCategory,
  eventType: EventType
): boolean {
  return CATEGORY_EVENT_TYPES[category]?.includes(eventType) ?? false;
}
