# 📝 EDG PLATFORM - CHANGELOG

Storia delle modifiche e decisioni architetturali.

---

## [2.0.0] - 2025-10-16

### 🎉 Aggiunto

#### Log Service (EdgLogger)
- ✅ Microservizio completo per logging centralizzato
- ✅ MongoDB come database per i log
- ✅ API per creazione, ricerca e statistiche log
- ✅ Calcolo automatico differenze tra stati
- ✅ Supporto transazioni correlate
- ✅ Autenticazione via API key
- ✅ Dockerfile per containerizzazione
- ✅ Integrazione in docker-compose.yml

#### MongoDB Database
- ✅ Container MongoDB 7.0 per log-service
- ✅ Porta 27017 esposta per DBeaver (development)
- ✅ Utente dedicato `edg_logger` con database `edg_logs`
- ✅ Health check configurato
- ✅ Volumi persistenti per dati

#### API Gateway
- ✅ Routing per log-service: `/log/*` → `log-service:4000/api/log/*`
- ✅ Proxy funzionante per tutti i servizi
- ✅ Path rewriting corretto
- ✅ Gestione errori migliorata

#### Documentazione
- ✅ **EDG-PLATFORM-DOCUMENTATION.md** - Documentazione completa unificata
- ✅ **EDG-API-REFERENCE.md** - Reference API dettagliata
- ✅ **CHANGELOG.md** - Storia modifiche (questo file)
- ✅ Consolidamento documentazione in file principale
- ✅ Rimozione ridondanze tra documenti

### 🔧 Modificato

#### Docker Compose
- ✅ Aggiunto servizio `logger-mongo`
- ✅ Aggiunto servizio `log-service`
- ✅ Aggiornate dipendenze tra servizi
- ✅ Configurati health checks per nuovi servizi
- ✅ Network `internal` non più isolato (per DBeaver in development)

#### Environment Variables
- ✅ Aggiunte variabili MongoDB: `MONGO_LOG_USER`, `MONGO_LOG_PASSWORD`, `MONGO_LOG_DATABASE`
- ✅ Aggiunta `LOG_API_KEY_SECRET` per autenticazione log-service
- ✅ Documentate tutte le variabili in formato completo

#### Gateway
- ✅ Implementazione con axios invece di http-proxy-middleware
- ✅ Controllo totale su path rewriting
- ✅ Logging migliorato per debug
- ✅ Error handling più robusto

### 🐛 Fixed

#### Gateway Proxy Issues
- ✅ **CRITICO**: Risolto problema pathRewrite non funzionante
- ✅ Soluzione: Proxy manuale con axios invece di http-proxy-middleware
- ✅ Path mapping corretto: `/auth/health` → `/health`, `/auth/*` → `/auth/*`
- ✅ POST body correttamente inoltrato ai microservizi

#### Database Access
- ✅ MySQL e MongoDB ora accessibili da DBeaver (development)
- ✅ Rimozione `internal: true` dalla rete Docker per permettere accesso host
- ✅ Porta MySQL 3306 e MongoDB 27017 esposte correttamente

### 📚 Documentazione

#### Consolidamento
- ✅ Unificati 3+ documenti MD in uno principale
- ✅ Eliminate ridondanze e informazioni obsolete
- ✅ Struttura gerarchica chiara e navigabile
- ✅ Sezioni separate per setup, troubleshooting, API reference

#### Nuove Guide
- ✅ Setup MongoDB con DBeaver
- ✅ Configurazione log-service
- ✅ Integrazione log-service da altri microservizi
- ✅ Query MongoDB utili per analisi log

---

## [1.0.0] - 2025-10-15

### 🎉 Rilascio Iniziale

#### Auth Service
- ✅ Microservizio autenticazione completo
- ✅ JWT (access token 15min + refresh token 7 giorni)
- ✅ RBAC con permessi composti (`modulo.azione`)
- ✅ Multi-account type (operatore, partner, cliente, agente)
- ✅ Reset password con token
- ✅ Gestione sessioni multiple per dispositivo
- ✅ Rate limiting specifico per business logic

#### Dual Mode Support
- ✅ **GATEWAY_MODE=false**: Standalone development mode
  - CORS attivo
  - Rate limiting generale attivo
  - Validazione JWT diretta
- ✅ **GATEWAY_MODE=true**: Production gateway mode
  - NO CORS (gestito da gateway)
  - NO rate limiting generale (gestito da gateway)
  - Trust header X-User-Data dal gateway

#### Database
- ✅ MySQL 8.0 con Sequelize ORM
- ✅ 5 tabelle: accounts, roles, role_permissions, sessions, reset_tokens
- ✅ Dual key pattern (id INT + uuid UUID)
- ✅ Indici ottimizzati per performance
- ✅ Associazioni RBAC complete

#### API Gateway
- ✅ Express gateway per routing
- ✅ CORS handling
- ✅ Rate limiting generale (100 req/15min)
- ✅ Proxy verso auth-service
- ✅ Health check endpoint

#### Docker Infrastructure
- ✅ docker-compose.yml completo
- ✅ Network isolation (internal + external)
- ✅ MySQL container con health check
- ✅ Auth-service containerizzato
- ✅ API Gateway containerizzato
- ✅ Volumi persistenti per database

#### Documentazione
- ✅ Architettura completa
- ✅ Guide setup e deployment
- ✅ API reference
- ✅ Troubleshooting
- ✅ Checkpoint per nuove chat

### 🐛 Fixed

