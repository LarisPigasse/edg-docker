# 🚀 EDG PLATFORM - Documentazione Completa

**Versione:** 2.0  
**Data:** 16 Ottobre 2025  
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

---

## 1. PANORAMICA SISTEMA

### 1.1 Tipo di Sistema

**Piattaforma microservizi EDG** per gestione autenticazione, logging e business logic.

### 1.2 Componenti Principali

```
┌──────────────────────────────────────────────────┐
│              EDG PLATFORM                        │
├──────────────────────────────────────────────────┤
│                                                  │
│  🌐 API Gateway (Express)                       │
│     • Routing                                    │
│     • CORS                                       │
│     • Rate Limiting                              │
│     • Authentication                             │
│                                                  │
│  🔐 Auth Service (Node.js + TypeScript)         │
│     • JWT Authentication                         │
│     • RBAC Permissions                           │
│     • Multi-account Types                        │
│     • Session Management                         │
│                                                  │
│  📝 Log Service (Node.js + TypeScript)          │
│     • Centralized Logging                        │
│     • Action Tracking                            │
│     • Transaction Logs                           │
│     • Statistics                                 │
│                                                  │
│  💾 Databases                                    │
│     • MySQL (Auth data)                          │
│     • MongoDB (Logs data)                        │
│                                                  │
└──────────────────────────────────────────────────┘
```

### 1.3 Stack Tecnologico

```yaml
Runtime:        Node.js 18+
Language:       TypeScript 5.8+
Framework:      Express.js 5.x
Databases:      
  - MySQL 8.0 (Sequelize ORM)
  - MongoDB 7.0 (Mongoose)
Auth:           JWT (jsonwebtoken)
Security:       BCrypt, Helmet, CORS, Rate Limiting
Container:      Docker + Docker Compose
Proxy:          http-proxy-middleware / axios
Tools:          DBeaver (DB management)
```

---

## 2. ARCHITETTURA E NETWORK

### 2.1 Architettura Generale

```
                        INTERNET
                           │
                           │ HTTPS
                           │
                    ┌──────▼──────┐
                    │   Nginx /   │
                    │  CloudFlare │
                    └──────┬──────┘
                           │
                           │ HTTP :80
                           │
        ┌──────────────────▼──────────────────┐
        │         EXTERNAL NETWORK            │
        │      (docker network: external)     │
        └──────────────────┬──────────────────┘
                           │
                    ┌──────▼──────┐
                    │ API Gateway │
                    │   :8080     │
                    └──────┬──────┘
                           │
        ┌──────────────────▼──────────────────┐
        │         INTERNAL NETWORK            │
        │      (docker network: internal)     │
        │                                     │
        │  ┌─────────────┐  ┌─────────────┐ │
        │  │Auth Service │  │ Log Service │ │
        │  │    :3001    │  │    :4000    │ │
        │  └──────┬──────┘  └──────┬──────┘ │
        │         │                 │        │
        │  ┌──────▼──────┐  ┌──────▼──────┐ │
        │  │    MySQL    │  │   MongoDB   │ │
        │  │    :3306    │  │   :27017    │ │
        │  └─────────────┘  └─────────────┘ │
        │         │                 │        │
        └─────────┼─────────────────┼────────┘
                  │                 │
         [DBeaver MySQL]   [DBeaver MongoDB]
       (localhost:3306)   (localhost:27017)
```

### 2.2 Network Isolation

#### External Network
- **Scopo:** Accesso pubblico
- **Componenti:** Solo API Gateway
- **Accesso:** Internet → Gateway :80

#### Internal Network  
- **Scopo:** Comunicazione microservizi
- **Componenti:** Gateway, Auth-Service, Log-Service, MySQL, MongoDB
- **Accesso:** Solo tra container Docker (isolato da internet)

#### Database Access (Development)
- MySQL e MongoDB espongono porte per DBeaver
- **Produzione:** Rimuovere `ports` mapping per completo isolamento

### 2.3 Security Model

