export const APP_CONFIG = {
  NAME: "EDG Frontend Template",
  NAME_FULL: "EDG Frontend Template Professional",
  COPYRIGHT: `© ${new Date().getFullYear()} Express Delivery`,
  COPYRIGHT_FULL: `© ${new Date().getFullYear()} Express Delivery. Tutti i diritti riservati.`,

  // Valori configurabili per ambiente
  VERSION: import.meta.env.VITE_APP_VERSION || "0.0.1",
  API_BASE_URL: import.meta.env.VITE_API_URL || "http://localhost:3001",

  // Impostazioni UI
  APP_THEMES: ["light", "dark"],
  APP_FOOTER: true,
  DEFAULT_THEME: "light",
  DEFAULT_LANGUAGE: "it",
  STORAGE_KEY: "edg-theme",

  // Brand e stile
  BRAND_COLORS: {
    PRIMARY: "#8b5cf6", // violet-500
    SECONDARY: "#e7e5e4", // neutral-200
    ACCENT: "#6366f1", // indigo-500
    INFO: "#bae6fd", // sky-200
    ACTION: "#0ea5e9", // sky-500
    SUCCESS: "#84cc16", // lime-500
    WARNING: "#fcd34d", // amber-300
    DANGER: "#ef4444", // red-500
  },
  BRAND_ICON: "/src/assets/icon.png",
  BRAND_LOGO: "/src/assets/logo.png",
} as const;

// Re-export di tutte le configurazioni
export { ROUTES } from "./routes.config";
export { NAVIGATION_ITEMS } from "./navigation.config";
export type { NavigationItem, NavigationIconType, NavigationItemId } from "./navigation.config";
export type { RouteKeys, RouteValues } from "./routes.config";

/** Posizioni disponibili per i toast */
export type ToastPosition = "top-center" | "bottom-center" | "top-right" | "bottom-right";

/** Configurazione Toast System */
export const TOAST_CONFIG = {
  DEFAULT_POSITION: "top-center" as ToastPosition,
  DEFAULT_DURATION: 4000,
  MAX_CONCURRENT: 2,
  /** Abilita swipe dismiss su mobile */
  SWIPE_ENABLED: false,
  /** Offset dal bordo dello schermo */
  VIEWPORT_OFFSET: 16,
} as const;

export default APP_CONFIG;
