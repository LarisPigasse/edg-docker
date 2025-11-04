// src/config/navigation.config.ts
import { ROUTES } from "./routes.config";

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: "home" | "dashboard" | "components" | "settings";
  description?: string;
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: ROUTES.DASHBOARD,
    icon: "dashboard", // Usa LayoutDashboard
    description: "Panoramica e dashboard principale",
  },
  {
    id: "explorer",
    label: "Componenti",
    href: ROUTES.EXPLORER,
    icon: "components", // Usa Package/Components icon
    description: "Esplora tutti i componenti del design system",
  },
  {
    id: "settings",
    label: "Impostazioni",
    href: ROUTES.SETTINGS,
    icon: "settings",
    description: "Configurazioni e impostazioni applicazione",
  },
];

// Type exports
export type NavigationIconType = NavigationItem["icon"];
export type NavigationItemId = NavigationItem["id"];
