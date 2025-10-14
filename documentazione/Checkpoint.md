# 🚀 CHECKPOINT - EDG Auth Service

Riferimento ultra-rapido per nuove chat. **Leggi questo prima di tutto!**

---

## ⚡ TL;DR (10 secondi)

```
STATUS:      ✅ PRODUCTION READY v1.0.0
COSA FA:     Microservizio autenticazione JWT + RBAC
FEATURES:    Dual mode (standalone/gateway), Multi-account, Permessi composti
STACK:       Node.js + TypeScript + Express + MySQL + Sequelize
MODALITÀ:    2 mode operativi (development standalone, production gateway)
```

---

## ✅ Cosa Funziona

### Core Features (100% Completo)

- ✅ Autenticazione JWT (access + refresh token)
- ✅ Registrazione / Login / Logout
- ✅ RBAC con permessi composti (`modulo.azione`)
- ✅ Multi-account type (operatore, partner, cliente, agente)
- ✅ Reset password con token
- ✅ Gestione sessioni multiple per dispositivo
- ✅ **Dual mode** (standalone + gateway) ← **NUOVO!**

### Database (100% Completo)

- ✅ 5 tabelle: roles, role_permissions, accounts, sessions, reset_tokens
- ✅ Dual key pattern (id INT + uuid UUID)
- ✅ Associazioni RBAC complete
- ✅ Indici ottimizzati

### API Endpoints (100% Testato)

- ✅ `POST /auth/register` - Registrazione
- ✅ `POST /auth/login` - Login
- ✅ `POST /auth/logout` - Logout
- ✅ `POST /auth/refresh` - Refresh token
- ✅ `GET /auth/me` - Info account (protetto)
- ✅ `POST /auth/change-password` - Cambio password (protetto)
- ✅ `POST /auth/request-reset-password` - Richiesta reset
- ✅ `POST /auth/reset-password` - Conferma reset
- ✅ `GET /health` - Health check

---

## 🎯 Novità Recenti (Ultima Sessione)

### ✨ Dual Mode Support (Gateway + Standalone)

**GATEWAY_MODE=false (Development):**
```
Frontend → Auth-Service:3001
           ↓
       Valida JWT direttamente
```

**GATEWAY_MODE=true (Production):**
```
Frontend → API Gateway:80 → Auth-Service (interno)
           ↓                ↓
       Valida JWT       Trust X-User-Data header
```

**File Modificati per Dual Mode:**
- ✅ `src/core/server.ts` - CORS e rate limiting condizionali
- ✅ `src/modules/auth/middleware/authMiddleware.ts` - Dual mode logic
- ✅ `src/modules/auth/middleware/verifyGateway.ts` - **NUOVO** Gateway security
- ✅ `src/modules/auth/routes/auth.routes.ts` - Rate limiting specifico
- ✅ `.env` - Nuove variabili (GATEWAY_MODE, GATEWAY_SECRET)
- ✅ `docker-compose.yml` - Network isolation

**Documentazione Gateway:**
- 📄 [GATEWAY-MODE.md](GATEWAY-MODE.md) - Guida completa
- 📄 [GUIDA-FILE-ENV.md](GUIDA-FILE-ENV.md) - Dove mettere .env
- 📄 [IMPLEMENTAZIONE-GATEWAY.md](IMPLEMENTAZIONE-GATEWAY.md) - Step-by-step

---

## 🔧 Problemi Risolti

### Problema Critico: Endpoint 404 ✅ RISOLTO

**Causa:** Ordine errato middleware (error handlers PRIMA delle route)

**Soluzione:**
```typescript
// ORDINE CORRETTO
setupMiddleware()
setupHealthAndRoot()
registerModuleRoutes()     // ← Route PRIMA
setupErrorHandlers()       // ← Error handlers DOPO
```

**File Modificati:**
- `src/core/server.ts`
- `src/app.ts`

**Dettagli:** [CHANGELOG.md](CHANGELOG.md)

---

## 📁 Struttura Progetto

