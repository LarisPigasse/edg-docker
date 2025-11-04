// src/app/slices/index.ts
export {
  // UI Slice - Actions
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
  
  // UI Slice - Selectors
  selectDarkMode,
  selectSidebarVisible,
  selectSidebarExpanded,
  selectFooterVisible,
  selectUserMenuOpen,
  selectSettingsMenuOpen,
  selectMobileMenuOpen,
  selectUIState,
  
  // UI Slice - Utilities
  initializeTheme,
  
  // UI Slice - Reducer (default export re-exported as named)
  default as uiSliceReducer,
} from "./uiSlice";

// Type exports
export type { default as UIState } from "./uiSlice";