text

# 🚀 EDG PLATFORM

**Piattaforma microservizi per autenticazione, autorizzazione e logging centralizzato**

[![Status](https://img.shields.io/badge/status-production%20ready-success)](https://github.com/edg-platform)
[![Version](https://img.shields.io/badge/version-2.0.0-blue)](https://github.com/edg-platform)
[![Node](https://img.shields.io/badge/node-18%2B-green)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/typescript-5.8%2B-blue)](https://www.typescriptlang.org)
[![Docker](https://img.shields.io/badge/docker-24%2B-blue)](https://www.docker.com)

---

## 🎯 Cosa È EDG Platform

EDG Platform è un sistema di microservizi **production-ready** che fornisce un'infrastruttura completa per:

- 🔐 **Autenticazione JWT** con access token (15 min) e refresh token (7 giorni)
- 👥 **RBAC avanzato** con permessi granulari formato `modulo.azione` e wildcard support
- 📝 **Logging centralizzato** con calcolo automatico differenze, transazioni correlate e statistiche
- 🌐 **API Gateway** con routing intelligente, CORS, rate limiting e health checks
- 🐳 **Docker-ready** con orchestrazione completa e network isolation

### Stack Tecnologico Core

**Runtime & Language:** Node.js 18+, TypeScript 5.8+  
**Framework:** Express.js 5.x  
**Databases:** MySQL 8.0 (auth data), MongoDB 7.0 (logs)  
**Security:** JWT, BCrypt, Helmet, CORS  
**DevOps:** Docker 24+, Docker Compose 2.20+

---

## ⚡ Quick Start (3 Comandi)

1. Entra nella directory Docker
   cd edg-docker

2. Configura environment (usa .env.example come base)
   cp .env.example .env # Poi modifica con i tuoi valori

3. Avvia tutto
   docker-compose up -d --build

text

**Verifica sistema attivo:**
curl http://localhost/health

Expected: {"status":"ok","timestamp":"..."}
text

**Setup dettagliato**: Vedi [DOCUMENTATION.md → Sezione 8: Setup e Avvio](DOCUMENTATION.md#8-setup-e-avvio)

---

## 📚 Come Navigare la Documentazione

### 🎯 Percorsi Guidati per Ruolo

#### 👨‍💻 Sono un Nuovo Sviluppatore

1. **Inizia qui** (questa pagina) - Overview generale
2. **[DOCUMENTATION.md § 1-2](DOCUMENTATION.md#1-panoramica-sistema)** - Architettura e componenti
3. **[DOCUMENTATION.md § 8](DOCUMENTATION.md#8-setup-e-avvio)** - Setup completo passo-passo
4. **[API-REFERENCE.md](API-REFERENCE.md)** - Sviluppa contro le API

#### 🚀 Sono DevOps / Devo Fare Deployment

1. **[DOCUMENTATION.md § 6](DOCUMENTATION.md#6-docker-e-deployment)** - Docker e deployment
2. **[DOCUMENTATION.md § 7](DOCUMENTATION.md#7-configurazione-environment)** - Environment variables
3. **[DOCUMENTATION.md § 10](DOCUMENTATION.md#10-troubleshooting)** - Troubleshooting completo

#### 🔧 Ho un Problema / Debugging

1. **[DOCUMENTATION.md § 10](DOCUMENTATION.md#10-troubleshooting)** - Guida troubleshooting
2. **[DOCUMENTATION.md § 9](DOCUMENTATION.md#9-testing-e-debug)** - Testing e debug tools
3. **[DOCUMENTATION.md § 11](DOCUMENTATION.md#11-changelog)** - Known issues e workaround

#### 📡 Devo Sviluppare Frontend / Integrare API

1. **[API-REFERENCE.md](API-REFERENCE.md)** - Reference completa API
2. **[DOCUMENTATION.md § 4](DOCUMENTATION.md#4-microservizi)** - Logica business microservizi
3. **[DOCUMENTATION.md § 9](DOCUMENTATION.md#9-testing-e-debug)** - Test API con curl/Postman

---

## 📖 Struttura Documentazione

| Documento                                | Scopo                           | Chi Lo Legge           | Dimensione |
| ---------------------------------------- | ------------------------------- | ---------------------- | ---------- |
| **README.md** (questo file)              | Entry point, navigazione veloce | Tutti                  | ~15 KB     |
| **[DOCUMENTATION.md](DOCUMENTATION.md)** | Documentazione tecnica completa | Dev, DevOps, Architect | ~55 KB     |
| **[API-REFERENCE.md](API-REFERENCE.md)** | Reference API dettagliata       | Frontend dev, QA       | ~17 KB     |

### Cosa C'è in DOCUMENTATION.md

Il documento principale contiene **tutto** quello che serve:

1. **Panoramica Sistema** - Architettura, componenti, diagrammi
2. **Architettura e Network** - Network isolation, security model
3. **Database** - Schema MySQL, collections MongoDB
4. **Microservizi** - Auth Service, Log Service (EdgLogger)
5. **API Gateway** - Routing, CORS, rate limiting
6. **Docker e Deployment** - Containers, volumes, networks
7. **Configurazione Environment** - Variabili .env e migrazione
8. **Setup e Avvio** - Quick start e setup dettagliato
9. **Testing e Debug** - Test suite, logging, debugging
10. **Troubleshooting** - Problemi comuni e soluzioni
11. **Changelog** - Storia modifiche, decisioni architetturali, roadmap

**Appendici:**

- A. Migrazione Environment Variables
- B. Script Utili
- C. FAQ

---

## 🏗️ Architettura (Vista Rapida)

┌─────────────────────────────────────────────────┐
│ INTERNET │
└─────────────────┬───────────────────────────────┘
│ HTTP :80
▼
┌────────────────┐
│ API GATEWAY │ Express + CORS + Rate Limiting
│ :80 │
└────────┬───────┘
│
┌───────────┴───────────┐
│ │
▼ ▼
┌──────────────┐ ┌──────────────┐
│ AUTH SERVICE │ │ LOG SERVICE │
│ :3001 │ │ :4000 │
│ │ │ │
│ JWT + RBAC │ │ EdgLogger │
└──────┬───────┘ └──────┬───────┘
│ │
▼ ▼
┌──────────┐ ┌──────────┐
│ MySQL │ │ MongoDB │
│ :3306 │ │ :27017 │
└──────────┘ └──────────┘

text

**Network Isolation:**

- **External network** - Solo API Gateway esposto (porta 80)
- **Internal network** - Tutti i microservizi comunicano internamente
- **Database ports** - Accessibili solo da localhost (development) o totalmente isolate (production)

**Dettagli completi**: [DOCUMENTATION.md § 2: Architettura](DOCUMENTATION.md#2-architettura-e-network)

---

## 📊 Stato Componenti

| Componente       | Versione | Status    | Descrizione                     | Tech Stack                                |
| ---------------- | -------- | --------- | ------------------------------- | ----------------------------------------- |
| **Auth Service** | 1.0.0    | ✅ Stable | Autenticazione e autorizzazione | Node.js + TypeScript + MySQL + Sequelize  |
| **Log Service**  | 1.0.0    | ✅ Stable | Logging centralizzato           | Node.js + TypeScript + MongoDB + Mongoose |
| **API Gateway**  | 1.0.0    | ✅ Stable | Routing e sicurezza             | Express.js + CORS + Rate Limiting         |
| **MySQL**        | 8.0      | ✅ Stable | Database auth                   | MySQL 8.0 + Sequelize ORM                 |
| **MongoDB**      | 7.0      | ✅ Stable | Database log                    | MongoDB 7.0 + Mongoose ODM                |

---

## 🔑 Features Principali

### Auth Service - Sistema di Autenticazione

✅ **JWT dual-token system**

- Access token: 15 minuti (per operazioni)
- Refresh token: 7 giorni (per rinnovo)
- Rotation automatica su refresh

✅ **RBAC granulare**

- Permessi formato `modulo.azione` (es. `utenti.create`, `report.read`)
- Wildcard support: `utenti.*`, `*.read`, `*.*`
- Deny-first logic per sicurezza massima
- Permissions in JWT payload (zero DB queries)

✅ **Multi-account types**

- `operatore` - Operatori interni EDG
- `partner` - Partner esterni
- `cliente` - Clienti finali
- `agente` - Agenti vendita

✅ **Gestione password**

- BCrypt hashing (10 rounds)
- Reset password con token temporanei
- Validazione robusta

✅ **Sessioni multiple**

- Supporto multi-dispositivo
- Tracking sessioni attive
- Logout selettivo o globale

✅ **Security features**

- Rate limiting anti-brute-force
- Helmet headers
- CORS configurabile
- Input validation

### Log Service (EdgLogger) - Logging Centralizzato

✅ **Tracciamento azioni**

- Log strutturati per ogni operazione
- Origine e contesto completo
- Metadati estendibili

✅ **Diff automatico**

- Calcolo automatico differenze tra stati
- `statoPrecedente` vs `statoNuovo`
- Visualizzazione chiara delle modifiche

✅ **Transazioni correlate**

- `transactionId` per operazioni correlate
- Ricostruzione flussi complessi
- Debug facilitato

✅ **Statistiche aggregate**

- Conteggi per azione, origine, risultato
- Range temporali flessibili
- API dedicate per analytics

✅ **Query flessibili**

- Ricerca per azione, origine, entità
- Filtri temporali
- Paginazione integrata

✅ **Performance**

- MongoDB per time-series data
- Indexing ottimizzato
- Query veloci anche su grandi volumi

### API Gateway - Routing Intelligente

✅ **Routing automatico**

- `/auth/*` → Auth Service :3001
- `/log/*` → Log Service :4000
- Path rewriting corretto

✅ **Security**

- CORS configurabile per origine
- Rate limiting generale
- Gateway secret per comunicazione interna

✅ **High availability**

- Health checks automatici
- Error handling centralizzato
- Logging completo

---

## 📡 API - Quick Reference

### Auth Service Endpoints

**Pubblici (no authentication):**
POST /auth/register # Registra nuovo account
POST /auth/login # Login (ottieni JWT)
POST /auth/reset-request # Richiedi reset password
POST /auth/reset-confirm # Conferma reset password

text

**Protetti (require JWT in header: `Authorization: Bearer <token>`):**
GET /auth/me # Info account corrente
POST /auth/refresh # Refresh access token
POST /auth/logout # Logout (invalida sessione)
POST /auth/change-password # Cambia password
GET /auth/sessions # Lista sessioni attive

text

**Admin (require permissions):**
GET /auth/check-permission # Verifica permesso

text

### Log Service Endpoints

**Tutti richiedono header: `X-API-Key: <log_service_api_key>`**

POST /log/azione # Crea nuovo log
GET /log/azioni # Cerca log (con filtri)
GET /log/statistiche # Statistiche aggregate

text

**Full reference con esempi**: [API-REFERENCE.md](API-REFERENCE.md)

---

## 🧪 Test Veloce (5 Minuti)

### 1. Registra Account di Test

curl -X POST http://localhost/auth/register
-H "Content-Type: application/json"
-d '{
"email": "test@edg.com",
"password": "Test123!@#",
"accountType": "operatore",
"roleId": 1
}'

text

**Expected response:**
{
"success": true,
"message": "Account creato con successo",
"data": {
"uuid": "...",
"email": "test@edg.com",
"accountType": "operatore"
}
}

text

### 2. Effettua Login

curl -X POST http://localhost/auth/login
-H "Content-Type: application/json"
-d '{
"email": "test@edg.com",
"password": "Test123!@#",
"accountType": "operatore"
}'

text

**Expected response:**
{
"success": true,
"data": {
"accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
"refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
"expiresIn": 900
}
}

text

### 3. Usa Access Token

Salva il token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

Ottieni info account
curl -X GET http://localhost/auth/me
-H "Authorization: Bearer $TOKEN"

text

### 4. Test Log Service (Opzionale)

Ottieni API key dal .env (LOG_SERVICE_API_KEY)
API_KEY="your-api-key-from-env"

curl -X POST http://localhost/log/azione
-H "Content-Type: application/json"
-H "X-API-Key: $API_KEY"
-d '{
"azione": "test.log",
"origine": "manual-test",
"risultato": "successo"
}'

text

**Test completi e automatizzati**: [DOCUMENTATION.md § 9: Testing](DOCUMENTATION.md#9-testing-e-debug)

---

## 🐛 Troubleshooting Rapido

| Problema                        | Diagnosi                            | Soluzione                                              |
| ------------------------------- | ----------------------------------- | ------------------------------------------------------ |
| **Container non si avvia**      | `docker-compose ps`                 | `docker-compose logs <service-name>` per vedere errori |
| **Porta 80 già in uso**         | `lsof -i :80`                       | Cambia port mapping in docker-compose.yml: `8080:80`   |
| **Database connection refused** | `docker-compose ps` verifica status | `docker-compose restart mysql` o `mongodb`             |
| **404 su endpoint valido**      | Verifica routing                    | `docker-compose logs gateway` per vedere routing       |
| **JWT invalid / expired**       | Token scaduto o malformato          | Effettua nuovo login per ottenere token fresco         |
| **CORS error da frontend**      | Origine non autorizzata             | Aggiungi origine in `CORS_ORIGINS` nel .env            |
| **Rate limit exceeded**         | Troppe richieste                    | Attendi 60 secondi o aumenta limite in config          |

**Troubleshooting completo**: [DOCUMENTATION.md § 10](DOCUMENTATION.md#10-troubleshooting)

---

## 🗺️ Roadmap

### 📦 v2.1.0 (Prossimo Release - Q1 2026)

**Features pianificate:**

- [ ] Email service per reset password e notifiche
- [ ] Redis cache per permissions (riduzione latenza)
- [ ] Prometheus metrics export
- [ ] Grafana dashboards pre-configurati
- [ ] Health checks avanzati con alerting

### 🚀 v3.0.0 (Future Vision - Q2-Q3 2026)

**Major features:**

- [ ] Two-factor authentication (2FA) con TOTP
- [ ] OAuth2 provider (EDG come identity provider)
- [ ] Admin UI per gestione ruoli e permessi
- [ ] Audit log completo con export
- [ ] CI/CD pipeline template (GitHub Actions / GitLab CI)
- [ ] Kubernetes deployment manifests

### 🔄 v3.1.0+ (Long Term)

**Espansioni ecosistema:**

- [ ] WebSocket support per real-time updates
- [ ] GraphQL gateway (alternativa a REST)
- [ ] Multi-tenancy support
- [ ] Plugin system per estensioni custom
- [ ] SDK client per linguaggi popolari (Python, Go, Java)

**Storia completa e decisioni**: [DOCUMENTATION.md § 11: Changelog](DOCUMENTATION.md#11-changelog)

---

## 📞 Supporto e Contatti

### 🔍 Ho una Domanda

1. **Cerca nella documentazione**: Usa Ctrl+F in [DOCUMENTATION.md](DOCUMENTATION.md)
2. **Controlla Known Issues**: [DOCUMENTATION.md § 11.4](DOCUMENTATION.md#114-known-issues)
3. **Consulta Troubleshooting**: [DOCUMENTATION.md § 10](DOCUMENTATION.md#10-troubleshooting)

### 🐛 Ho Trovato un Bug

1. Verifica se è un known issue: [DOCUMENTATION.md § 11.4](DOCUMENTATION.md#114-known-issues)
2. Raccogli informazioni:
   docker-compose logs <service-name>
   docker-compose ps
   cat .env (rimuovi dati sensibili)

text 3. Documenta steps per riprodurre il problema

### 💡 Ho un Suggerimento

Idee per miglioramenti o nuove features sono benvenute! Considera:

- Allineamento con architettura esistente
- Impatto su backward compatibility
- Casi d'uso reali che risolve

### 🤝 Voglio Contribuire

Il progetto segue questi principi:

- **Divide et impera** - Piccoli passi iterativi
- **Documentation driven** - Documenta prima, poi implementa
- **Clean code** - TypeScript strict, zero `any`, comments espliciti
- **Testing** - Test per ogni feature
- **Backward compatibility** - Deprecate, don't break

---

## 📄 Licenza e Copyright

**Versione:** 2.0.0  
**Data Ultimo Aggiornamento:** 21 Ottobre 2025  
**Status:** ✅ Production Ready

---

## 🔗 Link Utili

| Risorsa                        | Link                                 | Descrizione                            |
| ------------------------------ | ------------------------------------ | -------------------------------------- |
| 📘 **Documentazione Completa** | [DOCUMENTATION.md](DOCUMENTATION.md) | Tutto quello che serve sapere          |
| 📡 **API Reference**           | [API-REFERENCE.md](API-REFERENCE.md) | Endpoint dettagliati con esempi        |
| 🐳 **Docker Hub**              | -                                    | Container images (se pubblicati)       |
| 💬 **Community**               | -                                    | Forum / Slack / Discord (se esistente) |

---

**🎉 Benvenuto in EDG Platform!** Inizia con [DOCUMENTATION.md § 8: Setup e Avvio](DOCUMENTATION.md#8-setup-e-avvio)