```
auth-service/
├── src/
│   ├── core/                    # Framework riutilizzabile
│   │   ├── config/
│   │   │   ├── environment.ts
│   │   │   └── database.ts
│   │   └── server.ts
│   │
│   ├── modules/
│   │   └── auth/
│   │       ├── models/          # Sequelize models
│   │       ├── services/        # Business logic
│   │       ├── controllers/     # HTTP handlers
│   │       ├── middleware/      # Auth + Gateway
│   │       ├── routes/          # Route definitions
│   │       ├── types/           # TypeScript types
│   │       ├── utils/           # Utilities
│   │       └── seed/            # DB seeders
│   │
│   └── app.ts                   # Entry point
│
├── docs/                        # Documentazione
├── .env                         # Development config
├── docker-compose.yml           # Production setup
└── README.md
```

---

## 🗂️ Documentazione Disponibile

### 📘 Per Iniziare Velocemente

1. **[QUICK-START.md](QUICK-START.md)** ⚡ Setup in 5 minuti
2. **[README.md](README.md)** 📖 Overview generale
3. **[GUIDA-FILE-ENV.md](GUIDA-FILE-ENV.md)** 📂 Configurazione .env

### 📗 Per Capire il Sistema

4. **[ARCHITETTURA.md](ARCHITETTURA.md)** 🏗️ Architettura completa ← **NUOVO!**
5. **[PROJECT-STATUS.md](PROJECT-STATUS.md)** 📊 Stato dettagliato
6. **[RBAC-SYSTEM.md](RBAC-SYSTEM.md)** 🔐 Sistema autorizzazione

### 📙 Per Dual Mode / Gateway

7. **[GATEWAY-MODE.md](GATEWAY-MODE.md)** 🌐 Dual mode completo
8. **[IMPLEMENTAZIONE-GATEWAY.md](IMPLEMENTAZIONE-GATEWAY.md)** 🔧 Implementazione

### 📕 Per Testing e Troubleshooting

9. **[TESTING-GUIDE.md](TESTING-GUIDE.md)** 🧪 Test completi
10. **[CHANGELOG.md](CHANGELOG.md)** 📝 Problemi risolti

---

## 🎯 Per Nuove Chat: "Cosa Devo Sapere?"

### Se Lavori su Features Base

**Leggi:**
1. Questo documento (CHECKPOINT.md)
2. [ARCHITETTURA.md](ARCHITETTURA.md) - Capire struttura
3. [PROJECT-STATUS.md](PROJECT-STATUS.md) - Vedere cosa c'è

**Cosa sapere:**
- Sistema RBAC con permessi composti (`modulo.azione`)
- Dual key pattern (id INT + uuid UUID)
- Service layer per business logic
- TokenService usa metodi di istanza (non statici!)

### Se Lavori su Gateway / Docker

**Leggi:**
1. Questo documento (CHECKPOINT.md)
2. [GATEWAY-MODE.md](GATEWAY-MODE.md) - Capire dual mode
3. [GUIDA-FILE-ENV.md](GUIDA-FILE-ENV.md) - Configurazione

**Cosa sapere:**
- GATEWAY_MODE controlla tutto (false=standalone, true=gateway)
- Secrets devono essere UGUALI tra gateway e auth-service
- File .env: `auth-service/.env` (dev), `edg-docker/.env` (prod root)
- Network isolation in Docker (microservizi su rete interna)

### Se Risolvi Bug

**Leggi:**
1. [CHANGELOG.md](CHANGELOG.md) - Problemi già risolti
2. [PROJECT-STATUS.md](PROJECT-STATUS.md) - Troubleshooting section

**Pattern comuni:**
- Endpoint 404? → Verifica ordine middleware
- Gateway errors? → Verifica secrets match
- TypeScript errors? → TokenService usa istanze, non static

---

## 💡 Quick Commands

### Development (Standalone)

```bash
cd auth-service
npm run dev                # Avvia standalone mode
curl http://localhost:3001/health
```

### Production (Docker)

```bash
cd edg-docker              # Root project
docker-compose up -d       # Avvia stack completo
docker-compose logs -f     # Vedi log
```

### Database

```bash
npm run db:sync            # Sync tables
npm run seed:roles         # Seed ruoli predefiniti
```

---

## 🔑 Environment Variables Chiave

### Development (.env in auth-service/)

```env
GATEWAY_MODE=false
DB_HOST=localhost
JWT_SECRET=dev-secret-min-32-chars
CORS_ORIGINS=http://localhost:5173
```

### Production (.env in edg-docker/ root)

```env
GATEWAY_MODE=true
GATEWAY_SECRET=...         # UGUALE nel gateway!
JWT_SECRET=...             # UGUALE nel gateway!
MYSQL_PASSWORD=...
CORS_ORIGINS=https://app.edg.com
```

