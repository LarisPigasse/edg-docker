// src/core/hooks/useThemedImage.ts
import { useMemo } from 'react';
import { useUISettings } from '../../app/hooks';

// ⚠️ Le immagini vanno importate come moduli, non referenziate con un path
// tipo '/src/assets/logo.png': quel path esiste solo con il dev server di Vite.
// In build di produzione gli asset non importati non vengono emessi in dist/
// e in pagina restano 404. Con l'import Vite li copia, ne fa l'hashing e
// sostituisce l'URL corretto.
//
// ⚠️ Corollario: ogni voce di questa mappa finisce nel bundle anche se nessuno
// la mostra. Tenerla allineata a ciò che l'applicazione usa davvero — le altre
// immagini restano comunque in src/assets/, pronte da riagganciare.
import logoLight from '../../assets/logo.png';
import logoDark from '../../assets/logo-reverse.png';
import iconLight from '../../assets/icon.png';
import iconDark from '../../assets/icon-reverse.png';
import bgLight from '../../assets/bgbase.jpg';
import bgDark from '../../assets/bgdark.jpg';

/**
 * Immagini disponibili, ciascuna con la sua variante chiara e scura.
 *
 * Per aggiungerne una: importa i due file qui sopra e aggiungi la voce.
 * `ThemedImageKey` si aggiorna da solo e la nuova chiave diventa subito
 * selezionabile anche da `LAYOUT_CONFIG.BACKGROUND_IMAGE`.
 */
const THEMED_IMAGES = {
  logo: {
    light: logoLight,
    dark: logoDark,
  },
  icon: {
    light: iconLight,
    dark: iconDark,
  },
  bg: {
    light: bgLight,
    dark: bgDark,
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
export const useThemedLogo = (): string => useThemedImage('logo');

// Hook specifico per l'icona (convenience)
export const useThemedIcon = (): string => useThemedImage('icon');

// Hook specifico per il background (convenience)
export const useThemedBg = (): string => useThemedImage('bg');

export default useThemedImage;
