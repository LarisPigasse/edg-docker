// src/client/EventBuilder.ts

import {
  EventCategory,
  EventSeverity,
  AuthEventType,
  DataEventType,
  EmailEventType,
  SystemEventType,
  AuthEventMetadata,
  DataEventMetadata,
  EmailEventMetadata,
  SystemEventMetadata,
  LogEventPayload,
} from "./types";

/**
 * Helper per suggerire severità automatica
 */
function suggestSeverity(
  categoria: EventCategory,
  esito: "successo" | "fallito" | "parziale"
): EventSeverity {
  if (categoria === EventCategory.SECURITY) {
    if (esito === "fallito") return EventSeverity.CRITICAL;
    return EventSeverity.WARNING;
  }

  if (categoria === EventCategory.SYSTEM && esito === "fallito") {
    return EventSeverity.ERROR;
  }

  if (esito === "fallito") return EventSeverity.ERROR;
  if (esito === "parziale") return EventSeverity.WARNING;
  return EventSeverity.INFO;
}

/**
 * Helper per generare campi legacy da categoria/metadata
 */
function generateLegacyFields(
  categoria: EventCategory,
  sottoCategoria: string,
  metadata: any
): Pick<LogEventPayload, "origine" | "azione"> {
  let tipo: "create" | "update" | "delete" | "custom" = "custom";
  if (sottoCategoria.includes("create") || sottoCategoria === "import") {
    tipo = "create";
  } else if (sottoCategoria.includes("update")) {
    tipo = "update";
  } else if (sottoCategoria.includes("delete")) {
    tipo = "delete";
  }

  let entita = categoria.toLowerCase();
  let idEntita = "system-generated";

  if (metadata.entityType) entita = metadata.entityType;
  if (metadata.entityId) idEntita = metadata.entityId;

  if (categoria === EventCategory.EMAIL) {
    entita = "email";
    idEntita = metadata.emailId || metadata.recipient || "email-event";
  } else if (categoria === EventCategory.SYSTEM) {
    entita = "system-process";
    idEntita = metadata.processName || metadata.externalService || "system-event";
  } else if (categoria === EventCategory.AUTH) {
    entita = "authentication";
    idEntita = metadata.userId || metadata.sessionId || "auth-event";
  }

  const operazione = `${categoria}: ${sottoCategoria.replace(/_/g, " ")}`;

  return {
    origine: {
      tipo: "sistema",
      id: "log-client",
      dettagli: {},
    },
    azione: {
      tipo,
      entita,
      idEntita,
      operazione,
      dettagli: metadata,
    },
  };
}

/**
 * Builder semplificato per eventi AUTH
 */
export class AuthEventBuilder {
  private eventType!: AuthEventType;
  private metadata: Partial<AuthEventMetadata> = {};
  private esito: "successo" | "fallito" | "parziale" = "successo";
  private criticita?: EventSeverity;
  private messaggio?: string;
  private userId?: string;
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

  withTags(...tags: string[]) {
    this.tags = tags;
    return this;
  }

  build(): LogEventPayload {
    const criticita = this.criticita || suggestSeverity(EventCategory.AUTH, this.esito);
    const legacy = generateLegacyFields(EventCategory.AUTH, this.eventType, this.metadata);

    return {
      categoria: EventCategory.AUTH,
      sottoCategoria: this.eventType,
      criticita,
      metadata: this.metadata as AuthEventMetadata,
      risultato: {
        esito: this.esito,
        messaggio: this.messaggio,
      },
      origine: this.userId
        ? {
            tipo: "utente",
            id: this.userId,
            dettagli: {
              username: this.metadata.username,
              email: this.metadata.email,
            },
          }
        : legacy.origine,
      azione: legacy.azione,
      contesto: {
        ambiente: process.env.NODE_ENV || "development",
      },
      tags: this.tags || [EventCategory.AUTH],
    };
  }
}

/**
 * Builder semplificato per eventi DATA
 */
export class DataEventBuilder {
  private eventType!: DataEventType;
  private metadata: Partial<DataEventMetadata> = {};
  private esito: "successo" | "fallito" | "parziale" = "successo";
  private criticita?: EventSeverity;
  private userId?: string;
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

  byUser(userId: string) {
    this.userId = userId;
    return this;
  }

  withState(precedente: any, nuovo: any) {
    this.stato = { precedente, nuovo, diff: null };
    return this;
  }

  severity(severity: EventSeverity) {
    this.criticita = severity;
    return this;
  }

  failed() {
    this.esito = "fallito";
    return this;
  }

  withTags(...tags: string[]) {
    this.tags = tags;
    return this;
  }

  build(): LogEventPayload {
    const criticita = this.criticita || suggestSeverity(EventCategory.DATA, this.esito);
    const legacy = generateLegacyFields(EventCategory.DATA, this.eventType, this.metadata);

    return {
      categoria: EventCategory.DATA,
      sottoCategoria: this.eventType,
      criticita,
      metadata: this.metadata as DataEventMetadata,
      risultato: {
        esito: this.esito,
      },
      origine: this.userId
        ? { tipo: "utente", id: this.userId, dettagli: {} }
        : legacy.origine,
      azione: legacy.azione,
      contesto: {
        ambiente: process.env.NODE_ENV || "development",
      },
      stato: this.stato,
      tags: this.tags || [EventCategory.DATA],
    };
  }
}

/**
 * Facade per accesso ai builder
 */
export const EventBuilder = {
  auth: AuthEventBuilder,
  data: DataEventBuilder,
};
