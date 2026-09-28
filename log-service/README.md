# EDG Log Service - Sistema di Logging Centralizzato 📊

> **Versione:** 1.1.0  
> **Stato:** ✅ Production Ready  
> **Ultima modifica:** 9 Febbraio 2026  

Sistema di logging centralizzato per la piattaforma EDG con **Server + Client Library integrato**.

## 🎯 Caratteristiche Principali

### Server
✅ **Eventi Standardizzati** - 6 categorie predefinite con 59 sottotipi  
✅ **API REST** - Endpoint completi per log management  
✅ **MongoDB** - Storage ottimizzato con 12 indici  
✅ **Audit Trail** - Tracciamento modifiche con diff automatico  
✅ **Query Avanzate** - Ricerca per categoria, severità, date  

### Client Library
✅ **Type-Safe** - 100% TypeScript con auto-completamento  
✅ **Event Builders** - API fluent per creare eventi  
✅ **Retry Automatico** - Resilienza a failure temporanei  
✅ **Offline Queue** - Buffer in-memory quando server è offline  
✅ **Express Middleware** - Auto-logging richieste HTTP  

---

## 📦 Installazione

### Come Server (Docker)

```bash
cd D:\Sviluppo\edg-docker\log-service
npm install
npm run build
npm start
```

### Come Client Library (nei microservizi)

```bash
# Nel tuo microservice (es: auth-service)
cd D:\Sviluppo\edg-docker\auth-service

# Installazione locale (development)
npm install ../log-service

# Oppure publish su registry privato NPM
npm install @edg/log-service
```

---

## 🚀 Quick Start - Server

### 1. Configurazione

Crea file `.env`:

```env
# Server
PORT=4000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://edg_logger:LoggerMongo2025!@localhost:27017/edg-logger?authSource=admin

# Sicurezza
API_KEY_SECRET=dev-api-key-secret-change-in-production
SKIP_AUTH=false
```

### 2. Avvio Server

```bash
npm run dev   # Development con hot-reload
npm start     # Production
```

### 3. Test Server

```bash
npm run test:events  # Test eventi standardizzati
```

---

## 🔌 Quick Start - Client Library

### 1. Import nel Microservice

```typescript
// auth-service/src/index.ts
import { LogClient, EventBuilder } from '@edg/log-service/client';

const logger = new LogClient({
  apiUrl: 'http://log-service:4000',
  apiKey: process.env.LOG_API_KEY,
  enableOfflineQueue: true
});
```

### 2. Log Eventi

```typescript
// Log evento AUTH
await logger.log(
  EventBuilder.auth.login()
    .user('user_123', 'mario.rossi', 'mario@edg.com')
    .fromIp(req.ip)
    .session('sess_abc123')
    .build()
);

// Log evento DATA
await logger.log(
  EventBuilder.data.create('order', 'ord_12345')
    .entityName('Ordine Milano-Roma')
    .byUser('user_123')
    .withState(null, { status: 'pending', amount: 150.0 })
    .build()
);
```

### 3. Express Middleware (Auto-Logging)

```typescript
import express from 'express';
import { createExpressLogger } from '@edg/log-service/client';

const app = express();

// Auto-logging di tutte le richieste HTTP
app.use(createExpressLogger(logger, {
  ignorePaths: ['/health', '/metrics'],
  extractUserId: (req) => req.user?.id
}));

app.get('/api/users', (req, res) => {
  // Questa richiesta viene loggata automaticamente
  res.json({ users: [] });
});
```

---

## 📚 Documentazione Completa

### Server
- **[Guida Eventi Standardizzati](EVENTI_STANDARDIZZATI.md)** - Tutorial completo con esempi
- **[FASE 1 Completata](FASE1_COMPLETATA.md)** - Riepilogo implementazione
- **[Changelog](CHANGELOG.md)** - Storico versioni

### Client Library
- **[Client README](docs/CLIENT_README.md)** - Documentazione client completa
- **[API Reference](docs/CLIENT_API.md)** - Riferimento API
- **[Examples](docs/examples/)** - Esempi d'uso

---

## 🗂️ Struttura Progetto

```
log-service/
├── src/
│   ├── server.ts              # Entry point server
│   ├── models/                # Mongoose models
│   │   └── azioneLog.ts       # Modello principale con metodi
│   ├── routes/                # Express routes
│   ├── types/                 # TypeScript types (condivisi)
│   │   └── eventCategories.ts # Categorie eventi
│   ├── utils/                 # Utilities (condivise)
│   │   ├── eventValidator.ts  # Validazione eventi
│   │   └── eventBuilder.ts    # Builder server-side
│   ├── client/                # 📦 CLIENT LIBRARY
│   │   ├── index.ts           # Export punto principale
│   │   ├── LogClient.ts       # HTTP client
│   │   ├── EventBuilder.ts    # Builder client-side
│   │   ├── types.ts           # Types client
│   │   ├── queue/
│   │   │   └── OfflineQueue.ts
│   │   └── middleware/
│   │       └── expressLogger.ts
│   └── scripts/
│       └── testStandardizedEvents.ts
├── package.json               # Server + Client exports
├── tsconfig.json
├── Dockerfile
└── docker-compose.yml
```

