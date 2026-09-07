# Auth Module

## 📋 Overview

Il modulo **Auth** gestisce l'intero ciclo di vita dell'autenticazione utente nella piattaforma EDG Pro Frontend. Fornisce funzionalità complete per login, logout, recupero password, cambio password e gestione dello stato di autenticazione globale tramite Redux.

**Responsabilità principali:**
- Gestione sessione utente con JWT (access + refresh token)
- Login/Logout con validazione credenziali
- Recupero password via email con token temporaneo
- Reset password con conferma via link sicuro
- Cambio password per utenti autenticati
- Protezione route tramite componente `PrivateRoute`
- Refresh token automatico alla scadenza
- Persistenza stato auth in localStorage

---

## 🏗 Architettura

**Pattern:** Type-First + Redux Toolkit
```
types → api → store (Redux slice) → hooks → components → pages
```

**Stato globale:**
- **Redux store** per lo stato di autenticazione (user, token, isAuthenticated)
- Persistenza automatica in `localStorage` via middleware Redux
- Auto-refresh token ogni 14 minuti (1 minuto prima della scadenza)

**Dipendenze esterne:**
- Backend: `auth-service` via API Gateway (porta 8080)
- Email: `email-service` per invio email reset password

---

## 📂 Struttura File

```
features/auth/
├── types/
│   └── index.ts                    # User, LoginCredentials, AuthResponse, ecc.
├── api/
│   └── authApi.ts                  # Chiamate API auth-service
├── store/
│   └── authSlice.ts                # Redux slice con actions/reducers
├── hooks/
│   └── useAuth.ts                  # Hook per accedere allo stato Redux
├── components/
│   ├── PrivateRoute.tsx            # HOC protezione route
│   └── index.ts
├── pages/
│   ├── LoginPage.tsx               # Pagina login
│   ├── ForgotPasswordPage.tsx      # Richiesta reset password
│   ├── ResetPasswordPage.tsx       # Form reset password con token
│   ├── ChangePasswordPage.tsx      # Cambio password utente loggato
│   └── index.ts
├── utils/
│   └── tokenManager.ts             # Gestione localStorage token
├── index.ts                        # Barrel export pubblico
└── README.md                       # Questo file
```

---

## 🔌 API Integration

**Base URL:** `http://localhost:8080` (API Gateway)

### Endpoint utilizzati

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| `POST` | `/auth/login` | Login utente |
| `POST` | `/auth/logout` | Logout utente |
| `POST` | `/auth/refresh-token` | Rinnova access token |
| `POST` | `/auth/forgot-password` | Richiede reset password via email |
| `POST` | `/auth/reset-password` | Reset password con token |
| `POST` | `/auth/change-password` | Cambio password (autenticato) |
| `GET`  | `/auth/me` | Recupera dati utente corrente |

### Esempio Request/Response

**Login:**
```typescript
// Request
POST /auth/login
{
  "email": "admin@edg.local",
  "password": "password123"
}

// Response 200
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "admin@edg.local",
      "nome": "Admin",
      "cognome": "Root",
      "ruolo": "root",
      "permessi": ["*"]
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

**Refresh Token:**
```typescript
// Request
POST /auth/refresh-token
{
  "refreshToken": "eyJhbGc..."
}

// Response 200
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",    // nuovo token
    "refreshToken": "eyJhbGc..."    // token refresh aggiornato
  }
}
```

---

## 📊 Data Models

```typescript
// User entity
interface User {
  id:        number;
  email:     string;
  nome:      string;
  cognome:   string;
  ruolo:     'root' | 'admin' | 'operatore';
  permessi:  string[];
  createdAt: string;
  updatedAt: string;
}

// Login credentials
interface LoginCredentials {
  email:    string;
  password: string;
}

// Auth response dal backend
interface AuthResponse {
  user:         User;
  accessToken:  string;
  refreshToken: string;
}

// Redux auth state
interface AuthState {
  user:            User | null;
  accessToken:     string | null;
  refreshToken:    string | null;
  isAuthenticated: boolean;
  loading:         boolean;
  error:           string | null;
}
```

---

## 🧩 Componenti

### `PrivateRoute`
Higher-Order Component per proteggere route riservate agli utenti autenticati.

**Props:**
```typescript
interface PrivateRouteProps {
  children:           React.ReactNode;
  requiredPermission?: string;  // es. "sistema.logs" (solo root)
}
```

**Comportamento:**
- Se utente NON autenticato → redirect a `/login`
- Se utente autenticato MA manca permesso → redirect a `/403` o home
- Se utente autenticato CON permesso → renderizza `children`

**Esempio utilizzo:**
```tsx
<Route
  path="/sistema/logs"
  element={
    <PrivateRoute requiredPermission="sistema.logs">
      <LogsPage />
    </PrivateRoute>
  }
/>
```

---

## 🎣 Hooks

### `useAuth()`

Hook principale per interagire con lo stato di autenticazione Redux.

**Ritorna:**
```typescript
{
  user:            User | null;
  isAuthenticated: boolean;
  loading:         boolean;
  error:           string | null;
  login:           (credentials: LoginCredentials) => Promise<void>;
  logout:          () => Promise<void>;
  checkAuth:       () => Promise<void>;  // verifica token valido
}
```

**Esempio utilizzo:**
```tsx
const { user, isAuthenticated, login, logout } = useAuth();

