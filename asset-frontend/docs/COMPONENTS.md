# EDG Frontend Template - Catalogo Componenti

**Versione**: 3.0  
**Data aggiornamento**: 15 Dicembre 2025  
**Stack**: React 19 + TypeScript + Tailwind CSS 4 + Radix UI

---

## Indice

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

## 🖼️ Componenti Info

### Logo
**Location**: `src/core/components/info/Logo.tsx`  
**Purpose**: Logo dell'applicazione con modalità compatta e completa. Usa `useThemedIcon` per immagini responsive al tema.

### UserAvatar
**Location**: `src/core/components/info/UserAvatar.tsx`  
**Purpose**: Avatar utente con iniziali e varianti colore.

### VersionInfo
**Location**: `src/core/components/info/VersionInfo.tsx`  
**Purpose**: Visualizza informazioni sulla versione dell'applicazione con dettagli di build.

### ConnectionStatus
**Location**: `src/core/components/info/ConnectionStatus.tsx`  
**Purpose**: Monitora e visualizza lo stato della connessione al backend in real-time.

### QuickLink
**Location**: `src/core/components/info/QuickLink.tsx`  
**Purpose**: Link rapidi con icone, badge e supporto per link interni/esterni.

---

## 🏗️ Componenti Layout

### MainLayout
**Location**: `src/core/components/layout/custom/MainLayout.tsx`  
**Purpose**: Layout principale dell'applicazione con gestione sidebar e footer.

### Header
**Location**: `src/core/components/layout/custom/Header.tsx`  
**Purpose**: Header dell'applicazione con navigazione e controlli utente.

### Sidebar
**Location**: `src/core/components/layout/custom/Sidebar.tsx`  
**Purpose**: Barra laterale con navigazione e controlli.

### Footer
**Location**: `src/core/components/layout/custom/Footer.tsx`  
**Purpose**: Footer dell'applicazione con informazioni e link.

### Card
**Location**: `src/core/components/layout/card/Card.tsx`  
**Purpose**: Card container con varianti e theming.
```typescript
type CardVariant = 'default' | 'elevated' | 'bordered';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';
```

### Separator
**Location**: `src/core/components/layout/separator/Separator.tsx`  
**Purpose**: Separatore visuale con orientazione.
```typescript
type SeparatorOrientation = 'horizontal' | 'vertical';
type SeparatorVariant = 'default' | 'strong';
```

### Sheet (Drawer)
**Location**: `src/core/components/layout/sheet/Sheet.tsx`  
**Purpose**: Pannello contestuale che scivola da uno dei lati dello schermo.
```typescript
type SheetSide = 'top' | 'right' | 'bottom' | 'left';
```

### CenteredPage
**Location**: `src/core/components/layout/custom/CenteredPage.tsx`  
**Purpose**: Container per pagine che necessitano centratura verticale (login, 404).

### CenteredSection
**Location**: `src/core/components/layout/custom/CenteredSection.tsx`  
**Purpose**: Container per sezioni interne che necessitano centratura.

### HeaderGroup
**Location**: `src/core/components/layout/custom/HeaderGroup.tsx`  
**Purpose**: Titolo e sottotitolo con spacing ottimizzato.

### TitledSurface
**Location**: `src/core/components/layout/custom/TitledSurface.tsx`  
**Purpose**: Surface con titolo che interrompe il bordo superiore (fieldset-style).

---

## 🧭 Componenti Navigation

### NavigationMenu
**Location**: `src/core/components/navigation/navigation-menu/NavigationMenu.tsx`  
**Purpose**: Menu navigazione multi-livello con dropdown e responsive design.
```typescript
interface NavigationLink { label: string; href: string; icon?: React.ReactNode; }
interface NavigationGroup { title: string; items: NavigationLink[]; }
```

### Tabs
**Location**: `src/core/components/navigation/tabs/Tabs.tsx`  
**Purpose**: Componente per organizzare contenuti in schede navigabili.
```typescript
type TabsVariant = 'default' | 'pills' | 'underline';
type TabsSize = 'sm' | 'md' | 'lg';
```

### Command Palette
**Location**: `src/core/components/navigation/command/Command.tsx`  
**Purpose**: Finestra di dialogo per la ricerca e l'esecuzione rapida di comandi.
```typescript
interface CommandItem { id: string; label: string; icon?: React.ReactNode; onSelect: () => void; }
```

### UserMenu
**Location**: `src/core/components/navigation/custom/UserMenu.tsx`  
**Purpose**: Menu del profilo utente.

### SettingsMenu
**Location**: `src/core/components/navigation/custom/SettingsMenu.tsx`  
**Purpose**: Menu delle impostazioni dell'applicazione.

### MobileMenu
**Location**: `src/core/components/navigation/custom/MobileMenu.tsx`  
**Purpose**: Menu di navigazione per dispositivi mobile.

---

## 📊 Componenti Data

