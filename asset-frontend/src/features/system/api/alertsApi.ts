/**
 * API Service per il modulo Alerts
 * Endpoint base: /api/alert (log-service)
 */

import type {
  AlertRule,
  AlertRuleFormData,
  AlertHistoryFilters,
  AlertRulesResponse,
  AlertRuleResponse,
  AlertHistoryResponse,
  AlertHistoryStatsResponse,
} from '../types';

// ============================================================================
// CONFIGURAZIONE
// ============================================================================

const LOG_SERVICE_URL = import.meta.env.VITE_LOG_SERVICE_URL ?? '';

const BASE_URL = `${LOG_SERVICE_URL}/api/alert`;

// API Key per operazioni di scrittura (protette da apiKeyAuth nel backend)
const API_KEY = import.meta.env.VITE_LOG_SERVICE_API_KEY || '';

// ============================================================================
// FETCH HELPERS
// ============================================================================

const readHeaders = (): Record<string, string> => ({
  'Content-Type': 'application/json',
});

const writeHeaders = (): Record<string, string> => ({
  'Content-Type': 'application/json',
  ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
});

const apiFetch = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(endpoint, options);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return data as T;
};

// ============================================================================
// HELPERS — Conversione form → payload API
// ============================================================================

/**
 * Converte i valori stringa vuota del form in null per il backend.
 * Il backend interpreta null come "qualsiasi valore" (wildcard).
 */
const formDataToPayload = (form: AlertRuleFormData) => ({
  name: form.name.trim(),
  description: form.description.trim() || null,
  enabled: form.enabled,
  conditions: {
    categoria: form.conditions.categoria || null,
    sottoCategoria: form.conditions.sottoCategoria?.trim() || null,
    criticita: form.conditions.criticita || null,
    esito: form.conditions.esito || null,
    origineId: form.conditions.origineId?.trim() || null,
  },
  threshold: {
    count: Number(form.threshold.count),
    windowMinutes: Number(form.threshold.windowMinutes),
  },
  cooldownMinutes: Number(form.cooldownMinutes),
});

// ============================================================================
// QUERY STRING BUILDER — Filtri storico
// ============================================================================

const buildHistoryQuery = (filters: AlertHistoryFilters): string => {
  const params = new URLSearchParams();

  if (filters.ruleId) params.append('ruleId', filters.ruleId);
  if (filters.status) params.append('status', filters.status);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.page !== undefined) params.append('page', String(filters.page));
  if (filters.limit !== undefined) params.append('limit', String(filters.limit));

  const qs = params.toString();
  return qs ? `?${qs}` : '';
};

// ============================================================================
// API — ALERT RULES
// ============================================================================

export const alertsApi = {
  // --------------------------------------------------------------------------
  // READ
  // --------------------------------------------------------------------------

  /**
   * GET /api/alert/rules
   * Lista tutte le regole, opzionalmente filtrate per stato enabled.
   */
  async getRules(enabled?: boolean): Promise<AlertRule[]> {
    const qs = enabled !== undefined ? `?enabled=${enabled}` : '';
    const data = await apiFetch<AlertRulesResponse>(`${BASE_URL}/rules${qs}`, { headers: readHeaders() });
    return data.data;
  },

  /**
   * GET /api/alert/rules/:id
   * Dettaglio singola regola.
   */
  async getRule(id: string): Promise<AlertRule> {
    const data = await apiFetch<AlertRuleResponse>(`${BASE_URL}/rules/${id}`, { headers: readHeaders() });
    return data.data;
  },

  // --------------------------------------------------------------------------
  // WRITE
  // --------------------------------------------------------------------------

  /**
   * POST /api/alert/rules
   * Crea una nuova regola.
   */
  async createRule(form: AlertRuleFormData): Promise<AlertRule> {
    const data = await apiFetch<AlertRuleResponse>(`${BASE_URL}/rules`, {
      method: 'POST',
      headers: writeHeaders(),
      body: JSON.stringify(formDataToPayload(form)),
    });
    return data.data;
  },

  /**
   * PUT /api/alert/rules/:id
   * Aggiorna una regola esistente.
   */
  async updateRule(id: string, form: AlertRuleFormData): Promise<AlertRule> {
    const data = await apiFetch<AlertRuleResponse>(`${BASE_URL}/rules/${id}`, {
      method: 'PUT',
      headers: writeHeaders(),
      body: JSON.stringify(formDataToPayload(form)),
    });
    return data.data;
  },

  /**
   * PATCH /api/alert/rules/:id/toggle
   * Abilita o disabilita una regola senza inviare l'intero body.
   */
  async toggleRule(id: string): Promise<AlertRule> {
    const data = await apiFetch<AlertRuleResponse>(`${BASE_URL}/rules/${id}/toggle`, {
      method: 'PATCH',
      headers: writeHeaders(),
    });
    return data.data;
  },

  /**
   * DELETE /api/alert/rules/:id
   * Elimina una regola. Lo storico associato viene mantenuto.
   */
  async deleteRule(id: string): Promise<void> {
    await apiFetch(`${BASE_URL}/rules/${id}`, {
      method: 'DELETE',
      headers: writeHeaders(),
    });
  },

  // --------------------------------------------------------------------------
  // ALERT HISTORY
  // --------------------------------------------------------------------------

  /**
   * GET /api/alert/history
   * Storico alert con filtri e paginazione.
   */
  async getHistory(filters: AlertHistoryFilters = {}): Promise<AlertHistoryResponse> {
    return apiFetch<AlertHistoryResponse>(`${BASE_URL}/history${buildHistoryQuery(filters)}`, { headers: readHeaders() });
  },

  /**
   * GET /api/alert/history/stats
   * Statistiche aggregate per le card della dashboard.
   */
  async getHistoryStats(): Promise<AlertHistoryStatsResponse> {
    return apiFetch<AlertHistoryStatsResponse>(`${BASE_URL}/history/stats`, { headers: readHeaders() });
  },
};

export default alertsApi;
