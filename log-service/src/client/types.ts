// src/client/types.ts

/**
 * Configurazione e tipi specifici per il LogClient
 * Riutilizza i tipi del server da ../types/eventCategories
 */

import { EventCategory, EventType, EventSeverity, EventMetadata } from "../types/eventCategories";

// ========== PAYLOAD INTERFACE ==========

/**
 * Payload per creare un evento da client
 */
export interface LogEventPayload {
  categoria?: EventCategory;
  sottoCategoria?: EventType;
  criticita?: EventSeverity;
  metadata?: EventMetadata;
  
  // Campi legacy (auto-generati se non forniti)
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

// ========== CLIENT CONFIGURATION ==========

/**
 * Configurazione per il LogClient
 */
export interface LogClientConfig {
  apiUrl: string;
  apiKey?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  enableOfflineQueue?: boolean;
  maxQueueSize?: number;
  debug?: boolean;
}

/**
 * Risposta dal LogClient
 */
export interface LogClientResponse {
  success: boolean;
  logId?: string;
  error?: string;
}

// ========== RE-EXPORT TIPI SERVER ==========

// Re-export per comodità
export {
  EventCategory,
  EventType,
  EventSeverity,
  EventMetadata,
  AuthEventType,
  DataEventType,
  EmailEventType,
  SystemEventType,
  AuditEventType,
  SecurityEventType,
  AuthEventMetadata,
  DataEventMetadata,
  EmailEventMetadata,
  SystemEventMetadata,
  AuditEventMetadata,
  SecurityEventMetadata,
} from "../types/eventCategories";
