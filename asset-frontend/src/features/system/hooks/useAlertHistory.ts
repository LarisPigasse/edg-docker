/**
 * Hook per gestire lo storico alert e le statistiche.
 * Stato locale: lista storico paginata + stats card.
 */

import { useState, useEffect, useCallback } from 'react';
import alertsApi from '../api/alertsApi';
import type { AlertHistoryEntry, AlertHistoryStats, AlertHistoryFilters } from '../types';

// ============================================================================
// TIPI
// ============================================================================

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UseAlertHistoryResult {
  history: AlertHistoryEntry[];
  stats: AlertHistoryStats | null;
  loading: boolean;
  statsLoading: boolean;
  error: string | null;
  pagination: Pagination;

  // Navigazione
  nextPage: () => void;
  prevPage: () => void;

  // Filtri
  setFilters: (filters: AlertHistoryFilters) => void;

  // Refresh
  refetch: () => Promise<void>;
  refetchStats: () => Promise<void>;
}

const DEFAULT_PAGINATION: Pagination = {
  total: 0,
  page: 0,
  limit: 20,
  totalPages: 0,
};

// ============================================================================
// HOOK
// ============================================================================

export const useAlertHistory = (initialFilters: AlertHistoryFilters = {}): UseAlertHistoryResult => {
  const [history, setHistory] = useState<AlertHistoryEntry[]>([]);
  const [stats, setStats] = useState<AlertHistoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>(DEFAULT_PAGINATION);
  const [filters, setFiltersState] = useState<AlertHistoryFilters>(initialFilters);
  const [page, setPage] = useState(0);

  const limit = initialFilters.limit || 20;

  // --------------------------------------------------------------------------
  // FETCH HISTORY
  // --------------------------------------------------------------------------

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await alertsApi.getHistory({
        ...filters,
        page,
        limit,
      });

      setHistory(response.data);
      setPagination(response.pagination);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore nel caricamento dello storico';
      setError(message);
      console.error('[useAlertHistory] fetchHistory:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, page, limit]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // --------------------------------------------------------------------------
  // FETCH STATS
  // --------------------------------------------------------------------------

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);

    try {
      const response = await alertsApi.getHistoryStats();
      setStats(response.data);
    } catch (err) {
      console.error('[useAlertHistory] fetchStats:', err);
      // Stats non bloccanti: non imposta error principale
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // --------------------------------------------------------------------------
  // NAVIGAZIONE PAGINE
  // --------------------------------------------------------------------------

  const nextPage = useCallback(() => {
    setPage(prev => Math.min(prev + 1, pagination.totalPages - 1));
  }, [pagination.totalPages]);

  const prevPage = useCallback(() => {
    setPage(prev => Math.max(0, prev - 1));
  }, []);

  // --------------------------------------------------------------------------
  // FILTRI
  // --------------------------------------------------------------------------

  const setFilters = useCallback((newFilters: AlertHistoryFilters) => {
    setFiltersState(newFilters);
    setPage(0); // Reset alla prima pagina quando cambiano i filtri
  }, []);

  // --------------------------------------------------------------------------
  // RETURN
  // --------------------------------------------------------------------------

  return {
    history,
    stats,
    loading,
    statsLoading,
    error,
    pagination,
    nextPage,
    prevPage,
    setFilters,
    refetch: fetchHistory,
    refetchStats: fetchStats,
  };
};
