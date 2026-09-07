/**
 * Hook per gestire le regole di alerting.
 * Stato locale: lista regole, loading, errori, operazioni CRUD.
 */

import { useState, useEffect, useCallback } from 'react';
import alertsApi from '../api/alertsApi';
import type { AlertRule, AlertRuleFormData } from '../types';

// ============================================================================
// TIPI
// ============================================================================

interface UseAlertRulesResult {
  rules: AlertRule[];
  loading: boolean;
  error: string | null;
  total: number;

  // Operazioni
  refetch: () => Promise<void>;
  createRule: (form: AlertRuleFormData) => Promise<AlertRule>;
  updateRule: (id: string, form: AlertRuleFormData) => Promise<AlertRule>;
  toggleRule: (id: string) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
}

// ============================================================================
// HOOK
// ============================================================================

export const useAlertRules = (): UseAlertRulesResult => {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // FETCH
  // --------------------------------------------------------------------------

  const fetchRules = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await alertsApi.getRules();
      setRules(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore nel caricamento delle regole';
      setError(message);
      console.error('[useAlertRules] fetchRules:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  // --------------------------------------------------------------------------
  // CREATE
  // --------------------------------------------------------------------------

  const createRule = useCallback(async (form: AlertRuleFormData): Promise<AlertRule> => {
    const newRule = await alertsApi.createRule(form);
    // Inserisce in testa (le più recenti hanno priorità maggiore)
    setRules(prev => [newRule, ...prev]);
    return newRule;
  }, []);

  // --------------------------------------------------------------------------
  // UPDATE
  // --------------------------------------------------------------------------

  const updateRule = useCallback(async (id: string, form: AlertRuleFormData): Promise<AlertRule> => {
    const updated = await alertsApi.updateRule(id, form);
    setRules(prev => prev.map(r => (r._id === id ? updated : r)));
    return updated;
  }, []);

  // --------------------------------------------------------------------------
  // TOGGLE
  // --------------------------------------------------------------------------

  const toggleRule = useCallback(async (id: string): Promise<void> => {
    // Ottimistic update: inverte subito il flag visivamente
    setRules(prev => prev.map(r => (r._id === id ? { ...r, enabled: !r.enabled } : r)));

    try {
      const updated = await alertsApi.toggleRule(id);
      // Sincronizza con il valore reale restituito dal backend
      setRules(prev => prev.map(r => (r._id === id ? updated : r)));
    } catch (err) {
      // Rollback ottimistic update in caso di errore
      setRules(prev => prev.map(r => (r._id === id ? { ...r, enabled: !r.enabled } : r)));
      throw err;
    }
  }, []);

  // --------------------------------------------------------------------------
  // DELETE
  // --------------------------------------------------------------------------

  const deleteRule = useCallback(async (id: string): Promise<void> => {
    await alertsApi.deleteRule(id);
    setRules(prev => prev.filter(r => r._id !== id));
  }, []);

  // --------------------------------------------------------------------------
  // RETURN
  // --------------------------------------------------------------------------

  return {
    rules,
    loading,
    error,
    total: rules.length,
    refetch: fetchRules,
    createRule,
    updateRule,
    toggleRule,
    deleteRule,
  };
};
