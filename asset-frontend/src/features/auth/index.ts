// src/features/auth/index.ts

/**
 * MODULO AUTH - Entry Point
 *
 * Gestisce autenticazione, sessioni e permessi utente.
 *
 * @example
 * ```tsx
 * // Importare hook e componenti
 * import { useAuth, LoginPage, PrivateRoute } from '@/features/auth';
 *
 * // Importare reducer per lo store
 * import { authReducer } from '@/features/auth';
 *
 * // Importare tipi
 * import type { AuthAccount, LoginRequest } from '@/features/auth';
 * ```
 */

// ============================================================================
// TYPES - Contratto dati con il backend
// ============================================================================

export type {
  AccountType,
  AuthAccount,
  LoginRequest,
  RefreshTokenRequest,
  ChangePasswordRequest,
  ResetPasswordRequest,
  ConfirmResetPasswordRequest,
  ApiResponse,
  LoginResponse,
  RefreshTokenResponse,
  AuthState,
} from './types';

export { AUTH_STORAGE_KEYS } from './types';

// ============================================================================
// API - Chiamate HTTP all'auth-service
// ============================================================================

export { authApi } from './api';

// ============================================================================
// STORE - Redux slice per stato globale
// ============================================================================

export {
  // Reducer (da aggiungere allo store principale)
  authReducer,

  // Actions sincrone
  clearError,
  updateAccount,
  resetAuth,

  // Async thunks
  initializeAuth,
  login,
  logout,
  refreshAccessToken,

  // Selectors
  selectAuth,
  selectIsAuthenticated,
  selectAccount,
  selectAuthLoading,
  selectAuthInitializing,
  selectAuthError,
  selectPermissions,
} from './store';

// ============================================================================
// HOOKS - Interfaccia semplificata per i componenti
// ============================================================================

export { useAuth } from './hooks';

// ============================================================================
// COMPONENTS - Elementi UI riusabili
// ============================================================================

export { PrivateRoute, LoginForm } from './components';

// ============================================================================
// PAGES - Pagine complete
// ============================================================================

export { LoginPage, ForgotPasswordPage, ResetPasswordPage, ChangePasswordPage } from './pages';