```
┌─────────────────────────────────────────────────┐
│            SECURITY LAYERS                      │
├─────────────────────────────────────────────────┤
│                                                 │
│  1️⃣ NETWORK ISOLATION                          │
│     • Microservizi su rete interna             │
│     • Solo gateway esposto                     │
│                                                 │
│  2️⃣ API GATEWAY                                │
│     • CORS protection                          │
│     • Rate limiting (100 req/15min)            │
│     • JWT validation                           │
│                                                 │
│  3️⃣ AUTH SERVICE                               │
│     • JWT signing/verification                 │
│     • Password hashing (BCrypt)                │
│     • Session management                       │
│     • Business rate limiting:                  │
│       - Login: 5 attempts/15min per email      │
│       - Register: 10 attempts/hour per IP      │
│       - Reset: 3 attempts/hour per email       │
│                                                 │
│  4️⃣ LOG SERVICE                                │
│     • API key authentication                   │
│     • Internal access only                     │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 3. DATABASE

### 3.1 MySQL (Auth Service)

#### Schema

```sql
┌──────────────────────────────────────────┐
│              MYSQL SCHEMA                │
├──────────────────────────────────────────┤
│                                          │
│  accounts                                │
│  ├── id (INT, PK, AUTO_INCREMENT)       │
│  ├── uuid (UUID, UNIQUE)                │
│  ├── email (VARCHAR, UNIQUE)            │
│  ├── password (VARCHAR, hashed)         │
│  ├── accountType (ENUM)                 │
│  ├── roleId (INT, FK → roles)           │
│  └── timestamps                          │
│                                          │
│  roles                                   │
│  ├── id (INT, PK)                       │
│  ├── name (VARCHAR, UNIQUE)             │
│  ├── description (TEXT)                 │
│  └── timestamps                          │
│                                          │
│  role_permissions                        │
│  ├── id (INT, PK, AUTO_INCREMENT)       │
│  ├── roleId (INT, FK → roles)           │
│  ├── resource (VARCHAR)                 │
│  ├── action (VARCHAR)                   │
│  └── timestamps                          │
│      UNIQUE(roleId, resource, action)   │
│                                          │
│  sessions                                │
│  ├── id (INT, PK, AUTO_INCREMENT)       │
│  ├── accountId (INT, FK → accounts)     │
│  ├── refreshToken (VARCHAR, UNIQUE)     │
│  ├── expiresAt (DATETIME)               │
│  └── timestamps                          │
│                                          │
│  reset_tokens                            │
│  ├── id (INT, PK, AUTO_INCREMENT)       │
│  ├── accountId (INT, FK → accounts)     │
│  ├── token (VARCHAR, UNIQUE)            │
│  ├── expiresAt (DATETIME)               │
│  └── timestamps                          │
│                                          │
└──────────────────────────────────────────┘
```

#### Connection Details

```
Host:     mysql (Docker) / localhost (Host)
Port:     3306
Database: edg_auth
User:     edg_auth_admin
Password: Auth2025Db!
```

#### DBeaver Connection

```
Type:           MySQL 8.0+
Host:           localhost
Port:           3306
Database:       edg_auth
Username:       edg_auth_admin
Password:       Auth2025Db!
Driver Props:
  allowPublicKeyRetrieval: true
  useSSL: false
```

### 3.2 MongoDB (Log Service)

#### Schema (Collection: azionelogs)

```javascript
{
  _id: ObjectId("..."),
  timestamp: ISODate("2025-10-16T10:00:00.000Z"),
  
  origine: {
    tipo: "utente" | "sistema",
    id: String,
    dettagli: Object
  },
  
  azione: {
    tipo: "create" | "update" | "delete" | "custom",
    entita: String,
    idEntita: String,
    operazione: String,
    dettagli: Object
  },
  
  stato: {
    precedente: Object | null,
    nuovo: Object | null,
    diff: Object | null  // Calcolato automaticamente
  },
  
  contesto: {
    transazioneId: String,
    causalita: [String],
    sessione: String,
    ip: String,
    userAgent: String,
    ambiente: String
  },
  
  risultato: {
    esito: "successo" | "fallito" | "parziale",
    codice: String,
    messaggio: String,
    stackTrace: String,
    tempoEsecuzione: Number
  },
  
  tags: [String]
}
```

#### Connection Details

```
Host:     logger-mongo (Docker) / localhost (Host)
Port:     27017
Database: edg_logs
User:     edg_logger
Password: LoggerMongo2025!
AuthDB:   admin
```

#### DBeaver Connection

```
Type:               MongoDB
Host:               localhost
Port:               27017
Database:           edg_logs
Authentication:     SCRAM-SHA-256
Username:           edg_logger
Password:           LoggerMongo2025!
Auth Database:      admin

