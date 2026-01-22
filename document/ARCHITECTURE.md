# Architettura Sistema - EDG Auth Service

Documentazione completa dell'architettura, design patterns e struttura del sistema.

---

## Indice

1. [Panoramica Architettura](#panoramica-architettura)
2. [Stack Tecnologico](#stack-tecnologico)
3. [Pattern Architetturali](#pattern-architetturali)
4. [Struttura Progetto](#struttura-progetto)
5. [Database Schema](#database-schema)
6. [Modelli e Associazioni](#modelli-e-associazioni)
7. [Flow di Inizializzazione](#flow-di-inizializzazione)
8. [Security Layers](#security-layers)
9. [Convenzioni Codice](#convenzioni-codice)

---

## Panoramica Architettura

### Principi di Design

Il sistema EDG Auth Service è progettato seguendo questi principi:

- **Modularità** - Core framework riutilizzabile per altri microservizi
- **Separation of Concerns** - Layers ben separati (routes → controllers → services → models)
- **Type Safety** - TypeScript strict mode per massima sicurezza
- **Security First** - Security by design, non afterthought
- **Scalabilità** - Progettato per crescere con l'ecosistema EDG

### Architettura a Layers

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                         │
│              (React, Vue, Mobile Apps)                  │
└─────────────────────────────────────────────────────────┘
                          ↓ HTTP/HTTPS
┌─────────────────────────────────────────────────────────┐
│                 SECURITY MIDDLEWARE                     │
│  Helmet │ CORS │ Rate Limiting │ Body Parser            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   ROUTES LAYER                          │
│       Define endpoints and map to controllers          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                CONTROLLERS LAYER                        │
│    Handle HTTP request/response, validate input        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                 SERVICES LAYER                          │
│           Business logic and orchestration             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  MODELS LAYER                           │
│         Sequelize ORM - Data access logic              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                 DATABASE LAYER                          │
│                   MySQL 8+                              │
└─────────────────────────────────────────────────────────┘
```

---

## Stack Tecnologico

### Core Technologies

| Componente | Tecnologia | Versione | Ruolo |
|------------|-----------|----------|-------|
| **Runtime** | Node.js | 18+ | Ambiente di esecuzione |
| **Linguaggio** | TypeScript | 5.8+ | Type-safe JavaScript |
| **Framework** | Express.js | 5.x | Web server framework |
| **ORM** | Sequelize | 6.x | Database abstraction |
| **Database** | MySQL | 8.0+ | Database relazionale |

### Security Stack

| Componente | Tecnologia | Versione | Ruolo |
|------------|-----------|----------|-------|
| **Authentication** | JWT | jsonwebtoken 9.x | Token-based auth |
| **Password Hashing** | BCrypt | bcrypt 5.x | Password encryption (12 rounds) |
| **HTTP Security** | Helmet | helmet 7.x | Security headers |
| **CORS** | cors | cors 2.x | Cross-origin control |
| **Rate Limiting** | express-rate-limit | 7.x | Brute force protection |

### Development Tools

- **Hot Reload:** nodemon
- **Build:** tsc (TypeScript compiler)
- **Testing:** Jest (quando implementato)
- **Linting:** ESLint + Prettier
- **Git Hooks:** Husky (opzionale)

---

## Pattern Architetturali

### 1. Modular Server Pattern

**Problema:** Server monolitici difficili da estendere e testare.

**Soluzione:** EDGServer come core riutilizzabile.

```typescript
// Core server configurabile
class EDGServer {
  private app: Express;
  private db: DatabaseManager;

  constructor(options: ServerOptions) {
    this.setupMiddleware();
    this.setupHealthAndRoot();
  }

  registerModuleRoutes(): void {
    // Registrazione dinamica moduli
  }

  setupErrorHandlers(): void {
    // SEMPRE chiamato DOPO le route
  }
}
```

**Vantaggi:**
- Core riutilizzabile per altri microservizi EDG
- Testing isolato dei componenti
- Configurazione centralizzata

### 2. Dual Key Pattern (ID Strategy)

**Problema:** Esporre ID auto-increment è un rischio security (enumerazione, information disclosure).

**Soluzione:** Due chiavi per ogni entità.

```typescript
// Esempio: Account model
{
  id: 1,                    // INTEGER - chiave primaria interna
  uuid: "550e8400-e29b-...", // UUID v4 - chiave pubblica
  email: "user@example.com",
  roleId: 3                  // FK usa INTEGER (performance)
}
```

**Regole:**
- `id` INTEGER AUTO_INCREMENT: PRIMARY KEY, performance, foreign keys
- `uuid` UUID v4: pubblico nelle API, sicurezza, non enumerabile
- Foreign keys usano sempre `id` INTEGER (performance)

**Vantaggi:**
- Performance: JOIN su INTEGER molto più veloci
- Security: Impossibile enumerare entità via API
- Flessibilità: Migrazione dati semplificata

### 3. Repository Pattern (via Sequelize)

**Problema:** Business logic mescolata con query database.

**Soluzione:** Models Sequelize come repository.

```typescript
// Model definisce struttura e query base
class Account extends Model {
  // Attributi
  id!: number;
  uuid!: string;
  email!: string;

  // Metodi helper
  static async findByEmail(email: string) {
    return this.findOne({ where: { email } });
  }
}

// Service usa model per business logic
class AuthService {
  async login(email: string, password: string) {
    const account = await Account.findByEmail(email);
    // Business logic...
  }
}
```

### 4. Dependency Injection (Manual)

```typescript
// Dependencies iniettate via constructor
class AuthController {
  constructor(
    private authService: AuthService,
    private tokenService: TokenService
  ) {}

  async login(req: Request, res: Response) {
    const result = await this.authService.login(...);
    const token = this.tokenService.generateToken(...);
  }
}
```

**Vantaggi:**
- Testabilità: mock facile dei servizi
- Loose coupling
- Dependency chiare e esplicite

---

## Struttura Progetto

### Directory Tree Completo

```
auth-service/
├── src/
│   ├── core/                           # Framework riutilizzabile
│   │   ├── config/
│   │   │   ├── database.ts             # DatabaseManager (Sequelize)
│   │   │   └── environment.ts          # Config da ENV vars
│   │   └── server.ts                   # EDGServer class
│   │
│   ├── modules/
│   │   └── auth/                       # Modulo autenticazione
│   │       ├── models/                 # Database models
│   │       │   ├── Account.ts          # Model account
│   │       │   ├── Role.ts             # Model ruolo
│   │       │   ├── RolePermission.ts   # Model permessi
│   │       │   ├── Session.ts          # Model sessioni
│   │       │   ├── ResetToken.ts       # Model reset token
│   │       │   ├── associations.ts     # Relazioni tra models
│   │       │   └── index.ts            # Export centralizzato
│   │       │
│   │       ├── services/               # Business logic
│   │       │   ├── AuthService.ts      # Login, register, reset
│   │       │   └── TokenService.ts     # JWT generation/validation
│   │       │
│   │       ├── controllers/
│   │       │   └── AuthController.ts   # HTTP request handlers
│   │       │
│   │       ├── middleware/
│   │       │   └── authMiddleware.ts   # authenticate, requirePermission
│   │       │
│   │       ├── routes/
│   │       │   └── auth.routes.ts      # Route definitions
│   │       │
│   │       ├── types/
│   │       │   └── auth.types.ts       # TypeScript types/interfaces
│   │       │
│   │       ├── utils/
│   │       │   ├── password.ts         # BCrypt helpers
│   │       │   ├── token.ts            # JWT helpers
│   │       │   └── validation.ts       # Input validators
│   │       │
│   │       └── seed/
│   │           └── roles.seed.ts       # Script seed ruoli
│   │
│   └── app.ts                          # Entry point
│
├── docs/                               # Documentazione
│   ├── README.md
│   ├── SETUP.md
│   ├── ARCHITECTURE.md                 # Questo file
│   ├── RBAC.md
│   ├── OPERATIONS.md
│   └── CHANGELOG.md
│
├── dist/                               # Build output (gitignored)
├── node_modules/                       # Dependencies (gitignored)
│
├── .env                                # Environment vars (gitignored)
├── .env.example                        # Template env vars
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md                           # Main README
```

### Responsabilità dei Layer

**Core (`src/core/`)**
- Framework riutilizzabile per tutti i microservizi EDG
- Database manager
- Server base con middleware security
- NO business logic specifica

**Modules (`src/modules/`)**
- Ogni modulo è auto-contenuto
- Può essere estratto come microservizio separato
- Ha la propria struttura completa (models, services, controllers, routes)

**Models**
- Definizione schema database (Sequelize)
- Query base e helpers
- Validazioni a livello DB

**Services**
- Business logic
- Orchestrazione tra models
- Transazioni complesse

**Controllers**
- HTTP request/response handling
- Input validation
- Chiamate ai services

**Middleware**
- Autenticazione (JWT validation)
- Autorizzazione (permission check)
- Error handling

**Routes**
- Definizione endpoints
- Mapping a controllers
- Applicazione middleware

---

## Database Schema

### Schema Completo

```sql
-- ROLES: Ruoli del sistema
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  isSystem BOOLEAN NOT NULL DEFAULT false,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,

  INDEX idx_name (name),
  INDEX idx_uuid (uuid)
);

-- ROLE_PERMISSIONS: Permessi per ruolo
CREATE TABLE role_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  roleId INT NOT NULL,
  permission VARCHAR(50) NOT NULL,
  createdAt DATETIME NOT NULL,

  FOREIGN KEY (roleId) REFERENCES roles(id) ON DELETE CASCADE,
  UNIQUE INDEX idx_role_permission (roleId, permission),
  INDEX idx_permission (permission)
);

-- ACCOUNTS: Account utenti
CREATE TABLE accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255),
  accountType ENUM('operatore', 'partner', 'cliente', 'agente') NOT NULL,
  entityId CHAR(36) NOT NULL,
  roleId INT NOT NULL,
  isActive BOOLEAN NOT NULL DEFAULT true,
  isVerified BOOLEAN NOT NULL DEFAULT false,
  lastLogin DATETIME,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,

  FOREIGN KEY (roleId) REFERENCES roles(id) ON DELETE RESTRICT,
  UNIQUE INDEX idx_email_type (email, accountType),
  INDEX idx_uuid (uuid),
  INDEX idx_entity (entityId),
  INDEX idx_role (roleId)
);

-- SESSIONS: Sessioni attive
CREATE TABLE sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  accountId INT NOT NULL,
  refreshToken VARCHAR(255) NOT NULL UNIQUE,
  expiresAt DATETIME NOT NULL,
  ipAddress VARCHAR(45),
  userAgent TEXT,
  isRevoked BOOLEAN NOT NULL DEFAULT false,
  createdAt DATETIME NOT NULL,

  FOREIGN KEY (accountId) REFERENCES accounts(id) ON DELETE CASCADE,
  INDEX idx_account (accountId),
  INDEX idx_token (refreshToken),
  INDEX idx_expires (expiresAt),
  INDEX idx_revoked (isRevoked)
);

-- RESET_TOKENS: Token reset password
CREATE TABLE reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  accountId INT NOT NULL,
  token VARCHAR(100) NOT NULL UNIQUE,
  expiresAt DATETIME NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  ipAddress VARCHAR(45),
  userAgent TEXT,
  createdAt DATETIME NOT NULL,

  FOREIGN KEY (accountId) REFERENCES accounts(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_expires (expiresAt),
  INDEX idx_used (used)
);
```

### Relazioni

```
roles (1) ──────< (N) role_permissions
  │
  │
  └────< (N) accounts (1) ──────< (N) sessions
                    │
                    └───────< (N) reset_tokens
```

---

## Modelli e Associazioni

### Associazioni Sequelize

```typescript
// associations.ts

// Role ─< RolePermission
Role.hasMany(RolePermission, {
  foreignKey: 'roleId',
  as: 'permissions'
});
RolePermission.belongsTo(Role, {
  foreignKey: 'roleId',
  as: 'role'
});

// Role ─< Account
Role.hasMany(Account, {
  foreignKey: 'roleId',
  as: 'accounts'
});
Account.belongsTo(Role, {
  foreignKey: 'roleId',
  as: 'role'
});

// Account ─< Session
Account.hasMany(Session, {
  foreignKey: 'accountId',
  as: 'sessions'
});
Session.belongsTo(Account, {
  foreignKey: 'accountId',
  as: 'account'
});

// Account ─< ResetToken
Account.hasMany(ResetToken, {
  foreignKey: 'accountId',
  as: 'resetTokens'
});
ResetToken.belongsTo(Account, {
  foreignKey: 'accountId',
  as: 'account'
});
```

---

## Flow di Inizializzazione

### Sequenza Startup

```
1. Load Environment Variables (.env)
   ↓
2. Initialize DatabaseManager
   ├─ Connect to MySQL
   ├─ Register Models (Role, RolePermission, Account, Session, ResetToken)
   └─ Setup Associations
   ↓
3. Sync Database (if DB_SYNC=true)
   └─ Create/Update tables
   ↓
4. Initialize EDGServer
   ├─ Setup Middleware (Helmet, CORS, Rate Limiting, Body Parser)
   └─ Setup Base Endpoints (/, /health)
   ↓
5. Initialize Services
   ├─ AuthService
   └─ TokenService
   ↓
6. Initialize Controllers
   └─ AuthController (with injected services)
   ↓
7. Create Routes
   └─ AuthRouter (with controller and middleware)
   ↓
8. Register Module Routes
   └─ app.use('/auth', authRouter)
   ↓
9. Setup Error Handlers (404, 500)
   ⚠️ MUST be AFTER routes!
   ↓
10. Start Server
    └─ Listen on PORT (default 3001)
```

### Ordine Critico

**⚠️ IMPORTANTE:** L'ordine di registrazione middleware in Express è CRITICO!

```typescript
// ✅ CORRETTO
app.use(helmet());              // 1. Security
app.use(cors());                // 2. CORS
app.use(bodyParser.json());     // 3. Parsing
app.use('/auth', authRouter);   // 4. ROUTE
app.use(notFoundHandler);       // 5. 404 (DOPO route!)
app.use(errorHandler);          // 6. Error handler (ULTIMO!)

// ❌ SBAGLIATO
app.use(notFoundHandler);       // 404 PRIMA delle route
app.use('/auth', authRouter);   // Route non raggiungibili!
```

---

## Security Layers

### Layer 1: Transport Security

- **HTTPS** obbligatorio in production
- **TLS 1.2+** minimum
- **Certificate Pinning** (mobile apps)

### Layer 2: HTTP Security Headers

```typescript
// Helmet configuration
helmet({
  contentSecurityPolicy: {...},
  hsts: { maxAge: 31536000 },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true
})
```

### Layer 3: Rate Limiting

```typescript
// Per IP
{
  windowMs: 15 * 60 * 1000,  // 15 minuti
  max: 100                    // 100 richieste
}
```

### Layer 4: Input Validation

```typescript
// Validation utils
- validateEmail()
- validatePassword()
- validateUUID()
- sanitizeInput()
```

### Layer 5: Authentication (JWT)

```typescript
// Access Token: 15 min
// Refresh Token: 7 giorni
// Algorithm: HS256
// Secret: min 32 chars
```

### Layer 6: Authorization (RBAC)

```typescript
// Permission-based access control
hasPermission(userPermissions, module, action)
```

### Layer 7: Password Security

```typescript
// BCrypt
{
  rounds: 12,
  policy: {
    minLength: 8,
    requireUppercase: true,
    requireNumber: true,
    requireSpecial: true
  }
}
```

---

## Convenzioni Codice

### Naming Conventions

**TypeScript/JavaScript:**
- Classes: PascalCase (`AuthService`, `TokenService`)
- Interfaces: PascalCase con I prefix (`IAuthPayload`)
- Functions: camelCase (`generateToken`, `hashPassword`)
- Constants: UPPER_SNAKE_CASE (`JWT_SECRET`, `MAX_ATTEMPTS`)
- Private members: camelCase con _ prefix (`_validateToken`)

**Database:**
- Tables: snake_case plurale (`accounts`, `role_permissions`)
- Columns: camelCase nel model, snake_case nel DB
- Foreign Keys: `{tabella}Id` (`roleId`, `accountId`)

**Files:**
- Components: PascalCase (`AuthService.ts`, `Account.ts`)
- Utils: camelCase (`password.ts`, `validation.ts`)
- Config: lowercase (`database.ts`, `environment.ts`)

### Code Style

```typescript
// ✅ Buono: Type annotations esplicite
function login(email: string, password: string): Promise<LoginResult> {
  // ...
}

// ✅ Buono: Error handling con try-catch
try {
  const result = await service.login(email, password);
  return res.json({ success: true, data: result });
} catch (error) {
  return res.status(400).json({ success: false, error: error.message });
}

// ✅ Buono: Async/await invece di promises chains
const account = await Account.findOne({ where: { email } });
if (!account) throw new Error('Account not found');

// ❌ Evita: any type
// const data: any = ...

// ✅ Usa: Specific types
const data: LoginRequest = ...
```

---

## Performance Considerations

### Database Optimization

- **Indexes:** Su tutte le colonne usate in WHERE, JOIN
- **Foreign Keys:** Sempre INTEGER (non UUID)
- **Connection Pool:** 5-20 connessioni (configurabile)
- **Query Optimization:** Use Sequelize includes, not N+1 queries

### Caching Strategy (Future)

```
Redis Cache:
- Permissions by roleId (TTL: 15min)
- Active sessions (TTL: refresh token expiry)
- Rate limit counters
```

### Logging Strategy

- **Development:** Console logs con colori
- **Production:** Winston → file/cloud
- **Levels:** error, warn, info, debug

---

**Ultimo aggiornamento:** 21 Gennaio 2026  
**Versione:** 1.0.0
