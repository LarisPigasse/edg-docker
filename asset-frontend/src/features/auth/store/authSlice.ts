// src/features/auth/store/authSlice.ts

/**
 * STORE LAYER - Modulo Auth
 *
 * Redux slice per la gestione dello stato globale di autenticazione.
 * L'auth usa Redux (invece di stato locale) perché isAuthenticated
 * deve essere accessibile da tutta l'app (Header, PrivateRoute, ecc.)
 *
 * Supporta due modalità di persistenza:
 * - rememberMe = true: localStorage (persiste tra sessioni browser)
 * - rememberMe = false: sessionStorage (si cancella alla chiusura del browser)
 */

import { createSlice, createAsyncThunk, createSelector, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../../app/store';
import { authApi } from '../api';
import type { AuthState, AuthAccount, LoginRequest, LoginResponse } from '../types';
import apiService from '../../../core/services/apiService';

// ============================================================================
// STORAGE HELPERS
// ============================================================================

/** Chiavi per storage - centralizzate per evitare typo */
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'edg_access_token',
  REFRESH_TOKEN: 'edg_refresh_token',
  ACCOUNT: 'edg_account',
  REMEMBER_ME: 'edg_remember_me',
} as const;

/**
 * Determina quale storage usare in base a rememberMe salvato.
 * Se non c'è preferenza salvata, controlla entrambi gli storage.
 */
function getActiveStorage(): Storage {
  // Se c'è il flag in localStorage, usa localStorage
  if (localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true') {
    return localStorage;
  }
  // Se c'è il flag in sessionStorage (o dati in sessionStorage), usa sessionStorage
  if (sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)) {
    return sessionStorage;
  }
  // Default: localStorage (per retrocompatibilità)
  return localStorage;
}

/**
 * Salva i dati di autenticazione nello storage appropriato.
 * @param data Dati di login
 * @param rememberMe Se true usa localStorage, altrimenti sessionStorage
 */
function saveAuthToStorage(data: LoginResponse, rememberMe: boolean): void {
  const storage = rememberMe ? localStorage : sessionStorage;

  // Pulisce l'altro storage per evitare conflitti
  const otherStorage = rememberMe ? sessionStorage : localStorage;
  otherStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  otherStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  otherStorage.removeItem(STORAGE_KEYS.ACCOUNT);
  otherStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);

  // Salva nello storage scelto
  storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
  storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
  storage.setItem(STORAGE_KEYS.ACCOUNT, JSON.stringify(data.account));
  storage.setItem(STORAGE_KEYS.REMEMBER_ME, String(rememberMe));
}

/**
 * Rimuove tutti i dati di autenticazione da entrambi gli storage.
 */
function clearAuthFromStorage(): void {
  // Pulisce localStorage
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.ACCOUNT);
  localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);

  // Pulisce sessionStorage
  sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.ACCOUNT);
  sessionStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
}

/**
 * Carica i dati di autenticazione dallo storage.
 * Controlla prima localStorage, poi sessionStorage.
 */
