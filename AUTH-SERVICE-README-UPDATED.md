# EDG Auth Service

Microservizio di autenticazione centralizzato per l'ecosistema EDG con sistema RBAC avanzato e gestione accounts admin.

[![Status](https://img.shields.io/badge/status-production%20ready-green)]()
[![Version](https://img.shields.io/badge/version-1.1.0-blue)]()
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)]()
[![TypeScript](https://img.shields.io/badge/typescript-5.8.3-blue)]()

---

## 🎯 Panoramica

Sistema di autenticazione e autorizzazione enterprise-grade basato su **JWT** e **RBAC** (Role-Based Access Control) con permessi composti e wildcards. Progettato per architetture a microservizi con Docker.

### Caratteristiche Principali

- **Autenticazione JWT** - Access token (15min) + Refresh token (7 giorni)
- **RBAC Avanzato** - Permessi composti `modulo.azione` con wildcards
- **Accounts Admin CRUD** - Gestione completa accounts per root
- **Multi-Session** - Gestione sessioni multiple per dispositivo
- **Multi-Account** - 4 tipi: operatore, partner, cliente, agente
- **Security First** - Helmet, CORS, Rate Limiting, BCrypt (12 rounds)
- **Dual Key Pattern** - ID interno + UUID pubblico per massima sicurezza
- **Production Ready** - Sistema testato e documentato

---

## 🚀 Quick Start

### Installazione Rapida (5 minuti)

```bash
# 1. Installa dipendenze
npm install

# 2. Configura environment
cp .env.example .env
# Modifica .env con le tue credenziali

# 3. Crea database MySQL
mysql -u root -p -e "CREATE DATABASE edg_auth"

# 4. Sync database e seed
npm run db:sync
npm run seed:roles

# 5. Avvia server
npm run dev
```

**Server pronto su:** http://localhost:3001

✅ **Verifica:** `curl http://localhost:3001/health`

📖 **Setup dettagliato:** Consulta [SETUP.md](SETUP.md)

---

## 📋 Documentazione

| Documento | Descrizione |
|-----------|-------------|
| **[SETUP.md](SETUP.md)** | Installazione, configurazione, prerequisiti |
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | Architettura, database schema, pattern |
| **[RBAC.md](RBAC.md)** | Sistema autorizzazioni completo |
| **[OPERATIONS.md](OPERATIONS.md)** | Testing, deployment, troubleshooting |
| **[CHANGELOG.md](CHANGELOG.md)** | Storia modifiche e fix |

---

## 🏗️ Stack Tecnologico

```
┌─────────────────────────────────┐
│  Express.js 5 + TypeScript      │
├─────────────────────────────────┤
│  JWT + BCrypt + RBAC            │
├─────────────────────────────────┤
│  Sequelize ORM                  │
├─────────────────────────────────┤
│  MySQL 8+                       │
└─────────────────────────────────┘
```

- **Runtime:** Node.js 18+
- **Framework:** Express.js 5.x
- **Database:** MySQL 8+ con Sequelize
- **Security:** Helmet, CORS, Rate Limiting
- **Validation:** Custom validators + sanitization

---

## 🔐 Sistema RBAC

### Permessi Composti

Il sistema usa permessi nella forma **`modulo.azione`**:

```typescript
'spedizioni.read'    // Visualizzare spedizioni
'spedizioni.create'  // Creare spedizioni
'gestione.*'         // Wildcard: tutte le azioni su gestione
'sistema.accounts'   // Gestione accounts (admin)
'*'                  // Root: accesso completo
```

### Ruoli Predefiniti

| Ruolo | Permessi | Descrizione |
|-------|----------|-------------|
| **root** | `*` | Accesso completo sistema + gestione accounts |
| **admin** | `spedizioni.*`<br>`gestione.*`<br>`report.*` | Admin completo (no sistema) |
| **operatore** | `spedizioni.*`<br>`report.read/create/export` | Operativo standard |
| **guest** | `spedizioni.read`<br>`report.read` | Solo lettura |

📖 **Documentazione completa:** [RBAC.md](RBAC.md)

---

## 📡 API Endpoints

### Pubblici (no autenticazione)

```
POST   /auth/register               # Registrazione account
POST   /auth/login                  # Login
POST   /auth/refresh                # Refresh token
POST   /auth/request-reset-password # Richiesta reset password
POST   /auth/reset-password         # Conferma reset password
```

### Protetti (require Bearer token)

```
GET    /auth/me                     # Info account corrente
POST   /auth/change-password        # Cambio password
POST   /auth/logout                 # Logout sessione corrente
POST   /auth/logout-all             # Logout tutte le sessioni
GET    /auth/sessions               # Lista sessioni attive
```

### Admin Accounts (require Root permission: `*`)

```
GET    /auth/accounts               # Lista accounts (paginata + filtri)
GET    /auth/accounts/stats         # Statistiche overview
GET    /auth/accounts/:id           # Dettaglio singolo account
POST   /auth/register               # Crea nuovo account (riutilizza endpoint)
PUT    /auth/accounts/:id           # Aggiorna account
DELETE /auth/accounts/:id           # Soft delete (isActive=false)
POST   /auth/accounts/:id/activate  # Riattiva account disattivato
```

### System

```
GET    /                            # Info servizio
GET    /health                      # Health check
```

### Esempio Registrazione

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!@#",
    "accountType": "operatore",
    "entityId": "550e8400-e29b-41d4-a716-446655440000",
    "roleId": 3
  }'
```

### Esempio Login

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!@#",
    "accountType": "operatore"
  }'
```

### Esempio Gestione Accounts (Root Only)

```bash
# Lista accounts con paginazione
curl -X GET "http://localhost:3001/auth/accounts?page=0&limit=50" \
  -H "Authorization: Bearer <root-token>"

# Statistiche
curl -X GET http://localhost:3001/auth/accounts/stats \
  -H "Authorization: Bearer <root-token>"

# Aggiorna account
curl -X PUT http://localhost:3001/auth/accounts/123 \
  -H "Authorization: Bearer <root-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newemail@example.com",
    "roleId": 2,
    "isActive": true
  }'

# Disattiva account (soft delete)
curl -X DELETE http://localhost:3001/auth/accounts/123 \
  -H "Authorization: Bearer <root-token>"

# Riattiva account
curl -X POST http://localhost:3001/auth/accounts/123/activate \
  -H "Authorization: Bearer <root-token>"
```

---

## 💻 Development

### Comandi Principali

```bash
# Development
npm run dev              # Avvia con hot reload
npm run db:sync          # Sync database

# Build & Production
npm run build            # Compila TypeScript
npm start                # Avvia production

# Database
npm run seed:roles       # Seed ruoli predefiniti
npm run seed:all         # Seed completo

# Quality
npm run lint             # Linting
npm run lint:fix         # Auto-fix
npm test                 # Run tests
```

### Struttura Progetto

```
auth-service/
├── src/
│   ├── core/                  # Framework riutilizzabile
│   │   ├── config/            # Database, environment
│   │   └── server.ts          # EDGServer modulare
│   ├── modules/
│   │   └── auth/              # Modulo autenticazione
│   │       ├── models/        # Sequelize models
│   │       ├── services/      # Business logic
│   │       ├── controllers/   # HTTP handlers
│   │       │   ├── AuthController.ts
│   │       │   ├── SessionController.ts
│   │       │   └── AccountController.ts    # ✅ NUOVO
│   │       ├── routes/        # Route definitions
│   │       │   ├── auth.routes.ts
│   │       │   └── account.routes.ts       # ✅ NUOVO
│   │       ├── middleware/    # Auth middleware
│   │       │   ├── authMiddleware.ts
│   │       │   ├── permissionMiddleware.ts
│   │       │   └── verifyGateway.ts
│   │       └── utils/         # Utilities
│   └── app.ts                 # Entry point
├── docs/                      # Documentazione
└── package.json
```

📖 **Architettura completa:** [ARCHITECTURE.md](ARCHITECTURE.md)

---

## 🆕 Modulo Accounts CRUD (v1.1)

### Panoramica

Il modulo Accounts permette agli amministratori root di gestire tutti gli account della piattaforma tramite API REST complete.

### Caratteristiche

- ✅ **Lista paginata** con filtri (email, ruolo, tipo account, stato)
- ✅ **Statistiche overview** (totale, attivi, inattivi, bloccati, per ruolo)
- ✅ **Dettaglio account** con relazioni (ruolo incluso)
- ✅ **Aggiornamento** email, ruolo, tipo, entityId, stato
- ✅ **Soft delete** (isActive=false, account recuperabile)
- ✅ **Riattivazione** account disattivati
- ✅ **Protezioni** (no self-modify role, no self-delete)
- ✅ **Permessi** richiede root (`*` permission)

### Controller: AccountController.ts

```typescript
export class AccountController {
  private Account: any;
  private Role: any;

  constructor(Account: any, Role: any) {
    this.Account = Account;
    this.Role = Role;
  }

  async listAccounts(req, res): Promise<void>      // GET /accounts
  async getAccountById(req, res): Promise<void>    // GET /accounts/:id
  async getAccountStats(req, res): Promise<void>   // GET /accounts/stats
  async updateAccount(req, res): Promise<void>     // PUT /accounts/:id
  async deleteAccount(req, res): Promise<void>     // DELETE /accounts/:id
  async activateAccount(req, res): Promise<void>   // POST /accounts/:id/activate
}
```

### Routes Factory: account.routes.ts

```typescript
export const createAccountRouter = (Account: any, Role: any): Router => {
  const accountController = new AccountController(Account, Role);

  router.get('/stats', authenticate, requireRoot(), accountController.getAccountStats);
  router.get('/', authenticate, requireRoot(), accountController.listAccounts);
  router.get('/:id', authenticate, requireRoot(), accountController.getAccountById);
  router.put('/:id', authenticate, requireRoot(), accountController.updateAccount);
  router.delete('/:id', authenticate, requireRoot(), accountController.deleteAccount);
  router.post('/:id/activate', authenticate, requireRoot(), accountController.activateAccount);

  return router;
};
```

### Registrazione in app.ts

```typescript
// Dopo inizializzazione modelli
const accountRouter = createAccountRouter(Account, Role);
app.use('/auth/accounts', accountRouter);
```

### Filtri Disponibili

| Parametro | Tipo | Descrizione | Esempio |
|-----------|------|-------------|---------|
| `page` | number | Pagina (0-indexed) | `0` |
| `limit` | number | Risultati per pagina | `50` |
| `search` | string | Email (LIKE) | `user@example.com` |
| `roleId` | number | Filtra per ruolo | `1` (root) |
| `accountType` | string | Tipo account | `operatore` |
| `status` | string | Stato account | `active`, `inactive`, `blocked` |

### Response Paginazione

```json
{
  "success": true,
  "data": {
    "accounts": [...],
    "pagination": {
      "total": 150,
      "page": 0,
      "limit": 50,
      "totalPages": 3,
      "hasMore": true
    }
  }
}
```

### Response Statistiche

```json
{
  "success": true,
  "data": {
    "total": 150,
    "active": 145,
    "inactive": 3,
    "blocked": 2,
    "byRole": [
      { "role": "root", "count": 1 },
      { "role": "admin", "count": 5 },
      { "role": "operatore", "count": 120 },
      { "role": "guest", "count": 24 }
    ]
  }
}
```

---

## 🧪 Testing

### Test Rapidi

```bash
# Health check
curl http://localhost:3001/health

# Registrazione
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@edg.com","password":"Test123!@#","accountType":"operatore","entityId":"550e8400-e29b-41d4-a716-446655440000","roleId":3}'

# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@edg.com","password":"Test123!@#","accountType":"operatore"}'

# Lista accounts (root only)
curl -X GET http://localhost:3001/auth/accounts \
  -H "Authorization: Bearer <root-token>"
```

📖 **Test completi:** [OPERATIONS.md](OPERATIONS.md#testing)

---

## 🚢 Deployment

### Production Checklist

- [ ] ⚠️ **Cambia JWT_SECRET** - Min 32 caratteri casuali
- [ ] ⚠️ **Cambia GATEWAY_SECRET** - Min 32 caratteri casuali
- [ ] ⚠️ **Configura CORS_ORIGINS** - Solo domini autorizzati
- [ ] ⚠️ **Usa HTTPS** - Mai HTTP in production
- [ ] ⚠️ **Backup database** - Automatizzato
- [ ] ⚠️ **Environment** - NODE_ENV=production
- [ ] ✅ **Verifica permesso `sistema.accounts`** per root

### Database Permission Setup

Assicurati che il ruolo root abbia il permesso per gestire accounts:

```sql
USE edg_auth;

-- Il root ha già "*" (wildcard globale), ma per chiarezza:
INSERT INTO role_permissions (roleId, permission, createdAt)
SELECT 1, 'sistema.accounts', NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM role_permissions 
    WHERE roleId = 1 AND permission = 'sistema.accounts'
);
```

### Docker

```bash
docker compose build --no-cache auth-service
docker compose up -d auth-service
```

📖 **Deploy completo:** [OPERATIONS.md](OPERATIONS.md#deployment)

---

## 🔧 Troubleshooting

### Problemi Comuni

**Server non si avvia**
```bash
# Verifica MySQL
systemctl status mysql
mysql -u root -p -e "SELECT 1"
```

**Endpoint 404 su /auth/accounts**
- Verifica che `account.routes.ts` sia registrato in `app.ts`
- Controlla ordine middleware (route PRIMA di error handlers)
- Verifica log: `docker logs auth-service-1 --tail=50`

**403 Forbidden su /auth/accounts**
- Verifica che l'utente abbia permesso `*` (root)
- Controlla header `x-user-data` dal gateway
- Verifica `requireRoot()` middleware

**UUID non valido**
```bash
# Genera UUID v4 valido
node -e "console.log(require('crypto').randomUUID())"
```

**AccountController import error**
- I modelli vengono passati al constructor, NON importati
- Usa pattern factory: `createAccountRouter(Account, Role)`

📖 **Troubleshooting completo:** [OPERATIONS.md](OPERATIONS.md#troubleshooting)

---

## 📊 Performance

- ⚡ **Server Startup:** < 2 secondi
- ⚡ **Response Time:** < 50ms (locale)
- ⚡ **Database Query:** < 10ms (media)
- ⚡ **Accounts List:** < 100ms (50 risultati paginati)
- 🔒 **BCrypt Rounds:** 12
- 📦 **Bundle Size:** ~5MB (compiled)

---

## 🗺️ Roadmap

### ✅ v1.1 - Accounts CRUD (COMPLETATO)
- [x] AccountController con 7 endpoint
- [x] Lista paginata con filtri
- [x] Statistiche overview
- [x] Soft delete + riattivazione
- [x] Protezioni (no self-modify/delete)
- [x] Middleware requireRoot

### v1.2 - RBAC Avanzato
- [ ] PermissionService completo
- [ ] Middleware `requirePermission(module, action)` generico
- [ ] RoleService per CRUD ruoli dinamici
- [ ] API admin gestione ruoli e permessi

### v1.3 - Production Features
- [ ] Email service (reset password, welcome)
- [ ] Redis cache permessi
- [ ] Logging avanzato (Winston)
- [ ] Metrics (Prometheus)

### v2.0 - Features Avanzate
- [ ] 2FA (Two-Factor Authentication)
- [ ] OAuth2 (Google, Microsoft)
- [ ] Account verification
- [ ] Audit log completo

---

## 📝 Changelog

### v1.1.0 (2026-03-03)
- ✅ **Nuovo modulo Accounts CRUD** (gestione admin completa)
- ✅ **AccountController** con 7 endpoint REST
- ✅ **Paginazione** + filtri (email, ruolo, tipo, stato)
- ✅ **Statistiche** overview accounts
- ✅ **Soft delete** + riattivazione
- ✅ **Protezioni** self-modify e self-delete
- ✅ **Middleware** requireRoot per sicurezza
- 📝 Documentazione API aggiornata

### v1.0.0 (2025-10-13)
- 🎉 Release iniziale production-ready
- 🔐 JWT authentication completo
- 🔐 RBAC con permessi composti
- 🔐 Multi-session management
- 🔒 Security hardening completo

---

## 📄 License

**PRIVATE** - Tutti i diritti riservati - EDG Team

---

## 👥 Team

- **Architettura:** EDG Development Team
- **Sviluppo:** EDG Team + Mormegil
- **Data:** Ottobre 2025 - Marzo 2026
- **Versione:** 1.1.0

---

## 📞 Supporto

Per problemi o domande:
1. Consulta [CHANGELOG.md](CHANGELOG.md) - problemi risolti
2. Leggi [OPERATIONS.md](OPERATIONS.md) - troubleshooting
3. Controlla i log del server: `docker logs auth-service-1 -f`
4. Verifica configurazione: `docker exec auth-service-1 printenv`
5. Contatta il team EDG

---

**Made with ❤️ by EDG Team**

**Status:** ✅ Production Ready (v1.1.0)  
**Last Update:** 3 Marzo 2026