#### Endpoint 404 Error
- **Problema**: Tutti gli endpoint restituivano 404
- **Causa**: Error handlers registrati PRIMA delle route
- **Soluzione**: 
  ```typescript
  // ORDINE CORRETTO
  setupMiddleware()
  setupHealthAndRoot()
  registerModuleRoutes()     // ← Route PRIMA
  setupErrorHandlers()       // ← Error handlers DOPO
  ```
- **File modificati**: `src/core/server.ts`, `src/app.ts`

#### TypeScript Errors - TokenService
- **Problema**: Metodi di istanza usati come statici
- **Soluzione**: TokenService ora usa correttamente i metodi di istanza:
  ```typescript
  // PRIMA (Sbagliato)
  TokenService.generateAccessToken(payload)
  
  // DOPO (Corretto)
  const tokenService = new TokenService();
  tokenService.generateAccessToken(payload);
  ```

---

## [0.5.0] - 2025-10-13

### 🎉 Alpha Release

#### Core Features
- ✅ Auth service base implementato
- ✅ Database design completato
- ✅ Basic JWT authentication
- ✅ RBAC system design

#### Testing
- ✅ Postman collection creata
- ✅ Test manuali completati
- ✅ Tutti gli endpoint funzionanti

---

## Decisioni Architetturali Chiave

### 1. Dual Mode Architecture (v1.0.0)
**Decisione**: Supportare sia standalone che gateway mode  
**Rationale**: 
- Development più facile (standalone)
- Production sicura (gateway)
- Nessun cambiamento codice tra ambienti
- Configurazione via env var `GATEWAY_MODE`

### 2. RBAC con Permessi Composti (v1.0.0)
**Decisione**: Formato `modulo.azione` senza gerarchia  
**Rationale**:
- Granularità perfetta senza complessità
- Facile da gestire e comprendere
- Performance ottimale (no ricerca gerarchica)
- Esempio: `users.create`, `orders.read`, `reports.export`

### 3. Dual Key Pattern (v1.0.0)
**Decisione**: `id` (INT PK) + `uuid` (UUID UNIQUE)  
**Rationale**:
- Performance: JOIN veloci con INT
- Security: UUID nelle API esterne
- Compatibilità: Standard SQL con INT PK

### 4. JWT con Permissions nel Payload (v1.0.0)
**Decisione**: Include array permissions nel JWT  
**Rationale**:
- Zero query DB per ogni richiesta
- Validazione velocissima
- Permissions immutabili fino a scadenza token (15min)
- Trade-off accettabile: re-login ogni 15min per nuovi permessi

### 5. Rate Limiting Ibrido (v1.0.0)
**Decisione**: Generale (gateway) + Specifico (microservizio)  
**Rationale**:
- Gateway: Protezione DDoS generale
- Microservizio: Business logic protection (login attempts, etc.)
- Nessuna duplicazione: limiti diversi con scopi diversi

### 6. Session Strategy (v1.0.0)
**Decisione**: Access JWT (15min) + Refresh random token (7 giorni)  
**Rationale**:
- Access token breve: sicurezza
- Refresh token lungo: user experience
- Refresh token random: revocabile via DB
- Best practice industry standard

### 7. MongoDB per Logging (v2.0.0)
**Decisione**: Database separato NoSQL per i log  
**Rationale**:
- Schema flessibile per diversi tipi di log
- Performance eccellente per time-series data
- Aggregation pipeline potente per statistiche
- Indipendenza dal database principale

### 8. Gateway con Axios (v2.0.0)
**Decisione**: Proxy manuale con axios invece di http-proxy-middleware  
**Rationale**:
- Controllo totale su path rewriting
- Più semplice da debuggare
- Nessun problema con configurazione complessa
- Gestione errori più granulare

---

## Breaking Changes

### v2.0.0
- **docker-compose.yml**: Aggiunti nuovi servizi (logger-mongo, log-service)
- **Environment**: Nuove variabili richieste (`MONGO_LOG_*`, `LOG_API_KEY_SECRET`)
- **Network**: `internal` non più isolato (per DBeaver)

### v1.0.0
- **Environment**: Nuove variabili richieste (`GATEWAY_MODE`, `GATEWAY_SECRET`)
- **Deployment**: Richiede docker-compose invece di standalone
- **CORS**: Gestito dal gateway in production invece che dal microservizio

---

## Deprecations

Nessuna deprecation al momento.

---

## Security Fixes

### v2.0.0
- ✅ Log service protetto da API key
- ✅ MongoDB accessibile solo da rete interna (production)

### v1.0.0
- ✅ Network isolation completa tra servizi
- ✅ Gateway secret per comunicazione interna
- ✅ Rate limiting per prevenire brute force

---

## Known Issues

### v2.0.0
- **Development**: MySQL e MongoDB porte esposte per DBeaver (va bene per dev, rimuovere in prod)
- **Email**: Reset password non invia email reali (implementazione futura)
- **Monitoring**: Nessun sistema di monitoring/alerting ancora implementato

---

## Roadmap

### v2.1.0 (Prossima Release)
- [ ] Email service per reset password
- [ ] Redis cache per permissions
- [ ] Prometheus metrics
- [ ] Grafana dashboards

### v3.0.0 (Futuro)
- [ ] 2FA (Two-Factor Authentication)
- [ ] OAuth2 provider
- [ ] API admin per gestione ruoli
- [ ] Permission service completo
- [ ] Unit tests completi
- [ ] CI/CD pipeline

---

## Contributors

- Claude AI Assistant (Development & Documentation)
- Development Team

---

## License

Proprietary - EDG Platform

---

**Ultimo aggiornamento**: 16 Ottobre 2025
