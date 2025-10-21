# 🚀 EDG PLATFORM - Documentazione Completa

**Versione:** 2.0  
**Data:** 21 Ottobre 2025  
**Status:** ✅ Production Ready

---

## 📋 INDICE

1. [Panoramica Sistema](#1-panoramica-sistema)
2. [Architettura e Network](#2-architettura-e-network)
3. [Database](#3-database)
4. [Microservizi](#4-microservizi)
5. [API Gateway](#5-api-gateway)
6. [Docker e Deployment](#6-docker-e-deployment)
7. [Configurazione Environment](#7-configurazione-environment)
8. [Setup e Avvio](#8-setup-e-avvio)
9. [Testing e Debug](#9-testing-e-debug)
10. [Troubleshooting](#10-troubleshooting)
11. [Changelog e Storia](#11-changelog-e-storia)

**Appendici:**

- [Appendice A: Migrazione Environment Variables](#appendice-a-migrazione-environment-variables)
- [Appendice B: Script Utili](#appendice-b-script-utili)
- [Appendice C: FAQ](#appendice-c-faq)

---

## 1. PANORAMICA SISTEMA

### 1.1 Tipo di Sistema

**Piattaforma microservizi EDG** per gestione autenticazione, autorizzazione, logging e business logic distribuita.

### 1.2 Componenti Principali

┌──────────────────────────────────────────────────┐
│ EDG PLATFORM v2.0 │
├──────────────────────────────────────────────────┤
│ │
│ 🌐 API Gateway (Express) │
│ - Routing intelligente │
│ - CORS configurabile │
│ - Rate Limiting generale │
│ - Health checks │
│ │
│ 🔐 Auth Service (Node.js + TypeScript) │
│ - JWT Authentication (dual-token) │
│ - RBAC con permessi granulari │
│ - Multi-account types │
│ - Session management multi-device │
│ - Reset password via token │
│ │
│ 📝 Log Service (Node.js + TypeScript) │
│ - Centralized logging │
│ - Action tracking con diff │
│ - Transaction correlation │
│ - Statistics & analytics │
│ │
│ 💾 Databases │
│ - MySQL 8.0 (Auth data + Sequelize) │
│ - MongoDB 7.0 (Logs + Mongoose) │
│ │
└──────────────────────────────────────────────────┘

text

### 1.3 Stack Tecnologico

| Layer             | Tecnologia     | Versione     | Scopo                  |
| ----------------- | -------------- | ------------ | ---------------------- |
| **Runtime**       | Node.js        | 18+          | Execution environment  |
| **Language**      | TypeScript     | 5.8+         | Type-safe development  |
| **Framework**     | Express.js     | 5.x          | Web framework          |
| **DB SQL**        | MySQL          | 8.0          | Relational data (auth) |
| **ORM**           | Sequelize      | 6.x          | MySQL data modeling    |
| **DB NoSQL**      | MongoDB        | 7.0          | Document store (logs)  |
| **ODM**           | Mongoose       | 8.x          | MongoDB data modeling  |
| **Auth**          | JWT            | jsonwebtoken | Token-based auth       |
| **Security**      | BCrypt         | 10 rounds    | Password hashing       |
| **Container**     | Docker         | 24+          | Containerization       |
| **Orchestration** | Docker Compose | 2.20+        | Multi-container apps   |
| **Proxy**         | Axios          | Latest       | HTTP client (gateway)  |

### 1.4 Principi Architetturali

**Microservizi Isolation:** Ogni servizio è autonomo, con proprio database e responsabilità ben definite.

**Network Security:** Isolamento completo tra rete interna (microservizi) ed esterna (internet).

**Stateless Services:** Auth service stateless tramite JWT, stato solo in database.

**Event Logging:** Ogni azione significativa viene loggata centralmente per audit trail.

**Dual Mode:** Supporto per development standalone e production gateway-based senza cambio codice.

---

## 2. ARCHITETTURA E NETWORK

### 2.1 Diagramma Architettura

text
INTERNET
│
│ HTTPS (Production: Nginx/CloudFlare)
│
┌──────▼──────┐
│ Reverse │
│ Proxy │
└──────┬──────┘
│
│ HTTP :80
│
┌──────────────────▼──────────────────┐
│ EXTERNAL NETWORK │
│ (docker network: external) │
│ Exposed to Internet │
└──────────────────┬──────────────────┘
│
┌──────▼──────┐
│ API Gateway │ Rate Limiting
│ :8080 │ CORS
└──────┬──────┘ JWT Validation (future)
│
┌──────────────────▼──────────────────┐
│ INTERNAL NETWORK │
│ (docker network: internal) │
│ Isolated from Internet │
│ │
│ ┌─────────────┐ ┌─────────────┐ │
│ │Auth Service │ │ Log Service │ │
│ │ :3001 │ │ :4000 │ │
│ └──────┬──────┘ └──────┬──────┘ │
│ │ │ │
│ ┌──────▼──────┐ ┌──────▼──────┐ │
│ │ MySQL │ │ MongoDB │ │
│ │ :3306 │ │ :27017 │ │
│ └─────────────┘ └─────────────┘ │
│ │ │ │
└─────────┼─────────────────┼────────┘
│ │
[DBeaver MySQL] [DBeaver MongoDB]
(localhost:3306) (localhost:27017)
Development only Development only
text

### 2.2 Network Configuration

#### External Network

- **Driver:** bridge
- **Componenti:** Solo API Gateway
- **Esposizione:** Porta 80 (HTTP) mappata su host
- **Scopo:** Unico punto di accesso pubblico

#### Internal Network

- **Driver:** bridge
- **Componenti:** Gateway, Auth-Service, Log-Service, MySQL, MongoDB
- **Esposizione:** Nessuna porta esterna (tranne dev)
- **Scopo:** Comunicazione privata tra microservizi

#### Database Ports (Development Mode)

- **MySQL:** `0.0.0.0:3306` → Accessibile da DBeaver su host
- **MongoDB:** `0.0.0.0:27017` → Accessibile da DBeaver su host
- **Production:** Rimuovere port mapping per isolamento totale

### 2.3 Security Model Multilivello

┌─────────────────────────────────────────────────┐
│ SECURITY LAYERS (Defense in Depth) │
├─────────────────────────────────────────────────┤
│ │
│ 1️⃣ NETWORK ISOLATION │
│ ✅ Microservizi su internal network │
│ ✅ Solo gateway su external network │
│ ✅ Database non accessibili da internet │
│ ✅ Docker network isolation │
│ │
│ 2️⃣ API GATEWAY (Layer 7 Protection) │
│ ✅ CORS configurabile per origine │
│ ✅ Rate limiting: 100 req/15min default │
│ ✅ Request validation │
│ ✅ Error handling centralizzato │
│ 🔄 JWT validation (roadmap) │
│ │
│ 3️⃣ AUTH SERVICE (Authentication Layer) │
│ ✅ JWT signing/verification (HS256) │
│ ✅ Password hashing: BCrypt 10 rounds │
│ ✅ Session management con revoca │
│ ✅ Business rate limiting: │
│ - Login: 5 attempts/15min per email │
│ - Register: 10 attempts/hour per IP │
│ - Reset: 3 attempts/hour per email │
│ ✅ Dual key pattern (INT + UUID) │
│ ✅ RBAC permission validation │
│ │
│ 4️⃣ LOG SERVICE (Audit Layer) │
│ ✅ API key authentication │
│ ✅ Internal network only │
│ ✅ Immutable audit trail │
│ │
│ 5️⃣ DATABASE SECURITY │
│ ✅ Credenziali via environment variables │
│ ✅ Network isolation (internal) │
│ ✅ Prepared statements (SQL injection) │
│ ✅ Connection pooling │
│ │
└─────────────────────────────────────────────────┘

text

### 2.4 Request Flow (Esempio: Login)

┌─────────┐
│ Client │
│ Browser │
└────┬────┘
│
│ 1. POST /auth/login
│ Body: {email, password, accountType}
▼
┌──────────────┐
│ API Gateway │
│ :80 │
└──────┬───────┘
│
│ 2. Rate limiting check (100 req/15min)
│ 3. CORS validation
│ 4. Proxy to auth-service
│ POST http://auth-service:3001/auth/login
▼
┌──────────────┐
│ Auth Service │
│ :3001 │
└──────┬───────┘
│
│ 5. Business rate limiting (5 login/15min per email)
│ 6. Query MySQL: SELECT \* FROM accounts WHERE email=?
│ 7. BCrypt compare password
│ 8. Load permissions from role_permissions
│ 9. Generate JWT (access 15min, refresh 7days)
│ 10. Store refresh token in sessions table
│ 11. Log to log-service
│ POST http://log-service:4000/api/log/azione
▼
┌──────────────┐
│ Log Service │
│ :4000 │
└──────┬───────┘
│
│ 12. API key validation
│ 13. Insert to MongoDB azionelogs collection
│ 14. Return 201 Created
▼
Back to Auth Service
│
│ 15. Return {accessToken, refreshToken}
▼
Back to API Gateway
│
│ 16. Forward response to client
▼
┌─────────┐
│ Client │
│ Receives│
│ Tokens │
└─────────┘

text

---

## 3. DATABASE

### 3.1 MySQL (Auth Service Database)

#### Connection Details

Host: mysql (Docker internal) / localhost (Host)
Port: 3306
Database: edg_auth
User: edg_auth_admin
Password: Auth2025Db!
Charset: utf8mb4
Timezone: +00:00 (UTC)

text

#### DBeaver Connection

Type: MySQL 8.0+
Host: localhost
Port: 3306
Database: edg_auth
Username: edg_auth_admin
Password: Auth2025Db!

Driver Properties:
allowPublicKeyRetrieval: true
useSSL: false
serverTimezone: UTC

text

#### Schema Completo

-- ===================================================================
-- ACCOUNTS TABLE
-- ===================================================================
CREATE TABLE accounts (
id INT AUTO_INCREMENT PRIMARY KEY,
uuid CHAR(36) NOT NULL UNIQUE,
email VARCHAR(255) NOT NULL UNIQUE,
password VARCHAR(255) NOT NULL,
accountType ENUM('operatore', 'partner', 'cliente', 'agente') NOT NULL,
roleId INT NOT NULL,
isActive BOOLEAN DEFAULT true,
lastLogin DATETIME DEFAULT NULL,
createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

INDEX idx_email (email),
INDEX idx_uuid (uuid),
INDEX idx_accountType (accountType),
FOREIGN KEY (roleId) REFERENCES roles(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- ROLES TABLE
-- ===================================================================
CREATE TABLE roles (
id INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(100) NOT NULL UNIQUE,
description TEXT,
createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- ROLE_PERMISSIONS TABLE
-- ===================================================================
CREATE TABLE role_permissions (
id INT AUTO_INCREMENT PRIMARY KEY,
roleId INT NOT NULL,
permission VARCHAR(255) NOT NULL,
createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

UNIQUE KEY unique_role_permission (roleId, permission),
INDEX idx_roleId (roleId),
INDEX idx_permission (permission),
FOREIGN KEY (roleId) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- SESSIONS TABLE
-- ===================================================================
CREATE TABLE sessions (
id INT AUTO_INCREMENT PRIMARY KEY,
accountId INT NOT NULL,
refreshToken VARCHAR(500) NOT NULL UNIQUE,
deviceInfo TEXT,
ipAddress VARCHAR(45),
expiresAt DATETIME NOT NULL,
createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

INDEX idx_accountId (accountId),
INDEX idx_refreshToken (refreshToken),
INDEX idx_expiresAt (expiresAt),
FOREIGN KEY (accountId) REFERENCES accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- RESET_TOKENS TABLE
-- ===================================================================
CREATE TABLE reset_tokens (
id INT AUTO_INCREMENT PRIMARY KEY,
accountId INT NOT NULL,
token VARCHAR(255) NOT NULL UNIQUE,
expiresAt DATETIME NOT NULL,
used BOOLEAN DEFAULT false,
createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

INDEX idx_accountId (accountId),
INDEX idx_token (token),
INDEX idx_expiresAt (expiresAt),
FOREIGN KEY (accountId) REFERENCES accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

text

#### Seed Data (Ruoli Base)

-- Ruolo: SUPER_ADMIN (permessi completi)
INSERT INTO roles (id, name, description)
VALUES (1, 'SUPER_ADMIN', 'Amministratore con tutti i permessi');

INSERT INTO role_permissions (roleId, permission) VALUES
(1, '.'), -- Wildcard: tutti i permessi
(1, 'utenti.create'),
(1, 'utenti.read'),
(1, 'utenti.update'),
(1, 'utenti.delete'),
(1, 'ruoli.create'),
(1, 'ruoli.read'),
(1, 'ruoli.update'),
(1, 'ruoli.delete');

-- Ruolo: OPERATOR (operatore standard)
INSERT INTO roles (id, name, description)
VALUES (2, 'OPERATOR', 'Operatore standard con permessi limitati');

INSERT INTO role_permissions (roleId, permission) VALUES
(2, 'utenti.read'),
(2, 'report.read'),
(2, 'dashboard.read');

-- Ruolo: PARTNER (partner esterno)
INSERT INTO roles (id, name, description)
VALUES (3, 'PARTNER', 'Partner esterno con accesso limitato');

INSERT INTO role_permissions (roleId, permission) VALUES
(3, 'ordini.read'),
(3, 'ordini.create'),
(3, 'report.read');

text

#### Query Utili

-- Trova account con permessi
SELECT
a.uuid,
a.email,
a.accountType,
r.name AS role_name,
GROUP_CONCAT(rp.permission) AS permissions
FROM accounts a
JOIN roles r ON a.roleId = r.id
LEFT JOIN role_permissions rp ON r.id = rp.roleId
GROUP BY a.id;

-- Sessioni attive per account
SELECT
a.email,
s.deviceInfo,
s.ipAddress,
s.createdAt,
s.expiresAt
FROM sessions s
JOIN accounts a ON s.accountId = a.id
WHERE s.expiresAt > NOW()
ORDER BY s.createdAt DESC;

-- Token reset password non utilizzati
SELECT
a.email,
rt.token,
rt.createdAt,
rt.expiresAt
FROM reset_tokens rt
JOIN accounts a ON rt.accountId = a.id
WHERE rt.used = false AND rt.expiresAt > NOW();

text

### 3.2 MongoDB (Log Service Database)

#### Connection Details

Host: logger-mongo (Docker internal) / localhost (Host)
Port: 27017
Database: edg_logs
User: edg_logger
Password: LoggerMongo2025!
AuthDB: admin

text

#### DBeaver Connection

Type: MongoDB
Host: localhost
Port: 27017
Database: edg_logs
Authentication: SCRAM-SHA-256
Username: edg_logger
Password: LoggerMongo2025!
Auth Database: admin

Connection String:
mongodb://edg_logger:LoggerMongo2025!@localhost:27017/edg_logs?authSource=admin

text

#### Schema (Collection: azionelogs)

{
"\_id": ObjectId("6730f5a2b3e4d5e6f7a8b9c0"),

"timestamp": ISODate("2025-10-21T10:30:00.000Z"),

"origine": {
"tipo": "utente", // enum: ["utente", "sistema"]
"id": "550e8400-e29b-41d4-a716-446655440000",
"dettagli": {
"accountType": "operatore",
"email": "user@edg.com",
"ip": "192.168.1.100",
"userAgent": "Mozilla/5.0..."
}
},

"azione": {
"tipo": "create", // enum: ["create", "update", "delete", "read", "custom"]
"entita": "account",
"idEntita": "550e8400-e29b-41d4-a716-446655440001",
"operazione": "register",
"dettagli": {
"email": "new@edg.com",
"accountType": "cliente"
}
},

"stato": {
"precedente": null,
"nuovo": {
"uuid": "550e8400-e29b-41d4-a716-446655440001",
"email": "new@edg.com",
"accountType": "cliente",
"isActive": true
},
"diff": {
"created": ["uuid", "email", "accountType", "isActive"]
}
},

"contesto": {
"transazioneId": "txn_20251021103000_abc123",
"causalita": ["register_request", "validation_passed"],
"sessione": "sess_550e8400-e29b-41d4-a716-446655440000",
"ambiente": "production",
"servizio": "auth-service",
"versione": "1.0.0"
},

"risultato": {
"esito": "successo", // enum: ["successo", "fallito", "parziale"]
"codice": "ACCOUNT_CREATED",
"messaggio": "Account creato con successo",
"stackTrace": null,
"tempoEsecuzione": 245
},

"tags": ["auth", "register", "customer"],

"metadati": {
"retention": "365d",
"priority": "high"
}
}

text

#### Indexes

// Creati automaticamente da Mongoose
db.azionelogs.createIndex({ timestamp: -1 });
db.azionelogs.createIndex({ "origine.id": 1 });
db.azionelogs.createIndex({ "azione.entita": 1, "azione.tipo": 1 });
db.azionelogs.createIndex({ "contesto.transazioneId": 1 });
db.azionelogs.createIndex({ "risultato.esito": 1 });
db.azionelogs.createIndex({ tags: 1 });

text

#### Query Utili (MongoDB Shell)

// 1. Log ultimi 10
db.azionelogs.find().sort({ timestamp: -1 }).limit(10);

// 2. Log di un utente specifico
db.azionelogs.find({
"origine.id": "550e8400-e29b-41d4-a716-446655440000"
}).sort({ timestamp: -1 });

// 3. Tutti i login falliti
db.azionelogs.find({
"azione.operazione": "login",
"risultato.esito": "fallito"
});

// 4. Log di una transazione
db.azionelogs.find({
"contesto.transazioneId": "txn_20251021103000_abc123"
}).sort({ timestamp: 1 });

// 5. Statistiche per azione
db.azionelogs.aggregate([
{
$group: {
_id: "$azione.operazione",
count: { $sum: 1 },
successi: {
$sum: { $cond: [{ $eq: ["$risultato.esito", "successo"] }, 1, 0] }
},
falliti: {
$sum: { $cond: [{ $eq: ["$risultato.esito", "fallito"] }, 1, 0] }
}
}
},
{ $sort: { count: -1 } }
]);

---

## 4. MICROSERVIZI

### 4.1 Auth Service

#### Responsabilità

- **Autenticazione**: Registrazione, login, logout
- **Autorizzazione**: RBAC con permessi composti `modulo.azione`
- **Token Management**: JWT access + refresh tokens
- **Session Management**: Sessioni multiple per device
- **Password Management**: Reset via token temporaneo
- **Account Types**: Operatore, partner, cliente, agente

#### Struttura Directory

auth-service/
├── src/
│ ├── core/
│ │ ├── config/
│ │ │ ├── environment.ts # ENV vars validation
│ │ │ └── database.ts # Sequelize setup
│ │ └── server.ts # Express app setup
│ │
│ ├── modules/
│ │ └── auth/
│ │ ├── models/ # Sequelize models
│ │ │ ├── Account.ts
│ │ │ ├── Role.ts
│ │ │ ├── RolePermission.ts
│ │ │ ├── Session.ts
│ │ │ └── ResetToken.ts
│ │ │
│ │ ├── services/ # Business logic
│ │ │ ├── AuthService.ts
│ │ │ ├── TokenService.ts
│ │ │ └── PermissionService.ts
│ │ │
│ │ ├── controllers/ # HTTP handlers
│ │ │ └── AuthController.ts
│ │ │
│ │ ├── middleware/ # Express middleware
│ │ │ ├── authMiddleware.ts
│ │ │ ├── verifyGateway.ts
│ │ │ └── rateLimiter.ts
│ │ │
│ │ ├── routes/ # Route definitions
│ │ │ └── auth.routes.ts
│ │ │
│ │ ├── types/ # TypeScript interfaces
│ │ │ └── auth.types.ts
│ │ │
│ │ └── utils/ # Helper functions
│ │ ├── password.ts
│ │ ├── token.ts
│ │ └── validation.ts
│ │
│ └── app.ts # Entry point
│
├── Dockerfile
├── package.json
└── tsconfig.json

text

#### API Endpoints

| Method | Endpoint                       | Auth | Description                |
| ------ | ------------------------------ | ---- | -------------------------- |
| GET    | `/health`                      | ❌   | Health check               |
| POST   | `/auth/register`               | ❌   | Registrazione account      |
| POST   | `/auth/login`                  | ❌   | Login (JWT)                |
| POST   | `/auth/refresh`                | ❌   | Refresh token              |
| POST   | `/auth/logout`                 | ✅   | Logout sessione corrente   |
| POST   | `/auth/logout-all`             | ✅   | Logout tutti i dispositivi |
| GET    | `/auth/me`                     | ✅   | Info account               |
| POST   | `/auth/change-password`        | ✅   | Cambia password            |
| GET    | `/auth/sessions`               | ✅   | Lista sessioni             |
| POST   | `/auth/request-reset-password` | ❌   | Richiedi reset             |
| POST   | `/auth/reset-password`         | ❌   | Conferma reset             |
| GET    | `/auth/check-permission`       | ✅   | Verifica permesso          |

#### Environment Variables

Mode & Environment
NODE_ENV=production
GATEWAY_MODE=true

Server
PORT=3001

Database (MySQL)
DB_HOST=mysql
DB_PORT=3306
DB_NAME=edg_auth
DB_USER=edg_auth_admin
DB_PASSWORD=Auth2025Db!

JWT
JWT_SECRET=EDGsSDeocMK4a6NEo0TxUTSolWTixI0GioO0PhWnvp4ag025
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

Gateway
GATEWAY_SECRET=7d8b8851976626f5d3fd19ebf85a1432985e91ac0b0aa99852763b9e5324c727

CORS (solo se GATEWAY_MODE=false)
CORS_ORIGINS=http://localhost:3000

Rate Limiting
LOGIN_RATE_LIMIT_WINDOW=15
LOGIN_RATE_LIMIT_MAX_ATTEMPTS=5
REGISTER_RATE_LIMIT_WINDOW=60
REGISTER_RATE_LIMIT_MAX_ATTEMPTS=10

Log Service (Optional)
LOG_SERVICE_URL=http://log-service:4000
LOG_SERVICE_API_KEY=your-api-key
LOG_SERVICE_ENABLED=true

text

#### RBAC System

**Formato Permessi:** `modulo.azione`

**Esempi:**

- `utenti.create` - Creare utenti
- `utenti.read` - Leggere utenti
- `report.read` - Leggere report
- `ordini.*` - Tutte le azioni su ordini
- `*.read` - Read su tutti i moduli
- `*.*` - Tutti i permessi (super admin)

**Implementazione Check:**

export class PermissionService {
static hasPermission(userPermissions: string[], required: string): boolean {
// Exact match
if (userPermissions.includes(required)) return true;

text
const [module, action] = required.split('.');

// Module wildcard (utenti._)
if (userPermissions.includes(`${module}._`)) return true;

// Action wildcard (_.read)
if (userPermissions.includes(`_.${action}`)) return true;

// Full wildcard (_._)
if (userPermissions.includes('_._')) return true;

return false;
}
}

text

#### Dual Mode Architecture

**GATEWAY_MODE=false (Development):**

- CORS attivo
- Rate limiting completo nel service
- JWT validation diretta
- Ideale per sviluppo frontend

**GATEWAY_MODE=true (Production):**

- CORS disabilitato (gestito da gateway)
- Solo business rate limiting
- Trust header `X-User-Data` dal gateway
- Validazione `X-Gateway-Secret`

### 4.2 Log Service (EdgLogger)

#### Responsabilità

- **Centralized Logging**: Tutti i microservizi loggano qui
- **Action Tracking**: Tracciamento azioni utenti/sistema
- **State Diff**: Calcolo automatico differenze
- **Transaction Correlation**: Raggruppa azioni correlate
- **Statistics**: Aggregazioni e analytics

#### Struttura Directory

log-service/
├── src/
│ ├── config/
│ │ ├── database.ts # MongoDB connection
│ │ └── logger.ts # Winston config
│ │
│ ├── controllers/
│ │ └── logController.ts # Business logic
│ │
│ ├── middleware/
│ │ └── authMiddleware.ts # API key auth
│ │
│ ├── models/
│ │ └── AzioneLog.ts # Mongoose schema
│ │
│ ├── routes/
│ │ └── logRoutes.ts # Route definitions
│ │
│ ├── types/
│ │ └── log.types.ts # TypeScript types
│ │
│ ├── utils/
│ │ └── diffUtils.ts # Object diff
│ │
│ └── server.ts # Entry point
│
├── Dockerfile
├── package.json
└── tsconfig.json

text

#### API Endpoints

| Method | Endpoint                      | Auth       | Description     |
| ------ | ----------------------------- | ---------- | --------------- |
| GET    | `/health`                     | ❌         | Health check    |
| POST   | `/api/log/azione`             | ✅ API Key | Crea log        |
| GET    | `/api/log/azioni`             | ✅ API Key | Cerca log       |
| GET    | `/api/log/azioni/:id`         | ✅ API Key | Log singolo     |
| GET    | `/api/log/transazioni/:txnId` | ✅ API Key | Log transazione |
| GET    | `/api/log/statistiche`        | ✅ API Key | Statistiche     |

#### Environment Variables

Server
PORT=4000
NODE_ENV=production

MongoDB
MONGODB_URI=mongodb://edg_logger:LoggerMongo2025!@logger-mongo:27017/edg_logs?authSource=admin

Security
API_KEY_SECRET=your-secure-api-key
SKIP_AUTH=false

Logging
LOG_LEVEL=info
LOG_TO_FILE=false

text

#### Uso da Altri Microservizi

// auth-service/src/utils/loggerClient.ts
import axios from 'axios';

export class LoggerClient {
private static baseURL = process.env.LOG_SERVICE_URL;
private static apiKey = process.env.LOG_SERVICE_API_KEY;

static async logAction(data: {
origine: { tipo: 'utente' | 'sistema'; id: string };
azione: { tipo: string; entita: string; operazione: string };
risultato: { esito: 'successo' | 'fallito' | 'parziale'; messaggio?: string };
stato?: { precedente?: any; nuovo?: any };
tags?: string[];
}) {
try {
await axios.post(${this.baseURL}/api/log/azione, data, {
headers: {
'Content-Type': 'application/json',
'x-api-key': this.apiKey
},
timeout: 5000
});
} catch (error) {
console.error('[LoggerClient] Failed:', error.message);
}
}
}

// Esempio uso
await LoggerClient.logAction({
origine: { tipo: 'utente', id: account.uuid },
azione: { tipo: 'create', entita: 'account', operazione: 'register' },
risultato: { esito: 'successo', messaggio: 'Account created' },
tags: ['auth', 'register']
});

text

---

## 5. API GATEWAY

### 5.1 Responsabilità

**Routing:**

- `/auth/*` → Auth Service :3001
- `/log/*` → Log Service :4000
- Path rewriting automatico

**Security:**

- CORS configurabile
- Rate limiting generale (100 req/15min)
- Header manipulation

**Monitoring:**

- Health checks
- Request/response logging
- Error handling centralizzato

### 5.2 Implementazione

**File:** `api-gateway/gateway.js`

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 8080;

// Configuration
const AUTH_SERVICE = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
const LOG_SERVICE = process.env.LOG_SERVICE_URL || 'http://log-service:4000';
const CORS_ORIGINS = (process.env.CORS_ORIGINS || '\*').split(',');

// CORS
app.use(cors({
origin: (origin, callback) => {
if (CORS_ORIGINS.includes('\*') || !origin || CORS_ORIGINS.includes(origin)) {
callback(null, true);
} else {
callback(new Error('Not allowed by CORS'));
}
},
credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
windowMs: 15 _ 60 _ 1000,
max: 100,
message: {
success: false,
error: 'Rate limit exceeded',
message: 'Too many requests'
}
});
app.use(limiter);

// Request logging
app.use((req, res, next) => {
console.log([${new Date().toISOString()}] ${req.method} ${req.url});
next();
});

// Proxy function
async function proxyToService(req, res, targetService, targetPath = null) {
const path = targetPath || req.url;
const targetUrl = ${targetService}${path};

try {
const response = await axios({
method: req.method,
url: targetUrl,
headers: {
...req.headers,
'x-gateway-secret': process.env.GATEWAY_SECRET,
'x-forwarded-for': req.ip
},
data: ['POST', 'PUT', 'PATCH'].includes(req.method) ? req.body : undefined,
timeout: 30000,
validateStatus: () => true
});

text
res.status(response.status).send(response.data);
} catch (error) {
if (error.code === 'ECONNREFUSED') {
res.status(503).json({ error: 'Service Unavailable' });
} else if (error.code === 'ETIMEDOUT') {
res.status(504).json({ error: 'Gateway Timeout' });
} else {
res.status(502).json({ error: 'Bad Gateway' });
}
}
}

// Routes
app.get('/health', (req, res) => {
res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.all('/auth/\*', async (req, res) => {
await proxyToService(req, res, AUTH_SERVICE);
});

app.all('/log/\*', async (req, res) => {
const newPath = req.url.replace('/log', '/api/log');
await proxyToService(req, res, LOG_SERVICE, newPath);
});

app.use((req, res) => {
res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, () => {
console.log(Gateway running on port ${PORT});
});

text

### 5.3 Routing Table

| Client Request     | Gateway Forwards                              | Target Receives        |
| ------------------ | --------------------------------------------- | ---------------------- |
| `GET /health`      | - (responds directly)                         | -                      |
| `POST /auth/login` | `POST http://auth-service:3001/auth/login`    | `POST /auth/login`     |
| `POST /log/azione` | `POST http://log-service:4000/api/log/azione` | `POST /api/log/azione` |

### 5.4 Environment Variables

PORT=8080
NODE_ENV=production

AUTH_SERVICE_URL=http://auth-service:3001
LOG_SERVICE_URL=http://log-service:4000

GATEWAY_SECRET=7d8b8851976626f5d3fd19ebf85a1432985e91ac0b0aa99852763b9e5324c727
JWT_SECRET=EDGsSDeocMK4a6NEo0TxUTSolWTixI0GioO0PhWnvp4ag025

CORS_ORIGINS=http://localhost:3000,https://app.edg.com

text

---

## 6. DOCKER E DEPLOYMENT

### 6.1 Struttura Docker Compose

**File:** `edg-docker/docker-compose.yml`

version: '3.8'

networks:
external:
driver: bridge
internal:
driver: bridge

volumes:
mysql-data:
mongo-data:

services:

==================================================================
API GATEWAY
==================================================================
gateway:
build:
context: ../api-gateway
dockerfile: Dockerfile
container_name: edg-gateway
ports:

- "80:8080"
  environment:
- NODE_ENV=production
- PORT=8080
- AUTH_SERVICE_URL=http://auth-service:3001
- LOG_SERVICE_URL=http://log-service:4000
- GATEWAY_SECRET=${GATEWAY_SECRET}
- JWT_SECRET=${JWT_SECRET}
- CORS_ORIGINS=${CORS_ORIGINS}
  networks:
- external
- internal
  depends_on:
- auth-service
- log-service
  restart: unless-stopped
  healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
  interval: 30s
  timeout: 10s
  retries: 3

==================================================================
AUTH SERVICE
==================================================================
auth-service:
build:
context: ../auth-service
dockerfile: Dockerfile
container_name: edg-auth-service
environment:

- NODE_ENV=production
- GATEWAY_MODE=true
- PORT=3001
- DB_HOST=mysql
- DB_PORT=3306
- DB_NAME=${MYSQL_DATABASE}
- DB_USER=${MYSQL_USER}
- DB_PASSWORD=${MYSQL_PASSWORD}
- JWT_SECRET=${JWT_SECRET}
- JWT_ACCESS_EXPIRY=15m
- JWT_REFRESH_EXPIRY=7d
- GATEWAY_SECRET=${GATEWAY_SECRET}
- LOG_SERVICE_URL=http://log-service:4000
- LOG_SERVICE_API_KEY=${LOG_SERVICE_API_KEY}
- LOG_SERVICE_ENABLED=true
  networks:
- internal
  depends_on:
  mysql:
  condition: service_healthy
  restart: unless-stopped
  healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
  interval: 30s
  timeout: 10s
  retries: 3

==================================================================
LOG SERVICE
==================================================================
log-service:
build:
context: ../log-service
dockerfile: Dockerfile
container_name: edg-log-service
environment:

- NODE_ENV=production
- PORT=4000
- MONGODB_URI=mongodb://${MONGO_LOG_USER}:${MONGO_LOG_PASSWORD}@logger-mongo:27017/${MONGO_LOG_DATABASE}?authSource=admin
- API_KEY_SECRET=${LOG_SERVICE_API_KEY}
- LOG_LEVEL=info
  networks:
- internal
  depends_on:
  logger-mongo:
  condition: service_healthy
  restart: unless-stopped
  healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
  interval: 30s
  timeout: 10s
  retries: 3

==================================================================
MYSQL DATABASE
==================================================================
mysql:
image: mysql:8.0
container_name: edg-mysql
environment:

- MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
- MYSQL_DATABASE=${MYSQL_DATABASE}
- MYSQL_USER=${MYSQL_USER}
- MYSQL_PASSWORD=${MYSQL_PASSWORD}
  ports:
- "3306:3306" # Remove in production
  volumes:
- mysql-data:/var/lib/mysql
  networks:
- internal
  restart: unless-stopped
  healthcheck:
  test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
  interval: 10s
  timeout: 5s
  retries: 5

==================================================================
MONGODB DATABASE
==================================================================
logger-mongo:
image: mongo:7.0
container_name: edg-logger-mongo
environment:

- MONGO_INITDB_ROOT_USERNAME=admin
- MONGO_INITDB_ROOT_PASSWORD=${MONGO_ROOT_PASSWORD}
- MONGO_INITDB_DATABASE=${MONGO_LOG_DATABASE}
  ports:
- "27017:27017" # Remove in production
  volumes:
- mongo-data:/data/db
- ./init-mongo.js:/docker-entrypoint-initdb.d/init-mongo.js:ro
  networks:
- internal
  restart: unless-stopped
  healthcheck:
  test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
  interval: 10s
  timeout: 5s
  retries: 5

text

### 6.2 Dockerfile (Auth Service Example)

Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package\*.json ./
RUN npm ci --only=production

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

Production stage
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package\*.json ./

EXPOSE 3001

CMD ["node", "dist/app.js"]

text

### 6.3 MongoDB Init Script

**File:** `edg-docker/init-mongo.js`

db = db.getSiblingDB('admin');

db.createUser({
user: 'edg_logger',
pwd: 'LoggerMongo2025!',
roles: [
{
role: 'readWrite',
db: 'edg_logs'
}
]
});

db = db.getSiblingDB('edg_logs');

db.createCollection('azionelogs');

db.azionelogs.createIndex({ timestamp: -1 });
db.azionelogs.createIndex({ "origine.id": 1 });
db.azionelogs.createIndex({ "azione.entita": 1, "azione.tipo": 1 });
db.azionelogs.createIndex({ "contesto.transazioneId": 1 });
db.azionelogs.createIndex({ "risultato.esito": 1 });
db.azionelogs.createIndex({ tags: 1 });

text

---

## 7. CONFIGURAZIONE ENVIRONMENT

### 7.1 File .env Completo

**File:** `edg-docker/.env`

=================================================================
EDG PLATFORM - ENVIRONMENT VARIABLES
=================================================================

---

## MySQL Database

MYSQL_ROOT_PASSWORD=RootMySQL2025!
MYSQL_DATABASE=edg_auth
MYSQL_USER=edg_auth_admin
MYSQL_PASSWORD=Auth2025Db!

---

## MongoDB Database

MONGO_ROOT_PASSWORD=RootMongo2025!
MONGO_LOG_USER=edg_logger
MONGO_LOG_PASSWORD=LoggerMongo2025!
MONGO_LOG_DATABASE=edg_logs

---

## JWT & Authentication

JWT_SECRET=EDGsSDeocMK4a6NEo0TxUTSolWTixI0GioO0PhWnvp4ag025
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

---

## Gateway

GATEWAY_SECRET=7d8b8851976626f5d3fd19ebf85a1432985e91ac0b0aa99852763b9e5324c727

---

## CORS (comma-separated origins)

CORS_ORIGINS=http://localhost:3000,http://localhost:5173,https://app.edg.com

---

## Log Service

LOG_SERVICE_API_KEY=edg_logger_api_key_2025_secure_random_string

text

### 7.2 Generazione Secrets

JWT Secret (64 caratteri random)
openssl rand -base64 48

Gateway Secret (64 caratteri hex)
openssl rand -hex 32

API Key (alfanumerico 32 caratteri)
cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1

text

### 7.3 Variabili per Ambiente

**Development:**
NODE_ENV=development
GATEWAY_MODE=false
CORS_ORIGINS=\*
DB_LOGGING=true
LOG_LEVEL=debug

text

**Production:**
NODE_ENV=production
GATEWAY_MODE=true
CORS_ORIGINS=https://app.edg.com,https://admin.edg.com
DB_LOGGING=false
LOG_LEVEL=info

---

## 8. SETUP E AVVIO

### 8.1 Prerequisiti

**Software richiesto:**
Verifica versioni installate
docker --version # Docker 24+
docker-compose --version # Docker Compose 2.20+
curl --version # Per testing API
git --version # Per clonare repository

text

**Software opzionale:**
Per gestione database
DBeaver Community (visualizzare MySQL e MongoDB)

MySQL Workbench (alternativa per MySQL)

MongoDB Compass (alternativa per MongoDB)

Per testing API
Postman

Insomnia

HTTPie

text

### 8.2 Setup Completo (Passo-Passo)

#### Step 1: Preparazione Directory (2 minuti)

Clone repository (se applicabile)
git clone https://github.com/your-org/edg-platform.git
cd edg-platform

Oppure crea struttura manuale
mkdir -p edg-platform/{auth-service,log-service,api-gateway,edg-docker}
cd edg-platform/edg-docker

text

#### Step 2: Configurazione Environment (3 minuti)

Crea file .env
cat > .env << 'EOF'

MySQL
MYSQL_ROOT_PASSWORD=RootMySQL2025!
MYSQL_DATABASE=edg_auth
MYSQL_USER=edg_auth_admin
MYSQL_PASSWORD=Auth2025Db!

MongoDB
MONGO_ROOT_PASSWORD=RootMongo2025!
MONGO_LOG_USER=edg_logger
MONGO_LOG_PASSWORD=LoggerMongo2025!
MONGO_LOG_DATABASE=edg_logs

JWT & Gateway
JWT_SECRET=EDGsSDeocMK4a6NEo0TxUTSolWTixI0GioO0PhWnvp4ag025
GATEWAY_SECRET=7d8b8851976626f5d3fd19ebf85a1432985e91ac0b0aa99852763b9e5324c727

CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

Log Service
LOG_SERVICE_API_KEY=edg_logger_api_key_2025_secure_random
EOF

IMPORTANTE: Cambia password e secrets in production!
text

**Genera secrets sicuri:**
JWT Secret
echo "JWT_SECRET=$(openssl rand -base64 48)"

Gateway Secret
echo "GATEWAY_SECRET=$(openssl rand -hex 32)"

API Key
echo "LOG_SERVICE_API_KEY=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)"

text

#### Step 3: Build e Avvio Containers (5 minuti)

Build immagini e avvia tutti i servizi
docker-compose up -d --build

Verifica status containers
docker-compose ps

Expected output:
NAME STATUS PORTS
edg-gateway Up (healthy) 0.0.0.0:80->8080/tcp
edg-auth-service Up (healthy)
edg-log-service Up (healthy)
edg-mysql Up (healthy) 0.0.0.0:3306->3306/tcp
edg-logger-mongo Up (healthy) 0.0.0.0:27017->27017/tcp
text

#### Step 4: Verifica Sistema Attivo (2 minuti)

1. Gateway health
   curl http://localhost/health

Expected: {"status":"healthy","timestamp":"..."} 2. Auth service health (tramite gateway)
curl http://localhost/auth/health

Expected: {"status":"ok","service":"auth-service","database":"connected"} 3. Verifica logs
docker-compose logs -f --tail=50 gateway
docker-compose logs -f --tail=50 auth-service

Ctrl+C per uscire dai logs
text

#### Step 5: Seed Database (2 minuti)

Entra nel container auth-service
docker exec -it edg-auth-service sh

Esegui seed script
npm run seed:roles

Output atteso:
✅ Connected to MySQL
✅ Created role: SUPER_ADMIN
✅ Created role: OPERATOR
✅ Created role: PARTNER
✅ Seeding completed successfully
Esci dal container
exit

text

#### Step 6: Test Rapido (3 minuti)

1. Registra account di test
   curl -X POST http://localhost/auth/register
   -H "Content-Type: application/json"
   -d '{
   "email": "admin@edg.com",
   "password": "Admin123!@#",
   "accountType": "operatore",
   "roleId": 1
   }'

2. Effettua login
   curl -X POST http://localhost/auth/login
   -H "Content-Type: application/json"
   -d '{
   "email": "admin@edg.com",
   "password": "Admin123!@#",
   "accountType": "operatore"
   }'

Salva il token ricevuto
export TOKEN="eyJhbGci..."

3. Test endpoint protetto
   curl -X GET http://localhost/auth/me
   -H "Authorization: Bearer $TOKEN"

text

### 8.3 Comandi Utili

#### Docker Management

Avvia sistema
docker-compose up -d

Ferma sistema
docker-compose down

Ferma e rimuovi volumi (ATTENZIONE: cancella dati!)
docker-compose down -v

Riavvia singolo servizio
docker-compose restart auth-service

Rebuild singolo servizio
docker-compose up -d --build auth-service

Visualizza logs
docker-compose logs -f
docker-compose logs -f auth-service
docker-compose logs --tail=100 gateway

Entra in un container
docker exec -it edg-auth-service sh
docker exec -it edg-mysql mysql -u root -p

Verifica utilizzo risorse
docker stats

text

#### Database Management

MySQL: Connetti da host
mysql -h 127.0.0.1 -P 3306 -u edg_auth_admin -p

MySQL: Connetti da container
docker exec -it edg-mysql mysql -u root -p

MongoDB: Connetti da host
mongosh "mongodb://edg_logger:LoggerMongo2025!@localhost:27017/edg_logs?authSource=admin"

MongoDB: Connetti da container
docker exec -it edg-logger-mongo mongosh

Backup MySQL
docker exec edg-mysql mysqldump -u root -p edg*auth > backup*$(date +%Y%m%d).sql

Restore MySQL
docker exec -i edg-mysql mysql -u root -p edg_auth < backup_20251021.sql

Backup MongoDB
docker exec edg-logger-mongo mongodump -u edg*logger -p LoggerMongo2025! --authenticationDatabase admin --db edg_logs --out /tmp/backup
docker cp edg-logger-mongo:/tmp/backup ./mongo_backup*$(date +%Y%m%d)

Restore MongoDB
docker exec -i edg-logger-mongo mongorestore -u edg_logger -p LoggerMongo2025! --authenticationDatabase admin --db edg_logs /tmp/backup/edg_logs

text

---

## 9. TESTING E DEBUG

### 9.1 Test Suite Completa

#### Test 1: Registrazione Account

curl -X POST http://localhost/auth/register
-H "Content-Type: application/json"
-d '{
"email": "test1@edg.com",
"password": "Test123!@#",
"accountType": "operatore",
"roleId": 2
}'

Expected 201:
{
"success": true,
"message": "Account creato con successo",
"data": { "uuid": "...", "email": "test1@edg.com" }
}
text

#### Test 2: Login e JWT

curl -X POST http://localhost/auth/login
-H "Content-Type: application/json"
-d '{
"email": "test1@edg.com",
"password": "Test123!@#",
"accountType": "operatore"
}'

Expected 200:
{
"success": true,
"data": {
"accessToken": "eyJhbGci...",
"refreshToken": "eyJhbGci...",
"expiresIn": 900
}
}
Salva token
export ACCESS_TOKEN="eyJhbGci..."
export REFRESH_TOKEN="eyJhbGci..."

text

#### Test 3: Endpoint Protetto

curl -X GET http://localhost/auth/me
-H "Authorization: Bearer $ACCESS_TOKEN"

Expected 200:
{
"success": true,
"data": {
"uuid": "...",
"email": "test1@edg.com",
"accountType": "operatore",
"permissions": ["utenti.read", "report.read", "dashboard.read"]
}
}
text

#### Test 4: Refresh Token

curl -X POST http://localhost/auth/refresh
-H "Content-Type: application/json"
-d "{"refreshToken": "$REFRESH_TOKEN"}"

Expected 200:
{
"success": true,
"data": {
"accessToken": "eyJhbGci...",
"expiresIn": 900
}
}
text

#### Test 5: Change Password

curl -X POST http://localhost/auth/change-password
-H "Authorization: Bearer $ACCESS_TOKEN"
-H "Content-Type: application/json"
-d '{
"oldPassword": "Test123!@#",
"newPassword": "NewPass123!@#"
}'

Expected 200:
{
"success": true,
"message": "Password modificata con successo"
}
text

#### Test 6: Logout

curl -X POST http://localhost/auth/logout
-H "Authorization: Bearer $ACCESS_TOKEN"

Expected 200:
{
"success": true,
"message": "Logout effettuato con successo"
}
Il refresh token ora è invalidato
text

#### Test 7: Log Service

export LOG_API_KEY="edg_logger_api_key_2025_secure_random"

Crea log
curl -X POST http://localhost/log/azione
-H "Content-Type: application/json"
-H "X-API-Key: $LOG_API_KEY"
-d '{
"origine": { "tipo": "utente", "id": "test-user-123" },
"azione": { "tipo": "create", "entita": "test", "operazione": "manual_test" },
"risultato": { "esito": "successo", "messaggio": "Test log" }
}'

Cerca log
curl -X GET "http://localhost/log/azioni?limite=10"
-H "X-API-Key: $LOG_API_KEY"

Statistiche
curl -X GET http://localhost/log/statistiche
-H "X-API-Key: $LOG_API_KEY"

text

### 9.2 Debug Tools

#### Visualizza JWT Content

Installa jq se necessario
sudo apt-get install jq # Debian/Ubuntu
brew install jq # macOS
Decode JWT (parte payload)
echo "$ACCESS_TOKEN" | cut -d'.' -f2 | base64 -d | jq .

Output:
{
"accountId": 1,
"uuid": "550e8400-e29b-41d4-a716-446655440000",
"email": "test1@edg.com",
"accountType": "operatore",
"roleId": 2,
"permissions": ["utenti.read", "report.read"],
"iat": 1729512345,
"exp": 1729513245
}
text

#### Monitor Logs Real-time

Tutti i servizi
docker-compose logs -f

Filtra per servizio
docker-compose logs -f auth-service | grep ERROR
docker-compose logs -f gateway | grep 500

Ultime 100 righe
docker-compose logs --tail=100 auth-service

text

#### Database Query Debug

-- MySQL: Verifica account creati
SELECT
a.uuid,
a.email,
a.accountType,
r.name AS role,
a.createdAt
FROM accounts a
JOIN roles r ON a.roleId = r.id
ORDER BY a.createdAt DESC
LIMIT 10;

-- MySQL: Sessioni attive
SELECT
a.email,
s.deviceInfo,
s.createdAt,
s.expiresAt,
CASE WHEN s.expiresAt > NOW() THEN 'ACTIVE' ELSE 'EXPIRED' END AS status
FROM sessions s
JOIN accounts a ON s.accountId = a.id
ORDER BY s.createdAt DESC;

text
undefined
// MongoDB: Log recenti
db.azionelogs.find().sort({ timestamp: -1 }).limit(10).pretty();

// MongoDB: Conta log per risultato
db.azionelogs.aggregate([
{ $group: { _id: "$risultato.esito", count: { $sum: 1 } } }
]);

text

---

## 10. TROUBLESHOOTING

### 10.1 Problemi Comuni

#### Container non si avvia

**Sintomo:** `docker-compose ps` mostra status "Exit" o "Restarting"

**Diagnosi:**
docker-compose logs <service-name>
docker inspect <container-name>

text

**Soluzioni comuni:**

- **Port già in uso:** Cambia port mapping in docker-compose.yml
- **ENV variabile mancante:** Verifica .env file
- **Build fallito:** `docker-compose build --no-cache <service>`
- **Dipendenza non pronta:** Aumenta tempo health check

#### Database connection refused

**Sintomo:** `ECONNREFUSED` nei logs auth-service o log-service

**Diagnosi:**
docker-compose ps mysql
docker-compose logs mysql | grep ERROR
docker exec -it edg-mysql mysqladmin ping

text

**Soluzioni:**
Riavvia database
docker-compose restart mysql

Verifica credenziali in .env
cat .env | grep MYSQL

Ricostruisci container
docker-compose up -d --force-recreate mysql

Reset completo (ATTENZIONE: cancella dati!)
docker-compose down -v
docker-compose up -d

text

#### JWT invalid o expired

**Sintomo:** `401 Unauthorized` o `Invalid token`

**Cause:**

- Token effettivamente scaduto (15 minuti per access token)
- JWT_SECRET diverso tra gateway e auth-service
- Token malformato

**Soluzioni:**
Verifica JWT_SECRET uguale ovunque
docker exec edg-gateway env | grep JWT_SECRET
docker exec edg-auth-service env | grep JWT_SECRET

Effettua nuovo login
curl -X POST http://localhost/auth/login ...

Usa refresh token per rinnovo
curl -X POST http://localhost/auth/refresh -d "{"refreshToken":"..."}"

text

#### CORS error da frontend

**Sintomo:** Browser console mostra `CORS policy blocked`

**Diagnosi:**
Verifica configurazione CORS
docker exec edg-gateway env | grep CORS_ORIGINS

Test manuale
curl -H "Origin: http://localhost:3000"
-H "Access-Control-Request-Method: POST"
-X OPTIONS http://localhost/auth/login -v

text

**Soluzioni:**
Aggiungi origine in .env
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
Riavvia gateway
docker-compose restart gateway

In development, usa wildcard (NON in production!)
CORS_ORIGINS=\*
text

#### Rate limit exceeded

**Sintomo:** `429 Too Many Requests`

**Cause:**

- Superato limite gateway (100 req/15min)
- Superato limite business (es: 5 login/15min per email)

**Soluzioni:**
Attendi scadenza finestra (15 minuti)
Oppure modifica limiti in .env
Per testing, riavvia gateway (reset counters in-memory)
docker-compose restart gateway

text

#### 404 Not Found su endpoint valido

**Sintomo:** `404` su `/auth/login` o altri endpoint

**Diagnosi:**
Verifica routing gateway
docker-compose logs gateway | grep "POST /auth/login"

Verifica servizi raggiungibili
docker exec edg-gateway curl http://auth-service:3001/health
docker exec edg-gateway curl http://log-service:4000/health

text

**Soluzioni:**
Verifica URL service in gateway
docker exec edg-gateway env | grep SERVICE_URL

Riavvia gateway
docker-compose restart gateway

Verifica network
docker network inspect edg-docker_internal

text

### 10.2 Performance Issues

#### Slow response time

**Diagnosi:**
Monitor risorse
docker stats

Verifica query lente MySQL
docker exec -it edg-mysql mysql -u root -p -e "SHOW PROCESSLIST;"

Verifica slow queries MongoDB
docker exec -it edg-logger-mongo mongosh --eval "db.currentOp()"

text

**Soluzioni:**

- Aumenta risorse Docker (Settings → Resources)
- Verifica indici database
- Ottimizza query
- Aggiungi caching layer (Redis - roadmap)

#### High memory usage

**Diagnosi:**
docker stats --no-stream

text

**Soluzioni:**
Aggiungi limiti in docker-compose.yml
services:
auth-service:
deploy:
resources:
limits:
memory: 512M
reservations:
memory: 256M

text

### 10.3 Logs Utili per Debug

Gateway: Vedi tutte le richieste
docker-compose logs -f gateway | grep -E "GET|POST|PUT|DELETE"

Auth: Errori autenticazione
docker-compose logs -f auth-service | grep -i "error|fail"

Database: Connection issues
docker-compose logs mysql | grep -i "connection|error"
docker-compose logs logger-mongo | grep -i "connection|error"

Performance: Slow requests (>1s)
docker-compose logs -f | grep -E "took [0-9]{4,}ms"

text

---

## 11. CHANGELOG E STORIA

### 11.1 Release History

#### [2.0.0] - 2025-10-16

**🎉 Major Release - Production Ready**

**Aggiunto:**

- ✅ Log Service (EdgLogger) completo
- ✅ MongoDB 7.0 per log storage
- ✅ API Gateway con routing intelligente
- ✅ Documentazione completa unificata
- ✅ Docker Compose production-ready
- ✅ Health checks per tutti i servizi
- ✅ ENV migration guide

**Modificato:**

- ⚡ Refactoring Auth Service con architecture modulare
- ⚡ RBAC system v2 con wildcard support
- ⚡ JWT payload ottimizzato con permissions
- ⚡ Database schema migliorato

**Fixed:**

- 🐛 Gateway proxy path rewriting
- 🐛 MongoDB authentication issues
- 🐛 CORS configuration in dual mode
- 🐛 Rate limiting edge cases

#### [1.5.0] - 2025-09-15

**Beta Release**

**Aggiunto:**

- Auth Service base funzionante
- MySQL database con Sequelize
- JWT dual-token system
- RBAC basic implementation
- Dockerfile per auth-service

#### [1.0.0] - 2025-08-01

**Alpha Release**

**Aggiunto:**

- Proof of concept iniziale
- Database schema design
- API endpoint design

### 11.2 Decisioni Architetturali

#### Perché Microservizi?

**Decisione:** Architettura microservizi invece di monolite

**Motivazioni:**

- Scalabilità indipendente di auth e log
- Isolamento failure (un servizio down non blocca tutto)
- Deploy indipendenti
- Team separation possibile in futuro
- Technology stack diverso per servizio (MySQL vs MongoDB)

**Trade-off accettati:**

- Complessità operativa maggiore
- Overhead network tra servizi
- Necessità orchestrazione (Docker Compose)

#### Perché MongoDB per Log?

**Decisione:** MongoDB invece di MySQL per log service

**Motivazioni:**

- Schema flessibile per log strutturati
- Performance eccellenti su time-series data
- Query aggregate potenti
- Horizontal scaling più semplice
- Document model naturale per log nested

**Trade-off accettati:**

- Consistenza eventuale invece di ACID
- Query relazionali complesse più difficili
- Due database da mantenere

#### Perché JWT in Payload?

**Decisione:** Permissions in JWT payload invece di query DB

**Motivazioni:**

- Zero database queries per autorizzazione
- Latenza ridotta drasticamente
- Stateless services (scale horizontally)
- Offline validation possibile

**Trade-off accettati:**

- Token size maggiore (~2-3 KB)
- Permessi aggiornati solo al refresh (max 7 giorni)
- Soluzione: logout-all per cambio permessi immediato

#### Perché Dual Mode (GATEWAY_MODE)?

**Decisione:** Supporto standalone e gateway mode

**Motivazioni:**

- Development experience migliore (no gateway overhead)
- Frontend testing più veloce
- Production security massima con gateway
- Flexibility per deployment scenarios diversi

**Trade-off accettati:**

- Configurazione più complessa
- Due code path da testare
- ENV variabili aggiuntive

### 11.3 Breaking Changes Log

#### v2.0.0 (2025-10-16)

**MongoDB Environment Variables - BREAKING**

RIMOSSO
MONGO_DATABASE=edg_logger
MONGO_ROOT_USER=edg_logger_admin
MONGO_ROOT_PASSWORD=Logger2025Db!

AGGIUNTO
MONGO_LOG_USER=edg_logger
MONGO_LOG_PASSWORD=LoggerMongo2025!
MONGO_LOG_DATABASE=edg_logs

text

**Azione richiesta:** Vedi Appendice A per migrazione completa

### 11.4 Known Issues

#### Issue #1: JWT Refresh durante permessi change

**Status:** Known limitation  
**Workaround:** Usa `/auth/logout-all` dopo cambio permessi

**Descrizione:** Se i permessi di un utente cambiano (cambio ruolo), il JWT esistente mantiene vecchi permessi fino a scadenza refresh token (max 7 giorni).

**Workaround:**
Admin forza logout dell'utente modificato
curl -X POST http://localhost/auth/admin/logout-user
-H "Authorization: Bearer $ADMIN_TOKEN"
-d '{"userId": "uuid-utente"}'

Oppure utente fa logout-all
curl -X POST http://localhost/auth/logout-all
-H "Authorization: Bearer $USER_TOKEN"

text

**Roadmap fix v2.1.0:** Redis cache per permission invalidation real-time

#### Issue #2: Log Service single point of failure

**Status:** By design, mitigated  
**Impact:** Low (non blocca auth)

**Descrizione:** Se log-service è down, i log vanno persi ma auth continua a funzionare.

**Mitigation attuale:**
// auth-service logging è non-blocking
try {
await LoggerClient.logAction(...);
} catch (error) {
console.error('Log failed but continuing');
// Operation continues successfully
}

text

**Roadmap fix v2.2.0:** Message queue (RabbitMQ) per log buffering

### 11.5 Roadmap

#### v2.1.0 - Q1 2026 (Planned)

- [ ] Email service per reset password
- [ ] Redis cache per permissions invalidation
- [ ] Prometheus metrics export
- [ ] Grafana dashboards
- [ ] Health checks avanzati con alerting
- [ ] API versioning (v1, v2)

#### v3.0.0 - Q2-Q3 2026 (Vision)

- [ ] Two-factor authentication (TOTP)
- [ ] OAuth2 provider (EDG come IdP)
- [ ] Admin UI (React/Vue)
- [ ] Audit log completo con export
- [ ] CI/CD pipeline templates
- [ ] Kubernetes manifests
- [ ] Multi-region support

#### v3.1.0+ - Long Term

- [ ] WebSocket support
- [ ] GraphQL gateway
- [ ] Multi-tenancy
- [ ] Plugin system
- [ ] SDK client (Python, Go, Java)
- [ ] Machine learning per anomaly detection

---

## APPENDICE A: MIGRAZIONE ENVIRONMENT VARIABLES

### A.1 Scenario: Migrazione da v1.x a v2.0

Se stai aggiornando da versione precedente, segui questa guida passo-passo.

#### Modifiche Necessarie

**❌ RIMUOVI queste variabili:**
MONGO_DATABASE=edg_logger
MONGO_ROOT_USER=edg_logger_admin
MONGO_ROOT_PASSWORD=Logger2025Db!

text

**✅ AGGIUNGI queste variabili:**
MONGO_ROOT_PASSWORD=RootMongo2025!
MONGO_LOG_USER=edg_logger
MONGO_LOG_PASSWORD=LoggerMongo2025!
MONGO_LOG_DATABASE=edg_logs
LOG_SERVICE_API_KEY=edg_logger_api_key_2025_secure_random

text

#### Procedura Migrazione

**Step 1: Backup dati esistenti**
Backup MySQL
docker exec edg-mysql mysqldump -u root -p edg_auth > backup_mysql_pre_v2.sql

Backup MongoDB (se esistente)
docker exec edg-logger-mongo mongodump --out /tmp/backup
docker cp edg-logger-mongo:/tmp/backup ./backup_mongo_pre_v2

text

**Step 2: Ferma sistema**
docker-compose down

text

**Step 3: Aggiorna .env file**
Backup .env vecchio
cp .env .env.v1.backup

Crea nuovo .env v2.0
cat > .env << 'EOF'

[Copia contenuto .env nuovo da sezione 7.1]
EOF

text

**Step 4: Pull nuove immagini**
git pull origin main # Se usi git

Oppure scarica nuovi file manualmente
text

**Step 5: Rebuild e riavvio**
docker-compose build --no-cache
docker-compose up -d

text

**Step 6: Verifica migrazione**
Verifica servizi attivi
docker-compose ps

Test login esistente
curl -X POST http://localhost/auth/login
-H "Content-Type: application/json"
-d '{"email":"existing@user.com","password":"\*\*\*","accountType":"operatore"}'

text

**Step 7: Test log service**
export LOG_API_KEY="edg_logger_api_key_2025_secure_random"

curl -X POST http://localhost/log/azione
-H "Content-Type: application/json"
-H "X-API-Key: $LOG_API_KEY"
-d '{"origine":{"tipo":"sistema","id":"migration-test"},"azione":{"tipo":"custom","entita":"test","operazione":"migration_verification"},"risultato":{"esito":"successo"}}'

text

---

## APPENDICE B: SCRIPT UTILI

### B.1 Script Reset Completo

#!/bin/bash

reset-edg-platform.sh
ATTENZIONE: Cancella TUTTI i dati!
echo "⚠️ Questo script cancellerà TUTTI i dati!"
read -p "Sei sicuro? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
echo "Operazione annullata."
exit 0
fi

echo "🛑 Fermando containers..."
docker-compose down -v

echo "🗑️ Rimuovendo immagini..."
docker-compose rm -f

echo "🔨 Rebuild da zero..."
docker-compose build --no-cache

echo "🚀 Avvio sistema..."
docker-compose up -d

echo "⏳ Attendo che i servizi siano pronti (30s)..."
sleep 30

echo "🌱 Seed database..."
docker exec edg-auth-service npm run seed:roles

echo "✅ Reset completato!"
echo "📊 Status sistema:"
docker-compose ps

text

### B.2 Script Backup Automatico

#!/bin/bash

backup-edg-platform.sh
BACKUP*DIR="./backups/$(date +%Y%m%d*%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📦 Backup MySQL..."
docker exec edg-mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} edg_auth > "$BACKUP_DIR/mysql_edg_auth.sql"

echo "📦 Backup MongoDB..."
docker exec edg-logger-mongo mongodump
-u edg_logger
-p ${MONGO_LOG_PASSWORD}
--authenticationDatabase admin
--db edg_logs
--out /tmp/backup

docker cp edg-logger-mongo:/tmp/backup/edg_logs "$BACKUP_DIR/mongo_edg_logs"

echo "📦 Backup .env..."
cp .env "$BACKUP_DIR/.env"

echo "✅ Backup completato in $BACKUP_DIR"

text

### B.3 Script Health Check Completo

#!/bin/bash

health-check.sh
echo "🔍 EDG Platform Health Check"
echo "================================"

Gateway
echo -n "Gateway: "
if curl -sf http://localhost/health > /dev/null; then
echo "✅ OK"
else
echo "❌ FAIL"
fi

Auth Service
echo -n "Auth Service: "
if curl -sf http://localhost/auth/health > /dev/null; then
echo "✅ OK"
else
echo "❌ FAIL"
fi

MySQL
echo -n "MySQL: "
if docker exec edg-mysql mysqladmin ping -h localhost --silent; then
echo "✅ OK"
else
echo "❌ FAIL"
fi

MongoDB
echo -n "MongoDB: "
if docker exec edg-logger-mongo mongosh --quiet --eval "db.adminCommand('ping')" > /dev/null; then
echo "✅ OK"
else
echo "❌ FAIL"
fi

echo "================================"
echo "📊 Container Status:"
docker-compose ps

text

---

## APPENDICE C: FAQ

### C.1 Domande Generali

**Q: Posso usare EDG Platform in produzione?**  
A: Sì, versione 2.0+ è production-ready. Assicurati di:

- Cambiare TUTTE le password e secrets
- Rimuovere port mapping database in production
- Configurare CORS con origini specifiche
- Implementare backup automatici
- Configurare monitoring (Prometheus/Grafana)

**Q: Come scalo il sistema?**  
A: Attualmente:

- Scale orizzontale: Docker Swarm o Kubernetes
- Scale verticale: Aumenta risorse Docker
- Database: MySQL replication, MongoDB sharding
- Roadmap v3: Load balancer nativo, session sharing

**Q: Quanto costa operare EDG Platform?**  
A: Open source, costo = infrastruttura:

- Development: Free (Docker Desktop locale)
- Production small: ~$20-50/mese (VPS 2-4 GB RAM)
- Production medium: ~$100-200/mese (3 server + DB managed)
- Enterprise: Varia, consigliato Kubernetes cluster

**Q: Supporta multi-tenant?**  
A: Non ancora. Roadmap v3.1+. Workaround attuale:

- Deploy istanza separata per tenant
- O usa accountType per segregazione logica

### C.2 Sicurezza

**Q: JWT_SECRET compromesso, cosa faccio?**  
A:

1. Genera nuovo secret: `openssl rand -base64 48`
2. Aggiorna .env con nuovo secret
3. Riavvia auth-service e gateway
4. TUTTI gli utenti devono fare nuovo login (JWT vecchi invalidi)

**Q: Come ruoto le password database?**  
A:

1. Crea nuovo utente MySQL/MongoDB con nuova password
2. Aggiorna .env con nuove credenziali
3. Riavvia servizi
4. Verifica funzionamento
5. Rimuovi utente vecchio

**Q: Rate limiting è sufficiente contro DDoS?**  
A: No. Rate limiting protegge contro:

- Brute force password
- API abuse normale
  Ma NON contro DDoS distribuito. Usa:
- CloudFlare (free tier disponibile)
- AWS Shield / Azure DDoS Protection
- Nginx rate limiting upstream

### C.3 Sviluppo

**Q: Come sviluppo localmente senza Docker?**  
A:
Auth Service standalone
cd auth-service
npm install
cp .env.example .env
npm run dev

Configura GATEWAY_MODE=false
Avvia MySQL localmente (brew/apt install mysql)
Connetti a localhost:3001
text

**Q: Come aggiungo nuovo microservizio?**  
A: Segui pattern esistente:

1. Crea directory `new-service/`
2. Struttura: `src/`, `Dockerfile`, `package.json`
3. Aggiungi in `docker-compose.yml`
4. Configura routing in gateway
5. Documenta in DOCUMENTATION.md

**Q: Posso sostituire MySQL con PostgreSQL?**  
A: Sì, Sequelize supporta PostgreSQL:

1. Cambia `dialect: 'postgres'` in database.ts
2. Adatta docker-compose.yml con postgres:14
3. Aggiorna ENV variabili (PORT 5432)
4. Testa migrazioni schema

---

## 📞 SUPPORTO

**Documentazione:**

- README.md - Overview e quick start
- DOCUMENTATION.md - Questo documento
- API-REFERENCE.md - API dettagliata

**Community:**

- GitHub Issues (se open source)
- Slack/Discord channel (se disponibile)

**Enterprise Support:**

- Contatta team per supporto dedicato

---

**Versione Documentazione:** 2.0.0  
**Data Ultimo Aggiornamento:** 21 Ottobre 2025  
**Status:** ✅ Production Ready

---

🎉 **Fine Documentazione EDG Platform**
✅ RIEPILOGO FINALE
Hai ora 3 file completi pronti per l'uso:

📄 README.md (~15 KB)
Entry point per nuovi utenti

Navigazione intelligente per ruolo

Quick start 3 comandi

Features overview

Test rapido

Troubleshooting essenziale

Roadmap