Connection String:
mongodb://edg_logger:LoggerMongo2025!@localhost:27017/edg_logs?authSource=admin
```

---

## 4. MICROSERVIZI

### 4.1 Auth Service

#### Responsabilità

- Autenticazione JWT (access + refresh tokens)
- Autorizzazione RBAC con permessi composti
- Gestione account multi-tipo (operatore, partner, cliente, agente)
- Reset password via token
- Gestione sessioni multiple per dispositivo

#### Struttura Directory

```
auth-service/
├── src/
│   ├── core/
│   │   ├── config/
│   │   │   ├── environment.ts      # ENV vars management
│   │   │   └── database.ts         # Sequelize DatabaseManager
│   │   └── server.ts               # EDGServer (Express modulare)
│   │
│   ├── modules/
│   │   └── auth/
│   │       ├── models/             # Sequelize models
│   │       │   ├── Account.ts
│   │       │   ├── Role.ts
│   │       │   ├── RolePermission.ts
│   │       │   ├── Session.ts
│   │       │   ├── ResetToken.ts
│   │       │   ├── associations.ts
│   │       │   └── index.ts
│   │       │
│   │       ├── services/           # Business logic
│   │       │   ├── AuthService.ts
│   │       │   └── TokenService.ts
│   │       │
│   │       ├── controllers/        # HTTP handlers
│   │       │   └── AuthController.ts
│   │       │
│   │       ├── middleware/         # Express middleware
│   │       │   ├── authMiddleware.ts    # JWT validation
│   │       │   └── verifyGateway.ts     # Gateway security
│   │       │
│   │       ├── routes/             # Route definitions
│   │       │   └── auth.routes.ts
│   │       │
│   │       ├── types/              # TypeScript types
│   │       │   └── auth.types.ts
│   │       │
│   │       ├── utils/              # Utilities
│   │       │   ├── password.ts
│   │       │   ├── token.ts
│   │       │   └── validation.ts
│   │       │
│   │       └── seed/               # Database seeders
│   │           └── roles.seed.ts
│   │
│   └── app.ts                      # Entry point
│
├── Dockerfile
├── package.json
├── tsconfig.json
└── .env
```

#### API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Health check |
| POST | `/auth/register` | No | Registrazione account |
| POST | `/auth/login` | No | Login (restituisce JWT) |
| POST | `/auth/refresh` | No | Refresh access token |
| POST | `/auth/logout` | No | Logout (invalida refresh token) |
| POST | `/auth/logout-all` | Yes | Logout da tutti i dispositivi |
| GET | `/auth/me` | Yes | Informazioni account corrente |
| POST | `/auth/change-password` | Yes | Cambio password |
| POST | `/auth/request-reset-password` | No | Richiesta reset password |
| POST | `/auth/reset-password` | No | Conferma reset password |

#### Dual Mode Operation

**GATEWAY_MODE=false (Development - Standalone)**
```
Frontend → Auth-Service:3001
           ↓
       Valida JWT direttamente
       CORS attivo
       Rate limiting attivo
```

**GATEWAY_MODE=true (Production - Gateway)**
```
Frontend → Gateway:80 → Auth-Service:3001
           ↓            ↓
       Valida JWT    Trust X-User-Data header
                     NO CORS (gestito da gateway)
                     Business rate limiting only
```

#### Environment Variables

```env
# Mode
NODE_ENV=production
GATEWAY_MODE=true

# Database
DB_HOST=mysql
DB_PORT=3306
DB_NAME=edg_auth
DB_USER=edg_auth_admin
DB_PASSWORD=Auth2025Db!
DB_SYNC=false

# JWT
JWT_SECRET=EDGsSDeocMK4a6NEo0TxUTSolWTixI0GioO0PhWnvp4ag025
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Gateway
GATEWAY_SECRET=7d8b8851976626f5d3fd19ebf85a1432985e91ac0b0aa99852763b9e5324c727