---

## 🎨 Event Categories

### 1. AUTH - Autenticazione
- `login_success`, `login_failed`, `logout`
- `password_reset_request`, `password_reset_complete`
- `mfa_enabled`, `mfa_disabled`

### 2. DATA - Operazioni CRUD
- `create`, `update`, `delete`, `restore`
- `bulk_create`, `bulk_update`, `bulk_delete`
- `import`, `export`

### 3. EMAIL - Eventi Email
- `sent`, `delivered`, `failed`, `bounced`
- `opened`, `clicked`, `unsubscribed`

### 4. SYSTEM - Eventi Sistema
- `startup`, `shutdown`
- `cron_job_start`, `cron_job_complete`, `cron_job_failed`
- `api_call_external`, `webhook_received`

### 5. AUDIT - Audit Trail
- `permission_granted`, `permission_revoked`
- `role_assigned`, `role_removed`
- `configuration_change`, `compliance_check`

### 6. SECURITY - Sicurezza
- `suspicious_activity`, `brute_force_attempt`
- `ip_blocked`, `rate_limit_exceeded`
- `unauthorized_access`, `data_breach_attempt`

---

## 🔧 API Endpoints (Server)

### Logs

```http
POST   /api/logs              # Crea nuovo log
GET    /api/logs              # Lista logs (paginata)
GET    /api/logs/:id          # Dettaglio log
DELETE /api/logs/:id          # Elimina log
GET    /api/logs/stats        # Statistiche
```

### Query Parameters

```http
GET /api/logs?categoria=AUTH&criticita=error&limit=50
GET /api/logs?startDate=2026-01-01&endDate=2026-02-09
GET /api/logs?userId=user_123&entita=order
```

---

## 🧪 Testing

### Server

```bash
npm run test:events    # Test eventi standardizzati
npm run test:api       # Test API REST
```

### Client Library

```typescript
// Nei tuoi microservizi
import { LogClient } from '@edg/log-service/client';

const logger = new LogClient({
  apiUrl: 'http://localhost:4000',
  debug: true
});

// Health check
const isHealthy = await logger.healthCheck();
console.log('Log Service:', isHealthy ? 'UP' : 'DOWN');
```

---

## 🐳 Docker

### Build

```bash
docker build -t edg-log-service .
```

### Run

```bash
docker run -d \
  --name log-service \
  -p 4000:4000 \
  -e MONGO_URI=mongodb://... \
  edg-log-service
```

### Docker Compose

```yaml
services:
  log-service:
    build: ./log-service
    ports:
      - "4000:4000"
    environment:
      - MONGO_URI=mongodb://log-mongo:27017/edg-logger
    depends_on:
      - log-mongo
```

---

## 📊 Performance

- **Throughput**: ~5,000 logs/sec
- **Latency**: < 10ms (P95)
- **Storage**: ~1KB per evento medio
- **Indici MongoDB**: 12 indici ottimizzati

---

## 🔐 Sicurezza

- ✅ API Key authentication
- ✅ Helmet.js security headers
- ✅ CORS configurabile
- ✅ Rate limiting (TODO: Phase 2)
- ✅ Input validation con sanitization

---

## 🛣️ Roadmap

### ✅ FASE 1 - Eventi Standardizzati (COMPLETATA)
- [x] 6 categorie eventi + 59 sottotipi
- [x] Event Builder API fluent
- [x] Client Library integrato
- [x] Validazione robusta
- [x] 12 indici MongoDB
- [x] Test suite completa

### 🚧 FASE 2 - Dashboard & Alerting (In Progress)
- [ ] Dashboard React per visualizzazione
- [ ] Sistema alerting (Slack/Email)
- [ ] Metriche Prometheus
- [ ] Retention policy automatica

### 📅 FASE 3 - Advanced Features
- [ ] Elasticsearch integration
- [ ] GraphQL API
- [ ] Streaming real-time (WebSocket)
- [ ] Machine learning anomaly detection

---

## 📄 License

ISC © EDG Development Team

---

## 🤝 Contributors

- **Mormegil** - Lead Developer

---

## 📞 Support

Per problemi o domande:
- GitHub Issues: https://github.com/LarisPigasse/EdgLogger/issues
- Email: support@edg.com
