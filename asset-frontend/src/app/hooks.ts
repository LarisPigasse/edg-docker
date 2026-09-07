// src/app/hooks.ts
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './store';
import {
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
  selectDarkMode,
  selectFooterVisible,
  selectUserMenuOpen,
  selectSettingsMenuOpen,
  selectMobileMenuOpen,
} from './slices';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const useUISettings = () => {
  const dispatch = useAppDispatch();

  const darkMode = useAppSelector(selectDarkMode);
  const footerVisible = useAppSelector(selectFooterVisible);
  const userMenuOpen = useAppSelector(selectUserMenuOpen);
  const settingsMenuOpen = useAppSelector(selectSettingsMenuOpen);
  const mobileMenuOpen = useAppSelector(selectMobileMenuOpen);

  return {
    darkMode,
    footerVisible,
    userMenuOpen,
    settingsMenuOpen,
    mobileMenuOpen,

    toggleDarkMode: () => dispatch(toggleDarkMode()),
    setDarkMode: (value: boolean) => dispatch(setDarkMode(value)),

    toggleFooter: () => dispatch(toggleFooter()),
    setFooterVisible: (value: boolean) => dispatch(setFooterVisible(value)),

    toggleUserMenu: () => dispatch(toggleUserMenu()),
    setUserMenuOpen: (value: boolean) => dispatch(setUserMenuOpen(value)),
    closeUserMenu: () => dispatch(closeUserMenu()),

    toggleSettingsMenu: () => dispatch(toggleSettingsMenu()),
    setSettingsMenuOpen: (value: boolean) => dispatch(setSettingsMenuOpen(value)),
    closeSettingsMenu: () => dispatch(closeSettingsMenu()),

    toggleMobileMenu: () => dispatch(toggleMobileMenu()),
    setMobileMenuOpen: (value: boolean) => dispatch(setMobileMenuOpen(value)),
    closeMobileMenu: () => dispatch(closeMobileMenu()),
    closeAllMenus: () => dispatch(closeAllMenus()),

    resetUISettings: () => dispatch(resetUISettings()),
  };
};
