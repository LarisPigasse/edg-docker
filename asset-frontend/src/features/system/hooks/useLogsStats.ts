/**
 * Hook per caricare statistiche aggregate
 */

import { useState, useEffect, useCallback } from 'react';
import { logsApi } from '../api/logsApi';
import type { LogStats, LogFilters } from '../types';

interface UseLogsStatsResult {
  stats: LogStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useLogsStats = (filters: LogFilters = {}): UseLogsStatsResult => {
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await logsApi.getStats(filters);
      setStats(response.stats);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore nel caricamento statistiche';
      setError(message);
      console.error('[useLogsStats] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
};
