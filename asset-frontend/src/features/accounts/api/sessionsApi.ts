// src/features/sessions/api/sessionsApi.ts

import { apiFetch, getAuthHeaders } from '@/core/services/apiFetch';
import type {
  SessionsResponse,
  BlockUserRequest,
  BlockUserResponse,
  RevokeSessionResponse,
  UnblockUserResponse,
  BlockedUsersResponse,
} from '../types';

// Stringa vuota = stessa origine: vedi la nota in core/services/apiFetch.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export const fetchActiveSessions = async (): Promise<SessionsResponse> =>
  apiFetch<SessionsResponse>(`${API_BASE_URL}/auth/sessions`, {
    headers: getAuthHeaders(),
  });

export const revokeSession = async (sessionId: number): Promise<RevokeSessionResponse> =>
  apiFetch<RevokeSessionResponse>(`${API_BASE_URL}/auth/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

export const blockUser = async (userId: number, blockData: BlockUserRequest): Promise<BlockUserResponse> =>
  apiFetch<BlockUserResponse>(`${API_BASE_URL}/auth/users/${userId}/block`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(blockData),
  });

export const unblockUser = async (userId: number): Promise<UnblockUserResponse> =>
  apiFetch<UnblockUserResponse>(`${API_BASE_URL}/auth/users/${userId}/unblock`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

export const fetchBlockedUsers = async (): Promise<BlockedUsersResponse> =>
  apiFetch<BlockedUsersResponse>(`${API_BASE_URL}/auth/blocked-users`, {
    headers: getAuthHeaders(),
  });
