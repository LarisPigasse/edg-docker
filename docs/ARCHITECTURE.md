# 🏗️ EDG Platform - Architecture Overview

> **Documentazione architetturale completa del sistema**

---

## 📊 Executive Summary

**EDG Platform** è una piattaforma di gestione logistica basata su **architettura a microservizi** con **High Availability nativa**.

### Caratteristiche Principali

- ✅ **Microservizi indipendenti** - Sviluppo e deploy separati
- ✅ **High Availability** - Dual gateway con failover automatico
- ✅ **Load Balancing** - Traefik distribuisce il carico
- ✅ **Zero Downtime** - Update senza interruzione servizio
- ✅ **Containerizzazione completa** - Docker + Docker Compose
- ✅ **Production-ready** - Testato e robusto

---

## 🎯 Stack Tecnologico

### Backend

| Componente | Tecnologia | Versione | Scopo |
|------------|------------|----------|-------|
| **Runtime** | Node.js | 18+ | Esecuzione JavaScript server-side |
| **Framework** | Express | 4.x | API REST framework |
| **ORM** | Sequelize | 6.x | Object-Relational Mapping (MySQL) |
| **Auth** | JWT | - | JSON Web Tokens per autenticazione |
| **Validation** | Joi | - | Validazione input |

### Frontend

| Componente | Tecnologia | Versione | Scopo |
|------------|------------|----------|-------|
| **Framework** | React | 18+ | UI Component library |
| **Language** | TypeScript | 5+ | Type-safe JavaScript |
| **Build Tool** | Vite | 4+ | Fast build e hot reload |
| **Styling** | Tailwind CSS | 3+ | Utility-first CSS framework |
| **HTTP Client** | Axios | - | Promise-based HTTP client |

### Database

| Componente | Tecnologia | Versione | Scopo |
|------------|------------|----------|-------|
| **SQL** | MySQL | 8.0 | Database relazionale (auth, users) |
| **NoSQL** | MongoDB | 7.0 | Database documenti (logs) |

### Infrastructure

| Componente | Tecnologia | Versione | Scopo |
|------------|------------|----------|-------|
| **Container** | Docker | 20.10+ | Containerizzazione |
| **Orchestrator** | Docker Compose | 2.0+ | Multi-container orchestration |
| **Load Balancer** | Traefik | 2.10 | Reverse proxy e LB |
| **Networking** | Docker Networks | - | Isolamento servizi |

---

## 🏛️ Architettura Sistema

### Diagramma Generale

```
┌─────────────────────────────────────────────────────────────┐
│                         Internet                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP/HTTPS
                         ▼
              ┌──────────────────┐
              │     Traefik      │
              │  Load Balancer   │
              │ :80, :443, :8888 │
              └────────┬─────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌───────────────┐            ┌───────────────┐
│ API Gateway 1 │            │ API Gateway 2 │
│    :8080      │            │    :8080      │
└───────┬───────┘            └───────┬───────┘
        │                            │
        └──────────┬─────────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
    ▼              ▼              ▼
┌────────┐  ┌──────────┐  ┌──────────────┐
│ Auth   │  │   Log    │  │   Frontends  │
│Service │  │ Service  │  │  Pro/App/EDG │
│ :3001  │  │          │  │ 5173/74/75   │
└───┬────┘  └────┬─────┘  └──────────────┘
    │            │
    │            │
    ▼            ▼
┌────────┐  ┌──────────┐
│ MySQL  │  │ MongoDB  │
│ :3306  │  │ :27017   │
└────────┘  └──────────┘
```

---

## 📦 Componenti Dettagliati

### 1. Traefik (Load Balancer)

**Responsabilità:**
- Riceve tutte le richieste HTTP/HTTPS
- Distribuisce carico tra i 2 gateway
- Monitora health dei backend
- Esclude automaticamente gateway unhealthy
- Fornisce dashboard per monitoring

**Configurazione:**
```yaml
ports:
  - "80:80"       # HTTP pubblico
  - "443:443"     # HTTPS pubblico (futuro)
  - "8888:8080"   # Dashboard privata

command:
  - "--api.dashboard=true"
  - "--providers.docker=true"
  - "--entrypoints.web.address=:80"
  - "--metrics.prometheus=true"
```

**Health Check:**
- Endpoint: `/ping`
- Interval: 10s
- Timeout: 5s

**Metriche:**
- Requests per second
- Response time
- Backend status
- Error rate

---

### 2. API Gateway (Dual Instance)

