/**
 * Hook per gestire la lista logs con filtri e paginazione
 */

import { useState, useEffect, useCallback } from 'react';
import { logsApi } from '../api/logsApi';
import type { LogEvent, LogFilters } from '../types';

interface UseLogsListResult {
  logs: LogEvent[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  refetch: () => Promise<void>;
  nextPage: () => void;
  prevPage: () => void;
  setFilters: (filters: LogFilters) => void;
}

export const useLogsList = (initialFilters: LogFilters = {}): UseLogsListResult => {
  console.log('🔥🔥🔥 NEW VERSION LOADED 15:35 🔥🔥🔥');
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<LogFilters>(initialFilters);
  const [hasMore, setHasMore] = useState(false);

  const limit = filters.limit || 8;

  // 🔥 FIX: useEffect gestisce direttamente il fetch per evitare closure stale
  useEffect(() => {
    let isCancelled = false;

    const fetchLogs = async () => {
      setLoading(true);
      setError(null);

      try {
        const skip = (page - 1) * limit;

        // Rimuovi limit e skip da filters (paginazione gestita separatamente)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { limit: _limit, skip: _skip, ...cleanFilters } = filters;

        console.log('[useLogsList] Fetching with params:', { page, limit, skip, filters: cleanFilters });

        const response = await logsApi.getAll({
          ...cleanFilters,
          limit,
          skip,
        });

        // Previeni update se component unmounted
        if (isCancelled) return;

        console.log('[useLogsList] Response:', {
          logs: response.logs.length,
          total: response.total,
          backendPage: response.page,
          limit: response.limit,
          hasMore: response.hasMore,
        });

        setLogs(response.logs);
        setTotal(response.total);
        setHasMore(response.hasMore);

        console.log('[useLogsList] State updated:', {
          frontendPage: page,
          logsCount: response.logs.length,
          hasMore: response.hasMore,
          firstLogId: response.logs[0]?._id,
          lastLogId: response.logs[response.logs.length - 1]?._id,
        });
      } catch (err) {
        if (isCancelled) return;

        const message = err instanceof Error ? err.message : 'Errore nel caricamento logs';
        setError(message);
        console.error('[useLogsList] Error:', err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    console.log('[useLogsList] useEffect triggered - fetching with page:', page);
    fetchLogs();

    // Cleanup
    return () => {
      isCancelled = true;
    };
  }, [page, filters, limit]); // ✅ Dipendenze corrette senza fetchLogs

  const nextPage = useCallback(() => {
    console.log('[useLogsList] nextPage called - current:', page, 'hasMore:', hasMore);
    setPage(prev => {
      console.log('[useLogsList] Setting page from', prev, 'to', prev + 1);
      return prev + 1;
    });
  }, [page, hasMore]);

  const prevPage = useCallback(() => {
    console.log('[useLogsList] prevPage called - current:', page);
    setPage(prev => {
      const newPage = Math.max(1, prev - 1);
      console.log('[useLogsList] Setting page from', prev, 'to', newPage);
      return newPage;
    });
  }, [page]);

  const refetch = useCallback(async () => {
    // Trigger re-fetch forzando update del timestamp
    setPage(prev => prev);
  }, []);

  const updateFilters = useCallback((newFilters: LogFilters) => {
    console.log('[useLogsList] Filters updated, resetting to page 1');
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  }, []);

  return {
    logs,
    loading,
    error,
    total,
    page,
    limit,
    hasMore,
    refetch,
    nextPage,
    prevPage,
    setFilters: updateFilters,
  };
};