# Service
PORT=3001
SERVICE_NAME=EDG Auth Service

# Rate Limiting (Business Logic)
LOGIN_RATE_LIMIT_WINDOW=15
LOGIN_RATE_LIMIT_MAX_ATTEMPTS=5
RESET_PASSWORD_RATE_LIMIT_WINDOW=60
RESET_PASSWORD_RATE_LIMIT_MAX_ATTEMPTS=3
REGISTER_RATE_LIMIT_WINDOW=60
REGISTER_RATE_LIMIT_MAX_ATTEMPTS=10
```

### 4.2 Log Service (EdgLogger)

#### Responsabilità

- Logging centralizzato per tutti i microservizi
- Tracciamento azioni utenti e sistema
- Gestione transazioni correlate
- Statistiche e analisi aggregate

#### Struttura Directory

```
log-service/
├── src/
│   ├── config/
│   │   ├── database.ts         # MongoDB connection
│   │   └── logger.ts           # Winston logger
│   │
│   ├── controllers/
│   │   └── logController.ts    # Business logic
│   │
│   ├── middleware/
│   │   └── authMiddleware.ts   # API key authentication
│   │
│   ├── models/
│   │   └── AzioneLog.ts        # Mongoose schema
│   │
│   ├── routes/
│   │   └── logRoutes.ts        # Route definitions
│   │
│   ├── types/
│   │   └── express.ts          # Express type extensions
│   │
│   ├── utils/
│   │   └── diffUtils.ts        # Diff calculation
│   │
│   └── server.ts               # Entry point
│
├── Dockerfile
├── package.json
├── tsconfig.json
└── .env
```

#### API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Health check |
| POST | `/api/log/azione` | API Key | Crea nuovo log |
| GET | `/api/log/azioni` | API Key | Cerca log con filtri |
| GET | `/api/log/azioni/:id` | API Key | Recupera log per ID |
| GET | `/api/log/transazioni/:id` | API Key | Log di una transazione |
| GET | `/api/log/statistiche` | API Key | Statistiche aggregate |

#### Environment Variables

```env
# Server
PORT=4000
NODE_ENV=production

# MongoDB
MONGODB_URI=mongodb://edg_logger:LoggerMongo2025!@logger-mongo:27017/edg_logs?authSource=admin

# Security
API_KEY_SECRET=edg_logger_api_key_2025_secure_random_string_change_in_production
SKIP_AUTH=false
```

#### Uso da Altri Microservizi

```typescript
// Esempio da auth-service
import axios from 'axios';

const logAction = async (logData: any) => {
  try {
    await axios.post('http://log-service:4000/api/log/azione', logData, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.LOG_API_KEY_SECRET
      }
    });
  } catch (error) {
    console.error('Failed to send log:', error.message);
  }
};

// Uso
await logAction({
  origine: {
    tipo: 'sistema',
    id: 'auth-service',
    dettagli: { module: 'AuthController' }
  },
  azione: {
    tipo: 'create',
    entita: 'account',
    idEntita: newAccount.uuid,
    operazione: 'register',
    dettagli: { email: newAccount.email }
  },
  risultato: {
    esito: 'successo'
  },
  tags: ['auth', 'register']
});
```

---

## 5. API GATEWAY

### 5.1 Responsabilità

- Routing verso microservizi
- CORS handling
- Rate limiting generale
- JWT validation (futuro)
- Request/Response logging

### 5.2 Implementazione

**File:** `api-gateway/gateway.js`

```javascript
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

// Services URLs
const AUTH_SERVICE = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
const LOG_SERVICE = process.env.LOG_SERVICE_URL || 'http://log-service:4000';

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Proxy function
async function proxyToService(req, res, targetService, targetPath = null) {
  const path = targetPath || req.url;
  const targetUrl = `${targetService}${path}`;
  
  try {
    const axiosConfig = {
      method: req.method,
      url: targetUrl,
      headers: { ...req.headers },
      data: req.body,
      timeout: 30000,
      validateStatus: () => true
    };
    
    delete axiosConfig.headers['host'];
    delete axiosConfig.headers['content-length'];
    
    const response = await axios(axiosConfig);
    res.status(response.status).send(response.data);
  } catch (error) {
    res.status(502).json({ 
      error: 'Bad Gateway', 
      message: error.message 
    });
  }
}

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'api-gateway' });
});

