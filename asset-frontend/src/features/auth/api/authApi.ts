// src/features/auth/api/authApi.ts

/**
 * SERVICE LAYER - Modulo Auth
 *
 * Gestisce tutte le chiamate HTTP verso l'auth-service.
 * Questo file isola il resto dell'app dagli endpoint fisici.
 * Se l'API cambia, si modifica solo qui.
 */

import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  ChangePasswordRequest,
  ResetPasswordRequest,
  ConfirmResetPasswordRequest,
  AuthAccount,
} from '../types';

// ============================================================================
// STORAGE HELPER
// ============================================================================

/**
 * Recupera il token dal storage corretto (localStorage o sessionStorage).
 * Usa la stessa logica di authSlice per determinare quale storage è attivo.
 */
function getAccessToken(): string | null {
  // Prova prima localStorage
  const localToken = localStorage.getItem('edg_access_token');
  if (localToken) {
    return localToken;
  }

  // Se non c'è in localStorage, prova sessionStorage
  const sessionToken = sessionStorage.getItem('edg_access_token');
  if (sessionToken) {
    return sessionToken;
  }

  return null;
}

/**
 * Recupera il refresh token dal storage corretto (localStorage o sessionStorage).
 */
function getRefreshToken(): string | null {
  // Prova prima localStorage
  const localToken = localStorage.getItem('edg_refresh_token');
  if (localToken) {
    return localToken;
  }

  // Se non c'è in localStorage, prova sessionStorage
  const sessionToken = sessionStorage.getItem('edg_refresh_token');
  if (sessionToken) {
    return sessionToken;
  }

  return null;
}

// ============================================================================
// CONFIGURAZIONE
// ============================================================================

/**
 * Base URL per le API. Usa variabile d'ambiente o fallback a /api.
 * In sviluppo, Vite proxya /api verso l'API Gateway.
 */
const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';
const AUTH_ENDPOINT = `${API_BASE_URL}/auth`;

// ============================================================================
// HELPER - Funzione fetch con gestione errori e token
// ============================================================================

/**
 * Wrapper per fetch che:
 * - Aggiunge automaticamente Content-Type JSON
 * - Aggiunge Authorization header se presente il token
 * - Gestisce errori di rete e HTTP
 * - Ritorna sempre una struttura ApiResponse<T>
 */
async function fetchWithAuth<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  // Recupera il token dal localStorage o sessionStorage (quello attivo)
  const token = getAccessToken();

  // Prepara gli headers come Record (oggetto normale)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(typeof options.headers === 'object' && options.headers !== null && !(options.headers instanceof Headers)
      ? (options.headers as Record<string, string>)
      : {}),
  };

  // Aggiunge Authorization se abbiamo un token
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    // Esegue la chiamata
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // ⚠️ Il server può rispondere con HTML invece che JSON: succede quando la
    // richiesta non arriva al microservizio ma a un proxy o a una pagina di
    // errore. Parsare quell'HTML darebbe l'oscuro «Unexpected token '<'»:
    // meglio accorgersene qui e dire cosa è andato storto davvero.
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const preview = (await response.text()).slice(0, 120);
      console.error(`❌ [authApi] Risposta non JSON da ${url} (${response.status} ${contentType}):`, preview);
      return {
        success: false,
        error: `Il server ha risposto in formato inatteso (HTTP ${response.status}). Verifica che l'API Gateway sia raggiungibile e che il proxy di sviluppo sia configurato.`,
      };
    }

    // Parsa la risposta JSON
    const data = await response.json();

    // Se HTTP error (4xx, 5xx), ritorna errore strutturato
    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || `Errore HTTP ${response.status}`,
        message: data.message,
      };
    }

    // Risposta OK
    return data as ApiResponse<T>;
  } catch (error) {
    // Errore di rete o parsing
    console.error('❌ [authApi] Errore di rete:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Errore di connessione',
    };
  }
}

// ============================================================================
// API FUNCTIONS - Una funzione per ogni endpoint
// ============================================================================

/**
 * Oggetto con tutte le funzioni API per l'autenticazione.
 * Uso: authApi.login(credentials)
 */
export const authApi = {
  /**
   * POST /auth/login
   * Autentica l'utente e ritorna i token JWT.
   */
  login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return fetchWithAuth<LoginResponse>(`${AUTH_ENDPOINT}/login`, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  /**
   * POST /auth/logout
   * Invalida la sessione corrente sul server.
   */
  logout(): Promise<ApiResponse<void>> {
    const refreshToken = getRefreshToken();

    return fetchWithAuth<void>(`${AUTH_ENDPOINT}/logout`, {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },

  /**
   * POST /auth/logout-all
   * Invalida tutte le sessioni dell'utente (richiede auth).
   */
  logoutAll(): Promise<ApiResponse<void>> {
    return fetchWithAuth<void>(`${AUTH_ENDPOINT}/logout-all`, {
      method: 'POST',
    });
  },

  /**
   * POST /auth/refresh
   * Rinnova l'access token usando il refresh token.
   */
  refreshToken(refreshToken: string): Promise<ApiResponse<RefreshTokenResponse>> {
    return fetchWithAuth<RefreshTokenResponse>(`${AUTH_ENDPOINT}/refresh`, {
      method: 'POST',
      body: JSON.stringify({ refreshToken } as RefreshTokenRequest),
    });
  },

  /**
   * GET /auth/me
   * Ritorna i dati dell'account corrente (richiede auth).
   */
  getCurrentAccount(): Promise<ApiResponse<AuthAccount>> {
    return fetchWithAuth<AuthAccount>(`${AUTH_ENDPOINT}/me`, {
      method: 'GET',
    });
  },

  /**
   * POST /auth/change-password
   * Cambia la password dell'utente loggato (richiede auth).
   */
  changePassword(data: ChangePasswordRequest): Promise<ApiResponse<void>> {
    return fetchWithAuth<void>(`${AUTH_ENDPOINT}/change-password`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * POST /auth/request-reset-password
   * Richiede l'invio di un'email per il reset password.
   */
  requestPasswordReset(data: ResetPasswordRequest): Promise<ApiResponse<void>> {
    return fetchWithAuth<void>(`${AUTH_ENDPOINT}/request-reset-password`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * POST /auth/reset-password
   * Conferma il reset password con il token ricevuto via email.
   */
  confirmPasswordReset(data: ConfirmResetPasswordRequest): Promise<ApiResponse<void>> {
    return fetchWithAuth<void>(`${AUTH_ENDPOINT}/reset-password`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export default authApi;