**Responsabilità:**
- Punto d'ingresso unico per tutti i client
- Routing verso microservizi appropriati
- Autenticazione JWT
- Rate limiting
- CORS handling
- Request/Response logging

**Endpoints:**
```
/api/auth/*          → Auth Service
/api/logs/*          → Log Service
/pro/*              → Pro Frontend
/app/*              → App Frontend
/edg/*              → EDG Frontend
/health             → Health check
```

**Configurazione:**
```yaml
environment:
  NODE_ENV: production
  PORT: 8080
  AUTH_SERVICE_URL: http://auth-service:3001
  JWT_SECRET: ${JWT_SECRET}
  GATEWAY_SECRET: ${GATEWAY_SECRET}
  RATE_LIMIT_MAX_ATTEMPTS: 100
  INSTANCE_ID: gateway-1  # o gateway-2
```

**Differenze tra Gateway 1 e 2:**
- Identica configurazione
- Solo `INSTANCE_ID` diverso per identificazione
- Condividono stesso `JWT_SECRET`
- Condividono stesso `GATEWAY_SECRET`

**Health Check:**
- Endpoint: `/health`
- Interval: 10s
- Timeout: 5s
- Start period: 20s

---

### 3. Auth Service (Microservizio)

**Responsabilità:**
- Registrazione utenti
- Login/Logout
- Gestione JWT tokens (access + refresh)
- RBAC (Role-Based Access Control)
- Password reset
- Email verification

**Database:**
- MySQL (auth-mysql)
- Tabelle: users, roles, permissions, sessions

**Endpoints:**
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me
POST   /api/auth/reset-password
GET    /health
```

**Security:**
- Password hashing: bcrypt
- JWT tokens: access (15m) + refresh (7d)
- Rate limiting: 5 login attempts / 15 min
- CSRF protection

---

### 4. Log Service (Microservizio)

**Responsabilità:**
- Raccolta logs da tutti i servizi
- Aggregazione e indicizzazione
- Query e filtering
- Retention policy
- Export logs

**Database:**
- MongoDB (log-mongo)
- Collections: logs, metrics, errors

**Endpoints:**
```
POST   /api/logs
GET    /api/logs?level=error&date=2025-11-13
GET    /api/logs/:id
DELETE /api/logs?before=2025-10-01
GET    /health
```

**Log Levels:**
- DEBUG: Dettagli sviluppo
- INFO: Eventi normali
- WARN: Situazioni anomale ma gestibili
- ERROR: Errori che richiedono attenzione
- CRITICAL: Errori critici sistema

---

### 5. Frontend Applications

#### Pro Frontend (Operatori)

**Scopo:** Interfaccia per operatori interni EDG.

**Features:**
- Dashboard operativa
- Gestione spedizioni
- Tracking real-time
- Reporting
- Admin panel

**Porte:**
- Dev: 5173
- Prod: Servito via Gateway

#### App Frontend (Clienti)

**Scopo:** Interfaccia per clienti finali.

**Features:**
- Richiesta preventivi
- Creazione spedizioni
- Tracking spedizioni
- Storico ordini
- Profilo utente

**Porte:**
- Dev: 5174
- Prod: Servito via Gateway

#### EDG Frontend (Partner)

**Scopo:** Interfaccia per partner/corrieri.

**Features:**
- Gestione ritiri
- Aggiornamento stato
- Proof of delivery
- Analytics partner
- Fatturazione

**Porte:**
- Dev: 5175
- Prod: Servito via Gateway

---

### 6. Databases

#### MySQL (auth-mysql)

**Schema:**

```sql
users
├── id (PK)
├── email (UNIQUE)
├── password_hash
├── role_id (FK)
├── email_verified
├── created_at
└── updated_at

roles
├── id (PK)
├── name (admin, operator, client, partner)
└── permissions (JSON)

sessions
├── id (PK)
├── user_id (FK)
├── refresh_token
├── expires_at
└── created_at
```

**Backup:**
```bash
docker exec auth-mysql mysqldump \
  -u root -p${MYSQL_ROOT_PASSWORD} \
  edg_auth > backup.sql
```

#### MongoDB (log-mongo)

**Collections:**

```javascript
logs: {
  _id: ObjectId,
  timestamp: ISODate,
  level: String,
  service: String,
  message: String,
  metadata: Object,
  user_id: String
}

metrics: {
  _id: ObjectId,
  timestamp: ISODate,
  service: String,
  metric_name: String,
  value: Number
}
```

**Backup:**
```bash
docker exec log-mongo mongodump \
  --uri="mongodb://logger:${MONGO_LOG_PASSWORD}@localhost:27017/edglogger" \
  --out=/tmp/backup