// Auth service: /auth/health → /health (special case)
app.get('/auth/health', async (req, res) => {
  await proxyToService(req, res, AUTH_SERVICE, '/health');
});

// Auth service: /auth/* → /auth/*
app.all('/auth/*', async (req, res) => {
  await proxyToService(req, res, AUTH_SERVICE);
});

// Log service: /log/* → /api/log/*
app.all('/log/*', async (req, res) => {
  const path = req.url.replace('/log', '/api/log');
  await proxyToService(req, res, LOG_SERVICE, path);
});

app.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`);
});
```

### 5.3 Routing Table

| Client Request | Gateway Proxies To | Service Receives |
|---|---|---|
| `GET /health` | - | Gateway responds directly |
| `GET /auth/health` | `GET /health` | auth-service `/health` |
| `POST /auth/login` | `POST /auth/login` | auth-service `/auth/login` |
| `GET /auth/me` | `GET /auth/me` | auth-service `/auth/me` |
| `POST /log/azione` | `POST /api/log/azione` | log-service `/api/log/azione` |

---

## 6. DOCKER E DEPLOYMENT

### 6.1 Docker Compose Configuration

**File:** `edg-docker/docker-compose.yml`

```yaml
version: '3.8'

networks:
  internal:
    driver: bridge
  external:
    driver: bridge

services:
  # MySQL
  mysql:
    image: mysql:8.0
    container_name: edg-mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - mysql-data:/var/lib/mysql
    networks:
      - internal
    ports:
      - '3306:3306'
    healthcheck:
      test: ['CMD', 'mysqladmin', 'ping', '-h', 'localhost']
      timeout: 20s
      retries: 10

  # MongoDB
  logger-mongo:
    image: mongo:7.0
    container_name: edg-logger-mongo
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_LOG_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_LOG_PASSWORD}
      MONGO_INITDB_DATABASE: ${MONGO_LOG_DATABASE}
    volumes:
      - mongo-log-data:/data/db
    networks:
      - internal
    ports:
      - '27017:27017'
    healthcheck:
      test: ['CMD', 'mongosh', '--eval', "db.adminCommand('ping')"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Auth Service
  auth-service:
    build: ./auth-service
    container_name: edg-auth-service
    restart: always
    depends_on:
      mysql:
        condition: service_healthy
    environment:
      NODE_ENV: production
      GATEWAY_MODE: 'true'
      GATEWAY_SECRET: ${GATEWAY_SECRET}
      DB_HOST: mysql
      DB_NAME: ${MYSQL_DATABASE}
      DB_USER: ${MYSQL_USER}
      DB_PASSWORD: ${MYSQL_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      PORT: 3001
    expose:
      - '3001'
    networks:
      - internal
    healthcheck:
      test: ['CMD-SHELL', 'wget --spider http://localhost:3001/health || exit 1']
      interval: 30s

  # Log Service
  log-service:
    build: ./log-service
    container_name: edg-log-service
    restart: always
    depends_on:
      logger-mongo:
        condition: service_healthy
    environment:
      PORT: 4000
      NODE_ENV: production
      MONGODB_URI: mongodb://${MONGO_LOG_USER}:${MONGO_LOG_PASSWORD}@logger-mongo:27017/${MONGO_LOG_DATABASE}?authSource=admin
      API_KEY_SECRET: ${LOG_API_KEY_SECRET}
    expose:
      - '4000'
    networks:
      - internal
    healthcheck:
      test: ['CMD-SHELL', 'wget --spider http://localhost:4000/health || exit 1']
      interval: 30s

  # API Gateway
  api-gateway:
    build: ./api-gateway
    container_name: edg-api-gateway
    restart: always
    depends_on:
      auth-service:
        condition: service_healthy
      log-service:
        condition: service_healthy
    environment:
      NODE_ENV: production
      AUTH_SERVICE_URL: http://auth-service:3001
      LOG_SERVICE_URL: http://log-service:4000
      JWT_SECRET: ${JWT_SECRET}
      GATEWAY_SECRET: ${GATEWAY_SECRET}
      CORS_ORIGINS: ${CORS_ORIGINS}
    ports:
      - '80:8080'
    networks:
      - internal
      - external
    healthcheck:
      test: ['CMD-SHELL', 'wget --spider http://localhost:8080/health || exit 1']
      interval: 30s

volumes:
  mysql-data:
  mongo-log-data:
```

