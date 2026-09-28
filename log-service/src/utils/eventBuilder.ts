// src/utils/eventBuilder.ts

import {
  EventCategory,
  EventType,
  AuthEventType,
  DataEventType,
  EmailEventType,
  SystemEventType,
  AuditEventType,
  SecurityEventType,
  EventSeverity,
  AuthEventMetadata,
  DataEventMetadata,
  EmailEventMetadata,
  SystemEventMetadata,
  AuditEventMetadata,
  SecurityEventMetadata,
} from "../types/eventCategories";
import {
  CreateStandardizedEventPayload,
  createEventPayload,
} from "./eventValidator";

/**
 * Builder fluent per eventi AUTH
 */
export class AuthEventBuilder {
  private eventType!: AuthEventType;
  private metadata: Partial<AuthEventMetadata> = {};
  private esito: "successo" | "fallito" | "parziale" = "successo";
  private criticita?: EventSeverity;
  private messaggio?: string;
  private userId?: string;
  private contesto?: any;
  private tags?: string[];

  static login() {
    const builder = new AuthEventBuilder();
    builder.eventType = AuthEventType.LOGIN_SUCCESS;
    return builder;
  }

  static loginFailed() {
    const builder = new AuthEventBuilder();
    builder.eventType = AuthEventType.LOGIN_FAILED;
    builder.esito = "fallito";
    return builder;
  }

  static logout() {
    const builder = new AuthEventBuilder();
    builder.eventType = AuthEventType.LOGOUT;
    return builder;
  }

  static passwordReset() {
    const builder = new AuthEventBuilder();
    builder.eventType = AuthEventType.PASSWORD_RESET_COMPLETE;
    return builder;
  }

  user(userId: string, username?: string, email?: string) {
    this.userId = userId;
    this.metadata.userId = userId;
    if (username) this.metadata.username = username;
    if (email) this.metadata.email = email;
    return this;
  }

  fromIp(ip: string) {
    this.metadata.ip = ip;
    return this;
  }

  withUserAgent(userAgent: string) {
    this.metadata.userAgent = userAgent;
    return this;
  }

  session(sessionId: string) {
    this.metadata.sessionId = sessionId;
    return this;
  }

  failureReason(reason: string) {
    this.metadata.failureReason = reason;
    this.messaggio = reason;
    return this;
  }

  severity(severity: EventSeverity) {
    this.criticita = severity;
    return this;
  }

  context(ctx: any) {
    this.contesto = ctx;
    return this;
  }

  withTags(...tags: string[]) {
    this.tags = tags;
    return this;
  }

  build(): CreateStandardizedEventPayload {
    return createEventPayload(
      EventCategory.AUTH,
      this.eventType,
      this.esito,
      this.metadata,
      {
        criticita: this.criticita,
        messaggio: this.messaggio,
        origine: this.userId
          ? {
              tipo: "utente",
              id: this.userId,
              dettagli: {
                username: this.metadata.username,
                email: this.metadata.email,
              },
            }
          : undefined,
        contesto: this.contesto,
        tags: this.tags,
      }
    );
  }
}

/**
 * Builder fluent per eventi DATA
 */
export class DataEventBuilder {
  private eventType!: DataEventType;
  private metadata: Partial<DataEventMetadata> = {};
  private esito: "successo" | "fallito" | "parziale" = "successo";
  private criticita?: EventSeverity;
  private messaggio?: string;
  private userId?: string;
  private contesto?: any;
  private stato?: any;
  private tags?: string[];

  static create(entityType: string, entityId: string) {
    const builder = new DataEventBuilder();
    builder.eventType = DataEventType.CREATE;
    builder.metadata.entityType = entityType;
    builder.metadata.entityId = entityId;
    return builder;
  }

  static update(entityType: string, entityId: string) {
    const builder = new DataEventBuilder();
    builder.eventType = DataEventType.UPDATE;
    builder.metadata.entityType = entityType;
    builder.metadata.entityId = entityId;
    return builder;
  }

  static delete(entityType: string, entityId: string) {
    const builder = new DataEventBuilder();
    builder.eventType = DataEventType.DELETE;
    builder.metadata.entityType = entityType;
    builder.metadata.entityId = entityId;
    return builder;
  }

  entityName(name: string) {
    this.metadata.entityName = name;
    return this;
  }

  fieldsChanged(...fields: string[]) {
    this.metadata.fieldsChanged = fields;
    return this;
  }

  byUser(userId: string) {
    this.userId = userId;
    return this;
  }

  failed(reason?: string) {
    this.esito = "fallito";
    if (reason) this.messaggio = reason;
    return this;
  }

  partial(reason?: string) {
    this.esito = "parziale";
    if (reason) this.messaggio = reason;
    return this;
  }

  withState(previous: any, current: any) {
    this.stato = {
      precedente: previous,
      nuovo: current,
      diff: null, // Sarà calcolato dal service
    };
    return this;
  }

  severity(severity: EventSeverity) {
    this.criticita = severity;
    return this;
  }

  context(ctx: any) {
    this.contesto = ctx;
    return this;
  }

  withTags(...tags: string[]) {
    this.tags = tags;
    return this;
  }

