// src/features/accounts/types/index.ts

/**
 * Account principale
 */
export interface Account {
  id: number;
  email: string;
  roleId: number;
  accountType: AccountType;
  entityId: string | null;
  isActive: boolean;
  blockedUntil: string | null; // ISO 8601
  blockReason: string | null;
  lastLogin: string | null; // ISO 8601 — null se mai loggato
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  role: {
    id: number;
    name: string;
  };
}

/**
 * Tipi di account
 */
export type AccountType = 'operatore' | 'partner' | 'cliente' | 'agente';

/**
 * Stati account per filtro
 */
export type AccountStatus = 'all' | 'active' | 'inactive' | 'blocked';

/**
 * Filtri lista account
 */
export interface AccountFilters {
  search?: string; // Email search
  roleId?: number; // Filter by role
  accountType?: AccountType | 'all';
  status?: AccountStatus;
}

/**
 * Paginazione
 */
export interface AccountPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Response lista account
 */
export interface AccountsListResponse {
  success: boolean;
  data: {
    accounts: Account[];
    pagination: AccountPagination;
  };
}

/**
 * Response singolo account
 */
export interface AccountResponse {
  success: boolean;
  data: Account;
}

/**
 * Statistiche overview
 */
export interface AccountStats {
  total: number;
  active: number;
  inactive: number;
  blocked: number;
  byRole: Array<{
    role: string;
    count: number;
  }>;
}

/**
 * Response statistiche
 */
export interface AccountStatsResponse {
  success: boolean;
  data: AccountStats;
}

/**
 * Request creazione account (via /auth/register)
 */
export interface CreateAccountRequest {
  email: string;
  password: string;
  accountType: AccountType;
  entityId?: string;
  roleId: number;
}

/**
 * Request aggiornamento account
 */
export interface UpdateAccountRequest {
  email?: string;
  roleId?: number;
  accountType?: AccountType;
  entityId?: string;
  isActive?: boolean;
}

/**
 * Response azione generica (activate, delete)
 */
export interface ActionResponse {
  success: boolean;
  message: string;
}

/**
 * Ruoli disponibili (per select)
 */
export interface Role {
  id: number;
  name: string;
}

/**
 * Response lista ruoli
 */
export interface RolesResponse {
  success: boolean;
  data: Role[];
}

// Session Device Info
export interface SessionDevice {
  ip: string;
  device: string | null;
  os: string | null;
  browser: string | null;
}

// Session Geo Info
export interface SessionGeo {
  country: string | null;
  region: string | null;
  city: string | null;
  timezone: string | null;
}

// Session User Info
export interface SessionUser {
  id: number;
  email: string;
  role: string;
}

// Session completa
export interface Session {
  id: number;
  user: SessionUser;
  device: SessionDevice;
  geo: SessionGeo;
  createdAt: string; // ISO datetime
  lastActivityAt: string | null; // ISO datetime
  expiresAt: string; // ISO datetime
}

// Response API /auth/sessions
export interface SessionsResponse {
  success: boolean;
  data: Session[];
  total: number;
}

// Block user duration
export type BlockDuration = '1h' | '24h' | '7d' | 'permanent';

// Block user request
export interface BlockUserRequest {
  duration: BlockDuration;
  reason: string;
}

// Block user response
export interface BlockUserResponse {
  success: boolean;
  message?: string;
}

// Revoke session response
export interface RevokeSessionResponse {
  success: boolean;
  message?: string;
}

// Unblock user response
export interface UnblockUserResponse {
  success: boolean;
  message?: string;
}

// Helper type per durate leggibili
export const BLOCK_DURATION_LABELS: Record<BlockDuration, string> = {
  '1h': '1 ora',
  '24h': '24 ore',
  '7d': '7 giorni',
  permanent: 'Permanente',
};

// Blocked User
export interface BlockedUser {
  id: number;
  email: string;
  role: string;
  blockedUntil: string | null; // ISO datetime o null se permanente
  blockReason: string | null;
  blockedAt: string; // ISO datetime
}

// Response API /auth/blocked-users
export interface BlockedUsersResponse {
  success: boolean;
  data: BlockedUser[];
  total: number;
}
