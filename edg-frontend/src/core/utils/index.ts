import {
  House,
  Settings,
  Puzzle,
  LayoutGrid,
  Palette,
  ArrowBigLeft,
  ArrowBigRight,
  Check,
  Upload,
  Download,
  Timer,
  File,
} from "lucide-react";

/**
 * Utility per combinare classi CSS condizionalmente
 * Versione robusta che gestisce stringhe, undefined, null, boolean
 */
export function cn(...inputs: (string | undefined | null | false | 0)[]): string {
  return inputs.filter(Boolean).join(" ");
}

/**
 * Mapping delle icone Lucide per la navigazione
 */
export const iconMap = {
  home: House,
  dashboard: LayoutGrid,
  settings: Settings,
  components: Puzzle,
  showcase: Palette, // Icona più appropriata per showcase
  back: ArrowBigLeft,
  forward: ArrowBigRight,
  check: Check,
  upload: Upload,
  download: Download,
  timer: Timer,
  file: File,
} as const;

export type IconName = keyof typeof iconMap;