  build(): CreateStandardizedEventPayload {
    return createEventPayload(
      EventCategory.DATA,
      this.eventType,
      this.esito,
      this.metadata,
      {
        criticita: this.criticita,
        messaggio: this.messaggio,
        origine: this.userId
          ? {
              tipo: "utente",
              id: this.userId,
            }
          : undefined,
        contesto: this.contesto,
        stato: this.stato,
        tags: this.tags,
      }
    );
  }
}

/**
 * Builder fluent per eventi EMAIL
 */
export class EmailEventBuilder {
  private eventType!: EmailEventType;
  private metadata: Partial<EmailEventMetadata> = {};
  private esito: "successo" | "fallito" | "parziale" = "successo";
  private criticita?: EventSeverity;
  private contesto?: any;
  private tags?: string[];

  static sent(recipient: string, subject: string) {
    const builder = new EmailEventBuilder();
    builder.eventType = EmailEventType.SENT;
    builder.metadata.recipient = recipient;
    builder.metadata.subject = subject;
    return builder;
  }

  static failed(recipient: string, subject: string, errorMessage?: string) {
    const builder = new EmailEventBuilder();
    builder.eventType = EmailEventType.FAILED;
    builder.metadata.recipient = recipient;
    builder.metadata.subject = subject;
    builder.metadata.errorMessage = errorMessage;
    builder.esito = "fallito";
    return builder;
  }

  static bounced(recipient: string, subject: string, bounceType: "hard" | "soft") {
    const builder = new EmailEventBuilder();
    builder.eventType = EmailEventType.BOUNCED;
    builder.metadata.recipient = recipient;
    builder.metadata.subject = subject;
    builder.metadata.bounceType = bounceType;
    builder.esito = "fallito";
    return builder;
  }

  emailId(id: string) {
    this.metadata.emailId = id;
    return this;
  }

  template(templateName: string) {
    this.metadata.template = templateName;
    return this;
  }

  provider(providerName: string) {
    this.metadata.provider = providerName;
    return this;
  }

  errorCode(code: string) {
    this.metadata.errorCode = code;
    return this;
  }

  severity(severity: EventSeverity) {
    this.criticita = severity;
    return this;
  }

  context(ctx: any) {
    this.contesto = ctx;
    return this;
  }

  withTags(...tags: string[]) {
    this.tags = tags;
    return this;
  }

  build(): CreateStandardizedEventPayload {
    return createEventPayload(
      EventCategory.EMAIL,
      this.eventType,
      this.esito,
      this.metadata,
      {
        criticita: this.criticita,
        messaggio: this.metadata.errorMessage,
        contesto: this.contesto,
        tags: this.tags,
      }
    );
  }
}

/**
 * Builder fluent per eventi SYSTEM
 */
export class SystemEventBuilder {
  private eventType!: SystemEventType;
  private metadata: Partial<SystemEventMetadata> = {};
  private esito: "successo" | "fallito" | "parziale" = "successo";
  private criticita?: EventSeverity;
  private messaggio?: string;
  private contesto?: any;
  private tags?: string[];

  static cronJob(processName: string) {
    const builder = new SystemEventBuilder();
    builder.eventType = SystemEventType.CRON_JOB_START;
    builder.metadata.processName = processName;
    return builder;
  }

  static apiCall(externalService: string, endpoint: string) {
    const builder = new SystemEventBuilder();
    builder.eventType = SystemEventType.API_CALL_EXTERNAL;
    builder.metadata.externalService = externalService;
    builder.metadata.apiEndpoint = endpoint;
    return builder;
  }

  completed(duration?: number, recordsProcessed?: number) {
    if (this.eventType === SystemEventType.CRON_JOB_START) {
      this.eventType = SystemEventType.CRON_JOB_COMPLETE;
    }
    if (duration) this.metadata.duration = duration;
    if (recordsProcessed) this.metadata.recordsProcessed = recordsProcessed;
    return this;
  }

  failed(reason?: string) {
    if (this.eventType === SystemEventType.CRON_JOB_START) {
      this.eventType = SystemEventType.CRON_JOB_FAILED;
    }
    this.esito = "fallito";
    if (reason) this.messaggio = reason;
    return this;
  }

  statusCode(code: number) {
    this.metadata.statusCode = code;
    return this;
  }

  severity(severity: EventSeverity) {
    this.criticita = severity;
    return this;
  }

  context(ctx: any) {
    this.contesto = ctx;
    return this;
  }

  withTags(...tags: string[]) {
    this.tags = tags;
    return this;
  }

  build(): CreateStandardizedEventPayload {
    return createEventPayload(
      EventCategory.SYSTEM,
      this.eventType,
      this.esito,
      this.metadata,
      {
        criticita: this.criticita,
        messaggio: this.messaggio,
        contesto: this.contesto,
        tags: this.tags,
      }
    );
  }
}

/**
 * Facade per accesso semplificato ai builders
 */
export const EventBuilder = {
  auth: AuthEventBuilder,
  data: DataEventBuilder,
  email: EmailEventBuilder,
  system: SystemEventBuilder,
};
