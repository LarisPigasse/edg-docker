# Architettura EDG Auth Service

Documentazione tecnica completa dell'architettura, pattern e decisioni di design.

---

## 📋 Indice

1. [Panoramica Sistema](#panoramica-sistema)
2. [Struttura Generale](#struttura-generale)
3. [Servizi Implementati](#servizi-implementati)
4. [Pattern Architetturali](#pattern-architetturali)
5. [Flusso Dati](#flusso-dati)
6. [Database Design](#database-design)
7. [Decisioni Architetturali](#decisioni-architetturali)
8. [Modalità Operative](#modalità-operative)

---

## 🎯 Panoramica Sistema

### Tipo di Sistema
**Microservizio di autenticazione** per ecosistema EDG con supporto dual-mode (standalone/gateway).

### Responsabilità Principale
- Autenticazione utenti (JWT)
- Autorizzazione basata su RBAC (permessi composti)
- Gestione sessioni multiple
- Reset password
- Multi-account type (operatore, partner, cliente, agente)

### Stack Tecnologico
```
Runtime:     Node.js 18+
Language:    TypeScript 5.8+
Framework:   Express.js 5.x
Database:    MySQL 8.x + Sequelize ORM
Auth:        JWT (jsonwebtoken)
Security:    BCrypt, Helmet, CORS, Rate Limiting
Container:   Docker (production)
```

---

## 🏗️ Struttura Generale

### Directory Layout

```
auth-service/
│
├── src/
│   │
│   ├── core/                           # Framework riutilizzabile
│   │   ├── config/
│   │   │   ├── environment.ts          # Gestione ENV vars
│   │   │   └── database.ts             # DatabaseManager (Sequelize)
│   │   └── server.ts                   # EDGServer (Express modulare)
│   │
│   ├── modules/                        # Moduli business
│   │   └── auth/                       # Modulo autenticazione
│   │       ├── models/                 # Database models (Sequelize)
│   │       │   ├── Account.ts
│   │       │   ├── Role.ts
│   │       │   ├── RolePermission.ts
│   │       │   ├── Session.ts
│   │       │   ├── ResetToken.ts
│   │       │   ├── associations.ts
│   │       │   └── index.ts
│   │       │
│   │       ├── services/               # Business logic
│   │       │   ├── AuthService.ts
│   │       │   └── TokenService.ts
│   │       │
│   │       ├── controllers/            # HTTP handlers
│   │       │   └── AuthController.ts
│   │       │
│   │       ├── middleware/             # Express middleware
│   │       │   ├── authMiddleware.ts   # Dual mode auth
│   │       │   └── verifyGateway.ts    # Gateway security
│   │       │
│   │       ├── routes/                 # Route definitions
│   │       │   └── auth.routes.ts
│   │       │
│   │       ├── types/                  # TypeScript types
│   │       │   └── auth.types.ts
│   │       │
│   │       ├── utils/                  # Utilities
│   │       │   ├── password.ts
│   │       │   ├── token.ts
│   │       │   └── validation.ts
│   │       │
│   │       └── seed/                   # Database seeders
│   │           └── roles.seed.ts
│   │
│   └── app.ts                          # Entry point
│
├── docs/                               # Documentazione
├── tests/                              # Test suite (futuro)
├── .env                                # Environment (development)
├── package.json
├── tsconfig.json
├── Dockerfile
└── README.md
```

---

## 🔧 Servizi Implementati

### Core Services

#### 1. EDGServer (Core Framework)
**File:** `src/core/server.ts`

**Responsabilità:**
- Setup Express application
- Middleware configuration (security, CORS, rate limiting)
- Moduli registration (dynamic)
- Error handling
- Health checks

**Features:**
- ✅ Dual mode support (standalone/gateway)
- ✅ CORS condizionale
- ✅ Rate limiting condizionale
- ✅ Registrazione moduli dinamica
- ✅ Error handlers ordinati correttamente

**Pattern:**
```typescript
const server = createServer({
  config: serviceConfig,
  modules: [AuthModule],
});

await server.initializeDatabase();
server.registerModuleRoutes();
server.setupErrorHandlers();
```

---

#### 2. DatabaseManager
**File:** `src/core/config/database.ts`

**Responsabilità:**
- Gestione connessione Sequelize
- Registrazione modelli
- Associazioni tra modelli
- Sync database
- Health check

**Features:**
- ✅ Connection pooling
- ✅ Retry logic
- ✅ Model registration dinamica
- ✅ Association setup
- ✅ Health monitoring

---

#### 3. AuthService
**File:** `src/modules/auth/services/AuthService.ts`

**Responsabilità:**
- Registrazione account
- Login / Logout
- Cambio password
- Reset password
- Gestione sessioni

**Business Rules:**
- Password policy (min 8 char, 1 maiuscola, 1 numero, 1 speciale)
- Email univoca per account type
- Validazione roleId esistente
- Revoca sessioni su cambio password

**Dependencies:**
- Models: Account, Session, ResetToken, Role
- TokenService per JWT
- PasswordUtils per hashing

---

#### 4. TokenService
**File:** `src/modules/auth/services/TokenService.ts`

**Responsabilità:**
- Generazione JWT access token
- Generazione refresh token
- Validazione JWT
- Estrazione token da header

**Token Strategy:**
- Access token: JWT (15 min)
- Refresh token: Random string (7 giorni)
- Issuer: 'edg-auth-service'

**Metodi:**
```typescript
generateAccessToken(payload)    // JWT con permissions
generateRefreshToken()          // Random token
verifyAccessToken(token)        // Validate & decode JWT
extractTokenFromHeader(header)  // Extract from "Bearer XXX"
```

---

### Middleware

#### 1. authMiddleware (Dual Mode)
**File:** `src/modules/auth/middleware/authMiddleware.ts`

**Modalità:**

**Standalone Mode (GATEWAY_MODE=false):**
```
Request → authenticate() → Valida JWT → Estrai payload → req.account
```

**Gateway Mode (GATEWAY_MODE=true):**
```
Request → authenticate() → Verifica X-Gateway-Secret → Trust X-User-Data → req.account
```

**Exports:**
- `authenticate` - Main auth middleware (dual mode)
- `requireAccountType` - Filter by account type
- `optionalAuth` - Optional authentication
- `requirePermission` - Check specific permission (futuro)

---

#### 2. verifyGateway
**File:** `src/modules/auth/middleware/verifyGateway.ts`

**Responsabilità:**
- Verifica header `X-Gateway-Secret`
- Estrae dati da header `X-User-Data`
- Previene bypass del gateway

**Security:**
```typescript
if (X-Gateway-Secret !== GATEWAY_SECRET) {
  return 403 "Accesso diretto non consentito"
}
```

---

### Controllers

#### AuthController
**File:** `src/modules/auth/controllers/AuthController.ts`

**Endpoints:**
- `POST /auth/register` - Registrazione
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout
- `POST /auth/logout-all` - Logout da tutti i dispositivi
- `POST /auth/refresh` - Refresh token
- `POST /auth/change-password` - Cambio password
- `POST /auth/request-reset-password` - Richiesta reset
- `POST /auth/reset-password` - Conferma reset
- `GET /auth/me` - Info account corrente

**Response Format:**
```typescript
{
  success: boolean,
  data?: any,
  error?: string,
  message?: string,
  timestamp: string
}
```

---

## 📐 Pattern Architetturali

### 1. Clean Architecture (Layers)

```
┌─────────────────────────────────────────┐
│         PRESENTATION LAYER              │
│    Routes → Controllers                 │
├─────────────────────────────────────────┤
│         BUSINESS LAYER                  │
│           Services                      │
├─────────────────────────────────────────┤
│         DATA LAYER                      │
│      Models (Sequelize)                 │
└─────────────────────────────────────────┘
```

**Separazione responsabilità:**
- Routes: Definizione endpoint e middleware
- Controllers: HTTP request/response handling
- Services: Business logic pura
- Models: Data access e relazioni

---

### 2. Modular Monolith Pattern

**Struttura modulare per facile split futuro:**

```typescript
// Ogni modulo è self-contained
const AuthModule: ServerModule = {
  name: 'auth',
  path: '/auth',
  router: authRouter,
  models: [Account, Role, Session, ...],
  associations: setupAuthAssociations,
};

// Facilmente espandibile
const SalesModule: ServerModule = { ... };
const ReportsModule: ServerModule = { ... };
```

**Vantaggi:**
- ✅ Facile aggiungere moduli
- ✅ Codice isolato
- ✅ Testabile individualmente
- ✅ Può diventare microservizio separato

---

### 3. Dual Key Pattern (Database)

**Ogni tabella ha DUE chiavi:**

```sql
CREATE TABLE accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,  -- Chiave interna (performance)
  uuid CHAR(36) UNIQUE NOT NULL,      -- Chiave pubblica (security)
  ...
);
```

**Regole:**
- `id` INTEGER: PRIMARY KEY, usato per foreign keys (performance)
- `uuid` UUID v4: Identificatore pubblico nelle API (security)
- Foreign keys: SEMPRE INTEGER

**Vantaggi:**
- ⚡ Performance: JOIN su INTEGER velocissimi
- 🔒 Security: UUID non predicibili nelle API
- 📊 Scalabilità: UUID universali per distributed systems

---

### 4. Service Layer Pattern

**Business logic isolata nei services:**

```typescript
// Controller (thin)
async register(req, res) {
  const result = await authService.register(data);
  return res.json(result);
}

// Service (thick - business logic)
async register(data) {
  // 1. Validazione
  // 2. Check duplicati
  // 3. Hash password
  // 4. Verifica role
  // 5. Crea account
  // 6. Genera tokens
}
```

**Vantaggi:**
- ✅ Testabile senza HTTP
- ✅ Riusabile
- ✅ Logica centralizzata

---

### 5. Middleware Chain Pattern

**Pipeline configurabile per ogni route:**

```typescript
router.post(
  '/login',
  loginRateLimiter,        // 1. Rate limiting
  validateLoginInput,      // 2. Validation
  authController.login     // 3. Handler
);

router.get(
  '/me',
  authenticate,            // 1. Auth (dual mode)
  authController.getMe     // 2. Handler
);
```

---

## 🔄 Flusso Dati

### Registration Flow

```
Client
  ↓ POST /auth/register
Controller (validate input)
  ↓
Service
  ↓ 1. Check email exists
  ↓ 2. Validate role
  ↓ 3. Hash password
  ↓ 4. Create account
Database
  ↓ Account created
Service
  ↓ 5. Generate JWT
  ↓ 6. Create session
TokenService
  ↓
Controller
  ↓ Response with tokens
Client
```

---

### Login Flow (Standalone Mode)

```
Client
  ↓ POST /auth/login
  ↓ { email, password, accountType }
Controller
  ↓
Service
  ↓ 1. Find account by email + type
  ↓ 2. Verify password (bcrypt)
  ↓ 3. Load role + permissions
  ↓ 4. Generate JWT (with permissions)
  ↓ 5. Generate refresh token
  ↓ 6. Create session
Database
  ↓
Controller
  ↓ Response
  ↓ { accessToken, refreshToken, account }
Client
```

---

### Protected Endpoint (Standalone Mode)

```
Client
  ↓ GET /auth/me
  ↓ Authorization: Bearer JWT
Middleware: authenticate
  ↓ GATEWAY_MODE=false
  ↓ Extract token from header
TokenService
  ↓ Verify JWT signature
  ↓ Check expiry
  ↓ Extract payload
Middleware
  ↓ req.account = payload
Controller
  ↓ Use req.account
  ↓ Response with account data
Client
```

---

### Protected Endpoint (Gateway Mode)

```
Client
  ↓ GET /auth/me
  ↓ Authorization: Bearer JWT
API Gateway
  ↓ Validate JWT
  ↓ Extract payload
  ↓ Inject X-User-Data: {accountId, permissions, ...}
  ↓ Inject X-Gateway-Secret: secret
Auth Service
  ↓ Middleware: authenticate
  ↓ GATEWAY_MODE=true
Middleware: verifyGateway
  ↓ Verify X-Gateway-Secret
  ↓ Extract X-User-Data
  ↓ req.account = userData
Controller
  ↓ Use req.account
  ↓ Response with account data
Gateway
  ↓
Client
```

---

## 🗄️ Database Design

### Schema Relazionale

```
┌─────────────┐
│    roles    │
│ (id, uuid)  │
└──────┬──────┘
       │ 1
       │
       │ N
┌──────┴──────────────┐
│ role_permissions    │
│ (roleId, permission)│
└─────────────────────┘

┌─────────────┐
│    roles    │
│ (id, uuid)  │
└──────┬──────┘
       │ 1
       │
       │ N
┌──────┴──────────────┐
│    accounts         │
│ (id, uuid, roleId)  │
└──────┬──────────────┘
       │ 1
       │
       ├── N ──┐
       │       │
┌──────┴─────┐ │
│  sessions  │ │
│ (accountId)│ │
└────────────┘ │
               │
       ┌───────┴────────┐
       │ reset_tokens   │
       │  (accountId)   │
       └────────────────┘
```

### Indici Principali

```sql
-- Lookup veloce
accounts:        (email, accountType) UNIQUE
sessions:        (refreshToken) UNIQUE
reset_tokens:    (token) UNIQUE

-- Foreign keys
accounts:        (roleId)
sessions:        (accountId)
reset_tokens:    (accountId)
role_permissions: (roleId)
```

---

## 🎯 Decisioni Architetturali

### 1. Dual Mode (Standalone/Gateway)

**Decisione:** Supportare DUE modalità operative

**Motivazione:**
- Development: Testi direttamente senza gateway (veloce)
- Production: Tutto via gateway (sicuro, scalabile)

**Implementazione:**
- Environment variable: `GATEWAY_MODE=true|false`
- Middleware switch tra validazione JWT diretta o trust header
- CORS/rate limiting condizionali

**Trade-off:**
- ➕ Flessibilità massima
- ➕ Testing semplificato
- ➖ Codice leggermente più complesso

---

### 2. Permessi Composti (RBAC)

**Decisione:** Sistema `modulo.azione` senza gerarchia

**Motivazione:**
- Granularità perfetta
- Nessuna ambiguità
- Facile da capire
- Wildcards per potenza

**Formato:**
```
spedizioni.read
spedizioni.create
gestione.*
*
```

**Trade-off:**
- ➕ Controllo totale
- ➕ Prevedibile
- ➖ Nessun permesso implicito (feature, non bug!)

---

### 3. Rate Limiting Ibrido

**Decisione:** DUE livelli di rate limiting

**Gateway (generale):**
- 100 req/min per IP
- Protezione DDoS

**Microservizio (specifico):**
- 5 login/15min per EMAIL
- 3 reset password/ora per EMAIL
- 10 registrazioni/ora per IP

**Motivazione:**
- Gateway non conosce business logic
- Microservizio protegge casi specifici

**Trade-off:**
- ➕ Protezione migliore
- ➕ Separazione responsabilità
- ➖ Configurazione in 2 posti

---

### 4. JWT con Permissions nel Payload

**Decisione:** Permissions array dentro JWT

**Payload:**
```json
{
  "accountId": 1,
  "uuid": "...",
  "email": "user@example.com",
  "roleId": 2,
  "permissions": ["spedizioni.*", "report.read"]
}
```

**Motivazione:**
- Nessuna query DB per verificare permessi
- Performance eccellente
- Stateless

**Trade-off:**
- ➕ Velocissimo
- ➕ Scalabile
- ➖ Cambio permessi richiede nuovo login (accettabile, 15min expiry)

---

### 5. Sessioni con Refresh Token

**Decisione:** Refresh token random (non JWT)

**Motivazione:**
- Revocabili individualmente
- Trackabili in DB
- Device/IP specifici

**Strategy:**
- Access token: JWT 15min (stateless)
- Refresh token: Random 7gg (stateful)

**Trade-off:**
- ➕ Sicurezza migliore
- ➕ Gestione sessioni
- ➖ Query DB per refresh

---

## 🔄 Modalità Operative

### Standalone Mode (Development)

**Quando:**
- Development locale
- Testing
- Debug

**Setup:**
```env
GATEWAY_MODE=false
DB_HOST=localhost
CORS_ORIGINS=http://localhost:5173
```

**Comportamento:**
- ✅ Valida JWT direttamente
- ✅ CORS attivo
- ✅ Rate limiting generale attivo
- ✅ Porta 3001 esposta

---

### Gateway Mode (Production)

**Quando:**
- Production con Docker
- Architettura microservizi

**Setup:**
```env
GATEWAY_MODE=true
GATEWAY_SECRET=...
DB_HOST=mysql
```

**Comportamento:**
- ✅ Trust header X-User-Data dal gateway
- ✅ Verifica X-Gateway-Secret
- ❌ NO CORS (gestito dal gateway)
- ❌ NO rate limiting generale (gestito dal gateway)
- ✅ Rate limiting specifico sempre attivo
- ✅ Rete interna Docker (no accesso esterno)

---

## 📊 Metriche e Performance

### Target Performance
- Server startup: < 2 sec
- Auth request: < 50ms
- DB query: < 10ms
- JWT generation: < 5ms

### Security Metrics
- BCrypt rounds: 12
- JWT expiry: 15 min (access), 7 days (refresh)
- Password min length: 8 characters
- Rate limit: 100 req/15min (general), 5/15min (login)

---

## 🚀 Scalabilità

### Horizontal Scaling
- ✅ Stateless (JWT)
- ✅ Database connection pooling
- ✅ Load balancer ready
- ⚠️ Session storage in DB (OK fino a ~100K users)

### Future Optimizations
- Redis cache per permissions (quando serve)
- Read replicas per query pesanti
- CDN per static assets
- Message queue per operazioni async

---

## 📚 Riferimenti

### Documentazione Correlata
- [PROJECT-STATUS.md](PROJECT-STATUS.md) - Stato implementazione
- [GATEWAY-MODE.md](GATEWAY-MODE.md) - Dual mode dettagliato
- [RBAC-SYSTEM.md](RBAC-SYSTEM.md) - Sistema autorizzazione
- [QUICK-START.md](QUICK-START.md) - Setup rapido

### Standard e Convenzioni
- REST API: JSON, HTTP status codes standard
- Naming: camelCase (code), snake_case (DB)
- Error handling: Consistent error format
- TypeScript: Strict mode enabled

---

**Documento aggiornato:** 13 Ottobre 2025  
**Versione:** 1.0  
**Status:** Production Architecture
