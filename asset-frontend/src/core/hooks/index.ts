// Barrel file per hooks personalizzati
export {
  default as useThemedImage,
  useThemedLogo,
  useThemedIcon,
  useThemedBg,
  type ThemedImageKey,
} from './useThemedImage';

export {
  default as useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useIsLargeScreen,
  BREAKPOINTS,
} from './useMediaQuery';

export { default as useClickOutside } from './useClickOutside';

// Esporta anche altri hooks futuri
// export { default as useLocalStorage } from './useLocalStorage';
// export { default as useDebounce } from './useDebounce';
