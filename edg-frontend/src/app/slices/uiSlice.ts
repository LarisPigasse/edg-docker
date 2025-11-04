// src/features/settings/uiSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { storageUtils } from "../middleware/persistenceMiddleware";

interface UIState {
  darkMode: boolean;
  sidebarVisible: boolean;
  sidebarExpanded: boolean;
  footerVisible: boolean;
  userMenuOpen: boolean;
  settingsMenuOpen: boolean;
  mobileMenuOpen: boolean; // ⭐ NUOVO - per mobile menu
}

// Funzione per creare lo stato iniziale con dati dal localStorage
const createInitialState = (): UIState => {
  const defaultState: UIState = {
    darkMode: false,
    sidebarVisible: false,
    sidebarExpanded: true,
    footerVisible: true,
    userMenuOpen: false, // Sempre false all'avvio
    settingsMenuOpen: false, // Sempre false all'avvio
    mobileMenuOpen: false, // Sempre false all'avvio
  };

  // Carica impostazioni salvate
  const savedSettings = storageUtils.loadUISettings();

  if (savedSettings) {
    return {
      ...defaultState,
      ...savedSettings,
      userMenuOpen: false, // Assicurati che i menu siano sempre chiusi all'avvio
      settingsMenuOpen: false, // Assicurati che i menu siano sempre chiusi all'avvio
      mobileMenuOpen: false, // Mobile menu sempre chiuso all'avvio
    };
  }

  return defaultState;
};

const initialState = createInitialState();

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    // azioni per Dark Mode
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      applyThemeToDocument(state.darkMode);
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.darkMode = action.payload;
      applyThemeToDocument(state.darkMode);
    },
    // azioni per Sidebar
    toggleSidebar: (state) => {
      state.sidebarVisible = !state.sidebarVisible;
    },
    setSidebarVisible: (state, action: PayloadAction<boolean>) => {
      state.sidebarVisible = action.payload;
    },
    toggleSidebarExpanded: (state) => {
      state.sidebarExpanded = !state.sidebarExpanded;
    },
    setSidebarExpanded: (state, action: PayloadAction<boolean>) => {
      state.sidebarExpanded = action.payload;
    },
    // azioni per Footer
    toggleFooter: (state) => {
      state.footerVisible = !state.footerVisible;
    },
    setFooterVisible: (state, action: PayloadAction<boolean>) => {
      state.footerVisible = action.payload;
    },
    // azioni per User Menu
    toggleUserMenu: (state) => {
      state.userMenuOpen = !state.userMenuOpen;
      // Chiudi mobile menu se aperto
      if (state.userMenuOpen && state.mobileMenuOpen) {
        state.mobileMenuOpen = false;
      }
    },
    setUserMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.userMenuOpen = action.payload;
      // Chiudi mobile menu se si apre user menu
      if (action.payload && state.mobileMenuOpen) {
        state.mobileMenuOpen = false;
      }
    },
    closeUserMenu: (state) => {
      state.userMenuOpen = false;
    },
    // azioni per Settings Menu
    toggleSettingsMenu: (state) => {
      state.settingsMenuOpen = !state.settingsMenuOpen;
      // Chiudi mobile menu se aperto
      if (state.settingsMenuOpen && state.mobileMenuOpen) {
        state.mobileMenuOpen = false;
      }
    },
    setSettingsMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.settingsMenuOpen = action.payload;
      // Chiudi mobile menu se si apre user menu
      if (action.payload && state.mobileMenuOpen) {
        state.mobileMenuOpen = false;
      }
    },
    closeSettingsMenu: (state) => {
      state.settingsMenuOpen = false;
    },
    // azioni per mobile menu
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
      // Chiudi user menu se aperto
      if (state.mobileMenuOpen && state.userMenuOpen) {
        state.userMenuOpen = false;
      }
    },
    setMobileMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.mobileMenuOpen = action.payload;
      // Chiudi user menu se si apre mobile menu
      if (action.payload && state.userMenuOpen) {
        state.userMenuOpen = false;
      }
    },
    closeMobileMenu: (state) => {
      state.mobileMenuOpen = false;
    },
    // Chiudi tutti i menu
    closeAllMenus: (state) => {
      state.userMenuOpen = false;
      state.mobileMenuOpen = false;
    },
    resetUISettings: (state) => {
      // Reset allo stato di default
      const defaultState = {
        darkMode: false,
        sidebarVisible: false,
        sidebarExpanded: true,
        footerVisible: true,
        userMenuOpen: false,
        settingsMenuOpen: false,
        mobileMenuOpen: false,
      };

      Object.assign(state, defaultState);
      applyThemeToDocument(false);

      // Pulisci il localStorage
      storageUtils.clearUISettings();
    },
    // Action per inizializzazione completa (incluso tema nel DOM)
    initializeFromStorage: (state) => {
      // Applica il tema al DOM basato sullo stato corrente
      applyThemeToDocument(state.darkMode);
    },
  },
});

// Helper function per applicare il tema al documento
const applyThemeToDocument = (isDark: boolean) => {
  if (typeof document !== "undefined") {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    // Il localStorage viene gestito dal middleware automaticamente
  }
};

// Funzione per inizializzare il tema dall'localStorage (compatibilità)
export const initializeTheme = () => {
  const savedSettings = storageUtils.loadUISettings();

  if (savedSettings && typeof savedSettings.darkMode === "boolean") {
    applyThemeToDocument(savedSettings.darkMode);
    return savedSettings.darkMode;
  }

  // Fallback alle preferenze di sistema
  if (typeof window !== "undefined") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyThemeToDocument(prefersDark);
    return prefersDark;
  }

  return false;
};

export const {
  toggleDarkMode,
  setDarkMode,
  toggleSidebar,
  setSidebarVisible,
  toggleSidebarExpanded,
  setSidebarExpanded,
  toggleFooter,
  setFooterVisible,
  toggleUserMenu,
  setUserMenuOpen,
  closeUserMenu,
  toggleSettingsMenu,
  setSettingsMenuOpen,
  closeSettingsMenu,
  toggleMobileMenu,
  setMobileMenuOpen,
  closeMobileMenu,
  closeAllMenus,
  resetUISettings,
  initializeFromStorage,
} = uiSlice.actions;

// Selectors
export const selectDarkMode = (state: { ui: UIState }) => state.ui.darkMode;
export const selectSidebarVisible = (state: { ui: UIState }) => state.ui.sidebarVisible;
export const selectSidebarExpanded = (state: { ui: UIState }) => state.ui.sidebarExpanded;
export const selectFooterVisible = (state: { ui: UIState }) => state.ui.footerVisible;
export const selectUserMenuOpen = (state: { ui: UIState }) => state.ui.userMenuOpen;
export const selectSettingsMenuOpen = (state: { ui: UIState }) => state.ui.settingsMenuOpen;
export const selectMobileMenuOpen = (state: { ui: UIState }) => state.ui.mobileMenuOpen; // ⭐ NUOVO
export const selectUIState = (state: { ui: UIState }) => state.ui;

export default uiSlice.reducer;
