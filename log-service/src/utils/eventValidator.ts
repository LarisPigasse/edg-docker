// src/utils/eventValidator.ts

import {
  EventCategory,
  EventType,
  EventSeverity,
  EventMetadata,
  isValidEventTypeForCategory,
  getCategoryFromEventType,
  CATEGORY_EVENT_TYPES,
  DataEventType,
} from "../types/eventCategories";

/**
 * Risultato di una validazione
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Payload per creare un evento standardizzato
 */
export interface CreateStandardizedEventPayload {
  categoria?: EventCategory;
  sottoCategoria?: EventType;
  criticita?: EventSeverity;
  metadata?: EventMetadata;
  
  // Campi legacy (opzionali se si usa categoria standardizzata)
  origine?: {
    tipo: "utente" | "sistema";
    id: string;
    dettagli?: Record<string, any>;
  };
  azione?: {
    tipo: "create" | "update" | "delete" | "custom";
    entita: string;
    idEntita: string;
    operazione: string;
    dettagli?: Record<string, any>;
  };
  risultato: {
    esito: "successo" | "fallito" | "parziale";
    messaggio?: string;
  };
  contesto?: {
    transazioneId?: string;
    causalita?: string[];
    sessione?: string;
    ip?: string;
    userAgent?: string;
    ambiente?: string;
  };
  stato?: {
    precedente?: Record<string, any> | null;
    nuovo?: Record<string, any> | null;
    diff?: Record<string, any> | null;
  };
  tags?: string[];
}

/**
 * Valida che un evento standardizzato abbia una struttura corretta
 */