const handleLogin = async () => {
  try {
    await login({ email, password });
    // Redirect automatico dopo login success
  } catch (err) {
    // Gestione errore (es. toast)
  }
};
```

---

## 🗺 Routing & Permessi

**Route pubbliche (no auth):**
- `/login` — LoginPage
- `/forgot-password` — ForgotPasswordPage
- `/reset-password?token=...` — ResetPasswordPage

**Route protette (auth required):**
- `/change-password` — ChangePasswordPage (qualsiasi utente loggato)
- `/sistema/logs` — LogsPage (solo `root` con `sistema.logs`)
- `/sistema/alerts` — AlertsPage (solo `root` con `sistema.alerts`)
- `/sistema/health` — SystemPage (solo `root` con `system.health`)

**Permessi speciali:**
- `"*"` → accesso completo (ruolo `root`)
- Permessi granulari: `"sistema.logs"`, `"anagrafiche.clienti"`, ecc.

---

## 💡 Usage Examples

### Login flow completo

```tsx
// 1. Utente accede a /sistema/logs senza essere autenticato
//    → PrivateRoute intercetta e redirect a /login

// 2. LoginPage: utente inserisce credenziali
const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login({ email, password });
      navigate('/'); // redirect a dashboard
    } catch (err) {
      toast.danger({ title: 'Credenziali non valide' });
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
};

// 3. Redux aggiorna stato globale
//    → accessToken salvato in localStorage
//    → user salvato in Redux store
//    → isAuthenticated = true

// 4. Utente può ora accedere a tutte le route protette
```

### Protezione API con token

```tsx
// authApi.ts intercetta TUTTE le fetch e aggiunge header Authorization
const apiRequest = async (endpoint: string, options: RequestInit) => {
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  // Se 401 → prova refresh token automatico
  if (response.status === 401) {
    const refreshed = await refreshToken();
    if (refreshed) {
      // Riprova chiamata originale
      return apiRequest(endpoint, options);
    }
    // Altrimenti logout forzato
    store.dispatch(logout());
  }

  return response;
};
```

### Cambio password utente loggato

```tsx
// ChangePasswordPage
const ChangePasswordPage = () => {
  const { user } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleSubmit = async () => {
    try {
      await authApi.changePassword({ oldPassword, newPassword });
      toast({ title: 'Password aggiornata con successo' });
    } catch (err) {
      toast.danger({ title: 'Password attuale errata' });
    }
  };

  return <form>...</form>;
};
```

---

## 🧪 Testing Notes

### Scenari di test

**Login:**
- ✅ Credenziali valide → redirect a dashboard
- ❌ Credenziali errate → toast errore
- ❌ Email non verificata → messaggio "Verifica la tua email"
- ✅ Remember me → token persiste dopo chiusura browser

**Logout:**
- ✅ Token rimosso da localStorage
- ✅ Redux state azzerato (user = null)
- ✅ Redirect a `/login`

**Refresh Token:**
- ✅ Token scaduto → auto-refresh trasparente
- ❌ Refresh token scaduto → logout forzato
- ✅ API bloccate finché refresh non completa

**Forgot Password:**
- ✅ Email esistente → invio link reset
- ❌ Email inesistente → nessun errore (sicurezza)
- ✅ Token reset valido 1h

**Reset Password:**
- ✅ Token valido → password aggiornata
- ❌ Token scaduto → errore "Link non valido"
- ❌ Password debole → validazione frontend + backend

**PrivateRoute:**
- ✅ Non autenticato → redirect `/login`
- ✅ Autenticato senza permesso → redirect `/`
- ✅ Autenticato con permesso → render componente

---

## 🔮 Future Improvements

### Sicurezza
- [ ] Implementare **2FA** (two-factor authentication) con TOTP
- [ ] Limitare tentativi login (rate limiting frontend)
- [ ] Session timeout configurabile per inattività
- [ ] Fingerprinting dispositivo per rilevare accessi sospetti

### UX
- [ ] "Ricordami" persistente oltre i 7 giorni
- [ ] Login social (Google, Microsoft, ecc.)
- [ ] Notifica email ad ogni login da nuovo dispositivo
- [ ] Dashboard "Sessioni attive" con possibilità di revocare

### DevX
- [ ] Mock server MSW per test E2E senza backend
- [ ] Storybook per componenti auth
- [ ] Unit test con Jest + React Testing Library

### Performance
- [ ] Lazy load pagine auth (già fatto con `React.lazy`)
- [ ] Prefetch user data dopo login success
- [ ] Service Worker per gestione offline graceful

---

## 📝 Notes

- **Token expiry:** Access token dura 15 minuti, refresh token 7 giorni
- **Auto-refresh:** Scatta automaticamente 1 minuto prima della scadenza
- **Persistenza:** `localStorage` per accessToken, refreshToken, user serializzato
- **CORS:** API Gateway gestisce CORS, frontend non richiede configurazione speciale
- **Ruoli:** `root` > `admin` > `operatore` (gerarchia permessi)

---

**Autore:** Mormegil  
**Ultima modifica:** 2026-02-17  
**Versione modulo:** 2.0
