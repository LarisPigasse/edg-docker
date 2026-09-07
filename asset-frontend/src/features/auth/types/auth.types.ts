// src/features/auth/types/auth.types.ts

/**
 * CONTRACT LAYER - Modulo Auth
 *
 * Definisce il contratto dati tra frontend e auth-service.
 * Questi tipi rispecchiano esattamente le strutture del microservizio Docker.
 */

// ============================================================================
// TIPI BASE - Definiscono le entità fondamentali
// ============================================================================

/**
 * Tipi di account supportati dal sistema EDG.
 * Corrisponde a AccountType nel backend.
 */
export type AccountType = 'operatore' | 'partner' | 'cliente' | 'agente';

/**
 * Informazioni account restituite dal login.
 * Struttura minimale per l'uso quotidiano nell'app.
 */
export interface AuthAccount {
  id: number;
  email: string;
  accountType: AccountType;
  roleId: number;
  permissions: string[];
  roleName?: string;
}

// ============================================================================
// RICHIESTE API - Payload inviati al backend
// ============================================================================

/**
 * Payload per POST /auth/login
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Payload per POST /auth/refresh
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Payload per POST /auth/change-password
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * Payload per POST /auth/request-reset-password
 */
export interface ResetPasswordRequest {
  email: string;
}

/**
 * Payload per POST /auth/reset-password
 */
export interface ConfirmResetPasswordRequest {
  token: string;
  newPassword: string;
}

// ============================================================================
// RISPOSTE API - Strutture ricevute dal backend
// ============================================================================

/**
 * Wrapper standard per tutte le risposte API.
 * Il backend EDG usa sempre questa struttura.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Risposta da POST /auth/login
 */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  account: AuthAccount;
}

/**
 * Risposta da POST /auth/refresh
 */
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

// ============================================================================
// STATO REDUX - Struttura dello state auth nello store
// ============================================================================

/**
 * Stato di autenticazione gestito da Redux.
 * Questo è lo stato globale accessibile da tutta l'app.
 */
export interface AuthState {
  /** true se l'utente ha effettuato il login */
  isAuthenticated: boolean;

  /** Dati dell'account loggato, null se non autenticato */
  account: AuthAccount | null;

  /** JWT access token per le chiamate API */
  accessToken: string | null;

  /** Refresh token per rinnovare l'access token */
  refreshToken: string | null;

  /** true durante operazioni async (login, logout, refresh) */
  loading: boolean;

  /** true durante il check iniziale all'avvio dell'app */
  initializing: boolean;

  /** Messaggio di errore, null se nessun errore */
  error: string | null;
}

// ============================================================================
// COSTANTI - Chiavi per localStorage
// ============================================================================

/**
 * Chiavi usate per persistere l'autenticazione in localStorage.
 * Centralizzate qui per evitare typo e facilitare eventuali cambiamenti.
 */
export const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN: 'edg_access_token',
  REFRESH_TOKEN: 'edg_refresh_token',
  ACCOUNT: 'edg_account',
} as const;