### 6.2 Dockerfiles

#### Auth Service Dockerfile

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3001
CMD ["npm", "start"]
```

#### Log Service Dockerfile

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine
ENV NODE_ENV production
RUN addgroup appgroup && adduser -S -G appgroup appuser
USER appuser
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 4000
CMD ["npm", "start"]
```

#### API Gateway Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY gateway.js ./
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"
CMD ["node", "gateway.js"]
```

---

## 7. CONFIGURAZIONE ENVIRONMENT

### 7.1 File .env Location

```
Development (Standalone):
  auth-service/.env          # Auth service vars
  log-service/.env           # Log service vars

Production (Docker):
  edg-docker/.env            # ⚠️ ROOT LEVEL - Single source of truth
```

### 7.2 Environment Variables Complete

**File:** `edg-docker/.env`

```env
# =============================================================================
# EDG PLATFORM - ENVIRONMENT VARIABLES
# =============================================================================

# -----------------------------------------------------------------------------
# MySQL (Auth Service)
# -----------------------------------------------------------------------------
MYSQL_ROOT_PASSWORD=RootMySQL2025!
MYSQL_DATABASE=edg_auth
MYSQL_USER=edg_auth_admin
MYSQL_PASSWORD=Auth2025Db!

# -----------------------------------------------------------------------------
# MongoDB (Log Service)
# -----------------------------------------------------------------------------
MONGO_LOG_USER=edg_logger
MONGO_LOG_PASSWORD=LoggerMongo2025!
MONGO_LOG_DATABASE=edg_logs

# -----------------------------------------------------------------------------
# JWT Configuration (Auth Service + Gateway)
# -----------------------------------------------------------------------------
JWT_SECRET=EDGsSDeocMK4a6NEo0TxUTSolWTixI0GioO0PhWnvp4ag025

# -----------------------------------------------------------------------------
# Gateway Configuration
# -----------------------------------------------------------------------------
GATEWAY_SECRET=7d8b8851976626f5d3fd19ebf85a1432985e91ac0b0aa99852763b9e5324c727
CORS_ORIGINS=https://app.edg.com,https://admin.edg.com,https://partner.edg.com

# -----------------------------------------------------------------------------
# Log Service API Key
# -----------------------------------------------------------------------------
LOG_API_KEY_SECRET=edg_logger_api_key_2025_secure_random_string_change_in_production

# =============================================================================
# NOTES:
# 
# 1. JWT_SECRET: Must be identical in auth-service and gateway
# 2. GATEWAY_SECRET: For secure internal communication
# 3. LOG_API_KEY_SECRET: Used by microservices to send logs
# 
# PRODUCTION:
# - Generate secure random secrets: openssl rand -base64 32
# - Use secrets manager (AWS Secrets Manager, Azure Key Vault, etc.)
# - DO NOT commit this file to Git (.gitignore)
# 
# =============================================================================
```

### 7.3 Secret Generation

```bash
# Generate secure secrets
openssl rand -base64 32   # For JWT_SECRET
openssl rand -hex 32      # For GATEWAY_SECRET
openssl rand -base64 48   # For LOG_API_KEY_SECRET
```

---

## 8. SETUP E AVVIO

### 8.1 Prerequisites

- Docker 24+ & Docker Compose 2.20+
- Node.js 18+ (per development locale)
- DBeaver (opzionale, per accesso database)

### 8.2 First Time Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd edg-docker

# 2. Create .env file
cp .env.example .env
# Modifica .env con valori appropriati

# 3. Build images
docker-compose build

# 4. Start services
docker-compose up -d

# 5. Verify all services are healthy
docker-compose ps

# Expected output:
# NAME                 STATUS
# edg-mysql            Up (healthy)   0.0.0.0:3306->3306/tcp
# edg-logger-mongo     Up (healthy)   0.0.0.0:27017->27017/tcp
# edg-auth-service     Up (healthy)
# edg-log-service      Up (healthy)
# edg-api-gateway      Up (healthy)   0.0.0.0:80->8080/tcp

# 6. Test endpoints
curl http://localhost/health
curl http://localhost/auth/health
```

