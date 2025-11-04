// src/core/hooks/useThemedImage.ts
import { useMemo } from "react";
import { useUISettings } from "../../app/hooks";

// Mapping delle immagini disponibili
const THEMED_IMAGES = {
  logo: {
    light: "/src/assets/logo.png",
    dark: "/src/assets/logo-reverse.png",
  },
  icon: {
    light: "/src/assets/icon.png",
    dark: "/src/assets/icon-reverse.png",
  },
} as const;

// Tipi per le immagini disponibili
export type ThemedImageKey = keyof typeof THEMED_IMAGES;

// Hook per ottenere l'immagine corretta in base al tema
export const useThemedImage = (imageKey: ThemedImageKey): string => {
  const { darkMode } = useUISettings();

  return useMemo(() => {
    const imageSet = THEMED_IMAGES[imageKey];
    return darkMode ? imageSet.dark : imageSet.light;
  }, [imageKey, darkMode]);
};

// Hook specifico per il logo (convenience)
export const useThemedLogo = (): string => {
  return useThemedImage("logo");
};

// Hook specifico per l'icona (convenience)
export const useThemedIcon = (): string => {
  return useThemedImage("icon");
};

export default useThemedImage;
