// src/client/index.ts

/**
 * EDG Log Service - Client Library
 * 
 * Import da microservizi:
 * ```typescript
 * import { LogClient, EventBuilder } from '@edg/log-service/client';
 * ```
 */

// Core Client
export { LogClient } from "./LogClient";

// Event Builders
export { EventBuilder, AuthEventBuilder, DataEventBuilder } from "./EventBuilder";

// Express Middleware
export {
  createExpressLogger,
  type ExpressLoggerOptions,
} from "./middleware/expressLogger";

// Types
export type {
  LogClientConfig,
  LogClientResponse,
  LogEventPayload,
  EventMetadata,
  AuthEventMetadata,
  DataEventMetadata,
  EmailEventMetadata,
  SystemEventMetadata,
  AuditEventMetadata,
  SecurityEventMetadata,
} from "./types";

export {
  EventCategory,
  EventSeverity,
  AuthEventType,
  DataEventType,
  EmailEventType,
  SystemEventType,
  AuditEventType,
  SecurityEventType,
} from "./types";