export function validateStandardizedEvent(
  payload: CreateStandardizedEventPayload
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // ========== VALIDAZIONI OBBLIGATORIE ==========
  
  // Risultato è sempre obbligatorio
  if (!payload.risultato) {
    errors.push("Campo 'risultato' obbligatorio");
  } else {
    if (!["successo", "fallito", "parziale"].includes(payload.risultato.esito)) {
      errors.push(
        `Campo 'risultato.esito' non valido: ${payload.risultato.esito}`
      );
    }
  }

  // ========== VALIDAZIONI CATEGORIA STANDARDIZZATA ==========
  
  if (payload.categoria) {
    // Se categoria è fornita, sottoCategoria è obbligatoria
    if (!payload.sottoCategoria) {
      errors.push(
        "Campo 'sottoCategoria' obbligatorio quando 'categoria' è specificata"
      );
    } else {
      // Verifica che sottoCategoria sia valida per la categoria
      if (!isValidEventTypeForCategory(payload.categoria, payload.sottoCategoria)) {
        errors.push(
          `Sottocategoria '${payload.sottoCategoria}' non valida per categoria '${payload.categoria}'`
        );
      }
    }

    // Criticità è obbligatoria per eventi standardizzati
    if (!payload.criticita) {
      errors.push(
        "Campo 'criticita' obbligatorio quando 'categoria' è specificata"
      );
    } else {
      if (!Object.values(EventSeverity).includes(payload.criticita)) {
        errors.push(`Campo 'criticita' non valido: ${payload.criticita}`);
      }
    }

    // Metadata dovrebbe essere presente
    if (!payload.metadata || Object.keys(payload.metadata).length === 0) {
      warnings.push(
        "Campo 'metadata' vuoto - considera di aggiungere informazioni specifiche"
      );
    }
  }

  // ========== VALIDAZIONI CAMPI LEGACY ==========
  
  // Se non c'è categoria standardizzata, i campi legacy sono obbligatori
  if (!payload.categoria) {
    if (!payload.origine) {
      errors.push(
        "Campo 'origine' obbligatorio quando non si usa categoria standardizzata"
      );
    } else {
      if (!["utente", "sistema"].includes(payload.origine.tipo)) {
        errors.push(`Campo 'origine.tipo' non valido: ${payload.origine.tipo}`);
      }
      if (!payload.origine.id) {
        errors.push("Campo 'origine.id' obbligatorio");
      }
    }

    if (!payload.azione) {
      errors.push(
        "Campo 'azione' obbligatorio quando non si usa categoria standardizzata"
      );
    } else {
      if (!["create", "update", "delete", "custom"].includes(payload.azione.tipo)) {
        errors.push(`Campo 'azione.tipo' non valido: ${payload.azione.tipo}`);
      }
      if (!payload.azione.entita) {
        errors.push("Campo 'azione.entita' obbligatorio");
      }
      if (!payload.azione.idEntita) {
        errors.push("Campo 'azione.idEntita' obbligatorio");
      }
      if (!payload.azione.operazione) {
        errors.push("Campo 'azione.operazione' obbligatorio");
      }
    }
  }

  // ========== VALIDAZIONI CONTESTO ==========
  
  if (payload.contesto) {
    // Ambiente dovrebbe sempre essere specificato
    if (!payload.contesto.ambiente) {
      warnings.push("Campo 'contesto.ambiente' non specificato");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Auto-completa i campi mancanti con valori di default intelligenti
 */
export function normalizeStandardizedEvent(
  payload: CreateStandardizedEventPayload
): CreateStandardizedEventPayload {
  const normalized = { ...payload };

  // Se categoria non è specificata ma abbiamo un azione.tipo, proviamo a mapparlo
  if (!normalized.categoria && normalized.azione) {
    // Mapping automatico da azione.tipo a categoria DATA
    normalized.categoria = EventCategory.DATA;
    
    // Criticità di default basata su risultato
    if (!normalized.criticita) {
      normalized.criticita =
        normalized.risultato?.esito === "fallito"
          ? EventSeverity.ERROR
          : EventSeverity.INFO;
    }
  }

  // Se abbiamo categoria ma non sottoCategoria, proviamo a inferirla
  if (normalized.categoria === EventCategory.DATA && !normalized.sottoCategoria) {
    if (normalized.azione?.tipo === "create") normalized.sottoCategoria = DataEventType.CREATE;
    if (normalized.azione?.tipo === "update") normalized.sottoCategoria = DataEventType.UPDATE;
    if (normalized.azione?.tipo === "delete") normalized.sottoCategoria = DataEventType.DELETE;
  }

  // Default per metadata se mancante
  if (normalized.categoria && !normalized.metadata) {
    normalized.metadata = {};
  }

  // Default per contesto.ambiente se mancante
  if (!normalized.contesto) {
    normalized.contesto = {};
  }
  if (!normalized.contesto.ambiente) {
    normalized.contesto.ambiente = process.env.NODE_ENV || "development";
  }

  // Default per tags se mancante
  if (!normalized.tags) {
    normalized.tags = [];
  }

  // Aggiungi tag automatico per categoria
  if (normalized.categoria && !normalized.tags.includes(normalized.categoria)) {
    normalized.tags.push(normalized.categoria);
  }

  return normalized;
}

/**
 * Suggerisce la criticità basandosi sul tipo di evento e risultato
 */
export function suggestSeverity(
  categoria: EventCategory,
  sottoCategoria: EventType,
  esito: "successo" | "fallito" | "parziale"
): EventSeverity {
  // Eventi di sicurezza sono sempre almeno WARNING
  if (categoria === EventCategory.SECURITY) {
    if (esito === "fallito") return EventSeverity.CRITICAL;
    return EventSeverity.WARNING;
  }

  // Eventi AUTH falliti sono critici
  if (categoria === EventCategory.AUTH) {
    if (sottoCategoria === "login_failed") {
      return EventSeverity.WARNING; // Singolo fallimento
    }
    if (sottoCategoria === "brute_force_attempt") {
      return EventSeverity.CRITICAL; // Attacco in corso
    }
    if (esito === "successo") return EventSeverity.INFO;
    return EventSeverity.WARNING;
  }

  // Email bounced o failed sono warning
  if (categoria === EventCategory.EMAIL) {
    if (["bounced", "failed"].includes(sottoCategoria)) {
      return EventSeverity.WARNING;
    }
    return EventSeverity.INFO;
  }

  // System failures sono error
  if (categoria === EventCategory.SYSTEM) {
    if (esito === "fallito") return EventSeverity.ERROR;
    return EventSeverity.INFO;
  }

  // Default: basato sul risultato
  if (esito === "fallito") return EventSeverity.ERROR;
  if (esito === "parziale") return EventSeverity.WARNING;
  return EventSeverity.INFO;
}

/**
 * Helper: genera campo azione legacy da categoria/sottocategoria
 */
function generateLegacyAzione(
  categoria: EventCategory,
  sottoCategoria: EventType,
  metadata: EventMetadata
): {
  tipo: "create" | "update" | "delete" | "custom";
  entita: string;
  idEntita: string;
  operazione: string;
  dettagli: Record<string, any>;
} {
  // Mappa sottocategoria DATA a tipo azione legacy
  let tipo: "create" | "update" | "delete" | "custom" = "custom";
  if (sottoCategoria === DataEventType.CREATE || sottoCategoria === "bulk_create" || sottoCategoria === "import") {
    tipo = "create";
  } else if (sottoCategoria === DataEventType.UPDATE || sottoCategoria === "bulk_update") {
    tipo = "update";
  } else if (sottoCategoria === DataEventType.DELETE || sottoCategoria === "bulk_delete") {
    tipo = "delete";
  }

  // Estrai entità e ID da metadata in base alla categoria
  let entita = categoria.toLowerCase();
  let idEntita = "system-generated";
  
  // Per eventi DATA
  if ((metadata as any).entityType) {
    entita = (metadata as any).entityType;
  }
  if ((metadata as any).entityId) {
    idEntita = (metadata as any).entityId;
  }
  
  // Per eventi EMAIL
  if (categoria === EventCategory.EMAIL) {
    entita = "email";
    idEntita = (metadata as any).emailId || (metadata as any).recipient || "email-event";
  }
  
  // Per eventi SYSTEM
  if (categoria === EventCategory.SYSTEM) {
    entita = "system-process";
    idEntita = (metadata as any).processName || (metadata as any).externalService || "system-event";
  }
  
  // Per eventi AUTH
  if (categoria === EventCategory.AUTH) {
    entita = "authentication";
    idEntita = (metadata as any).userId || (metadata as any).sessionId || "auth-event";
  }
  
  // Per eventi SECURITY
  if (categoria === EventCategory.SECURITY) {
    entita = "security";
    idEntita = (metadata as any).blockedIp || "security-event";
  }
  
  // Per eventi AUDIT
  if (categoria === EventCategory.AUDIT) {
    entita = "audit";
    idEntita = (metadata as any).targetUserId || (metadata as any).permission || "audit-event";
  }
  
  // Operazione leggibile
  const operazione = `${categoria}: ${sottoCategoria.replace(/_/g, " ")}`;

  return {
    tipo,
    entita,
    idEntita,
    operazione,
    dettagli: metadata as Record<string, any>,
  };
}

/**
 * Crea un payload completo con tutti i valori di default
 */
export function createEventPayload(
  categoria: EventCategory,
  sottoCategoria: EventType,
  esito: "successo" | "fallito" | "parziale",
  metadata: EventMetadata,
  options?: {
    criticita?: EventSeverity;
    messaggio?: string;
    origine?: CreateStandardizedEventPayload["origine"];
    contesto?: CreateStandardizedEventPayload["contesto"];
    stato?: CreateStandardizedEventPayload["stato"];
    tags?: string[];
  }
): CreateStandardizedEventPayload {
  // Suggerisci criticità se non fornita
  const criticita =
    options?.criticita || suggestSeverity(categoria, sottoCategoria, esito);

  // Genera campi legacy automaticamente per retrocompatibilità
  const legacyAzione = generateLegacyAzione(categoria, sottoCategoria, metadata);

  return {
    categoria,
    sottoCategoria,
    criticita,
    metadata,
    risultato: {
      esito,
      messaggio: options?.messaggio,
    },
    origine: options?.origine || {
      tipo: "sistema",
      id: "log-service",
      dettagli: {},
    },
    azione: legacyAzione,
    contesto: {
      ambiente: process.env.NODE_ENV || "development",
      ...options?.contesto,
    },
    stato: options?.stato,
    tags: options?.tags || [categoria],
  };
}

/**
 * Verifica se un evento richiede attenzione immediata
 */
export function requiresImmediateAttention(
  categoria: EventCategory,
  criticita: EventSeverity
): boolean {
  // Eventi critici richiedono sempre attenzione
  if (criticita === EventSeverity.CRITICAL) {
    return true;
  }

  // Eventi di sicurezza richiedono sempre attenzione
  if (categoria === EventCategory.SECURITY) {
    return true;
  }

  // Eventi error su sistema richiedono attenzione
  if (
    categoria === EventCategory.SYSTEM &&
    criticita === EventSeverity.ERROR
  ) {
    return true;
  }

  return false;
}
