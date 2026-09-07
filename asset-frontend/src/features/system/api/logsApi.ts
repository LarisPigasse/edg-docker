/**
 * API Service per Log Service
 *
 * Endpoint: http://log-service:4000/api/logs
 */

import type { LogEvent, LogFilters, LogsListResponse, LogStats, LogStatsResponse } from '../types';

// ============================================================================
// API BASE URL
// ============================================================================

const LOG_SERVICE_URL = import.meta.env.VITE_LOG_SERVICE_URL ?? '';

// ============================================================================
// HELPER - Build query string da filtri
// ============================================================================

const buildQueryString = (filters: LogFilters): string => {
  const params = new URLSearchParams();

  if (filters.categoria) params.append('categoria', filters.categoria);
  if (filters.criticita) params.append('criticita', filters.criticita);
  if (filters.userId) params.append('userId', filters.userId);
  if (filters.entita) params.append('entita', filters.entita);
  if (filters.esito) params.append('esito', filters.esito);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.search) params.append('search', filters.search);
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.skip) params.append('skip', filters.skip.toString());

  return params.toString();
};

// ============================================================================
// FETCH HELPER
// ============================================================================

/** Forma grezza della risposta paginata del log-service. */
interface RawLogsListResponse {
  logs?: LogEvent[];
  totalCount?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

const apiFetch = async <T,>(endpoint: string): Promise<T> => {
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

// ============================================================================
// API METHODS
// ============================================================================

export const logsApi = {
  /**
   * GET /api/log/azioni - Lista eventi con filtri e paginazione
   */
  async getAll(filters: LogFilters = {}): Promise<LogsListResponse> {
    const queryString = buildQueryString(filters);
    const endpoint = `${LOG_SERVICE_URL}/api/log/azioni${queryString ? `?${queryString}` : ''}`;

    try {
      const data = await apiFetch<RawLogsListResponse>(endpoint);

      return {
        logs: data.logs || [],
        total: data.totalCount || 0,
        page: data.page || 0,
        limit: data.limit || 50,
        hasMore: (data.page || 0) + 1 < (data.totalPages || 0),
      };
    } catch (error) {
      console.error('[logsApi.getAll] Error:', error);
      throw error;
    }
  },

  /**
   * GET /api/log/azioni/:id - Dettaglio singolo evento
   */
  async getById(id: string): Promise<LogEvent> {
    const endpoint = `${LOG_SERVICE_URL}/api/log/azioni/${id}`;

    try {
      return await apiFetch<LogEvent>(endpoint);
    } catch (error) {
      console.error('[logsApi.getById] Error:', error);
      throw error;
    }
  },

  /**
   * GET /api/log/statistiche - Statistiche aggregate con filtri
   */
  async getStats(filters: LogFilters = {}): Promise<LogStatsResponse> {
    const queryString = buildQueryString(filters);
    const endpoint = `${LOG_SERVICE_URL}/api/log/statistiche${queryString ? `?${queryString}` : ''}`;

    try {
      const data = await apiFetch<LogStats>(endpoint);
      return { stats: data };
    } catch (error) {
      console.error('[logsApi.getStats] Error:', error);
      throw error;
    }
  },

  /**
   * GET /api/log/utenti - Lista utenti distinti presenti nei log
   * Usato per popolare la select del filtro utente (autonomo da auth-service)
   */
  async getUtenti(): Promise<string[]> {
    const endpoint = `${LOG_SERVICE_URL}/api/log/utenti`;

    try {
      return await apiFetch<string[]>(endpoint);
    } catch (error) {
      console.error('[logsApi.getUtenti] Error:', error);
      throw error;
    }
  },

  /**
   * DELETE /api/log/azioni/:id - Elimina evento (solo root)
   */
  async delete(id: string): Promise<void> {
    const endpoint = `${LOG_SERVICE_URL}/api/log/azioni/${id}`;

    try {
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('[logsApi.delete] Error:', error);
      throw error;
    }
  },

  /**
   * Export logs to CSV (client-side)
   */
  async exportToCsv(filters: LogFilters = {}): Promise<Blob> {
    const response = await this.getAll({ ...filters, limit: 10000 });
    const logs = response.logs;

    const headers = ['Timestamp', 'Category', 'Severity', 'User', 'Action', 'Outcome', 'Message'];
    const rows = logs.map(log => [
      log.timestamp,
      log.categoria || 'LEGACY',
      log.criticita || 'INFO',
      log.origine.id,
      log.azione.operazione,
      log.risultato.esito,
      log.risultato.messaggio || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  },

  /**
   * Export logs to JSON (client-side)
   */
  async exportToJson(filters: LogFilters = {}): Promise<Blob> {
    const response = await this.getAll({ ...filters, limit: 10000 });
    const jsonContent = JSON.stringify(response.logs, null, 2);
    return new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  },
};

export default logsApi;
