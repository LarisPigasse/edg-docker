// src/app/slices/uiSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { storageUtils } from '../middleware/persistenceMiddleware';

interface UIState {
  darkMode: boolean;
  footerVisible: boolean;
  userMenuOpen: boolean;
  settingsMenuOpen: boolean;
  mobileMenuOpen: boolean;
}

const createInitialState = (): UIState => {
  const defaultState: UIState = {
    darkMode: false,
    footerVisible: true,
    userMenuOpen: false,
    settingsMenuOpen: false,
    mobileMenuOpen: false,
  };

  const savedSettings = storageUtils.loadUISettings();

  if (savedSettings) {
    return {
      ...defaultState,
      darkMode: savedSettings.darkMode ?? defaultState.darkMode,
      footerVisible: savedSettings.footerVisible ?? defaultState.footerVisible,
      userMenuOpen: false,
      settingsMenuOpen: false,
      mobileMenuOpen: false,
    };
  }

  return defaultState;
};

const initialState = createInitialState();

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleDarkMode: state => {
      state.darkMode = !state.darkMode;
      applyThemeToDocument(state.darkMode);
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.darkMode = action.payload;
      applyThemeToDocument(state.darkMode);
    },
    toggleFooter: state => {
      state.footerVisible = !state.footerVisible;
    },
    setFooterVisible: (state, action: PayloadAction<boolean>) => {
      state.footerVisible = action.payload;
    },
    toggleUserMenu: state => {
      state.userMenuOpen = !state.userMenuOpen;
      if (state.userMenuOpen) {
        state.mobileMenuOpen = false;
        state.settingsMenuOpen = false;
      }
    },
    setUserMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.userMenuOpen = action.payload;
      if (action.payload) {
        state.mobileMenuOpen = false;
        state.settingsMenuOpen = false;
      }
    },
    closeUserMenu: state => {
      state.userMenuOpen = false;
    },
    toggleSettingsMenu: state => {
      state.settingsMenuOpen = !state.settingsMenuOpen;
      if (state.settingsMenuOpen) {
        state.mobileMenuOpen = false;
        state.userMenuOpen = false;
      }
    },
    setSettingsMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.settingsMenuOpen = action.payload;
      if (action.payload) {
        state.mobileMenuOpen = false;
        state.userMenuOpen = false;
      }
    },
    closeSettingsMenu: state => {
      state.settingsMenuOpen = false;
    },
    toggleMobileMenu: state => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
      if (state.mobileMenuOpen) {
        state.userMenuOpen = false;
        state.settingsMenuOpen = false;
      }
    },
    setMobileMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.mobileMenuOpen = action.payload;
      if (action.payload) {
        state.userMenuOpen = false;
        state.settingsMenuOpen = false;
      }
    },
    closeMobileMenu: state => {
      state.mobileMenuOpen = false;
    },
    closeAllMenus: state => {
      state.userMenuOpen = false;
      state.mobileMenuOpen = false;
      state.settingsMenuOpen = false;
    },
    resetUISettings: state => {
      const defaultState: UIState = {
        darkMode: false,
        footerVisible: true,
        userMenuOpen: false,
        settingsMenuOpen: false,
        mobileMenuOpen: false,
      };
      Object.assign(state, defaultState);
      applyThemeToDocument(false);
      storageUtils.clearUISettings();
    },
    initializeFromStorage: state => {
      applyThemeToDocument(state.darkMode);
    },
  },
});

const applyThemeToDocument = (isDark: boolean) => {
  if (typeof document !== 'undefined') {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
};

export const initializeTheme = () => {
  const savedSettings = storageUtils.loadUISettings();
  if (savedSettings && typeof savedSettings.darkMode === 'boolean') {
    applyThemeToDocument(savedSettings.darkMode);
    return savedSettings.darkMode;
  }
  if (typeof window !== 'undefined') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyThemeToDocument(prefersDark);
    return prefersDark;
  }
  return false;
};

export const {
  toggleDarkMode,
  setDarkMode,
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

export const selectDarkMode = (state: { ui: UIState }) => state.ui.darkMode;
export const selectFooterVisible = (state: { ui: UIState }) => state.ui.footerVisible;
export const selectUserMenuOpen = (state: { ui: UIState }) => state.ui.userMenuOpen;
export const selectSettingsMenuOpen = (state: { ui: UIState }) => state.ui.settingsMenuOpen;
export const selectMobileMenuOpen = (state: { ui: UIState }) => state.ui.mobileMenuOpen;
export const selectUIState = (state: { ui: UIState }) => state.ui;

export default uiSlice.reducer;
