// src/features/auth/hooks/useAuth.ts

/**
 * LOGIC LAYER - Modulo Auth
 *
 * Custom hook che fornisce un'interfaccia semplice per l'autenticazione.
 * I componenti usano questo hook invece di accedere direttamente a Redux.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isAuthenticated, account, login, logout, hasPermission } = useAuth();
 *
 *   if (!isAuthenticated) {
 *     return <LoginForm onSubmit={login} />;
 *   }
 *
 *   return <div>Ciao {account?.email}</div>;
 * }
 * ```
 */

import { useCallback, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { authApi } from '../api';
import {
  // Thunks
  login as loginThunk,
  logout as logoutThunk,
  initializeAuth,
  // Actions
  clearError,
  // Selectors
  selectIsAuthenticated,
  selectAccount,
  selectAuthLoading,
  selectAuthInitializing,
  selectAuthError,
  selectPermissions,
} from '../store';
import type { LoginRequest, ChangePasswordRequest, AccountType } from '../types';

/**
 * Hook principale per la gestione dell'autenticazione.
 * Fornisce stato, azioni e helper in un'unica interfaccia.
 */
export function useAuth() {
  const dispatch = useAppDispatch();

  // Stato locale per operazioni non-redux (changePassword)
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);

  // ============================================================================
  // STATO - Valori letti da Redux
  // ============================================================================

  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const account = useAppSelector(selectAccount);
  const loading = useAppSelector(selectAuthLoading);
  const initializing = useAppSelector(selectAuthInitializing);
  const error = useAppSelector(selectAuthError);
  const permissions = useAppSelector(selectPermissions);

  // ============================================================================
  // AZIONI - Funzioni che modificano lo stato
  // ============================================================================

  /**
   * Inizializza l'autenticazione (da chiamare all'avvio dell'app).
   * Verifica se esiste una sessione valida in localStorage o sessionStorage.
   */
  const initialize = useCallback(async () => {
    await dispatch(initializeAuth());
  }, [dispatch]);

  /**
   * Esegue il login con le credenziali fornite.
   * @param credentials - Email e password
   * @param rememberMe - Se true, salva in localStorage (persiste). Se false, usa sessionStorage (si cancella alla chiusura browser)
   * @returns true se login riuscito, false se fallito
   */
  const login = useCallback(
    async (credentials: LoginRequest, rememberMe: boolean = true): Promise<boolean> => {
      const result = await dispatch(loginThunk({ credentials, rememberMe }));
      return result.meta.requestStatus === 'fulfilled';
    },
    [dispatch]
  );

  /**
   * Esegue il logout e pulisce la sessione.
   */
  const logout = useCallback(async () => {
    await dispatch(logoutThunk());
  }, [dispatch]);

  /**
   * Cambia la password dell'utente loggato.
   * Richiede la password attuale per motivi di sicurezza.
   *
   * @param data - Contiene currentPassword e newPassword
   * @returns true se cambio riuscito, false se fallito
   *
   * @example
   * const success = await changePassword({
   *   currentPassword: 'OldPass123!',
   *   newPassword: 'NewPass456!'
   * });
   * if (success) {
   *   navigate('/login'); // Logout implicito
   * }
   */
  const changePassword = useCallback(async (data: ChangePasswordRequest): Promise<boolean> => {
    setChangePasswordLoading(true);
    setChangePasswordError(null);

    try {
      const response = await authApi.changePassword(data);

      if (!response.success) {
        // Traduce gli errori del backend in messaggi user-friendly
        let userFriendlyError = response.error || 'Cambio password fallito';

        // Mappa degli errori dal backend con messaggi user-friendly
        const errorMessages: Record<string, string> = {
          'Accesso diretto non consentito': 'Password attuale errata',
          Unauthorized: 'Password attuale errata',
          'Invalid credentials': 'Password attuale errata',
          'currentPassword is invalid': 'Password attuale errata',
        };

        // Controlla se l'errore corrisponde a uno dei pattern noti
        for (const [backendError, friendlyMessage] of Object.entries(errorMessages)) {
          if (userFriendlyError.toLowerCase().includes(backendError.toLowerCase())) {
            userFriendlyError = friendlyMessage;
            break;
          }
        }

        setChangePasswordError(userFriendlyError);
        return false;
      }

      // Cambio riuscito
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Errore durante il cambio password';
      setChangePasswordError(errorMsg);
      return false;
    } finally {
      setChangePasswordLoading(false);
    }
  }, []);

  /**
   * Pulisce il messaggio di errore corrente.
   * Utile dopo che l'utente ha visto l'errore.
   */
  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  /**
   * Pulisce l'errore di changePassword.
   */
  const clearChangePasswordError = useCallback(() => {
    setChangePasswordError(null);
  }, []);

  // ============================================================================
  // HELPER PERMESSI - Verifica autorizzazioni utente
  // ============================================================================

  /**
   * Verifica se l'utente ha un permesso specifico.
   *
   * Supporta wildcards:
   * - "*" = accesso totale (root)
   * - "modulo.*" = tutte le azioni su un modulo
   *
   * @example
   * hasPermission('spedizioni.read')    // permesso specifico
   * hasPermission('spedizioni.*')       // qualsiasi azione su spedizioni
   */
  const hasPermission = useCallback(
    (permission: string): boolean => {
      // Nessun permesso = nessun accesso
      if (!permissions.length) return false;

      // Wildcard totale (utente root)
      if (permissions.includes('*')) return true;

      // Permesso esatto
      if (permissions.includes(permission)) return true;

      // Wildcard per modulo: "spedizioni.*" include "spedizioni.read"
      const [module] = permission.split('.');
      if (permissions.includes(`${module}.*`)) return true;

      return false;
    },
    [permissions]
  );

  /**
   * Verifica se l'utente ha TUTTI i permessi specificati.
   *
   * @example
   * hasAllPermissions(['spedizioni.read', 'spedizioni.create'])
   */
  const hasAllPermissions = useCallback(
    (requiredPermissions: string[]): boolean => {
      return requiredPermissions.every(p => hasPermission(p));
    },
    [hasPermission]
  );

  /**
   * Verifica se l'utente ha ALMENO UNO dei permessi specificati.
   *
   * @example
   * hasAnyPermission(['spedizioni.read', 'report.read'])
   */
  const hasAnyPermission = useCallback(
    (requiredPermissions: string[]): boolean => {
      return requiredPermissions.some(p => hasPermission(p));
    },
    [hasPermission]
  );

  // ============================================================================
  // HELPER ACCOUNT TYPE - Verifica tipo account
  // ============================================================================

  /**
   * Verifica se l'utente è di un tipo account specifico.
   *
   * @example
   * isAccountType('operatore')
   */
  const isAccountType = useCallback(
    (type: AccountType): boolean => {
      return account?.accountType === type;
    },
    [account]
  );

  // ============================================================================
  // HELPER DISPLAY - Informazioni per UI
  // ============================================================================

  /**
   * Ritorna le iniziali dell'utente per l'avatar.
   * Estrae dalla parte dell'email prima della @.
   *
   * @example
   * // mario.rossi@edg.it -> "MR"
   * // admin@edg.it -> "AD"
   */
  const getUserInitials = useCallback((): string => {
    if (!account?.email) return '??';

    const emailPart = account.email.split('@')[0];

    // Se contiene punto, prende iniziali delle due parti
    // mario.rossi -> MR
    if (emailPart.includes('.')) {
      const parts = emailPart.split('.');
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }

    // Altrimenti prime due lettere
    // admin -> AD
    return emailPart.slice(0, 2).toUpperCase();
  }, [account]);

  /**
   * Ritorna il nome visualizzabile dell'utente.
   * Formatta la parte dell'email prima della @.
   *
   * @example
   * // mario.rossi@edg.it -> "Mario Rossi"
   * // admin@edg.it -> "Admin"
   */
  const getDisplayName = useCallback((): string => {
    if (!account?.email) return 'Utente';

    const emailPart = account.email.split('@')[0];

    // Formatta: mario.rossi -> Mario Rossi
    return emailPart
      .split(/[._-]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }, [account]);

  // ============================================================================
  // RETURN - Interfaccia pubblica dell'hook
  // ============================================================================

  return {
    // Stato Redux
    isAuthenticated,
    account,
    loading,
    initializing,
    error,
    permissions,

    // Stato changePassword (locale)
    changePasswordLoading,
    changePasswordError,

    // Azioni
    initialize,
    login,
    logout,
    changePassword,
    clearAuthError,
    clearChangePasswordError,

    // Helper permessi
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    isAccountType,

    // Helper display
    getUserInitials,
    getDisplayName,
  };
}

export default useAuth;