```

---

## 🔒 Sicurezza

### Network Isolation

**External Network (edg-external):**
- Traefik ↔ Internet
- Traefik ↔ API Gateways
- Gateway ↔ Frontend (dev only)

**Internal Network (edg-internal):**
- Gateway ↔ Microservizi
- Gateway ↔ Frontend
- Microservizi ↔ Database
- Isolata da Internet

### Authentication Flow

```
1. Client → POST /api/auth/login
   Headers: { email, password }

2. Gateway → forward → Auth Service
   Verifica credenziali in MySQL

3. Auth Service → genera JWT tokens
   Access Token (15min) + Refresh Token (7d)

4. Gateway ← tokens ← Auth Service

5. Client ← tokens ← Gateway

6. Client → GET /api/risorsa-protetta
   Headers: { Authorization: Bearer <access-token> }

7. Gateway → verifica JWT (senza chiamare Auth Service)
   Decodifica token, verifica firma, verifica scadenza

8. Se valido → forward → Microservizio
   Se scaduto → 401 Unauthorized

9. Client → POST /api/auth/refresh
   Headers: { Authorization: Bearer <refresh-token> }

10. Gateway → forward → Auth Service
    Verifica refresh token in database

11. Auth Service → genera nuovo access token

12. Client ← nuovo access token ← Gateway
```

### Secrets Management

**Mai in codice:**
```javascript
// ❌ SBAGLIATO
const JWT_SECRET = "mysecret123";

// ✅ CORRETTO
const JWT_SECRET = process.env.JWT_SECRET;
```

**File .env:**
```bash
# Generate secure secrets:
openssl rand -base64 32  # Per JWT_SECRET
openssl rand -base64 32  # Per GATEWAY_SECRET
openssl rand -base64 24  # Per DB passwords
```

**Git ignore:**
```
.env
.env.local
.env.production
*.secret
```

---

## 🚀 Deployment Flow

### Ambiente Sviluppo

```bash
# 1. Clone repo
git clone <repo-url>
cd edg-docker

# 2. Setup environment
cp .env.example .env
nano .env  # Modifica variabili

# 3. Build
docker-compose build

# 4. Start
docker-compose up -d

# 5. Develop
# Frontend: hot reload automatico
# Backend: docker-compose restart <service>
```

### Ambiente Produzione

```bash
# 1. Setup server
# - Install Docker + Docker Compose
# - Configure firewall (80, 443)
# - Setup SSL certificates

# 2. Deploy
git clone <repo-url> /opt/edg-docker
cd /opt/edg-docker

# 3. Configure
nano .env  # Production values

# 4. Build
docker-compose build --no-cache

# 5. Start
docker-compose up -d

# 6. Verify
docker-compose ps
curl https://yourdomain.com/health

# 7. Monitor
docker-compose logs -f
```

### Rolling Update (Zero Downtime)

```bash
# Update Gateway 1 (traffic on Gateway 2)
docker-compose build api-gateway-1
docker-compose up -d api-gateway-1
sleep 20  # Attendi healthy

# Update Gateway 2 (traffic on Gateway 1)
docker-compose build api-gateway-2
docker-compose up -d api-gateway-2
sleep 20  # Attendi healthy

# Update microservizi (no downtime needed)
docker-compose build auth-service
docker-compose up -d auth-service
```

---

## 📈 Scalabilità

### Scaling Verticale (Single Server)

**Aumenta risorse container:**
```yaml
# docker-compose.yml
services:
  api-gateway-1:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Scaling Orizzontale (Multi Gateway)

**Aggiungi Gateway 3, 4, 5...**
```yaml
# docker-compose.yml
api-gateway-3:
  # Copia config gateway-1
  environment:
    INSTANCE_ID: gateway-3
```

Traefik lo rileva automaticamente e inizia a distribuire traffico! ✨

### Scaling Multi-Server (Future)

**Docker Swarm o Kubernetes:**
```yaml
# docker-stack.yml (Swarm)
services:
  api-gateway:
    deploy:
      replicas: 5
      update_config:
        parallelism: 1
        delay: 10s
```

---

## 📊 Monitoring e Metriche

### Dashboard Traefik

**URL:** http://localhost:8888/dashboard/

**Info visualizzate:**
- Routers HTTP configurati
- Services backend e loro health
- Requests per second
- Response time medio
- Error rate

### Prometheus Metrics (Futuro)

