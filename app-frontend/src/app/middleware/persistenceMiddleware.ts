// src/app/middleware/persistenceMiddleware.ts
import type { Middleware } from "redux";
import type { Action } from "@reduxjs/toolkit";
import type { RootState, AppDispatch } from "../store";

// Chiavi per localStorage
const STORAGE_KEYS = {
  UI_SETTINGS: "edg-ui-settings",
} as const;

// Interfaccia per i settings persistenti
interface PersistedUISettings {
  darkMode: boolean;
  sidebarVisible: boolean;
  sidebarExpanded: boolean;
  footerVisible: boolean;
  // userMenuOpen non viene persistito (sempre false all'avvio)
}

// Utility per il localStorage
export const storageUtils = {
  // Salva le impostazioni UI nel localStorage
  saveUISettings: (uiState: RootState["ui"]) => {
    try {
      const settingsToSave: PersistedUISettings = {
        darkMode: uiState.darkMode,
        sidebarVisible: uiState.sidebarVisible,
        sidebarExpanded: uiState.sidebarExpanded,
        footerVisible: uiState.footerVisible,
      };

      localStorage.setItem(STORAGE_KEYS.UI_SETTINGS, JSON.stringify(settingsToSave));
    } catch (error) {
      console.warn("Failed to save UI settings to localStorage:", error);
    }
  },

  // Carica le impostazioni UI dal localStorage
  loadUISettings: (): Partial<PersistedUISettings> | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.UI_SETTINGS);
      if (!saved) return null;

      const parsed = JSON.parse(saved) as PersistedUISettings;

      // Validazione dei dati caricati
      if (typeof parsed.darkMode !== "boolean") parsed.darkMode = false;
      if (typeof parsed.sidebarVisible !== "boolean") parsed.sidebarVisible = false;
      if (typeof parsed.sidebarExpanded !== "boolean") parsed.sidebarExpanded = true;
      if (typeof parsed.footerVisible !== "boolean") parsed.footerVisible = true;

      return parsed;
    } catch (error) {
      console.warn("Failed to load UI settings from localStorage:", error);
      return null;
    }
  },

  // Rimuove le impostazioni dal localStorage
  clearUISettings: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.UI_SETTINGS);
    } catch (error) {
      console.warn("Failed to clear UI settings from localStorage:", error);
    }
  },
};

// Tipizzazione corretta per il middleware Redux
export const persistenceMiddleware: Middleware<
  Record<string, never>, // Extra dispatch signature
  RootState, // State type
  AppDispatch // Dispatch type
> = (store) => (next) => (action: Action) => {
  // Esegui l'action
  const result = next(action);

  // Se l'action riguarda l'UI, salva lo stato
  if (action.type?.startsWith("ui/")) {
    const state = store.getState();
    storageUtils.saveUISettings(state.ui);
  }

  return result;
};

export default persistenceMiddleware;
