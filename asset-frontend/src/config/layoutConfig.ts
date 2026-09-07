// src/config/layoutConfig.ts

// Solo tipo: cancellato in compilazione, nessuna dipendenza a runtime verso il core.
import type { ThemedImageKey } from '../core/hooks/useThemedImage';

/**
 * CONFIGURAZIONE LAYOUT
 *
 * Costanti centralizzate per il layout e gli stili globali.
 * Modificando questi valori, la modifica si riflette su tutte le pagine.
 *
 * @example
 * ```typescript
 * import { LAYOUT_CONFIG } from './config';
 *
 * // Usa la costante in un componente
 * <div className={`fixed inset-0 bg-bg-secondary ${LAYOUT_CONFIG.INNER_PAGE_BG_OPACITY} -z-10`} />
 * ```
 */

/**
 * Configurazione degli sfondi per le pagine interne (non-home).
 *
 * INNER_PAGE_BG_OPACITY:
 * - opacity-100: grigio pieno, nessuna immagine visibile
 * - opacity-95: quasi opaco
 * - opacity-90: leggermente trasparente
 * - opacity-80: moderatamente trasparente (CONSIGLIATO)
 * - opacity-75: trasparente
 * - opacity-50: molto trasparente, vedi l'immagine
 *
 * NOTA: Cambia questo valore per modificare l'opacità su TUTTE le pagine interne.
 */
export const LAYOUT_CONFIG = {
  /**
   * Immagine di sfondo dell'applicazione, dichiarata come chiave di
   * `THEMED_IMAGES` (src/core/hooks/useThemedImage.ts): la variante chiara o
   * scura viene scelta da sola in base al tema attivo.
   *
   * Valori disponibili: 'bg' | 'logo' | 'icon' — l'elenco lo detta la mappa
   * `THEMED_IMAGES`, quindi aggiungendo una voce lì compare anche qui.
   * L'immagine è applicata come background CSS a tutta la finestra, quindi non
   * occupa spazio nel flusso: non introduce margini né barre di scorrimento.
   */
  BACKGROUND_IMAGE: 'bg' as ThemedImageKey,

  /**
   * Opacità dello sfondo grigio per le pagine interne.
   * Applicato come overlay sopra l'immagine di sfondo di MainLayout.
   *
   * Modificando questo valore, la modifica si riflette automaticamente
   * su tutte le pagine che usano questo parametro.
   */
  INNER_PAGE_BG_OPACITY: 'opacity-64',

  /**
   * Colore dello sfondo per le pagine interne.
   * Usa `bg-bg-secondary` per un grigio che si adatta al tema (light/dark).
   */
  INNER_PAGE_BG_COLOR: 'bg-bg-secondary',

  /**
   * Z-index dello sfondo.
   * `-z-10` lo posiziona dietro al contenuto ma davanti all'immagine di MainLayout.
   */
  INNER_PAGE_BG_Z_INDEX: '-z-10',
} as const;

export type LayoutConfigKeys = keyof typeof LAYOUT_CONFIG;
