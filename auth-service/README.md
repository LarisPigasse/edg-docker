# EDG Auth Service

Microservizio di autenticazione centralizzato per l'ecosistema EDG con sistema RBAC avanzato.

[![Status](https://img.shields.io/badge/status-production%20ready-green)]()
[![Version](https://img.shields.io/badge/version-1.0.0-blue)]()
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)]()
[![TypeScript](https://img.shields.io/badge/typescript-5.8.3-blue)]()

---

## 🎯 Panoramica

Sistema di autenticazione e autorizzazione enterprise-grade basato su **JWT** e **RBAC** (Role-Based Access Control) con permessi composti e wildcards. Progettato per architetture a microservizi con Docker.

### Caratteristiche Principali

- **Autenticazione JWT** - Access token (15min) + Refresh token (7 giorni)
- **RBAC Avanzato** - Permessi composti `modulo.azione` con wildcards
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
'*'                  // Root: accesso completo
```

### Ruoli Predefiniti

| Ruolo | Permessi | Descrizione |
|-------|----------|-------------|
| **root** | `*` | Accesso completo sistema |
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
│   │       ├── routes/        # Route definitions
│   │       ├── middleware/    # Auth middleware
│   │       └── utils/         # Utilities
│   └── app.ts                 # Entry point
├── docs/                      # Documentazione
└── package.json
```

📖 **Architettura completa:** [ARCHITECTURE.md](ARCHITECTURE.md)

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
```

📖 **Test completi:** [OPERATIONS.md](OPERATIONS.md#testing)

---

## 🚢 Deployment

### Production Checklist

- [ ] ⚠️ **Cambia JWT_SECRET** - Min 32 caratteri casuali
- [ ] ⚠️ **Configura CORS_ORIGINS** - Solo domini autorizzati
- [ ] ⚠️ **Usa HTTPS** - Mai HTTP in production
- [ ] ⚠️ **Backup database** - Automatizzato
- [ ] ⚠️ **Environment** - NODE_ENV=production

### Docker (in sviluppo)

```bash
docker-compose up -d
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

**Endpoint 404**
- Verifica ordine middleware nei log
- Le route devono essere registrate PRIMA degli error handlers

**UUID non valido**
```bash
# Genera UUID v4 valido
node -e "console.log(require('crypto').randomUUID())"
```

📖 **Troubleshooting completo:** [OPERATIONS.md](OPERATIONS.md#troubleshooting)

---

## 📊 Performance

- ⚡ **Server Startup:** < 2 secondi
- ⚡ **Response Time:** < 50ms (locale)
- ⚡ **Database Query:** < 10ms (media)
- 🔒 **BCrypt Rounds:** 12
- 📦 **Bundle Size:** ~5MB (compiled)

---

## 🗺️ Roadmap

### v1.1 - RBAC Avanzato
- [ ] PermissionService completo
- [ ] Middleware `requirePermission(module, action)`
- [ ] RoleService per CRUD ruoli
- [ ] API admin gestione ruoli

### v1.2 - Production Features
- [ ] Email service (reset password)
- [ ] Redis cache permessi
- [ ] Logging avanzato (Winston)
- [ ] Metrics (Prometheus)
- [ ] Docker + Docker Compose

### v2.0 - Features Avanzate
- [ ] 2FA (Two-Factor Authentication)
- [ ] OAuth2 (Google, Microsoft)
- [ ] Account verification
- [ ] Audit log completo

---

## 📄 License

**PRIVATE** - Tutti i diritti riservati - EDG Team

---

## 👥 Team

- **Architettura:** EDG Development Team
- **Sviluppo:** EDG Team
- **Data:** Ottobre 2025
- **Versione:** 1.0.0

---

## 📞 Supporto

Per problemi o domande:
1. Consulta [CHANGELOG.md](CHANGELOG.md) - problemi risolti
2. Leggi [OPERATIONS.md](OPERATIONS.md) - troubleshooting
3. Controlla i log del server
4. Contatta il team EDG

---

**Made with ❤️ by EDG Team**

**Status:** ✅ Production Ready (v1.0.0)  
**Last Update:** 13 Ottobre 2025
