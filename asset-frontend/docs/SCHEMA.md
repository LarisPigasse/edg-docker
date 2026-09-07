# Vigilo — Schema del filesystem

_Cartella e servizio: `asset-frontend`._

**Versione**: 0.1.0
**Ultimo aggiornamento**: 23 Agosto 2026

Mappa generata sull'albero reale del progetto. Esclusi `node_modules/`, `dist/`,
`.git/` e `package-lock.json`.

---

## Legenda

- 🏠 punto d'ingresso dopo il login
- 🟡 area da sviluppare
- 📖 documento di riferimento
- ⚠️ residuo eliminabile
- Le cartelle sono annotate con la loro responsabilità

---

## Principio architetturale

La dipendenza va in una direzione sola:

```
features/* ──► core ──► (React, Radix, Tailwind)
     │
     └──► config   (routes, menu, brand)
```

`core/` non importa mai da `features/`. Se un componente serve a due moduli,
si promuove nel core; se serve a uno solo, resta nel modulo.

---

## Albero

```
asset-frontend/
├── .vscode/
│   └── settings.json
├── config/                                                   # Configurazioni di build fuori dalla root
│   ├── linting/
│   │   ├── .prettierignore
│   │   └── eslint.config.js
│   └── typescript/
│       ├── tsconfig.app.json
│       ├── tsconfig.json
│       └── tsconfig.node.json
├── docker/                                                   # Dockerfile multi-stage + nginx per la SPA
│   ├── Dockerfile
│   └── nginx.conf
├── docs/                                                     # Documentazione di progetto
│   ├── CHANGELOG.md
│   ├── COMPONENTS.md
│   ├── DOCUMENTATION.md
│   └── SCHEMA.md
├── public/                                                   # File serviti così come sono
│   └── favicon.png
├── src/                                                      # Codice applicativo
│   ├── app/                                                  # Redux store, slice UI, middleware
│   │   ├── middleware/
│   │   │   ├── index.ts
│   │   │   └── persistenceMiddleware.ts
│   │   ├── slices/
│   │   │   ├── index.ts
│   │   │   └── uiSlice.ts
│   │   ├── constants.ts
│   │   ├── hooks.ts
│   │   ├── index.ts
│   │   └── store.ts                                          # Configurazione dello store
│   ├── assets/                                               # Immagini e loghi (varianti light/dark)
│   │   ├── background.jpg
│   │   ├── bgbase.jpg
│   │   ├── bgdark.jpg
│   │   ├── edg.png
│   │   ├── edgdark.png
│   │   ├── home.jpg
│   │   ├── icon-reverse.png
│   │   ├── icon.png
│   │   ├── logo-reverse.png
│   │   └── logo.png
│   ├── config/                                               # Pannello di controllo: routes, menu, layout, brand
│   │   ├── index.ts                                          # APP_CONFIG: nome, brand, tema, toast
│   │   ├── layoutConfig.ts                                   # Costanti di layout
│   │   ├── navigation.config.ts                              # Moduli e sottomenu
│   │   └── routes.config.ts                                  # Unica fonte di verità dei path
│   ├── core/                                                 # Design system e servizi condivisi — non dipende dai moduli
│   │   ├── components/                                       # Componenti riusabili, per categoria
│   │   │   ├── actions/                                      # Azioni CRUD e menu contestuali
│   │   │   │   ├── ActionMenu.tsx
│   │   │   │   ├── CreateAction.tsx
│   │   │   │   ├── DeleteAction.tsx
│   │   │   │   ├── EditAction.tsx
│   │   │   │   └── index.ts
│   │   │   ├── data/                                         # Table, TableLink, StatCard
│   │   │   │   ├── stat-card/
│   │   │   │   │   ├── StatCard.data.ts
│   │   │   │   │   └── StatCard.tsx
│   │   │   │   ├── table/
│   │   │   │   │   ├── Table.data.ts
│   │   │   │   │   ├── Table.showcase.tsx
│   │   │   │   │   └── Table.tsx
│   │   │   │   ├── table-link/
│   │   │   │   │   ├── TableLink.data.ts
│   │   │   │   │   ├── TableLink.showcase.tsx
│   │   │   │   │   └── TableLink.tsx
│   │   │   │   └── index.ts
│   │   │   ├── feedback/                                     # Alert, Toast, Spinner, Skeleton, ErrorBoundary
│   │   │   │   ├── alert/
│   │   │   │   │   ├── Alert.data.ts
│   │   │   │   │   ├── Alert.showcase.tsx
│   │   │   │   │   └── Alert.tsx
│   │   │   │   ├── error-boundary/
│   │   │   │   │   ├── ErrorBoundary.tsx
│   │   │   │   │   └── ErrorFallback.tsx
│   │   │   │   ├── progress/
│   │   │   │   │   ├── Progress.data.ts
│   │   │   │   │   ├── Progress.showcase.tsx
│   │   │   │   │   └── Progress.tsx
│   │   │   │   ├── skeleton/
│   │   │   │   │   ├── Skeleton.data.ts
│   │   │   │   │   ├── Skeleton.showcase.tsx
│   │   │   │   │   └── Skeleton.tsx
│   │   │   │   ├── spinner/
│   │   │   │   │   ├── Spinner.data.ts
│   │   │   │   │   ├── Spinner.showcase.tsx
│   │   │   │   │   └── Spinner.tsx
│   │   │   │   ├── toast/
│   │   │   │   │   ├── Toast.context.ts
│   │   │   │   │   ├── Toast.data.ts
│   │   │   │   │   ├── Toast.provider.tsx
│   │   │   │   │   ├── Toast.showcase.tsx
│   │   │   │   │   ├── Toast.tsx
│   │   │   │   │   └── useToast.hook.ts
│   │   │   │   ├── tooltip/
│   │   │   │   │   ├── Tooltip.data.ts
│   │   │   │   │   ├── Tooltip.showcase.tsx
│   │   │   │   │   └── Tooltip.tsx
│   │   │   │   └── index.ts
│   │   │   ├── form/                                         # Campi di input e controlli
│   │   │   │   ├── checkbox/
│   │   │   │   │   ├── Checkbox.data.ts
│   │   │   │   │   ├── Checkbox.showcase.tsx
│   │   │   │   │   └── Checkbox.tsx
│   │   │   │   ├── date-picker/
│   │   │   │   │   ├── DatePicker.data.ts
│   │   │   │   │   ├── DatePicker.showcase.tsx
│   │   │   │   │   └── DatePicker.tsx
│   │   │   │   ├── floating-field-shell/
│   │   │   │   │   └── FloatingFieldShell.tsx
│   │   │   │   ├── form-field/
│   │   │   │   │   ├── FormField.data.ts
│   │   │   │   │   ├── FormField.showcase.tsx
│   │   │   │   │   └── FormField.tsx
│   │   │   │   ├── input/
│   │   │   │   │   ├── Input.data.ts
│   │   │   │   │   ├── Input.showcase.tsx
│   │   │   │   │   ├── Input.tsx
│   │   │   │   │   └── PasswordInput.tsx
│   │   │   │   ├── label/
│   │   │   │   │   ├── Label.data.ts
│   │   │   │   │   ├── Label.showcase.tsx
│   │   │   │   │   └── Label.tsx
│   │   │   │   ├── multi-select/
│   │   │   │   │   ├── MultiSelect.data.ts
│   │   │   │   │   ├── MultiSelect.showcase.tsx
│   │   │   │   │   └── MultiSelect.tsx
│   │   │   │   ├── radio-group/
│   │   │   │   │   ├── RadioGroup.data.ts
│   │   │   │   │   ├── RadioGroup.showcase.tsx
│   │   │   │   │   └── RadioGroup.tsx
│   │   │   │   ├── select/
│   │   │   │   │   ├── Select.data.ts
│   │   │   │   │   ├── Select.showcase.tsx
│   │   │   │   │   └── Select.tsx
│   │   │   │   ├── switch/
│   │   │   │   │   ├── Switch.data.ts
│   │   │   │   │   ├── Switch.showcase.tsx
│   │   │   │   │   └── Switch.tsx
│   │   │   │   ├── textarea/
│   │   │   │   │   ├── TextArea.data.ts
│   │   │   │   │   ├── TextArea.showcase.tsx
│   │   │   │   │   └── TextArea.tsx
│   │   │   │   ├── time-picker/
│   │   │   │   │   ├── TimePicker.data.ts
│   │   │   │   │   ├── TimePicker.showcase.tsx
│   │   │   │   │   └── TimePicker.tsx
│   │   │   │   └── index.ts
│   │   │   ├── info/                                         # Logo, avatar, stato connessione, versione
│   │   │   │   ├── ConnectionStatus.tsx
│   │   │   │   ├── Logo.tsx
│   │   │   │   ├── QuickLink.tsx
│   │   │   │   ├── UserAvatar.tsx
│   │   │   │   ├── VersionInfo.tsx
│   │   │   │   └── index.ts
│   │   │   ├── layout/                                       # Struttura di pagina e contenitori
│   │   │   │   ├── card/
│   │   │   │   │   ├── Card.data.ts
│   │   │   │   │   ├── Card.showcase.tsx
│   │   │   │   │   └── Card.tsx
│   │   │   │   ├── custom/
│   │   │   │   │   ├── CenteredPage.tsx
│   │   │   │   │   ├── CenteredSection.tsx
│   │   │   │   │   ├── Footer.tsx
│   │   │   │   │   ├── Header.tsx
│   │   │   │   │   ├── HeaderGroup.tsx
│   │   │   │   │   ├── MainLayout.tsx
│   │   │   │   │   └── TitledSurface.tsx
│   │   │   │   ├── page-header/
│   │   │   │   │   └── PageHeader.tsx
│   │   │   │   ├── separator/
│   │   │   │   │   ├── Separator.data.ts
│   │   │   │   │   ├── Separator.showcase.tsx
│   │   │   │   │   └── Separator.tsx
│   │   │   │   ├── sheet/
│   │   │   │   │   ├── Sheet.data.ts
│   │   │   │   │   ├── Sheet.showcase.tsx
│   │   │   │   │   └── Sheet.tsx
│   │   │   │   └── index.ts
│   │   │   ├── navigation/                                   # Menu, tab, command palette
│   │   │   │   ├── command/
│   │   │   │   │   ├── Command.data.ts
│   │   │   │   │   ├── Command.showcase.tsx
│   │   │   │   │   └── Command.tsx
│   │   │   │   ├── custom/
│   │   │   │   │   ├── MobileMenu.tsx
│   │   │   │   │   ├── SettingsMenu.tsx
│   │   │   │   │   └── UserMenu.tsx
│   │   │   │   ├── navigation-menu/
│   │   │   │   │   ├── NavigationMenu.data.ts
│   │   │   │   │   ├── NavigationMenu.showcase.tsx
│   │   │   │   │   └── NavigationMenu.tsx
│   │   │   │   ├── tabs/
│   │   │   │   │   ├── Tabs.data.ts
│   │   │   │   │   ├── Tabs.showcase.tsx
│   │   │   │   │   └── Tabs.tsx
│   │   │   │   └── index.ts
│   │   │   └── ui/                                           # Primitive: Button, Badge, Modal, Accordion
│   │   │       ├── accordion/
│   │   │       │   ├── Accordion.data.ts
│   │   │       │   ├── Accordion.showcase.tsx
│   │   │       │   └── Accordion.tsx
│   │   │       ├── avatar/
│   │   │       │   ├── Avatar.data.ts
│   │   │       │   ├── Avatar.showcase.tsx
│   │   │       │   └── Avatar.tsx
│   │   │       ├── badge/
│   │   │       │   ├── Badge.data.ts
│   │   │       │   ├── Badge.showcase.tsx
│   │   │       │   └── Badge.tsx
│   │   │       ├── button/
│   │   │       │   ├── Button.data.ts
│   │   │       │   ├── Button.showcase.tsx
│   │   │       │   └── Button.tsx
│   │   │       ├── confirm-modal/
│   │   │       │   ├── ConfirmModal.data.ts
│   │   │       │   ├── ConfirmModal.showcase.tsx
│   │   │       │   └── ConfirmModal.tsx
│   │   │       ├── info-card/
│   │   │       │   ├── InfoCard.data.ts
│   │   │       │   ├── InfoCard.showcase.tsx
│   │   │       │   └── InfoCard.tsx
│   │   │       ├── modal/
│   │   │       │   ├── Modal.data.ts
│   │   │       │   ├── Modal.showcase.tsx
│   │   │       │   └── Modal.tsx
│   │   │       └── index.ts
│   │   ├── hooks/                                            # Hook trasversali
│   │   │   ├── index.ts
│   │   │   ├── useClickOutside.ts
│   │   │   ├── useMediaQuery.ts
│   │   │   └── useThemedImage.ts
│   │   ├── services/                                         # apiService (classe) e apiFetch (refresh token automatico)
│   │   │   ├── apiFetch.ts
│   │   │   ├── apiService.ts
│   │   │   └── index.ts
│   │   ├── utils/                                            # cn, date, iconMap, getErrorMessage
│   │   │   ├── date.ts
│   │   │   ├── errors.ts                                     # getErrorMessage(): messaggio leggibile da un errore
│   │   │   └── index.ts
│   │   └── types.ts
│   ├── features/                                             # Moduli applicativi — dipendono dal core, mai il contrario
│   │   ├── accounts/                                         # Account e sessioni (auth-service)
│   │   │   ├── api/
│   │   │   │   ├── accountsApi.ts
│   │   │   │   └── sessionsApi.ts
│   │   │   ├── components/
│   │   │   │   ├── AccountFilters.tsx
│   │   │   │   ├── BlockUserModal.tsx
│   │   │   │   ├── BlockedUsersTable.tsx
│   │   │   │   ├── CreateAccountModal.tsx
│   │   │   │   ├── EditAccountModal.tsx
│   │   │   │   ├── SessionsTable.tsx
│   │   │   │   ├── UnblockConfirmModal.tsx
│   │   │   │   ├── ViewAccountModal.tsx
│   │   │   │   └── index.ts
│   │   │   ├── hooks/
│   │   │   │   ├── useAccounts.ts
│   │   │   │   └── useSessions.ts
│   │   │   ├── pages/
│   │   │   │   ├── AccountsPage.tsx
│   │   │   │   ├── SessionsPage.tsx
│   │   │   │   └── index.ts
│   │   │   ├── types/
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── assets/                                           # 🟡 MODULO ASSET — impalcatura, nessun dominio
│   │   │   ├── api/                                          # Client HTTP verso l'API Gateway
│   │   │   │   ├── apiHelpers.ts
│   │   │   │   └── index.ts
│   │   │   ├── components/                                   # Componenti del modulo (ancora vuoto)
│   │   │   │   └── index.ts
│   │   │   ├── hooks/                                        # Stato e orchestrazione
│   │   │   │   ├── index.ts
│   │   │   │   └── useCrudResource.ts
│   │   │   ├── pages/                                        # Pagine montate in App.tsx
│   │   │   │   ├── AssetDashboard.tsx                        # Pagina vuota, solo intestazione
│   │   │   │   └── index.ts
│   │   │   ├── types/                                        # Contratti verso il backend
│   │   │   │   ├── api.types.ts
│   │   │   │   └── index.ts
│   │   │   ├── utils/                                        # Funzioni pure di dominio
│   │   │   │   └── index.ts
│   │   │   ├── README.md                                     # 📖 Convenzioni del modulo
│   │   │   └── index.ts                                      # Barrel: unico punto d'accesso
│   │   ├── auth/                                             # Login, reset password, PrivateRoute (auth-service)
│   │   │   ├── api/
│   │   │   │   ├── authApi.ts
│   │   │   │   └── index.ts
│   │   │   ├── components/
│   │   │   │   ├── ChangePasswordForm.tsx
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── PrivateRoute.tsx
│   │   │   │   └── index.ts
│   │   │   ├── hooks/
│   │   │   │   ├── index.ts
│   │   │   │   └── useAuth.ts
│   │   │   ├── pages/
│   │   │   │   ├── ChangePasswordPage.tsx
│   │   │   │   ├── ForgotPasswordPage.tsx
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   ├── ResetPasswordPage.tsx
│   │   │   │   └── index.ts
│   │   │   ├── store/
│   │   │   │   ├── authSlice.ts
│   │   │   │   └── index.ts
│   │   │   ├── types/
│   │   │   │   ├── auth.types.ts
│   │   │   │   └── index.ts
│   │   │   ├── utils/
│   │   │   │   └── passwordValidation.ts
│   │   │   ├── README.md
│   │   │   └── index.ts
│   │   └── system/                                           # Logs, alert, health dei microservizi (log-service)
│   │       ├── api/
│   │       │   ├── alertsApi.ts
│   │       │   ├── logsApi.ts
│   │       │   └── systemApi.ts
│   │       ├── components/
│   │       │   ├── AlertHistoryTable.tsx
│   │       │   ├── AlertRuleForm.tsx
│   │       │   ├── AlertRulesTable.tsx
│   │       │   ├── AlertStatsCards.tsx
│   │       │   ├── LogDetailModal.tsx
│   │       │   ├── LogFilters.tsx
│   │       │   ├── LogStatsCards.tsx
│   │       │   ├── LogsTable.tsx
│   │       │   ├── ServiceStatusCard.tsx
│   │       │   └── index.ts
│   │       ├── hooks/
│   │       │   ├── index.ts
│   │       │   ├── useAlertHistory.ts
│   │       │   ├── useAlertRules.ts
│   │       │   ├── useLogsList.ts
│   │       │   ├── useLogsStats.ts
│   │       │   └── useSystem.ts
│   │       ├── pages/
│   │       │   ├── InfoPage.tsx
│   │       │   ├── LogsListPage.tsx
│   │       │   └── index.ts
│   │       ├── types/
│   │       │   └── index.ts
│   │       ├── utils/
│   │       │   └── logFormatters.ts
│   │       ├── README.md
│   │       └── index.ts
│   ├── pages/                                                # Pagine non legate a un modulo
│   │   ├── Dashboard.tsx                                     # 🏠 home dopo il login — volutamente vuota
│   │   ├── Explorer.tsx
│   │   ├── ExplorerModal.tsx
│   │   ├── NotFound.tsx
│   │   └── index.ts
│   ├── styles/                                               # Variabili del tema, tipografia, globali
│   │   ├── globals.css
│   │   ├── index.css
│   │   ├── lazy-loading.css
│   │   └── typography.css
│   ├── template/                                             # ⚠️ cartella vuota residua, eliminabile
│   ├── App.tsx                                               # Routing e provider globali
│   ├── main.tsx                                              # Bootstrap React
│   └── vite-env.d.ts                                         # Tipi di Vite
├── .env.development
├── .env.example                                              # Template delle variabili d'ambiente (versionato)
├── .env.production
├── .gitignore
├── LICENSE
├── README.md
├── index.html                                                # Entry point HTML
├── package.json                                              # edg-asset-frontend
├── tsconfig.json                                             # Config TypeScript per l'editor
└── vite.config.ts                                            # Dev server :5176, proxy /auth · /api · /log-api, alias @ → src
```

---

## Dove mettere le cose

| Devi aggiungere… | Va in… |
|------------------|--------|
| Una pagina di un modulo | `src/features/<modulo>/pages/` |
| Una chiamata HTTP | `src/features/<modulo>/api/` |
| Logica di stato riusabile nel modulo | `src/features/<modulo>/hooks/` |
| Un componente usato da due moduli | `src/core/components/<categoria>/` |
| Una route | `src/config/routes.config.ts` + `App.tsx` |
| Una voce di menu | `src/config/navigation.config.ts` |
| Un colore o un valore di brand | `src/config/index.ts` |
| Una variabile del tema | `src/styles/globals.css` + `index.css` |
| Una regola di proxy verso il backend | `vite.config.ts` (dev) · `docker/nginx.conf` (prod) |
