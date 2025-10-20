# 🚀 EDG PLATFORM

**Piattaforma microservizi per autenticazione, autorizzazione e logging centralizzato**

[![Status](https://img.shields.io/badge/status-production%20ready-success)]()
[![Version](https://img.shields.io/badge/version-2.0.0-blue)]()
[![Node](https://img.shields.io/badge/node-18%2B-green)]()
[![TypeScript](https://img.shields.io/badge/typescript-5.8%2B-blue)]()
[![Docker](https://img.shields.io/badge/docker-24%2B-blue)]()

---

## 🎯 Cosa è EDG Platform

EDG Platform è un sistema di microservizi completo che fornisce:

- 🔐 **Autenticazione JWT** con refresh tokens
- 👥 **RBAC (Role-Based Access Control)** con permessi granulari
- 📝 **Logging centralizzato** con transazioni correlate
- 🌐 **API Gateway** per routing e sicurezza
- 🐳 **Docker-ready** per deployment immediato

---

## ✨ Features

### Auth Service
- ✅ JWT authentication (access + refresh tokens)
- ✅ Multi-account types (operatore, partner, cliente, agente)
- ✅ RBAC con permessi composti (`modulo.azione`)
- ✅ Reset password con token
- ✅ Sessioni multiple per dispositivo
- ✅ Rate limiting anti-brute-force

### Log Service
- ✅ Logging centralizzato per tutti i microservizi
- ✅ Tracciamento azioni utenti e sistema
- ✅ Calcolo automatico differenze tra stati
- ✅ Transazioni correlate
- ✅ Statistiche e analisi aggregate
- ✅ Query flessibili con MongoDB

### API Gateway
- ✅ Routing automatico verso microservizi
- ✅ CORS handling
- ✅ Rate limiting generale
- ✅ Health checks
- ✅ Error handling centralizzato

---

## 🏗️ Architettura

```
                    INTERNET
                       │
                       │ HTTPS
                       ▼
                ┌──────────────┐
                │ API Gateway  │ :80
                │   (Express)  │
                └───────┬──────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│Auth Service  │ │ Log Service  │ │   Future     │
│   :3001      │ │    :4000     │ │  Services    │
└──────┬───────┘ └──────┬───────┘ └──────────────┘
       │                │
       ▼                ▼
┌──────────────┐ ┌──────────────┐
│    MySQL     │ │   MongoDB    │
│    :3306     │ │   :27017     │
└──────────────┘ └──────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Docker 24+
- Docker Compose 2.20+
- curl (per testing)

### Installazione (3 comandi)

```bash
# 1. Clona repository
cd edg-docker

# 2. Crea .env (copia da example o vedi documentazione)
cp .env.example .env

# 3. Avvia tutto
docker-compose up -d --build

# Verifica (attendi che tutti diventino "healthy")
docker-compose ps
```

### Test Veloce

```bash
# Gateway health
curl http://localhost/health

# Auth service
curl http://localhost/auth/health

# Register
curl -X POST http://localhost/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@edg.com","password":"Test123!@#","accountType":"operatore","roleId":1}'

# Login
curl -X POST http://localhost/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@edg.com","password":"Test123!@#","accountType":"operatore"}'
```

---

## 📚 Documentazione

### 🎯 Inizio Rapido

**[EDG-QUICK-START.md](EDG-QUICK-START.md)**  
Setup completo in 10 minuti con test base.

### 📘 Documentazione Completa

**[EDG-PLATFORM-DOCUMENTATION.md](EDG-PLATFORM-DOCUMENTATION.md)**  
Tutto quello che serve sapere:
- Architettura completa
- Configurazione database
- Microservizi
- Docker e deployment
- Testing e troubleshooting

### 📡 API Reference

**[EDG-API-REFERENCE.md](EDG-API-REFERENCE.md)**  
Documentazione dettagliata di tutte le API con esempi.

### 📝 Changelog

**[EDG-CHANGELOG.md](EDG-CHANGELOG.md)**  
Storia modifiche e decisioni architetturali.

### 📑 Indice

**[EDG-PLATFORM-INDEX.md](EDG-PLATFORM-INDEX.md)**  
Guida alla documentazione.

---

## 🛠️ Stack Tecnologico

| Categoria | Tecnologia | Versione |
|-----------|------------|----------|
| **Runtime** | Node.js | 18+ |
| **Language** | TypeScript | 5.8+ |
| **Framework** | Express.js | 5.x |
| **Auth** | JWT | jsonwebtoken |
| **DB SQL** | MySQL | 8.0 |
| **ORM SQL** | Sequelize | 6.x |
| **DB NoSQL** | MongoDB | 7.0 |
| **ODM** | Mongoose | 8.x |
| **Container** | Docker | 24+ |
| **Orchestration** | Docker Compose | 2.20+ |

---

## 📊 Endpoints

### Auth Service

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | No | Registrazione |
| POST | `/auth/login` | No | Login |
| POST | `/auth/refresh` | No | Refresh token |
| POST | `/auth/logout` | No | Logout |
| GET | `/auth/me` | Yes | Info account |
| POST | `/auth/change-password` | Yes | Cambio password |
| POST | `/auth/logout-all` | Yes | Logout tutti dispositivi |
| POST | `/auth/request-reset-password` | No | Richiesta reset |
| POST | `/auth/reset-password` | No | Conferma reset |

### Log Service

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/log/azione` | API Key | Crea log |
| GET | `/log/azioni` | API Key | Cerca log |
| GET | `/log/azioni/:id` | API Key | Get log per ID |
| GET | `/log/transazioni/:id` | API Key | Log transazione |
| GET | `/log/statistiche` | API Key | Statistiche |

---

## 🗄️ Database

### MySQL (Auth)

```sql
• accounts          # Account utenti
• roles             # Ruoli RBAC
• role_permissions  # Permessi per ruolo
• sessions          # Sessioni attive
• reset_tokens      # Token reset password
```

### MongoDB (Logs)

```javascript
• azionelogs        # Log azioni centralizzati
```

---

## 🔒 Sicurezza

- ✅ Network isolation (microservizi su rete interna)
- ✅ JWT authentication con refresh tokens
- ✅ Password hashing con BCrypt
- ✅ Rate limiting (generale + business logic)
- ✅ API Gateway come unico punto di accesso
- ✅ API key per log service
- ✅ CORS configurabile
- ✅ Helmet security headers

---

## 📖 Environment Variables

```env
# MySQL
MYSQL_DATABASE=edg_auth
MYSQL_USER=edg_auth_admin
MYSQL_PASSWORD=***

# MongoDB
MONGO_LOG_USER=edg_logger
MONGO_LOG_PASSWORD=***
MONGO_LOG_DATABASE=edg_logs

# JWT & Gateway
JWT_SECRET=***
GATEWAY_SECRET=***
CORS_ORIGINS=https://app.edg.com

# Log Service
LOG_API_KEY_SECRET=***
```

Vedi [EDG-PLATFORM-DOCUMENTATION.md](EDG-PLATFORM-DOCUMENTATION.md) sezione 7 per dettagli.

---

## 🧪 Testing

```bash
# Avvia sistema
docker-compose up -d

# Test health
curl http://localhost/health
curl http://localhost/auth/health

# Test completo auth flow
# Vedi EDG-QUICK-START.md

# Vedi log
docker-compose logs -f
```

---

## 🐛 Troubleshooting

### Servizio non parte

```bash
docker-compose logs <service-name>
docker-compose up -d --force-recreate <service-name>
```

### Database connection refused

```bash
docker-compose ps mysql
docker-compose restart mysql
```

### 404 su endpoint

```bash
docker-compose logs api-gateway
docker-compose restart api-gateway
```

Vedi [EDG-PLATFORM-DOCUMENTATION.md](EDG-PLATFORM-DOCUMENTATION.md) sezione 10 per troubleshooting completo.

---

## 🚦 Status

```
✅ Auth Service:        Production Ready
✅ Log Service:         Production Ready
✅ API Gateway:         Production Ready
✅ Docker Setup:        Production Ready
✅ Documentation:       Complete
🎯 Version:             2.0.0
```

---

## 🗺️ Roadmap

### v2.1.0 (Next)
- [ ] Email service per reset password
- [ ] Redis cache per permissions
- [ ] Prometheus metrics
- [ ] Grafana dashboards

### v3.0.0 (Future)
- [ ] 2FA (Two-Factor Authentication)
- [ ] OAuth2 provider
- [ ] Admin UI per gestione ruoli
- [ ] CI/CD pipeline

---

## 📄 License

Proprietary - EDG Platform

---

## 👥 Contributors

- Development Team
- Claude AI Assistant

---

## 📞 Support

Per supporto:
1. Leggi la [documentazione](EDG-PLATFORM-INDEX.md)
2. Controlla [troubleshooting](EDG-PLATFORM-DOCUMENTATION.md#10-troubleshooting)
3. Vedi [known issues](EDG-CHANGELOG.md#known-issues)

---

## ⭐ Quick Links

- **[Quick Start](EDG-QUICK-START.md)** - Setup in 10 minuti
- **[Documentation](EDG-PLATFORM-DOCUMENTATION.md)** - Docs completa
- **[API Reference](EDG-API-REFERENCE.md)** - Riferimento API
- **[Changelog](EDG-CHANGELOG.md)** - Storia modifiche
- **[Index](EDG-PLATFORM-INDEX.md)** - Guida documentazione

---

**Made with ❤️ by EDG Team**

**Version:** 2.0.0 | **Last Updated:** 16 October 2025