### Table
**Location**: `src/core/components/data/table/Table.tsx`  
**Purpose**: Tabella responsive per dati semplici.
```typescript
interface TableColumn<T> { key: keyof T; header: string; render?: (value: T[keyof T], row: T) => React.ReactNode; }
type TableSize = 'sm' | 'md' | 'lg';
```

### TableLink
**Location**: `src/core/components/data/table-link/TableLink.tsx`  
**Purpose**: Link per elementi cliccabili nelle righe della tabella.
```typescript
type TableLinkVariant = 'default' | 'primary' | 'danger';
```

---

## 📢 Componenti Feedback

### Alert
**Location**: `src/core/components/feedback/alert/Alert.tsx`  
**Purpose**: Alert per messaggi e notifiche in-page.
```typescript
type AlertVariant = 'info' | 'success' | 'warning' | 'danger';
```

### Progress
**Location**: `src/core/components/feedback/progress/Progress.tsx`  
**Purpose**: Progress bar per visualizzare stati di avanzamento.
```typescript
type ProgressVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';
type ProgressSize = 'sm' | 'md' | 'lg';
```

### Skeleton
**Location**: `src/core/components/feedback/skeleton/Skeleton.tsx`  
**Purpose**: Componente segnaposto per indicare il caricamento di contenuti.

### Spinner
**Location**: `src/core/components/feedback/spinner/Spinner.tsx`  
**Purpose**: Spinner di caricamento con varianti.
```typescript
type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';
```

### Toast
**Location**: `src/core/components/feedback/toast/Toast.provider.tsx`  
**Purpose**: Sistema di notifiche temporanee.
```typescript
type ToastSeverity = 'default' | 'success' | 'warning' | 'danger';
type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
// Uso: const { showToast } = useToast();
```

### Tooltip
**Location**: `src/core/components/feedback/tooltip/Tooltip.tsx`  
**Purpose**: Tooltip con Radix UI e theming automatico.
```typescript
type TooltipSide = 'top' | 'right' | 'bottom' | 'left';
type TooltipAlign = 'start' | 'center' | 'end';
```

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
```typescript
interface SelectOption { value: string; label: string; disabled?: boolean; }
```

### MultiSelect
**Location**: `src/core/components/form/multi-select/MultiSelect.tsx`  
**Purpose**: Select per selezionare opzioni multiple, visualizzate come tag.
```typescript
interface MultiSelectOption { value: string; label: string; }
```

### DatePicker
**Location**: `src/core/components/form/date-picker/DatePicker.tsx`  
**Purpose**: Selettore date con popup calendario e validazione input.
```typescript
type DatePickerFormat = 'dd/MM/yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd';
type DatePickerSize = 'sm' | 'md' | 'lg';
```

### TimePicker
**Location**: `src/core/components/form/time-picker/TimePicker.tsx`  
**Purpose**: Selettore orario con supporto 12/24h e controlli step.
```typescript
type TimePickerFormat = '12h' | '24h';
type TimePickerStep = 1 | 5 | 10 | 15 | 30;
```

### Checkbox
**Location**: `src/core/components/form/checkbox/Checkbox.tsx`  
**Purpose**: Checkbox con stati avanzati (checked, indeterminate) e Radix UI.
```typescript
type CheckboxSize = 'sm' | 'md' | 'lg';
```

### Switch
**Location**: `src/core/components/form/switch/Switch.tsx`  
**Purpose**: Toggle switch iOS-style con Radix UI.
```typescript
type SwitchSize = 'sm' | 'md' | 'lg';
```

### RadioGroup
**Location**: `src/core/components/form/radio-group/RadioGroup.tsx`  
**Purpose**: Gruppo di radio button con Radix UI.
```typescript
interface RadioOption { value: string; label: string; description?: string; disabled?: boolean; }
type RadioGroupOrientation = 'horizontal' | 'vertical';
```

### FormField
**Location**: `src/core/components/form/form-field/FormField.tsx`  
**Purpose**: Wrapper universale per layout consistente nei form.
```typescript
type FormFieldSize = 'sm' | 'md' | 'lg';
type FormFieldSpacing = 'tight' | 'normal' | 'relaxed';
```

### Label
**Location**: `src/core/components/form/label/Label.tsx`  
**Purpose**: Label standalone con varianti semantiche.
```typescript
type LabelVariant = 'default' | 'required' | 'optional';
type LabelSize = 'sm' | 'md' | 'lg';
```

---

## 🔧 Componenti UI

### Button
**Location**: `src/core/components/ui/button/Button.tsx`  
**Purpose**: Componente button con varianti e stati.
```typescript
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
type ButtonSize = 'sm' | 'md' | 'lg';
```

### Badge
**Location**: `src/core/components/ui/badge/Badge.tsx`  
**Purpose**: Badge per etichette e stati.
```typescript
type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';
type BadgeSize = 'sm' | 'md' | 'lg';
```