**Metriche esportate da Traefik:**
```
traefik_service_requests_total
traefik_service_request_duration_seconds
traefik_backend_requests_total
traefik_entrypoint_requests_total
```

**Setup Prometheus + Grafana:**
```yaml
prometheus:
  image: prom/prometheus
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml

grafana:
  image: grafana/grafana
  ports:
    - "3000:3000"
```

### Application Logs

**Centralizzati in Log Service:**
```javascript
// In ogni microservizio:
logger.info('User logged in', { userId: 123 });
logger.error('Database connection failed', { error });
```

**Query logs:**
```bash
# Ultimi 100 errori
curl http://localhost/api/logs?level=error&limit=100

# Logs specifico servizio
curl http://localhost/api/logs?service=auth-service

# Logs oggi
curl http://localhost/api/logs?date=2025-11-13
```

---

## 🔄 Disaster Recovery

### Backup Strategy

**Daily:**
```bash
# MySQL
docker exec auth-mysql mysqldump \
  -u root -p${MYSQL_ROOT_PASSWORD} \
  --all-databases > backup_$(date +%Y%m%d).sql

# MongoDB
docker exec log-mongo mongodump \
  --uri="..." --out=/tmp/backup_$(date +%Y%m%d)
```

**Weekly:**
- Full backup dei volumi Docker
- Copy offsite (S3, altro server)

**Monthly:**
- Test restore su ambiente staging

### Recovery Procedure

**Restore database:**
```bash
# MySQL
docker exec -i auth-mysql mysql \
  -u root -p${MYSQL_ROOT_PASSWORD} < backup_20251113.sql

# MongoDB
docker exec log-mongo mongorestore \
  --uri="..." /tmp/backup_20251113
```

**Rollback applicazione:**
```bash
# 1. Checkout versione precedente
git checkout <previous-commit>

# 2. Rebuild
docker-compose build --no-cache

# 3. Deploy
docker-compose up -d

# 4. Verify
curl http://localhost/health
```

---

## 🎯 Best Practices

### Sviluppo

- ✅ Branch strategy: main (prod) → develop → feature/xxx
- ✅ Code review obbligatorio
- ✅ Test automatici prima di merge
- ✅ Conventional commits
- ✅ Semantic versioning

### Sicurezza

- ✅ Mai committare secrets
- ✅ Rotate secrets ogni 90 giorni
- ✅ Usa HTTPS in produzione
- ✅ Rate limiting su tutti gli endpoint
- ✅ Input validation su tutti i payload
- ✅ SQL injection prevention (ORM parameterized queries)
- ✅ XSS prevention (sanitize output)
- ✅ CSRF tokens

### Performance

- ✅ Database indexes su campi frequently queried
- ✅ Redis cache per queries ripetitive (futuro)
- ✅ CDN per assets statici (futuro)
- ✅ Gzip compression su API responses
- ✅ Connection pooling database
- ✅ Lazy loading frontend

### Monitoring

- ✅ Log tutto (info, warn, error)
- ✅ Alert su errori critici
- ✅ Dashboard metriche sempre visibile
- ✅ Health check ogni servizio
- ✅ Backup automatici testati

---

## 🔮 Roadmap Futuro

### Short-term (0-3 mesi)

- [ ] SSL/TLS con Let's Encrypt
- [ ] Prometheus + Grafana monitoring
- [ ] Slack alerts su errori critici
- [ ] Redis cache layer
- [ ] WebSocket support (real-time)

### Mid-term (3-6 mesi)

- [ ] Kubernetes deployment
- [ ] Multi-region (EU + US)
- [ ] CDN integration
- [ ] Advanced RBAC
- [ ] API versioning (v1, v2)

### Long-term (6-12 mesi)

- [ ] Service Mesh (Istio)
- [ ] Chaos Engineering
- [ ] AI/ML integration
- [ ] Mobile apps (React Native)
- [ ] GraphQL API

---

## 📚 Riferimenti

### Documentazione

- **README.md** - Guida principale utente
- **TROUBLESHOOTING.md** - Risoluzione problemi
- **ARCHITECTURE.md** - Questo documento

### Risorse Esterne

- [Docker Docs](https://docs.docker.com/)
- [Traefik Docs](https://doc.traefik.io/traefik/)
- [Express.js](https://expressjs.com/)
- [React](https://react.dev/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

**Documento aggiornato:** Novembre 2025  
**Versione architettura:** 2.0 (HA)  
**Prossimo review:** Ogni 6 mesi o major changes
