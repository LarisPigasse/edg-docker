# EDG Frontend Template - Catalogo Componenti

**Versione**: 2.6
**Data aggiornamento**: 27 Agosto 2025
**Stack**: React + TypeScript + Tailwind CSS + Radix UI

---

## Indice

- [🎨 Componenti Atomici](#-componenti-atomici)
- [🖼️ Componenti Info](#️-componenti-info)
- [🏗️ Componenti Layout](#️-componenti-layout)
- [🧭 Componenti Navigation](#-componenti-navigation)
- [📊 Componenti Data](#-componenti-data)
- [📢 Componenti Feedback](#-componenti-feedback)
- [📝 Componenti Form](#-componenti-form)
- [🔧 Componenti UI](#-componenti-ui)
- [⚡ Componenti Actions](#-componenti-actions)
- [🛠️ Hooks](#️-hooks)
- [📡 Servizi](#-servizi)

---

## 🎨 Componenti Atomici

### ThemedSurface
**Location**: `src/core/components/atomic/ThemedSurface.tsx`
**Purpose**: Componente base per gestire sfondi, bordi e contenitori con theming automatico.

### ThemedText
**Location**: `src/core/components/atomic/ThemedText.tsx`
**Purpose**: Componente per testi semantici con theming automatico.

### ThemedImage
**Location**: `src/core/components/atomic/ThemedImage.tsx`
**Purpose**: Immagini che cambiano automaticamente con il tema (light/dark).

### ThemedBorder
**Location**: `src/core/components/atomic/ThemedBorder.tsx`
**Purpose**: Wrapper per elementi che necessitano solo bordi tematici.

### ThemedShadow
**Location**: `src/core/components/atomic/ThemedShadow.tsx`
**Purpose**: Wrapper per gestire ombre responsive al tema.

---

## 🖼️ Componenti Info

### VersionInfo
**Location**: `src/core/components/info/VersionInfo.tsx`
**Purpose**: Visualizza informazioni sulla versione dell'applicazione con dettagli di build.

### ConnectionStatus
**Location**: `src/core/components/info/ConnectionStatus.tsx`
**Purpose**: Monitora e visualizza lo stato della connessione al backend in real-time.

### QuickLink
**Location**: `src/core/components/info/QuickLink.tsx`
**Purpose**: Link rapidi con icone, badge e supporto per link interni/esterni.

### UserAvatar
**Location**: `src/core/components/info/UserAvatar.tsx`
**Purpose**: Avatar utente con iniziali e varianti colore.

### Logo
**Location**: `src/core/components/info/Logo.tsx`
**Purpose**: Logo dell'applicazione con modalità compatta e completa.

---

## 🏗️ Componenti Layout

### MainLayout
**Location**: `src/core/components/layout/main-layout/MainLayout.tsx`
**Purpose**: Layout principale dell'applicazione con gestione sidebar e footer.

### Header
**Location**: `src/core/components/layout/header/Header.tsx`
**Purpose**: Header dell'applicazione con navigazione e controlli utente.

### Sidebar
**Location**: `src/core/components/layout/sidebar/Sidebar.tsx`
**Purpose**: Barra laterale con navigazione e controlli.

### Footer
**Location**: `src/core/components/layout/footer/Footer.tsx`
**Purpose**: Footer dell'applicazione con informazioni e link.

### Card
**Location**: `src/core/components/layout/card/Card.tsx`
**Purpose**: Card container con varianti e theming.

### Separator
**Location**: `src/core/components/layout/separator/Separator.tsx`
**Purpose**: Separatore visuale con orientazione.

### Sheet (Drawer)
**Location**: `src/core/components/layout/sheet/Sheet.tsx`
**Purpose**: Un pannello contestuale che scivola da uno dei lati dello schermo.

### CenteredPage
**Location**: `src/core/components/layout/centered-page/CenteredPage.tsx`
**Purpose**: Container per pagine che necessitano centratura verticale (login, 404).

### CenteredSection
**Location**: `src/core/components/layout/centered-section/CenteredSection.tsx`
**Purpose**: Container per sezioni interne che necessitano centratura.

### HeaderGroup
**Location**: `src/core/components/layout/header-group/HeaderGroup.tsx`
**Purpose**: Titolo e sottotitolo con spacing ottimizzato.

### TitledSurface
**Location**: `src/core/components/layout/titled-surface/TitledSurface.tsx`
**Purpose**: Surface con titolo che interrompe il bordo superiore (fieldset-style).

---

## 🧭 Componenti Navigation

### Breadcrumbs
**Location**: `src/core/components/navigation/breadcrumbs/Breadcrumbs.tsx`
**Purpose**: Mostra la posizione dell'utente all'interno della gerarchia del sito.
```typescript
interface BreadcrumbItem { label: string; href?: string; }
```

### Command Palette
**Location**: `src/core/components/navigation/command/Command.tsx`
**Purpose**: Finestra di dialogo per la ricerca e l'esecuzione rapida di comandi.
```typescript
interface CommandItem { id: string; label: string; icon?: React.ReactNode; onSelect: () => void; }
```

### NavigationMenu
**Location**: `src/core/components/navigation/navigation-menu/NavigationMenu.tsx`
**Purpose**: Menu navigazione multi-livello con dropdown e responsive design.

### Tabs
**Location**: `src/core/components/navigation/tabs/Tabs.tsx`
**Purpose**: Componente per organizzare contenuti in schede navigabili.

### SettingsMenu
**Location**: `src/core/components/navigation/settings-menu/SettingsMenu.tsx`
**Purpose**: Menu delle impostazioni dell'applicazione.

### UserMenu
**Location**: `src/core/components/navigation/user-menu/UserMenu.tsx`
**Purpose**: Menu del profilo utente.

### MobileMenu
**Location**: `src/core/components/navigation/mobile-menu/MobileMenu.tsx`
**Purpose**: Menu di navigazione per dispositivi mobile.

---

## 📊 Componenti Data

### Table
**Location**: `src/core/components/data/table/Table.tsx`
**Purpose**: Tabella responsive per dati semplici.

### TableLink
**Location**: `src/core/components/data/table-link/TableLink.tsx`
**Purpose**: Link per elementi cliccabili nelle righe della tabella.

---

## 📢 Componenti Feedback

### Alert
**Location**: `src/core/components/feedback/alert/Alert.tsx`
**Purpose**: Alert per messaggi e notifiche in-page.

### Modal
**Location**: `src/core/components/feedback/modal/Modal.tsx`
**Purpose**: Modal base con overlay e gestione focus.

### ConfirmModal
**Location**: `src/core/components/feedback/confirm-modal/ConfirmModal.tsx`
**Purpose**: Modal di conferma per azioni critiche.

### Progress
**Location**: `src/core/components/feedback/progress/Progress.tsx`
**Purpose**: Progress bar per visualizzare stati di avanzamento.

### Skeleton
**Location**: `src/core/components/feedback/skeleton/Skeleton.tsx`
**Purpose**: Componente segnaposto per indicare il caricamento di contenuti.

### Spinner
**Location**: `src/core/components/feedback/spinner/Spinner.tsx`
**Purpose**: Spinner di caricamento con varianti.

### Toast
**Location**: `src/core/components/feedback/toast/Toast.provider.tsx`
**Purpose**: Sistema di notifiche temporanee (usa `useToast` hook).

### Tooltip
**Location**: `src/core/components/feedback/tooltip/Tooltip.tsx`
**Purpose**: Tooltip con Radix UI e theming automatico.

---

## 📝 Componenti Form

### Input
**Location**: `src/core/components/form/input/Input.tsx`
**Purpose**: Campo input con floating label e validazione.

### TextArea
**Location**: `src/core/components/form/textarea/TextArea.tsx`
**Purpose**: Area di testo con auto-resize e character counter.

### Select
**Location**: `src/core/components/form/select/Select.tsx`
**Purpose**: Select dropdown con Radix UI e floating label.

### MultiSelect
**Location**: `src/core/components/form/multi-select/MultiSelect.tsx`
**Purpose**: Select per selezionare opzioni multiple, visualizzate come tag.

### DatePicker
**Location**: `src/core/components/form/date-picker/DatePicker.tsx`
**Purpose**: Selettore date con popup calendario e validazione input.

### TimePicker
**Location**: `src/core/components/form/time-picker/TimePicker.tsx`
**Purpose**: Selettore orario con supporto 12/24h e controlli step.

### Checkbox
**Location**: `src/core/components/form/checkbox/Checkbox.tsx`
**Purpose**: Checkbox con stati avanzati e Radix UI.

### Switch
**Location**: `src/core/components/form/switch/Switch.tsx`
**Purpose**: Toggle switch iOS-style con Radix UI.

### RadioGroup
**Location**: `src/core/components/form/radio-group/RadioGroup.tsx`
**Purpose**: Gruppo di radio button con Radix UI.

### FormField
**Location**: `src/core/components/form/form-field/FormField.tsx`
**Purpose**: Wrapper universale per eliminare codice ripetitivo nei form.

### Label
**Location**: `src/core/components/form/label/Label.tsx`
**Purpose**: Label standalone con varianti semantiche.

---

## 🔧 Componenti UI

### Accordion
**Location**: `src/core/components/ui/accordion/Accordion.tsx`
**Purpose**: Componente per contenuti collassibili organizzati in sezioni.

### Avatar
**Location**: `src/core/components/ui/avatar/Avatar.tsx`
**Purpose**: Avatar utente con immagine, fallback initials e status indicators.

### AvatarGroup
**Location**: `src/core/components/ui/avatar-group/AvatarGroup.tsx`
**Purpose**: Mostra un gruppo di avatar impilati.

### Badge
**Location**: `src/core/components/ui/badge/Badge.tsx`
**Purpose**: Badge per etichette e stati.

### Button
**Location**: `src/core/components/ui/button/Button.tsx`
**Purpose**: Componente button con varianti e stati.

### InfoCard
**Location**: `src/core/components/ui/info-card/InfoCard.tsx`
**Purpose**: Card informativa usata nel Component Explorer.

### Pagination
**Location**: `src/core/components/ui/pagination/Pagination.tsx`
**Purpose**: Permette di suddividere grandi set di dati in pagine navigabili.

---

## ⚡ Componenti Actions

*(Questa sezione rimane invariata)*

---

## 🛠️ Hooks

*(Questa sezione rimane invariata)*

---

## 📡 Servizi

*(Questa sezione rimane invariata)*

---

## 📋 Checklist Implementazione

### ✅ Componenti Completati (62/64)

* **Atomici (5/5)**: ✅
* **Info (5/5)**: ✅
* **Layout (11/11)**: ✅
* **Navigation (7/9)**:
    * ✅ SettingsMenu, UserMenu, MobileMenu, NavigationMenu, Tabs, Command, Breadcrumbs
    * 🟡 FooterMenu, MainMenu
* **Data (2/2)**: ✅
* **Feedback (8/8)**: ✅
* **Form (11/11)**: ✅
* **UI (7/7)**: ✅
* **Actions (4/4)**: ✅
* **Hooks (2/5)**:
    * ✅ useUISettings, useThemedImage, useMediaQuery
    * 🟡 useLocalStorage, useModal, useThemeStyles
* **Servizi (1/1)**: ✅

---
**Ultima modifica**: 27 Agosto 2025
**Versione catalogo**: 2.6
**Completamento**: ~97%