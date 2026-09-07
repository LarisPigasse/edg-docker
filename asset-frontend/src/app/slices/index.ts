// src/app/slices/index.ts
export {
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
  selectDarkMode,
  selectFooterVisible,
  selectUserMenuOpen,
  selectSettingsMenuOpen,
  selectMobileMenuOpen,
  selectUIState,
  initializeTheme,
  default as uiSliceReducer,
} from './uiSlice';

export type { default as UIState } from './uiSlice';