function loadAuthFromStorage(): {
  accessToken: string;
  refreshToken: string;
  account: AuthAccount;
  rememberMe: boolean;
} | null {
  // Prova prima localStorage
  let storage: Storage = localStorage;
  let accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

  // Se non c'è in localStorage, prova sessionStorage
  if (!accessToken) {
    storage = sessionStorage;
    accessToken = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  if (!accessToken) {
    return null;
  }

  try {
    const refreshToken = storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    const accountStr = storage.getItem(STORAGE_KEYS.ACCOUNT);
    const rememberMe = storage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';

    if (!refreshToken || !accountStr) {
      return null;
    }

    const account = JSON.parse(accountStr) as AuthAccount;
    return { accessToken, refreshToken, account, rememberMe };
  } catch (error) {
    console.error('Errore caricamento auth da storage:', error);
    clearAuthFromStorage();
    return null;
  }
}

/**
 * Aggiorna i token nello storage (mantiene lo stesso storage usato prima).
 */
function updateTokensInStorage(accessToken: string, refreshToken: string, account: AuthAccount): void {
  const storage = getActiveStorage();
  storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  storage.setItem(STORAGE_KEYS.ACCOUNT, JSON.stringify(account));
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: AuthState = {
  isAuthenticated: false,
  account: null,
  accessToken: null,
  refreshToken: null,
  loading: false,
  initializing: true,
  error: null,
};

// ============================================================================
// ASYNC THUNKS
// ============================================================================

/**
 * Inizializza l'autenticazione all'avvio dell'app.
 */
export const initializeAuth = createAsyncThunk('auth/initialize', async () => {
  const stored = loadAuthFromStorage();

  if (!stored) {
    return { isAuthenticated: false, account: null };
  }

  // Verifica che il token sia ancora valido
  const meResponse = await authApi.getCurrentAccount();

  if (meResponse.success && meResponse.data) {
    return {
      isAuthenticated: true,
      account: stored.account,
      accessToken: stored.accessToken,
      refreshToken: stored.refreshToken,
    };
  }

  // Token scaduto, proviamo refresh
  const refreshResponse = await authApi.refreshToken(stored.refreshToken);

  if (refreshResponse.success && refreshResponse.data) {
    // Aggiorna token nello storage (mantiene rememberMe)
    updateTokensInStorage(refreshResponse.data.accessToken, refreshResponse.data.refreshToken, stored.account);

    return {
      isAuthenticated: true,
      account: stored.account,
      accessToken: refreshResponse.data.accessToken,
      refreshToken: refreshResponse.data.refreshToken,
    };
  }

  // Refresh fallito
  clearAuthFromStorage();
  return { isAuthenticated: false, account: null };
});

/**
 * Payload per il thunk login che include rememberMe
 */
interface LoginPayload {
  credentials: LoginRequest;
  rememberMe: boolean;
}

/**
 * Esegue il login con le credenziali fornite.
 */
export const login = createAsyncThunk('auth/login', async ({ credentials, rememberMe }: LoginPayload, { rejectWithValue }) => {
  const response = await authApi.login(credentials);

  if (!response.success || !response.data) {
    return rejectWithValue(response.error || 'Login fallito');
  }

  // Salva nello storage appropriato in base a rememberMe
  saveAuthToStorage(response.data, rememberMe);

  return response.data;
});

/**
 * Esegue il logout.
 */
export const logout = createAsyncThunk('auth/logout', async () => {
  const response = await authApi.logout();

  if (!response.success) {
    console.warn('Logout API fallito:', response.error);
  }

  clearAuthFromStorage();
  return null;
});

/**
 * Rinnova l'access token.
 */
export const refreshAccessToken = createAsyncThunk('auth/refreshToken', async (_, { getState, rejectWithValue }) => {
  const state = getState() as { auth: AuthState };
  const { refreshToken, account } = state.auth;

  if (!refreshToken) {
    return rejectWithValue('Nessun refresh token disponibile');
  }

  const response = await authApi.refreshToken(refreshToken);

  if (!response.success || !response.data) {
    clearAuthFromStorage();
    return rejectWithValue(response.error || 'Refresh token fallito');
  }

  // Aggiorna storage
  if (account) {
    updateTokensInStorage(response.data.accessToken, response.data.refreshToken, account);
  }

  return response.data;
});

// ============================================================================
// SLICE
// ============================================================================

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },

    updateAccount(state, action: PayloadAction<Partial<AuthAccount>>) {
      if (state.account) {
        state.account = { ...state.account, ...action.payload };
        const storage = getActiveStorage();
        storage.setItem(STORAGE_KEYS.ACCOUNT, JSON.stringify(state.account));
      }
    },

    resetAuth(state) {
      clearAuthFromStorage();
      Object.assign(state, { ...initialState, initializing: false });
    },
  },

  extraReducers: builder => {
    // --- initializeAuth ---
    builder
      .addCase(initializeAuth.pending, state => {
        state.initializing = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.initializing = false;
        state.isAuthenticated = action.payload.isAuthenticated;
        state.account = action.payload.account || null;
        state.accessToken = action.payload.accessToken || null;
        state.refreshToken = action.payload.refreshToken || null;
        if (action.payload.accessToken) {
          apiService.setAuthToken(action.payload.accessToken);
        }
      })
      .addCase(initializeAuth.rejected, state => {
        state.initializing = false;
        state.isAuthenticated = false;
        state.account = null;
        state.accessToken = null;
        state.refreshToken = null;
      });

    // --- login ---
    builder
      .addCase(login.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.account = action.payload.account;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.error = null;
        apiService.setAuthToken(action.payload.accessToken);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      });

    // --- logout ---
    builder
      .addCase(logout.pending, state => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, state => {
        state.loading = false;
        state.isAuthenticated = false;
        state.account = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.error = null;
        apiService.removeAuthToken();
      })
      .addCase(logout.rejected, state => {
        state.loading = false;
        state.isAuthenticated = false;
        state.account = null;
        state.accessToken = null;
        state.refreshToken = null;
      });

    // --- refreshAccessToken ---
    builder
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        apiService.setAuthToken(action.payload.accessToken);
      })
      .addCase(refreshAccessToken.rejected, state => {
        state.isAuthenticated = false;
        state.account = null;
        state.accessToken = null;
        state.refreshToken = null;
      });
  },
});

// ============================================================================
// EXPORTS
// ============================================================================

export const { clearError, updateAccount, resetAuth } = authSlice.actions;

// Selettori base (non memoizzati)
export const selectAuth = (state: RootState) => state.auth;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectAccount = (state: RootState) => state.auth.account;
export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthInitializing = (state: RootState) => state.auth.initializing;
export const selectAuthError = (state: RootState) => state.auth.error;

// Selettore memoizzato per evitare re-render inutili
// Ritorna sempre lo stesso array reference se permissions non cambia
export const selectPermissions = createSelector([selectAccount], account => account?.permissions || []);

export const authReducer = authSlice.reducer;
export default authSlice.reducer;
