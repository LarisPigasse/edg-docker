# Changelog

Cronologia delle modifiche di **Vigilo** (cartella e servizio: `asset-frontend`).

Il formato segue [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
e il progetto adotta il [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] - 2026-08-23

Nascita del progetto: fork di `pro-frontend` privato del modulo legato a `vehicle-service`.
Obiettivo di questa versione: un frontend **vuoto** che esegue il login e mostra una home
pulita, senza errori bloccanti con `npm run dev`.

### Added
- Modulo `features/assets`: impalcatura tecnica del futuro applicativo, senza dominio
  - `api/apiHelpers.ts` — base URL, `buildQuery`, factory CRUD `createResourceApi`
  - `hooks/useCrudResource.ts` — hook generico lista + filtri + paginazione + mutazioni
  - `types/api.types.ts` — `ApiResponse`, `PaginatedApiResponse`, `PaginationMeta`, `BaseFilters`
  - `pages/AssetDashboard.tsx` — pagina vuota, serve solo a rendere il modulo navigabile
  - `README.md` di modulo con convenzioni e checklist "aggiungere una risorsa"
- `core/utils/errors.ts` — `getErrorMessage()`: estrae un messaggio leggibile da un errore
  sconosciuto, sostituisce il `catch (err: any)` sparso nel codice
- Proxy di sviluppo in `vite.config.ts` per `/auth`, `/api` e `/log-api`
- `.env.example` versionabile con tutte le variabili documentate
- Script npm `type-check` e `lint:fix`

### Changed
- Identità: `edg-operatori-frontend` → `edg-asset-frontend`, versione `0.1.0`
- Dev server su porta **5176**, host consentiti `asset.edg.local` / `asset-frontend`
- **Chiamate API same-origin.** `VITE_API_URL` e `VITE_API_BASE_URL` sono vuote: il codice
  produce URL relativi che il proxy di Vite inoltra a Traefik. Nessuna richiesta
  cross-origin, quindi non serve aggiungere `http://localhost:5176` a `CORS_ORIGINS`
  del gateway. I fallback `|| 'http://localhost:8080'` sono diventati `?? ''`, così la
  stringa vuota significa davvero "stessa origine"
- `src/pages/Dashboard.tsx` — home volutamente vuota
- `src/config/index.ts` — asset di brand importati come moduli (il nome dell'applicazione è definito più sotto, in «il prodotto si chiama Vigilo»)
- `index.html` — titolo, lingua `it`, meta description
- `routes.config.ts` — modulo `ASSET` (`/asset`, `/asset/dashboard`) al posto del blocco `VEICOLI`
- `navigation.config.ts` — menu ridotto a HOME · ASSET · SISTEMA
- `docker/Dockerfile` — porta dev 5176, healthcheck su `/health`, build-arg `VITE_LOG_SERVICE_URL`
- `docs/SCHEMA.md` rigenerato sull'albero reale del progetto

### Removed
- `features/vehicles` e tutte le sue route, voci di menu e pagine (dominio di `vehicle-service`)
- Moduli `ANAGRAFICHE` e `SPEDIZIONI` dal menu (erano voci senza pagine)
- Alias TypeScript/Vite morti `@components`, `@utils`, `@types`
- File residui `*.backup`, cartella `dist/` e documento di handover del modulo mezzi

### Fixed
- `docker/Dockerfile` stage di produzione: mancava `COPY --from=frontend-builder /app/dist`,
  l'immagine nginx serviva una root vuota
- **Asset del tema assenti in produzione.** `useThemedImage` referenziava le immagini come
  `/src/assets/logo.png`: path valido solo con il dev server. In build Vite non le emetteva
  e in pagina restavano 404. Ora sono import di moduli, quindi copiate e con hash in `dist/`
- `pages/index.ts` ri-esportava `Explorer`, che `App.tsx` importa con `lazy()`: il code
  splitting non funzionava. Bundle principale da **826 kB a 446 kB**
- `pages/Dashboard.tsx` chiamava due hook dopo un early return (violazione delle rules-of-hooks)
- `core/components/data/table/Table.tsx` — espressione ternaria usata come statement
- `features/system/api/logsApi.ts` — helper `apiFetch` generico al posto di `Promise<any>`
- `features/system/types/index.ts` — `Record<string, any>` → `Record<string, unknown>`
- **Lint pulito**: 26 errori e 2 warning ereditati da `pro-frontend` azzerati

### Fixed — login (post-verifica sul campo)
- **«Unexpected token '<', "<!DOCTYPE"… is not valid JSON» al login.** Anche per una
  richiesta same-origin il browser invia l'header `Origin` su POST. Il proxy lo inoltrava
  al gateway, che applica il middleware CORS su `/auth` e rifiuta ogni origine fuori da
  `CORS_ORIGINS` — dove `http://localhost:5176` non compare. Il rifiuto tornava come pagina
  HTML di errore di Express (HTTP 500), che il frontend tentava di leggere come JSON.
  Il proxy ora rimuove `Origin` e `Referer`: oltre il salto la richiesta è server-to-server
  e imbocca il ramo che il gateway prevede già per le chiamate interne
  (`if (!origin) return callback(null, true)`).
- Target del proxy configurabili da `.env` con `VITE_PROXY_TARGET` e `VITE_PROXY_LOG_TARGET`
- `authApi.fetchWithAuth` e `core/services/apiFetch` verificano il `content-type` prima di
  parsare: una risposta non-JSON produce ora un messaggio esplicito e il log dei primi 120
  caratteri ricevuti, invece dell'oscuro errore di `JSON.parse`

### Changed — sfondo del layout
- **L'immagine di sfondo è sfondo, non contenuto.** Era un `<img>` dentro
  `pages/Dashboard.tsx`: viveva nel flusso del `<main>`, quindi ereditava il suo
  `px-6 py-6` (margine visibile su tutti i lati) e, quando più alta dell'area
  disponibile, allungava il documento facendo comparire la barra di scorrimento.
  Ora è un `background-image` su un livello `fixed inset-0` in `MainLayout`:
  copre l'intera finestra, non partecipa al calcolo dell'altezza del documento e
  con `bg-cover` si adatta a ogni proporzione restando centrata.
- `MainLayout` — sfondo unificato fra desktop e mobile: il ramo desktop aveva il
  commento «Background fisso per desktop» ma nessuno sfondo, e un `bg-bg-base`
  opaco sul `<main>` che comunque lo avrebbe coperto
- Collegati `LAYOUT_CONFIG.INNER_PAGE_BG_COLOR / _OPACITY / _Z_INDEX`: erano già
  presenti nel template, documentati per questo esatto scopo, ma non usati da
  nessuno. Sulla home l'immagine si vede piena; sulle pagine interne le si
  sovrappone un velo che tiene leggibile il contenuto
- `LAYOUT_CONFIG.BACKGROUND_IMAGE` — l'immagine di sfondo si sceglie per chiave
  (`'bg' | 'logo' | 'icon'`), con variante chiara/scura automatica
- `pages/Dashboard.tsx` — home di nuovo vuota: l'immagine ora è dello sfondo

### Changed — il prodotto si chiama Vigilo
- `APP_CONFIG.NAME` → «Vigilo», `NAME_FULL` → «Vigilo — Scadenze, manutenzioni e
  controlli periodici». Il nome compare così nella home, nel tooltip del logo e
  ovunque il codice legga `APP_CONFIG`
- `HOME_TITLE` / `HOME_SUBTITLE` sostituiti da `NAME` + `TAGLINE`: il nome
  dell'applicazione era duplicato in due chiavi diverse, ora ne resta una sola
- `index.html` — `<title>` e meta description
- `package.json` (+ `package-lock.json`, per non rompere `npm ci`) —
  `edg-asset-frontend` → `vigilo-frontend`
- README, DOCUMENTATION, SCHEMA e CHANGELOG intestati a Vigilo
- Intestazioni di `Dockerfile`, `nginx.conf`, `vite.config.ts` e dei file `.env`:
  «VIGILO (servizio: asset-frontend)», per tenere distinti il nome di prodotto e
  quello tecnico

  **Restano `asset-frontend`**: il nome della cartella, il servizio Docker,
  l'host `asset.edg.local` e la porta 5176 — sono identificatori
  dell'infrastruttura, referenziati da docker-compose, Traefik e gateway.

### Added — identità in home
- `pages/Dashboard.tsx` — titolo «Vigilo» e sottotitolo «Scadenze, manutenzioni e
  controlli periodici», centrati sull'immagine di sfondo, con un filetto di accento
  nel violetto del brand
- `APP_CONFIG.HOME_TITLE` / `HOME_SUBTITLE` — i due testi stanno in `config`, non
  dentro il componente: sono contenuto di brand e si ritoccano da lì
- Contrasto verificato sulle due immagini di sfondo: `bgbase` è quasi bianco al
  centro e `bgdark` quasi nero, quindi i token `text-text-primary` /
  `text-text-secondary` bastano da soli — nessun velo né ombra sotto al testo

### Removed — asset non utilizzati
- Chiavi `home` e `edg` dalla mappa `THEMED_IMAGES` e relativi hook
  `useThemedHome` / `useThemedEdg`, che nessuno chiamava più dopo lo svuotamento
  della home. Gli import di quella mappa sono statici, quindi ogni voce finiva
  nel bundle anche senza essere mostrata: **le immagini emesse in `dist/` passano
  da ~560 KB a 260 KB** (`home.jpg` da sola pesava 340 KB).
  I file restano in `src/assets/`: per riagganciarne uno bastano un import e una
  voce nella mappa.

### Verificato
- `npm ci` · `npm run build` (tsc + Vite) · `npm run lint` — tutti puliti, zero warning
- `npm run dev` avvia il server in ~400 ms e serve senza errori `App.tsx`, `LoginPage`,
  la home, la pagina Asset, gli stili e le immagini del tema
- Traefik `:80` → API Gateway raggiungibile; `POST /auth/login` risponde correttamente
- Proxy provato contro un gateway fittizio: il body arriva intatto, `Origin` e `Referer`
  non sopravvivono al salto e la risposta torna al browser come JSON
- Utility Tailwind dello sfondo effettivamente generate nel CSS compilato
  (`z-index:-20`, `z-index:-10`, `bg-cover`, `opacity-80`, `bg-bg-secondary`)
- Dopo la pulizia della mappa, `dist/` contiene solo `bgbase`, `bgdark`, `logo`,
  `logo-reverse` e la favicon

---

## Storico ereditato da pro-frontend

La cronologia seguente riguarda il template di origine ed è conservata come riferimento.

## [Unreleased]

### Planned
- Error Boundary component for graceful error handling
- Authentication system implementation
- Testing suite with Vitest + Testing Library

---

## [3.0.0] - 2025-12-15

### Breaking Changes
- **Removed atomic components layer** - `ThemedText`, `ThemedSurface`, `ThemedImage`, `ThemedBorder`, `ThemedShadow` components have been removed
- Components now use Tailwind classes directly with CSS variables

### Removed
- `src/core/components/atomic/` folder and all its contents
- `ThemedText` component - use `<span className="text-text-primary">` instead
- `ThemedSurface` component - use `<div className="bg-bg-primary">` instead
- `ThemedImage` component - use `useThemedImage` hook directly instead
- `ThemedBorder` component - use `border border-border-default` classes
- `ThemedShadow` component - use `shadow-themed-*` classes

### Changed
- **Theming architecture simplified** from 3 layers to 2 layers:
  - Before: CSS Variables → Tailwind Theme → Atomic Components
  - After: CSS Variables → Tailwind Theme → Direct usage
- `typography.css` now uses theme variables instead of hardcoded colors
- `Logo.tsx` refactored to use `useThemedIcon` hook directly
- All components migrated from atomic wrappers to direct Tailwind classes

### Fixed
- Vite HMR WebSocket configuration - now works with both `localhost` and custom hosts
- Removed debug Redux selector from Dashboard that was causing console warnings

### Migration Guide
```tsx
// BEFORE (with ThemedSurface)
<ThemedSurface variant="primary" borderVariant="default">
  <ThemedText variant="secondary">Content</ThemedText>
</ThemedSurface>

// AFTER (direct Tailwind classes)
<div className="bg-bg-primary border border-border-default">
  <span className="text-text-secondary">Content</span>
</div>
```

**Mapping reference:**
| Old | New |
|-----|-----|
| `<ThemedText variant="primary">` | `<span className="text-text-primary">` |
| `<ThemedText variant="secondary">` | `<span className="text-text-secondary">` |
| `<ThemedSurface variant="primary">` | `<div className="bg-bg-primary">` |
| `<ThemedSurface variant="modal">` | `<div className="bg-bg-modal">` |
| `borderVariant="default"` | `border border-border-default` |
| `<ThemedImage imageKey="icon">` | `useThemedIcon()` hook |

---

## [2.1.0] - 2025-07-24

### Added
- **API Service Infrastructure**
  - Complete HTTP client with GET, POST, PUT, PATCH, DELETE, UPLOAD methods
  - Authentication support with token management
  - Typed error handling with `ApiError` interface
  - Request/Response interceptors with timeout management
  - Environment-based configuration
  - File upload support with FormData handling

- **Info Components Suite**
  - `VersionInfo` component with app version, environment badges, and build timestamps
  - `ConnectionStatus` component with real-time backend monitoring and polling
  - `QuickLink` component with internal/external link support, icons, and badges

- **Layout Utility Components**
  - `CenteredPage` component for full viewport centering with animations
  - `CenteredSection` component for flexible section centering with icons

### Changed
- Enhanced documentation with detailed component specifications
- Improved TypeScript interfaces across all new components

---

## [2.0.0] - 2025-07-07

### Added
- **Complete Form System** (8 components + wrapper)
  - `Input` component with floating labels and validation
  - `TextArea` component with auto-resize and character counter
  - `Select` component with Radix UI integration
  - `Checkbox` component with advanced states
  - `Switch` component with iOS-style design
  - `RadioGroup` component with orientations and descriptions
  - `FormField` universal wrapper for consistent layouts
  - `Label` standalone component with semantic variants

- **UI Components Suite**
  - `Card` component with variants and theming
  - `Separator` component with orientation support
  - `Alert` component with dismissible functionality
  - Enhanced `Button` component with `loadingText` feature

- **Data Display Components**
  - `Table` component with responsive design
  - `TableLink` component for clickable table elements
  - `InfoCard` component with structured content
  - `Badge` component with color variants

- **Action Components**
  - `ActionMenu` dropdown for CRUD operations
  - `CreateAction`, `EditAction`, `DeleteAction` components
  - Integrated confirmation dialogs

### Enhanced
- **CSS System Extensions**
  - 4 semantic underline states for form components
  - Autofill override CSS for browser consistency
  - Extended theme variables for form elements

---

## [1.3.0] - 2025-06-30

### Added
- **Dual Menu System**
  - `UserMenu` component for profile management
  - `SettingsMenu` component for app configuration
  - Smart menu exclusivity (only one open at a time)

- **Enhanced UI Components**
  - `UserAvatar` component with initials and hover effects
  - `HeaderGroup` component for optimized title/subtitle spacing
  - `TitledSurface` component with fieldset-style title borders

### Changed
- **Header System Restructuring**
  - 3-zone layout: LEFT (Logo + Mobile menu), CENTER (Navigation), RIGHT (User controls)
  - Responsive behavior with conditional element visibility

---

## [1.2.0] - 2025-06-26

### Added
- **Core Layout System**
  - `MainLayout` component with grid structure and responsive behavior
  - `Header` component with logo, navigation, and user controls
  - `Sidebar` component with expandable/collapsible states
  - `Footer` component with minimal design and version info

- **Theme System Infrastructure**
  - Complete CSS custom properties for light/dark mode
  - Automatic theme switching with DOM class management
  - Theme persistence via localStorage middleware

- **Redux State Management**
  - `uiSlice` with complete UI state
  - Persistence middleware for automatic localStorage sync
  - Typed hooks and selectors

---

## [1.1.0] - 2025-06-25

### Added
- **Navigation System**
  - Route configuration with centralized definitions
  - Navigation configuration with icon mapping
  - React Router integration with typed routes

- **Base UI Components**
  - `Button` component with variants and loading states
  - `Modal` and `ConfirmModal` components
  - `Spinner` component for loading indicators

---

## [1.0.0] - 2025-06-20

### Added
- **Initial Project Setup**
  - React 18 + Vite + TypeScript foundation
  - Tailwind CSS configuration with custom theme
  - Redux Toolkit setup with persistence middleware
  - Lucide React icons integration

- **Project Structure**
  - Feature-based architecture
  - Scalable folder structure with clear separation of concerns

---

## Version Guidelines

- **Major (X.0.0)**: Breaking changes, removal of features
- **Minor (X.Y.0)**: New components, backward-compatible features
- **Patch (X.Y.Z)**: Bug fixes, documentation updates

---

**Repository**: [GitHub](https://github.com/LarisPigasse/edg-frontend-template)