### 8.3 Common Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f auth-service

# Restart specific service
docker-compose restart auth-service

# Rebuild specific service
docker-compose build auth-service
docker-compose up -d auth-service

# Check service status
docker-compose ps

# Execute command in container
docker-compose exec auth-service sh

# View resource usage
docker stats
```

### 8.4 Development Workflow

#### Development Mode (Standalone Auth Service)

```bash
cd auth-service

# Install dependencies
npm install

# Create .env for development
cat > .env << EOF
NODE_ENV=development
GATEWAY_MODE=false
DB_HOST=localhost
DB_PORT=3306
DB_NAME=edg_auth
DB_USER=edg_auth_admin
DB_PASSWORD=Auth2025Db!
JWT_SECRET=dev-secret-min-32-chars-long
CORS_ORIGINS=http://localhost:5173
PORT=3001
EOF

# Start dev server (with hot reload)
npm run dev

# Test endpoint
curl http://localhost:3001/health
```

#### Production Mode (Docker)

```bash
cd edg-docker

# Build and start
docker-compose up -d --build

# Monitor
docker-compose logs -f
```

---

## 9. TESTING E DEBUG

### 9.1 Health Checks

```bash
# Gateway health
curl http://localhost/health

# Auth service health (via gateway)
curl http://localhost/auth/health

# Log service health (internal only, via docker)
docker exec edg-log-service wget -qO- http://localhost:4000/health
```

### 9.2 Auth Service Testing

#### Register
```bash
curl -X POST http://localhost/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@edg.com",
    "password": "Test123!@#",
    "accountType": "operatore",
    "roleId": 1
  }'

# Expected: {"success":true,"message":"Account creato con successo"}
```

#### Login
```bash
curl -X POST http://localhost/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@edg.com",
    "password": "Test123!@#",
    "accountType": "operatore"
  }'

# Expected: {"success":true,"data":{"accessToken":"...","refreshToken":"..."}}
```

#### Get Account Info (Protected)
```bash
# Save token from login response
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl http://localhost/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Expected: {"success":true,"data":{"uuid":"...","email":"test@edg.com",...}}
```

### 9.3 Log Service Testing

```bash
# Create log (requires API key)
curl -X POST http://localhost/log/azione \
  -H "Content-Type: application/json" \
  -H "x-api-key: edg_logger_api_key_2025_secure_random_string_change_in_production" \
  -d '{
    "origine": {
      "tipo": "sistema",
      "id": "test-system",
      "dettagli": {}
    },
    "azione": {
      "tipo": "custom",
      "entita": "test",
      "idEntita": "1",
      "operazione": "test_operation",
      "dettagli": {}
    },
    "risultato": {
      "esito": "successo"
    },
    "tags": ["test"]
  }'
```

### 9.4 Database Access

#### MySQL (DBeaver)

```
Host:     localhost
Port:     3306
Database: edg_auth
User:     edg_auth_admin
Password: Auth2025Db!
```

**Test Query:**
```sql
-- View all accounts
SELECT uuid, email, accountType, roleId FROM accounts;

-- View roles and permissions
SELECT r.name, rp.resource, rp.action 
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.roleId
ORDER BY r.name, rp.resource;
```

#### MongoDB (DBeaver)

```
Host:          localhost
Port:          27017
Database:      edg_logs
User:          edg_logger
Password:      LoggerMongo2025!
Auth Database: admin
```

**Test Query:**
```javascript
// View all logs
db.azionelogs.find({}).sort({timestamp: -1}).limit(10)

// Count logs by result
db.azionelogs.aggregate([
  {$group: {_id: "$risultato.esito", count: {$sum: 1}}}
])
```

---

## 10. TROUBLESHOOTING

### 10.1 Common Issues

#### Issue: Services not starting

```bash
# Check logs
docker-compose logs

# Common causes:
# - Port already in use
# - Environment variables missing
# - Database not ready

