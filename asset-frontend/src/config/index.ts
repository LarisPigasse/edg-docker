// src/config/index.ts

// Gli asset di brand vanno importati come moduli: vedi la nota in useThemedImage.ts
import brandIcon from '../assets/icon.png';
import brandLogo from '../assets/logo.png';

/**
 * CONFIGURAZIONE APPLICATIVA CENTRALE
 *
 * Unico punto in cui vivono nome, brand, tema e costanti globali.
 * Tutto ciò che cambia fra un frontend EDG e l'altro sta qui dentro.
 */
export const APP_CONFIG = {
  NAME: 'VIGILO',
  NAME_FULL: 'Vigilo — Scadenze, manutenzioni e controlli periodici',
  COPYRIGHT: `© ${new Date().getFullYear()} Express Delivery`,
  COPYRIGHT_FULL: `© ${new Date().getFullYear()} Express Delivery. Tutti i diritti riservati.`,

  // Valori configurabili per ambiente
  VERSION: import.meta.env.VITE_APP_VERSION || '0.1.0',
  API_BASE_URL: import.meta.env.VITE_API_URL ?? '',

  /**
   * Claim dell'applicazione: compare sotto il nome nella home e può essere
   * riusato ovunque serva una riga di presentazione. Vive qui e non dentro la
   * pagina perché è contenuto di brand.
   */
  TAGLINE: 'SCADENZE, MANUTENZIONI E CONTROLLI PERIODICI',

  // Impostazioni UI
  APP_THEMES: ['light', 'dark'],
  APP_FOOTER: true,
  DEFAULT_THEME: 'light',
  DEFAULT_LANGUAGE: 'it',
  STORAGE_KEY: 'edg-theme',

  // Brand e stile
  BRAND_COLORS: {
    PRIMARY: '#8b5cf6', // violet-500
    SECONDARY: '#e7e5e4', // neutral-200
    ACCENT: '#6366f1', // indigo-500
    INFO: '#bae6fd', // sky-200
    ACTION: '#0ea5e9', // sky-500
    SUCCESS: '#84cc16', // lime-500
    WARNING: '#fcd34d', // amber-300
    DANGER: '#ef4444', // red-500
  },
  BRAND_ICON: brandIcon,
  BRAND_LOGO: brandLogo,
} as const;

// Routes
export { ROUTES } from './routes.config';
export type { RouteKeys, RouteValues } from './routes.config';

// Layout Config
export { LAYOUT_CONFIG } from './layoutConfig';
export type { LayoutConfigKeys } from './layoutConfig';

// Navigation - Moduli
export { MODULES, SYSTEM_ITEMS, getActiveModule, isHomeActive } from './navigation.config';
export type { ModuleConfig, SubMenuItem, ModuleId } from './navigation.config';

/** Posizioni disponibili per i toast */
export type ToastPosition = 'top-center' | 'bottom-center' | 'top-right' | 'bottom-right';

/** Configurazione Toast System */
export const TOAST_CONFIG = {
  DEFAULT_POSITION: 'top-center' as ToastPosition,
  DEFAULT_DURATION: 4000,
  MAX_CONCURRENT: 2,
  SWIPE_ENABLED: false,
  VIEWPORT_OFFSET: 16,
} as const;

export default APP_CONFIG;
