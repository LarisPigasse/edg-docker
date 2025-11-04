# EDG Frontend Template

🚀 **Modern React TypeScript frontend template with complete UI component system and theming**

[![React](https://img.shields.io/badge/React-19.1.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.3.5-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1.10-38B2AC.svg)](https://tailwindcss.com/)

> **Un template frontend completo e riutilizzabile per avviare rapidamente lo sviluppo di applicazioni React moderne con un sistema di design robusto e scalabile.**

## ✨ Caratteristiche Principali

### 🎨 **Sistema di Design Completo**
- **50+ componenti UI** pronti all'uso con theming automatico
- **Sistema atomico** con componenti modulari e riutilizzabili
- **Dark/Light mode** automatico con persistenza delle preferenze
- **Design system** bassu su Radix UI primitives per accessibility completa

### 🛠️ **Stack Tecnologico Moderno**
- **React 19** con hooks moderni e TypeScript rigoroso
- **Vite** per build ultrarapidi e hot-reload istantaneo
- **Tailwind CSS 4** con CSS custom properties per theming
- **Redux Toolkit** per state management con persistenza automatica

### 📱 **Layout Responsivo**
- **Mobile-first** design con breakpoints intelligenti
- **Sidebar collassabile** con stati espanso/compresso
- **Header/Footer** condizionali e configurabili
- **Navigation system** context-aware con routing tipizzato

### 🔧 **Developer Experience**
- **TypeScript** rigoroso senza compromessi (zero `any`)
- **ESLint + Prettier** con regole ottimizzate
- **Barrel exports** per import puliti e organizzati
- **Hot-reload** con aggiornamenti instantanei

## 🏗️ Componenti Implementati

### **Componenti Form (8)**
| Componente | Descrizione | Features |
|------------|-------------|----------|
| `Input` | Campo input con floating label | Validation, required indicator, auto-fill override |
| `TextArea` | Area di testo con auto-resize | Character counter, min/max rows |
| `Select` | Dropdown con Radix UI | Keyboard navigation, opzioni disabilitabili |
| `Checkbox` | Checkbox con stati avanzati | Indeterminate, disabled, error handling |
| `Switch` | Toggle iOS-style | Smooth animations, touch-friendly |
| `RadioGroup` | Gruppo radio con orientazioni | Vertical/horizontal, descriptions |
| `FormField` | Wrapper universale | Consistent layout, error hierarchy |
| `Label` | Label standalone | Semantic variants, required indicators |

### **Componenti UI Base (15+)**
| Componente | Descrizione | Varianti |
|------------|-------------|----------|
| `Button` | Bottone con stati | primary, secondary, danger, loading |
| `Card` | Container con bordi | default, elevated, bordered |
| `Modal` | Modale con backdrop | size variants, confirmation |
| `Table` | Tabella responsiva | striped, hover, compact |
| `Badge` | Etichetta colorata | success, warning, error, info |
| `Alert` | Notifica dismissibile | variants, icons, actions |
| `Avatar` | Avatar con fallback | size variants, status indicators |
| `Accordion` | Contenuto espandibile | single/multiple mode |
| `Tabs` | Navigazione a schede | default, pills, underline |
| `Toast` | Sistema notifiche | auto-dismiss, queue management |

### **Componenti Layout (8)**
| Componente | Descrizione | Purpose |
|------------|-------------|---------|
| `MainLayout` | Layout principale | Grid structure, responsive |
| `Header` | Intestazione app | Logo, navigation, user controls |
| `Sidebar` | Barra laterale | Collapsible, icon/text states |
| `Footer` | Piè di pagina | Version info, links |
| `CenteredPage` | Pagina centrata | Error pages, login |
| `HeaderGroup` | Title + subtitle | Optimized spacing |
| `TitledSurface` | Surface con titolo | Fieldset-style border |

### **Componenti Atomici (5)**
| Componente | Descrizione | Uso |
|------------|-------------|-----|
| `ThemedSurface` | Superfici tematiche | Backgrounds, containers |
| `ThemedText` | Testo semantico | Typography variants |
| `ThemedImage` | Immagini responsive | Auto theme switching |
| `ThemedBorder` | Bordi tematici | Wrapper utility |
| `ThemedShadow` | Ombre responsive | Elevation system |

## 🚀 Quick Start

### Prerequisiti
- **Node.js** 18+ 
- **npm** o **yarn**
- **Git**

### Installazione

```bash
# Clona il repository
git clone https://github.com/LarisPigasse/edg-frontend-template.git
cd edg-frontend-template

# Installa le dipendenze
npm install

# Avvia il server di sviluppo
npm run dev
```

### Script Disponibili

```bash
# Sviluppo con hot-reload
npm run dev

# Build per produzione
npm run build

# Anteprima build
npm run preview

# Linting del codice
npm run lint
```

## 📁 Struttura del Progetto

```
edg-frontend-template/
├── src/
│   ├── app/                    # Store Redux e configurazione
│   │   ├── middleware/         # Persistence middleware
│   │   ├── slices/            # Redux slices (UI state)
│   │   └── store.ts           # Store configuration
│   ├── core/                   # Componenti core riutilizzabili
│   │   ├── components/
│   │   │   ├── atomic/        # Componenti atomici (ThemedSurface, ThemedText)
│   │   │   ├── ui/            # Componenti UI base (Button, Input, Modal)
│   │   │   ├── layout/        # Componenti layout (Header, Sidebar, Footer)
│   │   │   └── navigation/    # Componenti navigazione (Menu, UserMenu)
│   │   ├── hooks/             # Custom hooks
│   │   ├── services/          # API services
│   │   └── utils/             # Utilities condivise
│   ├── pages/                  # Pagine applicazione
│   │   ├── components/        # Showcase components
│   │   ├── Dashboard.tsx      # Homepage
│   │   ├── Showcase.tsx       # Demo componenti
│   │   └── ComponentExplorer.tsx # Documentazione interattiva
│   ├── config/                # Configurazioni (routes, navigation)
│   ├── data/                  # Dati statici e esempi
│   └── styles/                # Stili globali e temi
├── config/                    # Configurazioni build (Vite, TypeScript, ESLint)
├── public/                    # Assets statici
└── docs/                      # Documentazione estesa
```

## 🎨 Sistema di Theming

### **CSS Custom Properties**
Il template utilizza un sistema di variabili CSS semantiche per garantire consistenza e facilità di manutenzione:

```css
/* Light Mode */
:root {
  --surface-base: #f9fafb;
  --surface-primary: #ffffff;
  --content-primary: #111827;
  --content-secondary: #6b7280;
  /* ... altre variabili */
}

/* Dark Mode */
.dark {
  --surface-base: #111827;
  --surface-primary: #1f2937;
  --content-primary: #f9fafb;
  --content-secondary: #d1d5db;
  /* ... altre variabili */
}
```

### **Toggle Automatico**
- **Persistenza** delle preferenze utente in localStorage
- **System preference** detection come fallback
- **DOM synchronization** automatica con classe `.dark`
- **Redux integration** per state management centralizzato

### **Componenti Themed**
Tutti i componenti utilizzano il sistema di theming senza logica condizionale nel JSX:

```tsx
// ❌ Evitare logica condizionale
<div className={darkMode ? "bg-gray-800 text-white" : "bg-white text-black"}>

// ✅ Usare componenti tematici
<ThemedSurface variant="primary">
  <ThemedText variant="primary">Content</ThemedText>
</ThemedSurface>
```

## 🔧 State Management

### **Redux Toolkit Setup**
```typescript
// Configurazione store
export const store = configureStore({
  reducer: {
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(persistenceMiddleware),
});

// Hook tipizzati
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

### **UI State Management**
Lo slice UI gestisce tutte le preferenze dell'interfaccia con persistenza automatica:

```typescript
interface UIState {
  darkMode: boolean;           // Tema dark/light
  sidebarVisible: boolean;     // Visibilità sidebar
  sidebarExpanded: boolean;    // Sidebar espansa/compressa
  footerVisible: boolean;      // Visibilità footer
  userMenuOpen: boolean;       // Stato menu utente
}
```

### **Custom Hooks**
```typescript
// Hook principale per UI settings
const {
  darkMode,
  sidebarVisible,
  toggleDarkMode,
  toggleSidebar,
  resetUISettings
} = useUISettings();
```

## 📚 Documentazione Completa

| Documento | Descrizione |
|-----------|-------------|
| **[DOCUMENTATION.md](./DOCUMENTATION.md)** | Architettura completa e implementazioni dettagliate |
| **[COMPONENTS.md](./COMPONENTS.md)** | Guida completa ai componenti con esempi |
| **[CHANGELOG.md](./CHANGELOG.md)** | Cronologia completa delle modifiche |

## 🌟 Features Avanzate

### **Performance Optimizations**
- **useMemo** per calcoli costosi
- **Selective re-renders** con selectors Redux specifici
- **Asset optimization** per immagini tematiche
- **Bundle splitting** ready per code splitting

### **Accessibility First**
- **ARIA labels** appropriati su tutti i componenti
- **Keyboard navigation** completa
- **Focus management** corretto
- **Screen reader** compatibility
- **Color contrast** WCAG compliant

### **Developer Tools**
- **Component Explorer** interattivo per documentazione
- **Debug Panel** per visualizzazione stati
- **Showcase Pages** per testing visivo
- **TypeScript** strict mode per type safety

### **Mobile Ready**
- **Responsive breakpoints** intelligenti
- **Touch-friendly** button sizes (48px+)
- **Mobile menu** per navigation
- **Viewport optimization**

## 🤝 Contribuire

Il template è progettato per essere esteso e personalizzato:

1. **Fork** il repository
2. **Crea** un branch per la tua feature
3. **Implementa** seguendo i pattern esistenti
4. **Testa** con i componenti showcase
5. **Documenta** le modifiche nel CHANGELOG
6. **Apri** una Pull Request

### **Pattern di Sviluppo**
- **Un componente alla volta** - Sviluppo incrementale
- **TypeScript first** - Tipizzazione rigorosa
- **Accessibility** - WCAG 2.1 compliant
- **Performance** - React best practices
- **Documentation** - Showcase per ogni componente

## 📈 Roadmap Future

### **Componenti Pianificati**
- **FileUpload** con drag & drop
- **DataTable** con sorting e filtering  
- **Calendar** per date selection
- **Charts** per data visualization
- **Wizard** per multi-step forms

### **Features System**
- **Authentication** system completo
- **Permission** management
- **API integration** patterns
- **Testing** suite con Jest + Testing Library
- **Storybook** integration

## 📄 Licenza

Questo progetto è rilasciato sotto licenza **MIT**. Vedi il file [LICENSE](./LICENSE) per dettagli completi.

## 🔗 Links Utili

- **[Repository GitHub](https://github.com/LarisPigasse/edg-frontend-template)**
- **[Demo Live](https://edg-frontend-template.vercel.app)** *(in arrivo)*
- **[Documentazione API](./docs/api.md)** *(in arrivo)*
- **[Guida Contribuzione](./CONTRIBUTING.md)** *(in arrivo)*

---

**Creato con ❤️ da EDG Team**

*Un template frontend moderno per accelerare lo sviluppo di applicazioni React professionali.*
