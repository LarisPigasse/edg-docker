# 📘 EDG PLATFORM - MANUALE COMPLETO

**Versione:** 2.1.0  
**Data:** 24 Novembre 2025  
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
9. [API Reference](#9-api-reference)
10. [Troubleshooting](#10-troubleshooting)
11. [Changelog e Roadmap](#11-changelog-e-roadmap)

---

## 1. PANORAMICA SISTEMA

### 1.1 Cos'è EDG Platform

EDG Platform è un sistema di microservizi **production-ready** che fornisce un'infrastruttura completa per:

- 🔐 **Autenticazione JWT** con access token (15 min) e refresh token (7 giorni)
- 👥 **RBAC avanzato** con permessi granulari formato `modulo.azione`
- 📝 **Logging centralizzato** con calcolo automatico differenze e transazioni correlate
- 🌐 **API Gateway** con routing intelligente, CORS, rate limiting e health checks
- 🐳 **Docker-ready** con orchestrazione completa e network isolation

### 1.2 Componenti Principali

```text
┌──────────────────────────────────────────────────┐
│                EDG PLATFORM v2.1                 │
├──────────────────────────────────────────────────┤
│                                                  │
│  🌐 API Gateway (Express)                        │
│     - Routing intelligente                       │
│     - CORS Strict & Rate Limiting                │
│     - Security Headers (Helmet)                  │
│                                                  │
│  🔐 Auth Service (Node.js + TypeScript)          │
│     - JWT Authentication (dual-token)            │
│     - RBAC con permessi granulari                │
│     - Multi-account types                        │
│                                                  │
│  📝 Log Service (Node.js + TypeScript)           │
│     - Centralized logging                        │
│     - Action tracking con diff                   │
│                                                  │
│  💾 Databases                                    │
│     - MySQL 8.0 (Auth data)                      │
│     - MongoDB 7.0 (Logs)                         │
│                                                  │
└──────────────────────────────────────────────────┘
```

### 1.3 Stack Tecnologico

| Layer             | Tecnologia     | Versione     | Scopo                  |
| ----------------- | -------------- | ------------ | ---------------------- |
| **Runtime**       | Node.js        | 18+          | Execution environment  |
| **Language**      | TypeScript     | 5.8+         | Type-safe development  |
| **Framework**     | Express.js     | 5.x          | Web framework          |
| **DB SQL**        | MySQL          | 8.0          | Relational data (auth) |
| **DB NoSQL**      | MongoDB        | 7.0          | Document store (logs)  |
| **Auth**          | JWT            | jsonwebtoken | Token-based auth       |
| **Security**      | Helmet         | 7.x          | HTTP Security Headers  |
| **Rate Limit**    | Express-RL     | 7.x          | DDoS Protection        |
| **Container**     | Docker         | 24+          | Containerization       |
| **Orchestration** | Docker Compose | 2.20+        | Multi-container apps   |

---

## 2. ARCHITETTURA E NETWORK

### 2.1 Diagramma Architettura

```text
INTERNET
  │
  │ HTTPS (Production: Nginx/CloudFlare)
  │
┌──────▼──────┐
│   Reverse   │
│    Proxy    │
└──────┬──────┘
       │
       │ HTTP :80
       │
┌──────────────────▼──────────────────┐
│        EXTERNAL NETWORK             │
│    (docker network: external)       │
│       Exposed to Internet           │
└──────────────────┬──────────────────┘
                   │
           ┌──────▼──────┐
           │ API Gateway │  Rate Limiting
           │   :8080     │  CORS Strict
           └──────┬──────┘  Helmet Security
                  │
┌──────────────────▼──────────────────┐
│        INTERNAL NETWORK             │
│    (docker network: internal)       │
│      Isolated from Internet         │
│                                     │
│  ┌─────────────┐   ┌─────────────┐  │
│  │Auth Service │   │ Log Service │  │
│  │   :3001     │   │   :4000     │  │
│  └──────┬──────┘   └──────┬──────┘  │
│         │                 │         │
│  ┌──────▼──────┐   ┌──────▼──────┐  │
│  │    MySQL    │   │   MongoDB   │  │
│  │    :3306    │   │   :27017    │  │
│  └─────────────┘   └─────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

### 2.2 Security Model Multilivello

1.  **Network Isolation**:

    - Microservizi su rete interna isolata.
    - Solo API Gateway esposto su rete esterna.
    - Database inaccessibili da internet.

2.  **API Gateway (Layer 7)**:

    - **CORS Strict**: Whitelist origini consentite.
    - **Rate Limiting**: 100 req/15min (configurabile).
    - **Security Headers**: Protezione via Helmet.

3.  **Auth Service**:
    - JWT Signing (HS256).
    - Password Hashing (BCrypt 10 rounds).
    - RBAC Validation.

---

## 3. DATABASE

### 3.1 MySQL (Auth Service)

Utilizzato per dati strutturati e relazionali (utenti, ruoli, permessi).

- **Container**: `auth-mysql`
- **Porta Interna**: 3306
- **Volume**: `mysql-data`

### 3.2 MongoDB (Log Service)

Utilizzato per log ad alto volume e dati non strutturati.

- **Container**: `log-mongo`
- **Porta Interna**: 27017
- **Volume**: `mongo-data`

---

## 4. MICROSERVIZI

### 4.1 Auth Service

Gestisce l'identità e gli accessi.

- **Porta**: 3001
- **Funzioni**: Login, Register, Refresh Token, Password Reset, RBAC Check.

### 4.2 Log Service

Centralizza i log di sistema e audit.

- **Porta**: 4000
- **Funzioni**: Ingestione log, Querying, Statistiche.

---

## 5. API GATEWAY

Il punto di ingresso unico per tutte le richieste.

- **Tecnologia**: Express.js + `http-proxy-middleware`
- **Porta**: 8080 (esposta come 80)
- **Features**:
  - **Routing Dinamico**: Instrada richieste basate su path (`/auth`, `/log`) o sottodominio (`pro.`, `app.`).
  - **Sicurezza**: Implementa Rate Limiting e CORS.

---

## 6. DOCKER E DEPLOYMENT

### 6.1 Struttura Docker Compose

Il file `docker-compose.yml` definisce l'intera infrastruttura.

- **Traefik**: Load Balancer e Reverse Proxy (Dashboard su `/dashboard/`).
- **API Gateway**: Replicato (2 istanze) per High Availability.
- **Resource Limits**: Tutti i container hanno limiti CPU (0.5) e RAM (512MB) per stabilità.

### 6.2 Comandi Principali

```bash
# Avvio (Build e Detach)
docker-compose up -d --build

# Stop
docker-compose down

# Logs (Real-time)
docker-compose logs -f api-gateway-1

# Restart Servizio
docker-compose restart auth-service
```

---

## 7. CONFIGURAZIONE ENVIRONMENT

Il file `.env` controlla la configurazione. **Non committare mai il file .env in produzione!**

### Variabili Chiave

```bash
# Gateway Security
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_ATTEMPTS=100

# Secrets (CAMBIARE IN PROD)
JWT_SECRET=super-secret-key
GATEWAY_SECRET=internal-secret-key
```

---

## 8. SETUP E AVVIO

1.  **Prerequisiti**: Docker e Docker Compose installati.
2.  **Configurazione**: Copia `.env.example` in `.env`.
3.  **Avvio**: Esegui `docker-compose up -d --build`.
4.  **Verifica**:
    - Gateway: `http://localhost/health`
    - Traefik Dashboard: `http://localhost/dashboard/`

---

## 9. API REFERENCE

### 9.1 Auth Service (`/auth`)

| Metodo | Endpoint         | Descrizione                 | Auth   |
| ------ | ---------------- | --------------------------- | ------ |
| POST   | `/auth/login`    | Login utente (ritorna JWT)  | No     |
| POST   | `/auth/register` | Registrazione nuovo account | No     |
| POST   | `/auth/refresh`  | Rinnova Access Token        | No     |
| GET    | `/auth/me`       | Info profilo corrente       | **Sì** |
| POST   | `/auth/logout`   | Logout (invalida refresh)   | **Sì** |

#### Esempio Login

**Request:**

```json
POST /auth/login
{
  "email": "user@example.com",
  "password": "password123",
  "accountType": "operatore"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "abc..."
  }
}
```

### 9.2 Log Service (`/log`)

Richiede header `x-api-key`.

| Metodo | Endpoint      | Descrizione                     |
| ------ | ------------- | ------------------------------- |
| POST   | `/log/azione` | Crea un nuovo log               |
| GET    | `/log/azioni` | Lista log (filtri query string) |

---

## 10. TROUBLESHOOTING

### ❌ "Cannot start service: port is already allocated"

**Causa**: Porta 80 occupata (es. Apache, Skype).
**Soluzione**: Ferma il servizio conflittuale o cambia porta in `docker-compose.yml`.

### ❌ Dashboard Traefik 404

**Causa**: Manca lo slash finale.
**Soluzione**: Usa `http://localhost/dashboard/` (con lo slash).

### ❌ CORS Error

**Causa**: Origine frontend non in whitelist.
**Soluzione**: Aggiungi l'URL del frontend a `CORS_ORIGINS` nel `.env` e riavvia il gateway.

### ❌ Container "OOMKilled"

**Causa**: Memoria insufficiente.
**Soluzione**: Aumenta i limiti in `docker-compose.yml` o la RAM assegnata a Docker Desktop.

---

## 11. CHANGELOG E ROADMAP

### Versione 2.1.0 (Corrente)

- ✅ **Security Hardening**: Rate Limiting, Helmet, Strict CORS.
- ✅ **Infrastructure**: Resource limits su tutti i container.
- ✅ **Traefik**: Dashboard messa in sicurezza.

### Roadmap Futura (v3.0)

- [ ] 2FA (Two-Factor Authentication).
- [ ] Dashboard Admin per gestione ruoli.
- [ ] Kubernetes deployment manifests.