---

## 🚦 Decisioni Architetturali Chiave

1. **Dual Mode:** Standalone (dev) + Gateway (prod) - Flessibilità massima
2. **RBAC Composto:** `modulo.azione` senza gerarchia - Granularità perfetta
3. **Dual Key:** id INT (performance) + uuid UUID (security)
4. **JWT con Permissions:** Payload include permissions array - Zero DB queries
5. **Rate Limiting Ibrido:** Generale (gateway) + Specifico (microservizio)
6. **Session Strategy:** Access JWT (15min) + Refresh random (7gg)

---

## 🎯 Prossimi Passi Possibili

### Features RBAC Avanzate (Opzionale)

- [ ] PermissionService completo
- [ ] Middleware `requirePermission(module, action)`
- [ ] RoleService per CRUD ruoli custom
- [ ] API admin per gestione ruoli

### Production Ready (Opzionale)

- [ ] Redis cache per permissions
- [ ] Logging avanzato (Winston)
- [ ] Metrics (Prometheus)
- [ ] Email service per reset password
- [ ] 2FA (Two-Factor Authentication)

### Testing (Raccomandato)

- [ ] Unit tests (Jest)
- [ ] Integration tests
- [ ] E2E tests
- [ ] Load testing

---

## 📞 Checklist per Continuare Lavoro

Prima di iniziare in una nuova chat, assicurati di:

- [ ] ✅ Leggere CHECKPOINT.md (questo documento)
- [ ] ✅ Leggere ARCHITETTURA.md (struttura generale)
- [ ] ✅ Capire dual mode (GATEWAY-MODE.md se lavori su gateway)
- [ ] ✅ Vedere PROJECT-STATUS.md per dettagli implementativi
- [ ] ✅ Condividere questi documenti nella nuova chat

---

## 🎓 Pattern e Convenzioni

### Naming
- Code: camelCase (variabili, funzioni)
- Classes: PascalCase
- Database: snake_case (tabelle, colonne in SQL)
- Files: camelCase.ts / kebab-case.md

### Structure
- Layers: Routes → Controllers → Services → Models
- Errors: Consistent format con `success`, `error`, `data`
- Validation: Input validation nei controllers
- Business logic: Sempre nei services

### TypeScript
- Strict mode enabled
- Types in `types/` directory
- Interfaces per contracts
- Types per data structures

---

## 🏆 Status Finale

```
✅ Sistema Base:         100% Completato e Testato
✅ Database:             100% Completo
✅ API Endpoints:        100% Funzionanti
✅ Dual Mode:            100% Implementato
✅ Documentazione:       100% Completa
✅ Production Ready:     ✅ SÌ (base features)

Prossimo Milestone:      Features RBAC Avanzate (opzionale)
```

---

## 🎯 Quick Reference Card

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 EDG AUTH SERVICE - QUICK REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 STATUS:    ✅ Production Ready v1.0.0
 STACK:     Node.js + TypeScript + Express + MySQL
 FEATURES:  JWT + RBAC + Dual Mode + Multi-account

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 DEVELOPMENT                  PRODUCTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GATEWAY_MODE=false           GATEWAY_MODE=true
 Direct :3001                 Via Gateway :80
 Valida JWT                   Trust X-User-Data
 CORS attivo                  CORS nel gateway
 auth-service/.env            edg-docker/.env

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 DOCS ESSENZIALI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ⚡ CHECKPOINT.md       (questo) - Start here!
 🏗️ ARCHITETTURA.md    - Struttura completa
 📊 PROJECT-STATUS.md  - Stato dettagliato
 🌐 GATEWAY-MODE.md    - Dual mode completo
 🔐 RBAC-SYSTEM.md     - Autorizzazione
 📝 CHANGELOG.md       - Problemi risolti

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 COMMANDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 npm run dev              Avvia development
 npm run db:sync          Sync database
 npm run seed:roles       Seed ruoli
 docker-compose up -d     Avvia production

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

**Ultimo aggiornamento:** 13 Ottobre 2025  
**Versione:** 1.0  
**Next Review:** Quando aggiungi features significative

**🎯 Per nuove chat: Condividi CHECKPOINT.md + ARCHITETTURA.md + PROJECT-STATUS.md**
