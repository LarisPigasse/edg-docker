// src/features/accounts/api/accountsApi.ts

import { apiFetch, getAuthHeaders } from '@/core/services/apiFetch';
import type {
  AccountFilters,
  AccountsListResponse,
  AccountResponse,
  AccountStatsResponse,
  RolesResponse,
  CreateAccountRequest,
  UpdateAccountRequest,
  ActionResponse,
} from '../types';

// Stringa vuota = stessa origine: vedi la nota in core/services/apiFetch.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export const fetchAccountStats = async (): Promise<AccountStatsResponse> =>
  apiFetch<AccountStatsResponse>(`${API_BASE_URL}/auth/accounts/stats`, {
    headers: getAuthHeaders(),
  });

export const fetchAccounts = async (page = 0, limit = 50, filters: AccountFilters = {}): Promise<AccountsListResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (filters.search) params.append('search', filters.search);
  if (filters.roleId) params.append('roleId', filters.roleId.toString());
  if (filters.accountType && filters.accountType !== 'all') params.append('accountType', filters.accountType);
  if (filters.status && filters.status !== 'all') params.append('status', filters.status);

  return apiFetch<AccountsListResponse>(`${API_BASE_URL}/auth/accounts?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
};

export const fetchAccountById = async (accountId: number): Promise<AccountResponse> =>
  apiFetch<AccountResponse>(`${API_BASE_URL}/auth/accounts/${accountId}`, {
    headers: getAuthHeaders(),
  });

export const fetchRoles = async (): Promise<RolesResponse> =>
  apiFetch<RolesResponse>(`${API_BASE_URL}/auth/accounts/roles`, {
    headers: getAuthHeaders(),
  });

export const createAccount = async (data: CreateAccountRequest): Promise<AccountResponse> =>
  apiFetch<AccountResponse>(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

export const updateAccount = async (accountId: number, data: UpdateAccountRequest): Promise<AccountResponse> =>
  apiFetch<AccountResponse>(`${API_BASE_URL}/auth/accounts/${accountId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

export const deleteAccount = async (accountId: number): Promise<ActionResponse> =>
  apiFetch<ActionResponse>(`${API_BASE_URL}/auth/accounts/${accountId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

export const hardDeleteAccount = async (accountId: number): Promise<ActionResponse> =>
  apiFetch<ActionResponse>(`${API_BASE_URL}/auth/accounts/${accountId}/hard`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

export const activateAccount = async (accountId: number): Promise<ActionResponse> =>
  apiFetch<ActionResponse>(`${API_BASE_URL}/auth/accounts/${accountId}/activate`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
