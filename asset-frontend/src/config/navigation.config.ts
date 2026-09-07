// src/config/navigation.config.ts
import type { LucideIcon } from 'lucide-react';
import { Home, Package, Settings } from 'lucide-react';
import { ROUTES } from './routes.config';

/**
 * Sottomenu di un modulo
 */
export interface SubMenuItem {
  id: string;
  label: string;
  href: string;
}

/**
 * Configurazione di un modulo
 * - Se ha children, mostra il sottomenu quando attivo
 * - Se non ha children, è una voce semplice (es. Home)
 */
export interface ModuleConfig {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  children?: SubMenuItem[];
}

/**
 * Configurazione dei moduli dell'applicazione
 *
 * Per aggiungere un nuovo modulo:
 * 1. Aggiungi le routes in routes.config.ts
 * 2. Aggiungi il modulo qui con i suoi children
 * 3. Monta le pagine in App.tsx
 */
export const MODULES: ModuleConfig[] = [
  {
    id: 'home',
    label: 'HOME',
    href: ROUTES.HOME,
    icon: Home,
    // Home non ha children: mostra tutti i moduli
  },
  {
    id: 'asset',
    label: 'ASSET',
    href: ROUTES.ASSET,
    icon: Package,
    // Perimetro della futura applicazione di gestione asset/veicoli.
    // Aggiungere qui le voci man mano che le pagine vengono realizzate
    // (dotazione, scadenze, interventi, …).
    children: [{ id: 'dashboard', label: 'Dashboard', href: ROUTES.ASSET_DASHBOARD }],
  },
  {
    id: 'sistema',
    label: 'SISTEMA',
    href: ROUTES.SISTEMA,
    icon: Settings,
    children: [
      { id: 'accounts', label: 'Accounts', href: ROUTES.SISTEMA_ACCOUNT },
      { id: 'sessions', label: 'Sessioni', href: ROUTES.SISTEMA_SESSIONS },
      { id: 'logs', label: 'Logs', href: ROUTES.SISTEMA_LOGS },
      { id: 'info', label: 'Info', href: ROUTES.SISTEMA_INFO },
      { id: 'explorer', label: 'Explorer', href: ROUTES.SISTEMA_EXPLORER },
    ],
  },
];

/**
 * Voci di sistema (non sono moduli, sempre visibili in altre posizioni)
 */
export const SYSTEM_ITEMS = {
  settings: {
    id: 'settings',
    label: 'Impostazioni',
    href: ROUTES.SETTINGS,
    icon: Settings,
  },
} as const;

/**
 * Helper: trova il modulo attivo dalla pathname
 */
export const getActiveModule = (pathname: string): ModuleConfig | null => {
  // Home è attivo solo se pathname è esattamente "/"
  if (pathname === '/') {
    return MODULES.find(m => m.id === 'home') || null;
  }

  // Trova il modulo che matcha il pathname
  return MODULES.find(m => m.id !== 'home' && pathname.startsWith(m.href)) || null;
};

/**
 * Helper: verifica se siamo in Home (mostra tutti i moduli)
 */
export const isHomeActive = (pathname: string): boolean => {
  return pathname === '/' || pathname === ROUTES.HOME;
};

// Type exports
export type ModuleId = ModuleConfig['id'];
