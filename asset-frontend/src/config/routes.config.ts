// src/config/routes.config.ts

/**
 * MAPPA DELLE ROUTE
 *
 * Unica fonte di verità per i path dell'applicazione: nessun path scritto a
 * mano nei componenti, sempre `ROUTES.QUALCOSA`.
 *
 * Per aggiungere una sezione:
 *   1. dichiara qui la route (prefisso = id del modulo)
 *   2. registrala in `navigation.config.ts` fra i children del modulo
 *   3. montala in `App.tsx` dentro un `<PrivateRoute>`
 */
export const ROUTES = {
  // ── Home ──────────────────────────────────────────────────────────────────
  HOME: '/',
  DASHBOARD: '/',

  // ── Modulo Asset ──────────────────────────────────────────────────────────
  // Perimetro della futura applicazione di gestione asset/veicoli.
  ASSET: '/asset',
  ASSET_DASHBOARD: '/asset/dashboard',

  // ── Modulo Sistema ────────────────────────────────────────────────────────
  SISTEMA: '/sistema',
  SISTEMA_ACCOUNT: '/sistema/accounts',
  SISTEMA_SESSIONS: '/sistema/sessions',
  SISTEMA_LOGS: '/sistema/logs',
  SISTEMA_INFO: '/sistema/info',
  SISTEMA_EXPLORER: '/sistema/explorer',

  // ── Auth ──────────────────────────────────────────────────────────────────
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  CHANGE_PASSWORD: '/change-password',

  // ── User menu ─────────────────────────────────────────────────────────────
  SETTINGS: '/settings',
  NOT_FOUND: '/404',
} as const;

export type RouteKeys = keyof typeof ROUTES;
export type RouteValues = (typeof ROUTES)[RouteKeys];
