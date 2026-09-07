# Vigilo — Documentazione

## Panoramica

Vigilo è il frontend React della piattaforma EDG dedicato a scadenze, manutenzioni e controlli periodici. Eredita da `pro-frontend` design system, theming, state management, routing e autenticazione già configurati.

**Origine**: derivato da `pro-frontend` (EDG microservices platform)

---

## Stack Tecnologico

| Tecnologia | Versione | Scopo |
|------------|----------|-------|
| React | 19.1.0 | UI Framework |
| TypeScript | 5.8.3 | Type Safety |
| Vite | 6.3.5 | Build Tool |
| Tailwind CSS | 4.1.10 | Styling |
| Redux Toolkit | 2.8.2 | State Management |
| React Router | 7.6.2 | Routing |
| Radix UI | latest | Accessible Primitives |
| Lucide React | latest | Icone |

---

## Architettura

### Struttura Cartelle

```
src/
├── app/                    # Redux store, slices, middleware
├── core/                   # Componenti e utilities riutilizzabili
│   ├── components/         # 52 componenti organizzati per categoria
│   ├── hooks/              # Custom hooks (useThemedImage, ecc.)
│   ├── services/           # API service
│   └── utils/              # Utility functions
├── features/               # Moduli funzionali (da implementare)
├── pages/                  # Pagine dell'applicazione
├── config/                 # Configurazioni (routes, navigation)
├── assets/                 # Immagini e asset statici
└── styles/                 # CSS globali e theming
```

### Categorie Componenti

| Categoria | Componenti | Descrizione |
|-----------|------------|-------------|
| **info** | 5 | Logo, Avatar, VersionInfo, ConnectionStatus, QuickLink |
| **layout** | 11 | MainLayout, Header, Sidebar, Footer, Card, Sheet, ecc. |
| **navigation** | 6 | NavigationMenu, Tabs, Command, UserMenu, SettingsMenu, MobileMenu |
| **data** | 2 | Table, TableLink |
| **feedback** | 6 | Alert, Progress, Skeleton, Spinner, Toast, Tooltip |
| **form** | 11 | Input, Select, Checkbox, Switch, DatePicker, TimePicker, ecc. |
| **ui** | 7 | Button, Badge, Avatar, Accordion, Modal, ConfirmModal, InfoCard |
| **actions** | 4 | ActionMenu, CreateAction, EditAction, DeleteAction |

> **Dettagli completi**: vedi [COMPONENTS.md](./COMPONENTS.md)

---

## Sistema di Theming

Il template usa un sistema a **2 livelli**:

### 1. CSS Variables (globals.css)

```css
:root {
  --bg-primary: #ffffff;
  --text-primary: #111827;
  --border-default: #e5e7eb;
}

.dark {
  --bg-primary: #1a1f2e;
  --text-primary: #f8fafc;
  --border-default: #374151;
}
```

### 2. Tailwind Theme Mapping (index.css)

```css
@theme {
  --color-bg-primary: var(--bg-primary);
  --color-text-primary: var(--text-primary);
  --color-border-default: var(--border-default);
}
```

### Utilizzo nei Componenti

```tsx
// Uso diretto delle classi Tailwind
<div className="bg-bg-primary text-text-primary border border-border-default">
  Contenuto con theming automatico
</div>
```

Il tema si attiva aggiungendo/rimuovendo la classe `.dark` al documento. La preferenza utente viene salvata in localStorage.

---

## State Management

### Redux Store

```typescript
// src/app/store.ts
const store = configureStore({
  reducer: {
    ui: uiSliceReducer,  // Gestisce tema, sidebar, footer, menu
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(persistenceMiddleware),
});
```

### UI Slice

Gestisce tutte le preferenze dell'interfaccia:

```typescript
interface UIState {
  darkMode: boolean;
  sidebarVisible: boolean;
  sidebarExpanded: boolean;
  footerVisible: boolean;
  userMenuOpen: boolean;
  settingsMenuOpen: boolean;
  mobileMenuOpen: boolean;
}
```

### Hook Principale

```typescript
const {
  darkMode,
  sidebarVisible,
  toggleDarkMode,
  toggleSidebar,
  resetUISettings
} = useUISettings();
```

---

## Routing

### Configurazione Routes

```typescript
// src/config/routes.config.ts
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  EXPLORER: '/explorer',
  SETTINGS: '/settings',
  NOT_FOUND: '/404',
};
```

### Lazy Loading

Le pagine secondarie usano lazy loading per ottimizzare il bundle:

```typescript
// Eager loading - pagina principale
import { Dashboard } from './pages';

// Lazy loading - pagine secondarie
const Explorer = lazy(() => import('./pages/Explorer'));
const NotFound = lazy(() => import('./pages/NotFound'));
```

---

## API Service

Client HTTP singleton per comunicazione con backend:

```typescript
import apiService from '@/core/services/apiService';

// Configurazione
apiService.setAuthToken('jwt-token');

// Richieste
const users = await apiService.get<User[]>('/users');
const newUser = await apiService.post<User>('/users', { name: 'Mario' });
await apiService.upload('/upload', formData);
```

**Features**: timeout, error handling tipizzato, interceptors, environment-based URL.

---

## Quick Start

```bash
# Installazione
npm install

# Sviluppo
npm run dev

# Build produzione
npm run build

# Preview build
npm run preview
```

---

## Estendere il Template

### Aggiungere una Feature

1. Crea cartella in `src/features/nome-feature/`
2. Struttura consigliata:
   ```
   features/nome-feature/
   ├── components/     # Componenti specifici
   ├── hooks/          # Hook specifici
   ├── services/       # API specifiche
   ├── slices/         # Redux slice (se necessario)
   └── index.ts        # Barrel exports
   ```

### Aggiungere un Componente Core

1. Crea cartella in `src/core/components/[categoria]/nome-componente/`
2. File necessari:
   - `NomeComponente.tsx` - Componente principale
   - `NomeComponente.data.ts` - Metadata per Explorer
   - `NomeComponente.showcase.tsx` - Demo/esempi
3. Esporta nel barrel file della categoria

### Aggiungere una Pagina

1. Crea in `src/pages/NomePagina.tsx`
2. Aggiungi route in `src/config/routes.config.ts`
3. Aggiungi in `src/App.tsx` (lazy se secondaria)

---

## Documentazione Correlata

| File | Contenuto |
|------|-----------|
| [README.md](./README.md) | Overview progetto e quick start |
| [COMPONENTS.md](./COMPONENTS.md) | Catalogo completo componenti con API |
| [CHANGELOG.md](./CHANGELOG.md) | Cronologia modifiche e migration guide |

---

## Principi di Sviluppo

- **TypeScript rigoroso** - Zero `any` types
- **Accessibilità** - Radix UI primitives, ARIA labels
- **Performance** - Lazy loading, memoization
- **Consistenza** - Pattern uniformi, barrel exports
- **Modularità** - Componenti indipendenti e riutilizzabili

---

*Ultima modifica: 15 Dicembre 2025*  
*Versione: 3.0*