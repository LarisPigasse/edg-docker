// src/core/hooks/useMediaQuery.ts
import { useState, useEffect } from "react";

/**
 * Hook per rilevare media queries e gestire responsive behavior
 * @param query - Media query string (es: '(max-width: 767px)')
 * @returns boolean - true se la media query matcha
 */
export const useMediaQuery = (query: string): boolean => {
  // Inizializza con false per evitare hydration mismatch
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    // Controlla se window è disponibile (client-side)
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia(query);

    // Imposta il valore iniziale
    setMatches(mediaQuery.matches);

    // Handler per i cambiamenti
    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Aggiunge listener
    mediaQuery.addEventListener("change", handleChange);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [query]);

  return matches;
};

/**
 * Hook specifici per breakpoints comuni
 */
export const useIsMobile = (): boolean => {
  return useMediaQuery("(max-width: 767px)");
};

export const useIsTablet = (): boolean => {
  return useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
};

export const useIsDesktop = (): boolean => {
  return useMediaQuery("(min-width: 1024px)");
};

export const useIsLargeScreen = (): boolean => {
  return useMediaQuery("(min-width: 1280px)");
};

// Breakpoint constants per consistency
export const BREAKPOINTS = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

export default useMediaQuery;