### Avatar
**Location**: `src/core/components/ui/avatar/Avatar.tsx`  
**Purpose**: Avatar utente con immagine, fallback initials e status indicators.
```typescript
type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type AvatarShape = 'circle' | 'square';
type AvatarStatus = 'online' | 'offline' | 'busy' | 'away';
```

### Accordion
**Location**: `src/core/components/ui/accordion/Accordion.tsx`  
**Purpose**: Componente per contenuti collassibili organizzati in sezioni.
```typescript
type AccordionType = 'single' | 'multiple';
type AccordionVariant = 'default' | 'bordered' | 'separated';
```

### Modal
**Location**: `src/core/components/ui/modal/Modal.tsx`  
**Purpose**: Modal base con overlay e gestione focus.
```typescript
type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
```

### ConfirmModal
**Location**: `src/core/components/ui/confirm-modal/ConfirmModal.tsx`  
**Purpose**: Modal di conferma per azioni critiche.
```typescript
type ConfirmVariant = 'danger' | 'warning' | 'info';
```

### InfoCard
**Location**: `src/core/components/ui/info-card/InfoCard.tsx`  
**Purpose**: Card informativa usata nel Component Explorer.
```typescript
type ComponentCategory = 'ui' | 'form' | 'navigation' | 'feedback' | 'data' | 'layout';
```

---

## ⚡ Componenti Actions

### ActionMenu
**Location**: `src/core/components/actions/ActionMenu.tsx`  
**Purpose**: Menu dropdown per operazioni CRUD su elementi.
```typescript
interface Action { id: string; label: string; icon?: React.ReactNode; variant?: 'default' | 'danger'; onClick: () => void; }
```

### CreateAction
**Location**: `src/core/components/actions/CreateAction.tsx`  
**Purpose**: Bottone/action per creazione nuovi elementi.

### EditAction
**Location**: `src/core/components/actions/EditAction.tsx`  
**Purpose**: Bottone/action per modifica elementi.

### DeleteAction
**Location**: `src/core/components/actions/DeleteAction.tsx`  
**Purpose**: Bottone/action per eliminazione con conferma.

---

## 🛠️ Hooks

### useUISettings
**Location**: `src/app/hooks.ts`  
**Purpose**: Hook principale per gestire tutte le impostazioni UI (tema, sidebar, footer).
```typescript
const {
  darkMode,
  sidebarVisible,
  sidebarExpanded,
  footerVisible,
  toggleDarkMode,
  toggleSidebar,
  toggleSidebarExpanded,
  toggleFooter,
  resetUISettings
} = useUISettings();
```

### useThemedImage
**Location**: `src/core/hooks/useThemedImage.ts`  
**Purpose**: Hook per ottenere immagini che cambiano in base al tema (light/dark).
```typescript
type ThemedImageKey = 'logo' | 'icon';

const imageSrc = useThemedImage('logo');
const logoSrc = useThemedLogo();  // Convenience hook
const iconSrc = useThemedIcon();  // Convenience hook
```

### useToast
**Location**: `src/core/components/feedback/toast/useToast.hook.ts`  
**Purpose**: Hook per mostrare notifiche toast.
```typescript
const { showToast } = useToast();
showToast({ title: 'Salvato!', severity: 'success' });
```

### useAppSelector / useAppDispatch
**Location**: `src/app/hooks.ts`  
**Purpose**: Hook tipizzati per Redux.
```typescript
const darkMode = useAppSelector(state => state.ui.darkMode);
const dispatch = useAppDispatch();
```

---

## 📡 Servizi

### apiService
**Location**: `src/core/services/apiService.ts`  
**Purpose**: Client HTTP per comunicazione con backend.

```typescript
import apiService from '@/core/services/apiService';

// GET request
const response = await apiService.get<User[]>('/users');

// POST request
const newUser = await apiService.post<User>('/users', { name: 'Mario' });

// Con autenticazione
apiService.setAuthToken('jwt-token');

// Upload file
await apiService.upload('/upload', formData);
```

**Features**:
- Metodi HTTP: GET, POST, PUT, PATCH, DELETE, UPLOAD
- Gestione token di autenticazione
- Timeout configurabile
- Error handling tipizzato
- Environment-based base URL

---

## 📋 Riepilogo Componenti

| Categoria | Componenti | Stato |
|-----------|------------|-------|
| Info | 5 | ✅ |
| Layout | 11 | ✅ |
| Navigation | 6 | ✅ |
| Data | 2 | ✅ |
| Feedback | 6 | ✅ |
| Form | 11 | ✅ |
| UI | 7 | ✅ |
| Actions | 4 | ✅ |
| **Totale** | **52** | ✅ |

| Hooks | 4 | ✅ |
| Servizi | 1 | ✅ |

---

**Ultima modifica**: 15 Dicembre 2025  
**Versione catalogo**: 3.0
