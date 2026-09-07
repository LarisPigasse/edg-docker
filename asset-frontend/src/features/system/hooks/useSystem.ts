// src/features/system/hooks/useSystem.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import systemApi from '../api/systemApi';
import type { SystemHealthData } from '../api/systemApi';

const POLL_INTERVAL_MS = 60_000; // aggiorna ogni 60 secondi

interface UseSystemResult {
  data:       SystemHealthData | null;
  loading:    boolean;
  error:      string | null;
  lastUpdate: Date | null;
  refetch:    () => Promise<void>;
}

export const useSystem = (): UseSystemResult => {
  const [data, setData]           = useState<SystemHealthData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchHealth = useCallback(async () => {
    setError(null);

    // Solo al primo fetch mostra il loading globale
    if (!data) setLoading(true);

    try {
      const result = await systemApi.getHealth();
      setData(result);
      setLastUpdate(new Date());
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore nel caricamento';
      setError(msg);
      console.error('[useSystem]', err);
    } finally {
      setLoading(false);
    }
  }, [data]);

  // Fetch iniziale + polling automatico
  useEffect(() => {
    fetchHealth();

    timerRef.current = setInterval(() => {
      fetchHealth();
    }, POLL_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, lastUpdate, refetch: fetchHealth };
};