# Solution: Check logs and fix configuration
docker-compose down
# Fix .env or docker-compose.yml
docker-compose up -d
```

#### Issue: Auth service 404 errors

```bash
# Check if service is healthy
docker-compose ps auth-service

# Check service logs
docker-compose logs auth-service

# Verify routes are registered
docker-compose exec auth-service wget -qO- http://localhost:3001/health
```

#### Issue: Database connection refused

```bash
# Verify database is running
docker-compose ps mysql

# Check if port is exposed
docker port edg-mysql

# Test connection from host
mysql -h 127.0.0.1 -P 3306 -u edg_auth_admin -pAuth2025Db! edg_auth
```

#### Issue: Gateway proxy errors

```bash
# Check gateway logs
docker-compose logs api-gateway

# Verify services are reachable from gateway
docker-compose exec api-gateway wget -qO- http://auth-service:3001/health
docker-compose exec api-gateway wget -qO- http://log-service:4000/health

# Common causes:
# - Service names wrong in gateway.js
# - Services not on same network
# - Services not healthy
```

### 10.2 Debug Commands

```bash
# Enter container shell
docker-compose exec auth-service sh
docker-compose exec mysql mysql -u root -p

# View environment variables
docker-compose exec auth-service env

# Test internal connectivity
docker-compose exec api-gateway ping auth-service
docker-compose exec auth-service ping mysql

# Check network
docker network ls
docker network inspect edg-docker_internal

# View resource usage
docker stats --no-stream

# Remove everything and start fresh
docker-compose down -v
docker-compose up -d --build
```

### 10.3 Log Analysis

```bash
# Real-time logs (all services)
docker-compose logs -f

# Logs for specific service
docker-compose logs -f auth-service

# Last 50 lines
docker-compose logs --tail=50 auth-service

# Logs with timestamps
docker-compose logs -f --timestamps

# Search logs
docker-compose logs auth-service | grep ERROR
docker-compose logs api-gateway | grep "Proxying"
```

### 10.4 Performance Issues

```bash
# Check resource usage
docker stats

# If high CPU/Memory:
# 1. Check for infinite loops in logs
# 2. Reduce connection pool sizes
# 3. Add resource limits in docker-compose.yml:

services:
  auth-service:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
```

### 10.5 Reset Everything

```bash
# Stop and remove containers, networks, volumes
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d

# Verify
docker-compose ps
curl http://localhost/health
```

---

## APPENDIX A: Quick Reference

### Service URLs

| Service | Docker | Host | Purpose |
|---------|--------|------|---------|
| Gateway | - | http://localhost | Public access |
| Auth Service | http://auth-service:3001 | http://localhost:3001 | Authentication (via gateway) |
| Log Service | http://log-service:4000 | - | Logging (internal only) |
| MySQL | mysql:3306 | localhost:3306 | Auth database |
| MongoDB | logger-mongo:27017 | localhost:27017 | Log database |

### Key Files

| File | Location | Purpose |
|------|----------|---------|
| docker-compose.yml | edg-docker/ | Orchestration |
| .env | edg-docker/ | Environment vars (production) |
| gateway.js | edg-docker/api-gateway/ | Gateway implementation |
| Dockerfile | edg-docker/auth-service/ | Auth service build |
| Dockerfile | edg-docker/log-service/ | Log service build |

### Key Ports

| Port | Service | Access |
|------|---------|--------|
| 80 | API Gateway | Public |
| 3001 | Auth Service | Internal |
| 4000 | Log Service | Internal |
| 3306 | MySQL | Development (DBeaver) |
| 27017 | MongoDB | Development (DBeaver) |

---

## APPENDIX B: Checklist Nuova Chat

Prima di iniziare in una nuova chat:

- [ ] ✅ Condividere questo documento (EDG-PLATFORM-DOCUMENTATION.md)
- [ ] ✅ Spiegare su quale componente si sta lavorando
- [ ] ✅ Condividere log rilevanti se ci sono errori
- [ ] ✅ Indicare l'obiettivo della sessione

---

**Fine Documentazione**

**Versione:** 2.0  
**Ultimo Aggiornamento:** 16 Ottobre 2025  
**Prossima Revisione:** Quando si aggiungono nuovi microservizi o features significative
