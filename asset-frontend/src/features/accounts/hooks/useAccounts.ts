// src/features/accounts/hooks/useAccounts.ts

import { useState, useEffect, useCallback } from 'react';
import { getErrorMessage } from '../../../core/utils';
import {
  fetchAccounts,
  fetchAccountStats,
  fetchRoles,
  createAccount,
  updateAccount,
  deleteAccount,
  activateAccount,
  hardDeleteAccount,
} from '../api/accountsApi';
import type {
  Account,
  AccountFilters,
  AccountPagination,
  AccountStats,
  CreateAccountRequest,
  UpdateAccountRequest,
  Role,
} from '../types';

interface UseAccountsReturn {
  accounts: Account[];
  stats: AccountStats | null;
  roles: Role[];
  loading: boolean;
  error: string | null;
  filters: AccountFilters;
  pagination: AccountPagination;
  setFilters: (filters: AccountFilters) => void;
  nextPage: () => void;
  prevPage: () => void;
  refetch: () => Promise<void>;
  createAccount: (data: CreateAccountRequest) => Promise<void>;
  updateAccount: (accountId: number, data: UpdateAccountRequest) => Promise<void>;
  deleteAccount: (accountId: number) => Promise<void>;
  activateAccount: (accountId: number) => Promise<void>;
  hardDeleteAccount: (accountId: number) => Promise<void>;
}

export const useAccounts = (initialFilters: AccountFilters = {}): UseAccountsReturn => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [stats, setStats] = useState<AccountStats | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AccountFilters>(initialFilters);
  const [pagination, setPagination] = useState<AccountPagination>({
    total: 0,
    page: 0,
    limit: 10,
    totalPages: 0,
    hasMore: false,
  });

  // Carica ruoli una volta sola al mount
  useEffect(() => {
    fetchRoles()
      .then(res => setRoles(res.data))
      .catch(err => console.error('Errore caricamento ruoli:', err));
  }, []);

  const loadAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [accountsResponse, statsResponse] = await Promise.all([
        fetchAccounts(pagination.page, pagination.limit, filters),
        fetchAccountStats(),
      ]);
      setAccounts(accountsResponse.data.accounts);
      setPagination(accountsResponse.data.pagination);
      setStats(statsResponse?.data ?? null);
    } catch (err) {
      console.error('Errore caricamento account:', err);
      setError(getErrorMessage(err, 'Errore nel caricamento degli account'));
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleSetFilters = useCallback((newFilters: AccountFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 0 }));
  }, []);

  const nextPage = useCallback(() => {
    if (pagination.hasMore) setPagination(prev => ({ ...prev, page: prev.page + 1 }));
  }, [pagination.hasMore]);

  const prevPage = useCallback(() => {
    if (pagination.page > 0) setPagination(prev => ({ ...prev, page: prev.page - 1 }));
  }, [pagination.page]);

  const refetch = useCallback(async () => {
    await loadAccounts();
  }, [loadAccounts]);

  const handleCreateAccount = useCallback(
    async (data: CreateAccountRequest) => {
      await createAccount(data);
      await refetch();
    },
    [refetch]
  );

  const handleUpdateAccount = useCallback(
    async (accountId: number, data: UpdateAccountRequest) => {
      await updateAccount(accountId, data);
      await refetch();
    },
    [refetch]
  );

  const handleDeleteAccount = useCallback(
    async (accountId: number) => {
      await deleteAccount(accountId);
      await refetch();
    },
    [refetch]
  );

  const handleActivateAccount = useCallback(
    async (accountId: number) => {
      await activateAccount(accountId);
      await refetch();
    },
    [refetch]
  );

  const handleHardDeleteAccount = useCallback(
    async (accountId: number) => {
      await hardDeleteAccount(accountId);
      await refetch();
    },
    [refetch]
  );

  return {
    accounts,
    stats,
    roles,
    loading,
    error,
    filters,
    pagination,
    setFilters: handleSetFilters,
    nextPage,
    prevPage,
    refetch,
    createAccount: handleCreateAccount,
    updateAccount: handleUpdateAccount,
    deleteAccount: handleDeleteAccount,
    activateAccount: handleActivateAccount,
    hardDeleteAccount: handleHardDeleteAccount,
  };
};
