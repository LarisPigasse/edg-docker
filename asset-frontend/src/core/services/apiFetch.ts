// src/core/services/apiFetch.ts

/**
 * Utility fetch condivisa per i moduli che usano autenticazione JWT.
 *
 * Features:
 * - Aggiunge automaticamente il Bearer token dagli storage
 * - Retry automatico su 401: tenta il refresh token silenziosamente
 * - Aggiorna storage e apiService dopo il refresh
 * - Evita loop infiniti tramite flag isRetry
 */

import apiService from './apiService';

// ─── Costanti storage (allineate con authSlice.ts) ───────────────────────────

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'edg_access_token',
  REFRESH_TOKEN: 'edg_refresh_token',
  REMEMBER_ME: 'edg_remember_me',
} as const;

// Stringa vuota = stessa origine del frontend: la chiamata resta relativa e in
// sviluppo passa dal proxy di Vite (vite.config.ts), evitando problemi di CORS.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

// ─── Helpers storage ─────────────────────────────────────────────────────────

export const getAuthToken = (): string | null =>
  localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || null;

export const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ─── Refresh silenzioso ───────────────────────────────────────────────────────

/**
 * Tenta il refresh dell'access token usando il refresh token in storage.
 * Aggiorna storage e apiService se il refresh ha successo.
 * Ritorna il nuovo access token oppure null.
 */
async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.success || !data.data?.accessToken) return null;

    // Mantiene la stessa strategia storage (local vs session)
    const storage = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true' ? localStorage : sessionStorage;

    storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.data.accessToken);
    storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.data.refreshToken);

    // Aggiorna apiService così i moduli che lo usano (es. vehicles) sono coperti
    apiService.setAuthToken(data.data.accessToken);

    return data.data.accessToken;
  } catch {
    return null;
  }
}

// ─── apiFetch ────────────────────────────────────────────────────────────────

/**
 * Fetch base con retry automatico su 401.
 *
 * Flusso:
 * 1. Esegue la chiamata con il token corrente
 * 2. Se riceve 401 e non è già un retry → tenta refresh token
 * 3. Se il refresh ha successo → ripete la chiamata con il nuovo token
 * 4. Se il refresh fallisce → lancia l'errore originale (401)
 *
 * @param url       URL completo della richiesta
 * @param options   RequestInit standard (method, body, headers, ecc.)
 * @param isRetry   Flag interno per evitare loop infiniti — non usare dall'esterno
 */
export async function apiFetch<T>(url: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  const response = await fetch(url, {
    cache: 'no-store',
    ...options,
  });

  // Gestione 401 con refresh automatico (solo al primo tentativo)
  if (response.status === 401 && !isRetry) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      const retryOptions: RequestInit = {
        ...options,
        headers: {
          ...(options.headers as Record<string, string>),
          Authorization: `Bearer ${newToken}`,
        },
      };
      return apiFetch<T>(url, retryOptions, true);
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: `HTTP error ${response.status}`,
    }));
    throw new Error(errorData.error || errorData.message || `HTTP error ${response.status}`);
  }

  // 204 No Content — nessun body da parsare
  if (response.status === 204) {
    return null as unknown as T;
  }

  // ⚠️ Se la risposta non è JSON siamo finiti su un proxy o su una pagina di
  // errore, non sul microservizio: meglio un messaggio esplicito che il
  // criptico «Unexpected token '<'» di JSON.parse.
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const preview = (await response.text()).slice(0, 120);
    console.error(`❌ [apiFetch] Risposta non JSON da ${url} (${contentType}):`, preview);
    throw new Error("Il server ha risposto in formato inatteso: verifica che l'API Gateway sia raggiungibile.");
  }

  return response.json();
}

export default apiFetch;
