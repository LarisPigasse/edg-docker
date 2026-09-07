/**
 * Types per il modulo Alerts
 * Sincronizzati con @edg/log-service — /api/alert
 */

// ============================================================================
// ENUMS — sincronizzati con log-service
// ============================================================================

export const EventCategory = {
  AUTH: 'AUTH',
  DATA: 'DATA',
  EMAIL: 'EMAIL',
  SYSTEM: 'SYSTEM',
  AUDIT: 'AUDIT',
  SECURITY: 'SECURITY',
} as const;
export type EventCategory = (typeof EventCategory)[keyof typeof EventCategory];

export const EventSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
} as const;
export type EventSeverity = (typeof EventSeverity)[keyof typeof EventSeverity];

export type AlertStatus = 'SENT' | 'FAILED';

export type EsitoType = 'successo' | 'fallito' | 'parziale';

// ============================================================================
// ALERT RULE — Regola di alerting
// ============================================================================

export interface AlertConditions {
  categoria?: EventCategory | null;
  sottoCategoria?: string | null;
  criticita?: EventSeverity | null;
  esito?: EsitoType | null;
  origineId?: string | null;
}

export interface AlertThreshold {
  count: number; // Numero di eventi che triggera l'alert
  windowMinutes: number; // Finestra temporale (0 = trigger immediato)
}

export interface AlertRule {
  _id: string;
  name: string;
  description?: string | null;
  enabled: boolean;
  conditions: AlertConditions;
  threshold: AlertThreshold;
  cooldownMinutes: number;
  lastTriggeredAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// ALERT HISTORY — Storico alert inviati
// ============================================================================

export interface AlertHistoryEntry {
  _id: string;
  ruleId: string;
  ruleName: string;
  triggeringEventId: string;
  sentTo: string;
  status: AlertStatus;
  error?: string | null;
  createdAt: string;
}

// ============================================================================
// ALERT HISTORY STATS — Card statistiche
// ============================================================================

export interface AlertHistoryStats {
  total: number;
  sent: number;
  failed: number;
  recentTotal: number; // Ultimi 7 giorni
  successRate: number; // Percentuale 0-100
}

// ============================================================================
// FORM — Payload per creazione / modifica regola
// ============================================================================

export interface AlertRuleFormData {
  name: string;
  description: string;
  enabled: boolean;
  conditions: {
    categoria?: EventCategory | '';
    sottoCategoria?: string;
    criticita?: EventSeverity | '';
    esito?: EsitoType | '';
    origineId?: string;
  };
  threshold: {
    count: number;
    windowMinutes: number;
  };
  cooldownMinutes: number;
}

export const ALERT_RULE_FORM_DEFAULTS: AlertRuleFormData = {
  name: '',
  description: '',
  enabled: true,
  conditions: {
    categoria: '',
    sottoCategoria: '',
    criticita: '',
    esito: '',
    origineId: '',
  },
  threshold: {
    count: 1,
    windowMinutes: 0,
  },
  cooldownMinutes: 30,
};

// ============================================================================
// FILTERS — Filtri per storico
// ============================================================================

export interface AlertHistoryFilters {
  ruleId?: string;
  status?: AlertStatus | '';
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface AlertRulesResponse {
  success: boolean;
  data: AlertRule[];
  total: number;
}

export interface AlertRuleResponse {
  success: boolean;
  data: AlertRule;
}

export interface AlertHistoryResponse {
  success: boolean;
  data: AlertHistoryEntry[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AlertHistoryStatsResponse {
  success: boolean;
  data: AlertHistoryStats;
}

// ============================================================================
// UI HELPERS
// ============================================================================

/**
 * Restituisce una stringa leggibile delle condizioni di una regola.
 * Condizioni null/undefined vengono omesse.
 */
export function formatConditions(conditions: AlertConditions): string {
  const parts: string[] = [];

  if (conditions.categoria) parts.push(`Categoria: ${conditions.categoria}`);
  if (conditions.criticita) parts.push(`Criticità: ${conditions.criticita.toUpperCase()}`);
  if (conditions.esito) parts.push(`Esito: ${conditions.esito}`);
  if (conditions.sottoCategoria) parts.push(`Tipo: ${conditions.sottoCategoria}`);
  if (conditions.origineId) parts.push(`Origine: ${conditions.origineId}`);

  return parts.length > 0 ? parts.join(' · ') : 'Qualsiasi evento';
}

// ============================================================================
// LOG EVENT - Struttura evento dal backend
// ============================================================================

export interface LogEvent {
  _id: string;
  timestamp: string;

  // Campi standardizzati (FASE 1)
  categoria?: EventCategory;
  sottoCategoria?: string;
  criticita?: EventSeverity;
  metadata?: Record<string, unknown>;

  // Campi legacy (sempre presenti)
  origine: {
    tipo: 'utente' | 'sistema';
    id: string;
    dettagli?: Record<string, unknown>;
  };
  azione: {
    tipo: 'create' | 'update' | 'delete' | 'custom';
    entita: string;
    idEntita: string;
    operazione: string;
    dettagli?: Record<string, unknown>;
  };
  risultato: {
    esito: 'successo' | 'fallito' | 'parziale';
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
    precedente?: Record<string, unknown> | null;
    nuovo?: Record<string, unknown> | null;
    diff?: Record<string, unknown> | null;
  };
  tags?: string[];

  // Audit fields
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// FILTERS - Filtri per query
// ============================================================================

export interface LogFilters {
  categoria?: EventCategory;
  criticita?: EventSeverity;
  userId?: string;
  entita?: string;
  esito?: 'successo' | 'fallito' | 'parziale';
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  skip?: number;
}

// ============================================================================
// STATISTICS - Statistiche aggregate
// ============================================================================

export interface LogStats {
  total: number;
  byCategory: Record<EventCategory, number>;
  bySeverity: Record<EventSeverity, number>;
  byOutcome: {
    successo: number;
    fallito: number;
    parziale: number;
  };
  criticalEvents: number;
  lastHourEvents: number;
  successRate: {
    overall: number; // Tasso successo generale (tutti i dati)
    last30Days: number; // Tasso successo ultimi 30 giorni
    trend: number; // Differenza: last30Days - overall
  };
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface LogsListResponse {
  logs: LogEvent[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface LogDetailResponse {
  log: LogEvent;
}

export interface LogStatsResponse {
  stats: LogStats;
}

// ============================================================================
// UI HELPERS
// ============================================================================

export interface LogTableRow {
  id: string;
  timestamp: string;
  category: EventCategory | 'LEGACY';
  severity: EventSeverity | 'info';
  user: string;
  action: string;
  outcome: 'successo' | 'fallito' | 'parziale';
  message?: string;
}

/**
 * Restituisce una stringa leggibile della soglia di una regola.
 */
export function formatThreshold(threshold: AlertThreshold): string {
  if (threshold.count === 1 && threshold.windowMinutes === 0) {
    return 'Trigger immediato';
  }
  return `${threshold.count} eventi in ${threshold.windowMinutes} min`;
}

export type { LogEvent as Log };
