# Architettura Microservizi per Sistema di Gestione Logistica e Spedizioni

## Documento di Design Architetturale

**Data:** Ottobre 2025  
**Versione:** 1.0  
**Autore:** Documentazione tecnica di progetto

---

## 1. Contesto e Obiettivi

### 1.1 Contesto Tecnico

- **Stack Backend:** Node.js/Express, Python
- **Stack Frontend:** React (TypeScript/JavaScript)
- **Mobile:** Flutter (Dart)
- **Database:** MySQL, MongoDB
- **Ambiente di sviluppo:** VS Code su Windows 11
- **Infrastruttura:** Server dedicato Ubuntu su Ionos con Plesk Obsidian
- **Containerizzazione:** Docker (standard per ambiente locale e remoto)
- **Version Control:** Git su GitHub
- **Vincolo:** Esclusivamente soluzioni Open Source

### 1.2 Obiettivi del Sistema

Sviluppare un'applicazione aziendale modulare e scalabile per la gestione di:

- Ordini e spedizioni
- Logistica e tracking
- Fatturazione
- Amministrazione interna

### 1.3 Filosofia di Sviluppo

- **Architettura:** Microservizi con approccio incrementale
- **Qualità:** Modularità, Scalabilità, Sicurezza, Pulizia del Codice
- **Standard:** Prettier, ESLint
- **Testing:** Jest, Pytest (test semplici ed efficaci)
- **Deployment:** Container Docker su sottodomini di terzo livello

---

## 2. Architettura Generale: Il Modello a "Costellazione"

### 2.1 Concetto Fondamentale

L'architettura si basa su una **"costellazione" di sottodomini di terzo livello**, dove ogni sottodominio ospita un microservizio o modulo specifico in un container Docker dedicato.

**Esempio di naming:**

- `log.miodominio.it` → EdgLogger (gestione log)
- `auth.miodominio.it` → Servizio autenticazione
- `api.miodominio.it` → Backend principale / API Gateway
- `app.miodominio.it` → Frontend clienti
- `admin.miodominio.it` → Frontend amministrazione interna

### 2.2 Vantaggi dell'Approccio

✅ **Separazione delle responsabilità** - Ogni servizio ha uno scopo chiaro  
✅ **Scalabilità indipendente** - Ogni servizio cresce autonomamente  
✅ **Deploy isolato** - Aggiornamenti senza impatto su altri servizi  
✅ **Naming intuitivo** - Nomenclatura comprensibile per il team  
✅ **Allineamento con Docker/Plesk** - Gestione container semplificata

### 2.3 Considerazioni Critiche

⚠️ **Complessità operativa** - Richiede gestione attenta di:

- Autenticazione distribuita
- Comunicazione inter-service
- Transazioni distribuite
- Monitoring e logging centralizzato

---

## 3. Classificazione dei Servizi

### 3.1 Servizi Accessori (Infrastructure/Platform Services)

**Definizione:** Forniscono capacità trasversali utilizzate da tutti i servizi operativi. Non implementano logica di business specifica ma abilitano funzionalità comuni.

**Caratteristiche:**

- Sviluppati una volta, riutilizzati ovunque
- Indipendenti dal dominio business
- Alta disponibilità critica
- Database dedicati e isolati

**Servizi identificati:**

#### 3.1.1 Autenticazione (`auth.miodominio.it`)

- **Database:** `auth_db` (ISOLATO)
- **Responsabilità:**
  - Login/Logout
  - Emissione e validazione JWT
  - Gestione ruoli e permessi
  - Single Sign-On (SSO)
  - Password reset, 2FA
  - Audit login
- **Tecnologie suggerite:** Ory Kratos, Keycloak, Custom Node.js + JWT + Redis
- **Priorità:** CRITICA - blocca sviluppo di altri servizi

#### 3.1.2 Gestione Log (`log.miodominio.it` - EdgLogger)

- **Database:** `logs_db` (ISOLATO)
- **Responsabilità:**
  - Raccolta log applicativi
  - Error tracking
  - Audit trail
  - Performance metrics
  - Correlation ID tracking
- **Caratteristiche:** Write-intensive, asincrono, retention policy
- **Stato:** ✅ Già implementato

#### 3.1.3 Comunicazioni (`notifications.miodominio.it`)

- **Database:** `notifications_db` o queue-based
- **Responsabilità:**
  - Email transazionali
  - SMS notifications
  - Push notifications
  - Webhook esterni
  - Template management
- **Pattern:** Event-driven con code (RabbitMQ/Redis)
- **Provider:** Astratto (SendGrid, Mailgun, etc.)

#### 3.1.4 Tracking (`tracking.miodominio.it`)

- **Database:** `tracking_db` (ISOLATO)
- **Responsabilità:**
  - Raccolta eventi di consegna
  - Integrazione API corrieri
  - Geolocalizzazione
  - Stato real-time spedizioni
  - API pubbliche per clienti/destinatari
- **Caratteristiche:** High-volume, analytics-oriented, public-facing

#### 3.1.5 Analytics e Report (`analytics.miodominio.it`)

- **Database:** `analytics_db` (read-only replica di business_db)
- **Responsabilità:**
  - Dashboard KPI
  - Report periodici
  - Export dati (CSV, Excel)
  - Business intelligence
  - Aggregazioni complesse
- **Caratteristiche:** Read-heavy, batch processing, caching aggressivo

### 3.2 Servizi Operativi (Business/Domain Services)

**Definizione:** Implementano la logica di business core e gestiscono le interazioni con gli utenti finali.

**Caratteristiche:**

- Evolvono con il business
- Alta interazione con clienti/operatori
- Possono condividere database quando fortemente accoppiati
- Scalano in base al volume business

**Servizi identificati:**

#### 3.2.1 Gestione Ordini (`orders.miodominio.it`)

- **Database:** `business_db` (condiviso)
- **Responsabilità:**
  - Creazione ordini (clienti e admin)
  - Gestione lifecycle ordine
  - Validazione ordini
  - Link a fatture
  - Gestione variazioni
- **Interazione:** Alta con clienti via `app.miodominio.it`

#### 3.2.2 Gestione Spedizioni (`shipping.miodominio.it`)

- **Database:** `business_db` (condiviso con orders)
- **Responsabilità:**
  - Assegnazione corriere
  - Generazione etichette
  - Gestione ritiri
  - Gestione resi
  - Integrazione API corrieri
- **Interazione:** Clienti + operatori

#### 3.2.3 Fatturazione (`invoices.miodominio.it`)

- **Database:** `business_db` (condiviso)
- **Responsabilità:**
  - Generazione fatture da ordini
  - Gestione pagamenti
  - Storico fatturazione
  - Export fiscale
- **Motivo condivisione DB:** Transazioni atomiche con ordini

#### 3.2.4 Gestione Clienti (`customers.miodominio.it`)

- **Database:** `business_db` (condiviso)
- **Responsabilità:**
  - Anagrafica clienti
  - Indirizzi di consegna
  - Preferenze
  - Storico interazioni

#### 3.2.5 Gestione Inventario (`inventory.miodominio.it`)

- **Database:** `business_db` o `inventory_db` (valutare)
- **Responsabilità:**
  - Gestione stock
  - Warehouse management
  - Picking/Packing
  - Disponibilità prodotti

### 3.3 Frontend Applicativi

**Non sono microservizi** ma interfacce utente che aggregano chiamate API.

#### 3.3.1 Frontend Clienti (`app.miodominio.it`)

- React/TypeScript
- Consuma API via gateway
- Funzionalità: ordini, tracking, fatture

#### 3.3.2 Frontend Amministrazione (`admin.miodominio.it`)

- React/TypeScript (UI amministrativa)
- Consuma API di tutti i servizi operativi
- Autenticazione: ruoli admin via `auth.miodominio.it`

---

## 4. Strategia Database

### 4.1 Principio Guida

> **"Separare database quando porta valore reale (sicurezza, performance, scaling), condividere quando la separazione crea solo complessità senza benefici"**

### 4.2 Regole per Decidere

#### Condividere il Database quando:

✅ **Bounded Context comune** - Stesso dominio business  
✅ **Transazioni frequenti** - Devono essere atomiche insieme  
✅ **Forte coesione dei dati** - Entità naturalmente collegate  
✅ **Performance critiche** - Troppe API calls rallenterebbero  
✅ **Team piccolo** - Gestire molti DB è oneroso

#### Separare il Database quando:

❌ **Sicurezza critica** - Dati sensibili (auth)  
❌ **Pattern di accesso diverso** - Read-heavy vs write-heavy  
❌ **Crescita indipendente** - Volumi molto diversi  
❌ **Tecnologia ottimale diversa** - Time-series vs relazionale  
❌ **Ciclo di vita diverso** - Retention policies differenti  
❌ **Scaling indipendente** - Risorse molto diverse

### 4.3 Architettura Database Finale

```
SERVIZI ACCESSORI (Database Isolati):
├─ auth_db          → users, roles, sessions (SICUREZZA)
├─ logs_db          → application logs, errors (WRITE-HEAVY)
├─ tracking_db      → tracking events, locations (ANALYTICS, VOLUME)
└─ notifications_db → message queue, templates (OPERATIVO)

SERVIZI OPERATIVI (Database Condiviso):
└─ business_db      → orders, order_items, shipments,
                      invoices, payments, customers,
                      customer_addresses, inventory

ANALYTICS:
└─ analytics_db     → Read-only replica di business_db
```

### 4.4 Motivazioni delle Scelte

**auth_db separato:**

- 🔒 Dati sensibili isolati
- 🔒 Compliance (GDPR, audit)
- 🔒 Blast radius limitato
- 🔒 Backup policies dedicate

**logs_db separato:**

- 📊 Write-intensive
- 📊 Crescita rapida
- 📊 Retention policy specifica
- 📊 Non deve impattare business operations

**tracking_db separato:**

- 🚚 Volume altissimo (1 spedizione → 50+ eventi)
- 🚚 Query analitiche pesanti
- 🚚 Public-facing API
- 🚚 Data lifecycle diverso

**business_db condiviso (orders + invoices + shipments):**

- ✅ Transazioni atomiche necessarie
- ✅ Forte coesione (ordine → fattura → spedizione)
- ✅ Query cross-entity frequenti
- ✅ Performance critiche
- ✅ Complessità ridotta

---

## 5. API Gateway e Comunicazione

### 5.1 API Gateway (`gateway.miodominio.it` o `api.miodominio.it`)

**Responsabilità:**

- Punto di ingresso unico per i frontend
- Routing intelligente verso microservizi
- Rate limiting
- Load balancing
- CORS centralizzato
- Versioning API (`/v1/orders`, `/v2/orders`)

**Tecnologie suggerite:**

- Nginx
- Traefik (con auto-discovery)
- Kong

**Architettura:**

```
Frontend (app/admin)
    ↓
gateway.miodominio.it
    ├─→ /auth/*     → auth.miodominio.it
    ├─→ /orders/*   → orders.miodominio.it
    ├─→ /shipping/* → shipping.miodominio.it
    ├─→ /tracking/* → tracking.miodominio.it
    └─→ /analytics/* → analytics.miodominio.it
```

### 5.2 Comunicazione Sincrona (HTTP/REST)

**Quando usare:**

- Richieste frontend → backend
- Validazione auth (gateway → auth service)
- Query dati in real-time
- Operazioni CRUD semplici

**Standard:**

- REST API
- JSON payload
- HTTP status codes standard
- JWT per autenticazione

### 5.3 Comunicazione Asincrona (Events/Queue)

**Quando usare:**

- Notifiche (ordine creato → invia email)
- Operazioni non critiche per la risposta
- Aggregazione dati (analytics)
- Operazioni long-running

**Tecnologie suggerite:**

- RabbitMQ (affidabile, feature-rich)
- Redis Streams (semplice, performante)

**Pattern Event-Driven:**

```javascript
// Esempio: Creazione ordine
orders.miodominio.it
    ↓
Pubblica: OrderCreated { orderId: 123, customerId: 456 }
    ↓
Queue (RabbitMQ/Redis)
    ↓
Consumatori:
  - notifications → invia email conferma
  - analytics → aggiorna statistiche
  - log → registra evento
  - tracking → inizia monitoraggio
```

### 5.4 Correlation ID per Distributed Tracing

**Implementazione:**
Ogni richiesta riceve un ID unico che viene propagato attraverso tutti i servizi.

```
Client Request
    ↓ [correlation-id: req-12345-abc]
gateway.miodominio.it
    ↓ [correlation-id: req-12345-abc]
orders.miodominio.it
    ↓ [correlation-id: req-12345-abc]
shipping.miodominio.it
    ↓ [correlation-id: req-12345-abc]
log.miodominio.it (tutti i log marcati con req-12345-abc)
```

**Benefici:**

- Tracciabilità end-to-end
- Debugging facilitato
- Performance monitoring
- Analisi dei flussi

---

## 6. Gestione Transazioni Distribuite

### 6.1 Il Problema

**Scenario:** Un ordine richiede:

1. Creare ordine (`orders`)
2. Riservare inventario (`inventory`)
3. Creare spedizione (`shipping`)
4. Inviare notifica (`notifications`)

**Domanda:** Cosa succede se uno step fallisce?

### 6.2 Pattern Saga (Consigliato)

**Definizione:** Sequenza di transazioni locali coordinate tramite eventi, dove ogni servizio può "compensare" in caso di errore.

**Implementazione:**

```
1. orders crea ordine → SUCCESS
   ↓ Event: OrderCreated
2. inventory riserva stock → SUCCESS
   ↓ Event: StockReserved
3. shipping crea spedizione → FAIL
   ↓ Event: ShippingFailed
4. inventory COMPENSA → rilascia stock
   ↓ Event: StockReleased
5. orders COMPENSA → marca ordine fallito
   ↓ Event: OrderCancelled
```

**Vantaggi:**

- Più semplice da implementare
- Ogni servizio mantiene autonomia
- Fault tolerance

### 6.3 Alternative Future

**Event Sourcing + CQRS:**

- Per sistemi molto complessi
- Maggiore tracciabilità
- Richiede più infrastruttura

---

## 7. Sicurezza

### 7.1 Autenticazione e Autorizzazione

**JWT-based Authentication:**

```
1. Client → auth.miodominio.it (login)
2. auth → Genera JWT + Refresh Token
3. Client → Ogni richiesta include JWT nell'header
4. Gateway/Servizi → Validano JWT localmente
5. Token expiry → Client richiede refresh
```

**Vantaggi JWT:**

- Stateless
- Decentralizzato (ogni servizio valida)
- Payload con informazioni utente/ruoli

**Gestione Ruoli:**

```json
{
  "sub": "user123",
  "roles": ["customer"],
  "permissions": ["orders:read", "orders:create"]
}
```

### 7.2 Sicurezza Network

**Configurazione Firewall:**

- ✅ Porta MongoDB 32768 aperta nel firewall Ionos
- ✅ Limitare accesso per IP quando possibile
- ✅ Porte servizi interni NON esposte pubblicamente
- ✅ Solo gateway esposto pubblicamente

**HTTPS Obbligatorio:**

- Certificati SSL/TLS per tutti i sottodomini
- Let's Encrypt tramite Plesk

### 7.3 Gestione Segreti

**Non hardcodare mai:**

- Connection strings
- API keys
- Password

**Soluzioni:**

- Docker Secrets (in produzione)
- Variabili d'ambiente (sviluppo)
- HashiCorp Vault (enterprise, futuro)

---

## 8. Observability e Monitoring

### 8.1 Logging Centralizzato

**EdgLogger (`log.miodominio.it`):**

- Raccolta centralizzata di tutti i log
- Correlation ID per tracciare flussi
- Livelli: DEBUG, INFO, WARN, ERROR, CRITICAL
- Retention: 90 giorni (configurabile)

**Standard Log Entry:**

```json
{
  "timestamp": "2025-10-01T10:30:00Z",
  "level": "INFO",
  "service": "orders.miodominio.it",
  "correlationId": "req-12345-abc",
  "message": "Order created successfully",
  "metadata": {
    "orderId": 123,
    "userId": 456
  }
}
```

### 8.2 Health Checks

**Ogni servizio espone:**

```
GET /health
Response:
{
  "status": "healthy",
  "version": "1.2.3",
  "uptime": 86400,
  "dependencies": {
    "mongodb": "connected",
    "redis": "connected"
  }
}
```

**Monitoring automatico:**

- Gateway monitora health di tutti i servizi
- Alerting se servizi down
- Auto-restart container se unhealthy

### 8.3 Metriche e Analytics

**Metriche da tracciare:**

- Request rate (req/sec)
- Response time (ms)
- Error rate (%)
- Database query time
- Queue depth

**Tools suggeriti (Open Source):**

- Prometheus (metriche)
- Grafana (dashboard)
- Jaeger (distributed tracing)
- Loki (log aggregation)

---

## 9. Roadmap di Implementazione

### Fase 1: Foundation Infrastructure (Priorità ALTA)

**Obiettivo:** Costruire le fondamenta per tutti i servizi

1. ✅ **EdgLogger operativo** (COMPLETATO)
2. 🔧 **auth.miodominio.it** - Autenticazione centralizzata
   - Setup database auth_db
   - Implementazione JWT
   - API login/logout/validate
   - Gestione ruoli base (customer, admin)
3. 🔧 **gateway.miodominio.it** - API Gateway
   - Setup Nginx o Traefik
   - Routing verso servizi
   - Rate limiting
   - CORS configuration

**Deliverable:** Infrastruttura base pronta per servizi operativi

---

### Fase 2: Core Business Services (Priorità ALTA)

**Obiettivo:** Implementare funzionalità business essenziali

4. 🔧 **business_db** - Setup database condiviso
   - Schema orders, customers, invoices
   - Indici e ottimizzazioni
5. 🔧 **orders.miodominio.it** - Gestione ordini
   - CRUD ordini
   - Validazione business rules
   - Integrazione con auth
6. 🔧 **customers.miodominio.it** - Gestione clienti
   - Anagrafica
   - Indirizzi
7. 🔧 **app.miodominio.it** - Frontend clienti MVP
   - Login
   - Creazione ordini
   - Visualizzazione storico

**Deliverable:** Sistema funzionante per gestione ordini base

---

### Fase 3: Logistica e Spedizioni (Priorità MEDIA)

**Obiettivo:** Completare ciclo logistico

8. 🔧 **shipping.miodominio.it** - Gestione spedizioni
   - Creazione spedizioni da ordini
   - Integrazione corrieri
   - Generazione etichette
9. 🔧 **invoices.miodominio.it** - Fatturazione
   - Generazione fatture automatica
   - Link ordini-fatture
10. 🔧 **tracking.miodominio.it** - Tracking spedizioni
    - Setup tracking_db
    - Polling API corrieri
    - API pubbliche per clienti

**Deliverable:** Ciclo completo ordine → spedizione → tracking

---

### Fase 4: Comunicazioni e UX (Priorità MEDIA)

**Obiettivo:** Migliorare esperienza utente

11. 🔧 **notifications.miodominio.it** - Sistema notifiche
    - Setup queue (RabbitMQ/Redis)
    - Email transazionali
    - Template management
12. 🔧 **app.miodominio.it** - Frontend completo
    - Tracking real-time
    - Notifiche
    - Gestione account

**Deliverable:** Esperienza utente completa e professionale

---

### Fase 5: Amministrazione e Analytics (Priorità BASSA)

**Obiettivo:** Tools per gestione interna

13. 🔧 **admin.miodominio.it** - Pannello amministrazione
    - Dashboard operativa
    - Gestione ordini/spedizioni
    - Configurazioni
14. 🔧 **analytics.miodominio.it** - Reportistica
    - Setup analytics_db (replica)
    - Dashboard KPI
    - Export report

**Deliverable:** Strumenti di gestione e business intelligence

---

### Fase 6: Ottimizzazione e Scaling (Priorità FUTURA)

**Obiettivo:** Performance e resilienza

15. 🔧 **Service Discovery** - Consul o Traefik auto-discovery
16. 🔧 **Advanced Monitoring** - Prometheus + Grafana + Jaeger
17. 🔧 **Auto-scaling** - Kubernetes (se necessario)
18. 🔧 **Service Mesh** - Istio/Linkerd (se sistema diventa molto complesso)

**Deliverable:** Sistema enterprise-grade, altamente scalabile

---

## 10. Best Practices e Anti-Pattern

### 10.1 Best Practices ✅

**Architettura:**

- ✅ Iniziare semplice, aggiungere complessità quando serve
- ✅ Database separati per sicurezza e pattern diversi
- ✅ Database condiviso per transazioni e coesione forte
- ✅ API Gateway fin dall'inizio
- ✅ Autenticazione centralizzata (auth service)

**Sviluppo:**

- ✅ Documenta API con OpenAPI/Swagger
- ✅ Health checks su ogni servizio
- ✅ Correlation ID in tutte le richieste
- ✅ Logging strutturato e centralizzato
- ✅ Retry logic per chiamate esterne

**Operazioni:**

- ✅ Docker per ogni servizio
- ✅ CI/CD per deploy automatizzati
- ✅ Backup automatici database critici
- ✅ Monitoring proattivo con alerting

### 10.2 Anti-Pattern da Evitare ❌

**Architettura:**

- ❌ Troppi microservizi troppo presto (inizia con 3-5 core)
- ❌ Database monolitico per tutto
- ❌ Database separati per ogni singola entità
- ❌ Comunicazione sincrona quando asincrona è appropriata

**Sicurezza:**

- ❌ Duplicare logica di autenticazione in ogni servizio
- ❌ Hardcodare credenziali
- ❌ Esporre servizi interni pubblicamente

**Operazioni:**

- ❌ Ignorare monitoring e logging all'inizio
- ❌ Non implementare health checks
- ❌ Deploy manuali senza automazione
- ❌ Sottovalutare complessità comunicazione inter-service

---

## 11. Testing Strategy

### 11.1 Livelli di Test

**Unit Tests:**

- Funzioni e metodi isolati
- Jest (Node.js), Pytest (Python)
- Coverage minimo: 70%

**Integration Tests:**

- Interazione tra componenti
- Test database (con DB di test)
- Mock di servizi esterni

**API Tests:**

- Test endpoint REST
- Postman/Newman o Supertest
- Validation request/response

**E2E Tests:**

- Flussi completi utente
- Playwright o Cypress
- Scenari critici (ordine completo, login, etc.)

### 11.2 Test per Microservizi

**Contract Testing:**

- Validare che servizi rispettino interfacce
- Pact.io o Spring Cloud Contract

**Chaos Engineering (futuro):**

- Test resilienza
- Simulare fallimenti servizi
- Chaos Monkey

---

## 12. Documentazione e Standard

### 12.1 Documentazione API

**OpenAPI/Swagger:**

- Ogni servizio espone `/api-docs`
- Documentazione auto-generata
- Try-it-out per testing rapido

### 12.2 Standard Codice

**JavaScript/TypeScript:**

- Prettier (formattazione)
- ESLint (linting)
- Naming: camelCase per variabili, PascalCase per classi

**Python:**

- Black (formattazione)
- Pylint (linting)
- PEP 8 compliance

### 12.3 Git Workflow

**Branching:**

- `main` - produzione
- `develop` - sviluppo
- `feature/*` - nuove funzionalità
- `hotfix/*` - fix urgenti

**Commit Messages:**

- Conventional Commits
- `feat:`, `fix:`, `docs:`, `refactor:`, etc.

---

## 13. Considerazioni Finali

### 13.1 Pragmatismo vs Purismo

L'architettura proposta bilancia:

- **Teoria dei microservizi** (separazione, autonomia)
- **Realtà operativa** (complessità, risorse, team size)

**Decisioni chiave:**

- ✅ Database condiviso per servizi fortemente accoppiati
- ✅ Meno database da gestire (4-5 invece di 10+)
- ✅ Complessità incrementale (non tutto subito)
- ✅ Scalabilità quando serve (non over-engineering preventivo)

### 13.2 Evolutività

L'architettura è progettata per evolvere:

- **Start:** 3-4 servizi core + infrastruttura
- **Growth:** Aggiungere servizi quando business lo richiede
- **Scale:** Separare ulteriormente se volumi lo necessitano

### 13.3 Prossimi Passi

1. ✅ **Connessione MongoDB** - Completata
2. 🔧 **Setup auth.miodominio.it** - Prossimo step critico
3. 🔧 **Setup gateway** - Fondamentale per routing
4. 🔧 **Primo servizio operativo** (orders) - Inizio business logic

---

## 14. Riferimenti e Risorse

### 14.1 Pattern e Architetture

- Microservices Pattern (Chris Richardson)
- Domain-Driven Design (Eric Evans)
- Building Microservices (Sam Newman)

### 14.2 Tecnologie Chiave

- Docker: https://docs.docker.com
- MongoDB: https://docs.mongodb.com
- JWT: https://jwt.io
- RabbitMQ: https://www.rabbitmq.com/documentation.html
- Traefik: https://doc.traefik.io/traefik/

### 14.3 Tools Open Source

- Keycloak (Auth): https://www.keycloak.org
- Grafana (Monitoring): https://grafana.com
- Jaeger (Tracing): https://www.jaegertracing.io
- Prometheus (Metrics): https://prometheus.io

---

## Appendice A: Glossary

**Bounded Context:** Confine logico che separa diversi domini di business  
**Correlation ID:** Identificatore unico per tracciare richieste attraverso servizi  
**Event Sourcing:** Pattern dove lo stato è ricostruito da una sequenza di eventi  
**JWT:** JSON Web Token, standard per autenticazione stateless  
**Saga Pattern:** Pattern per gestire transazioni distribuite tramite eventi  
**Service Discovery:** Meccanismo per localizzare dinamicamente servizi disponibili  
**Service Mesh:** Layer infrastrutturale per comunicazione service-to-service

---

## Appendice B: Diagrammi di Riferimento

### B.1 Architettura Completa

```
┌───────────────────────────────────────────────────────────────┐
│                  SERVIZI ACCESSORI                             │
├───────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ auth         │  │ log          │  │notifications │       │
│  │              │  │ (EdgLogger)  │  │              │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                                │
│  ┌──────────────┐  ┌──────────────┐                          │
│  │ tracking     │  │ analytics    │                          │
│  │              │  │              │                          │
│  └──────────────┘  └──────────────┘                          │
└────────────────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ↓               ↓               ↓
┌───────────────────────────────────────────────────────────────┐
│                  SERVIZI OPERATIVI                             │
├───────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ orders       │  │ shipping     │  │ invoices     │       │
│  │              │  │              │  │              │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                                │
│  ┌──────────────┐  ┌──────────────┐                          │
│  │ customers    │  │ inventory    │                          │
│  │              │  │              │                          │
│  └──────────────┘  └──────────────┘                          │
└────────────────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ↓               ↓               ↓
┌───────────────────────────────────────────────────────────────┐
│                    LAYER DATABASE                              │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  SERVIZI ACCESSORI (Database Isolati):                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  auth_db     │  │  logs_db     │  │tracking_db   │       │
│  │              │  │              │  │              │       │
│  │ • users      │  │ • app_logs   │  │ • shipments  │       │
│  │ • roles      │  │ • errors     │  │ • events     │       │
│  │ • sessions   │  │ • audit      │  │ • locations  │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                                │
│  SERVIZI OPERATIVI (Database Condiviso):                      │
│  ┌────────────────────────────────────────────────────┐      │
│  │              business_db                            │      │
│  │  • orders                                          │      │
│  │  • order_items                                     │      │
│  │  • shipments                                       │      │
│  │  • invoices                                        │      │
│  │  • customers                                       │      │
│  │  • customer_addresses                              │      │
│  │  • inventory                                       │      │
│  │  • payments                                        │      │
│  └────────────────────────────────────────────────────┘      │
│                                                                │
│  ┌──────────────┐                                             │
│  │analytics_db  │ (read-only replica di business_db)         │
│  └──────────────┘                                             │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### B.2 Flusso Autenticazione

```
┌──────────┐
│  Client  │
└────┬─────┘
     │ 1. POST /login {username, password}
     ↓
┌─────────────────────┐
│ gateway             │
│ .miodominio.it      │
└────┬────────────────┘
     │ 2. Forward request
     ↓
┌─────────────────────┐
│ auth.miodominio.it  │
│                     │
│ • Valida credenziali│
│ • Genera JWT        │
│ • Genera Refresh    │
└────┬────────────────┘
     │ 3. Return tokens
     ↓
┌──────────┐
│  Client  │ Salva JWT in memoria/storage sicuro
└────┬─────┘
     │ 4. Ogni richiesta include:
     │    Authorization: Bearer <JWT>
     ↓
┌─────────────────────┐
│ gateway             │
│                     │
│ • Valida JWT        │
│ • Estrae user info  │
│ • Forward con user  │
└────┬────────────────┘
     │ 5. Request + User Context
     ↓
┌─────────────────────┐
│ orders/shipping/etc │ Riceve request già autenticata
└─────────────────────┘
```

### B.3 Flusso Event-Driven (Ordine Completo)

```
┌──────────────────┐
│ Client crea      │
│ ordine           │
└────┬─────────────┘
     │ POST /orders
     ↓
┌─────────────────────────────────────────┐
│ orders.miodominio.it                    │
│                                         │
│ 1. Valida ordine                        │
│ 2. INSERT INTO business_db.orders       │
│ 3. Pubblica evento: OrderCreated        │
└────┬────────────────────────────────────┘
     │ Event: OrderCreated {orderId: 123}
     ↓
┌─────────────────────────────────────────┐
│ Message Queue (RabbitMQ/Redis)          │
└────┬────────┬────────┬───────┬──────────┘
     │        │        │       │
     ↓        ↓        ↓       ↓
┌─────────┐ ┌──────┐ ┌────┐ ┌─────────┐
│shipping │ │notify│ │log │ │analytics│
│         │ │      │ │    │ │         │
│Crea     │ │Invia │ │Reg.│ │Aggiorna │
│spediz.  │ │email │ │ev. │ │stats    │
└────┬────┘ └──────┘ └────┘ └─────────┘
     │ Event: ShipmentCreated
     ↓
┌─────────────────────────────────────────┐
│ tracking.miodominio.it                  │
│                                         │
│ • Inizia polling corriere               │
│ • Crea tracking pubblico                │
└─────────────────────────────────────────┘
```

### B.4 Strategia Database - Decisioni

```
┌─────────────────────────────────────────────────────────┐
│          DECISIONE: Separare o Condividere DB?          │
└─────────────────────────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ↓                               ↓
  ┌──────────────┐              ┌──────────────┐
  │   SEPARARE   │              │  CONDIVIDERE │
  └──────────────┘              └──────────────┘
         │                               │
         ↓                               ↓
  Quando:                         Quando:
  • Sicurezza critica            • Transazioni atomiche
  • Write-heavy vs Read-heavy    • Forte coesione dati
  • Crescita molto diversa       • Query cross-entity
  • Tecnologia diversa           • Performance critiche
  • Retention diversa            • Team piccolo
         │                               │
         ↓                               ↓
  Esempi:                         Esempi:
  • auth_db                      • orders + invoices
  • logs_db                      • orders + shipments
  • tracking_db                  • customers + addresses
  • analytics_db (replica)       • inventory + products
```

---

## Appendice C: Checklist di Implementazione

### C.1 Checklist Setup Nuovo Microservizio

```markdown
□ Definizione responsabilità e scope
□ Scelta tecnologia (Node.js/Python)
□ Setup repository Git
□ Configurazione ESLint/Prettier
□ Dockerfile creato
□ Database assignment (nuovo o condiviso?)
□ API endpoints definiti
□ OpenAPI/Swagger documentation
□ Health check endpoint implementato
□ Logging integration (EdgLogger)
□ Authentication integration (JWT validation)
□ Error handling standardizzato
□ Unit tests (coverage > 70%)
□ Integration tests
□ Environment variables configuration
□ Docker Compose per sviluppo locale
□ Deploy su server (Plesk + Docker)
□ Sottodominio configurato
□ HTTPS/SSL attivo
□ Gateway routing configurato
□ Monitoring alerts configurati
□ Documentazione aggiornata
```

### C.2 Checklist Pre-Deploy Produzione

```markdown
□ Tutti i test passano (unit + integration)
□ Code review completata
□ Secrets gestiti correttamente (no hardcoded)
□ Database migrations testate
□ Backup database configurato
□ Health checks verificati
□ Logging funzionante
□ Error tracking attivo
□ Performance testing eseguito
□ Security scan completato
□ API documentation aggiornata
□ Changelog aggiornato
□ Rollback plan definito
□ Team notificato del deploy
□ Monitoring dashboard pronto
□ Alerts configurati
```

### C.3 Checklist Incident Response

```markdown
□ Identificare servizio affected
□ Controllare health checks
□ Verificare logs in EdgLogger
□ Controllare dipendenze (DB, altri servizi)
□ Isolare problema (network, codice, infra?)
□ Verificare metriche (CPU, memoria, disk)
□ Rollback se necessario
□ Fix implementato
□ Test eseguiti
□ Deploy fix
□ Verifica risoluzione
□ Post-mortem documentation
□ Miglioramenti preventivi identificati
```

---

## Appendice D: Template e Snippets

### D.1 Template Health Check Endpoint

```javascript
// Node.js/Express
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    const dbStatus = await checkDatabaseConnection();

    // Check dependencies
    const redisStatus = await checkRedisConnection();

    // Build response
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '1.0.0',
      uptime: process.uptime(),
      dependencies: {
        database: dbStatus ? 'connected' : 'disconnected',
        redis: redisStatus ? 'connected' : 'disconnected',
      },
    };

    const statusCode = dbStatus && redisStatus ? 200 : 503;

    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});
```

### D.2 Template Logging Strutturato

```javascript
// Structured logging utility
const log = {
  info: (message, metadata = {}) => {
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      service: process.env.SERVICE_NAME,
      correlationId: metadata.correlationId,
      message,
      metadata,
    };

    // Send to EdgLogger
    sendToLogger(entry);
    console.log(JSON.stringify(entry));
  },

  error: (message, error, metadata = {}) => {
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      service: process.env.SERVICE_NAME,
      correlationId: metadata.correlationId,
      message,
      error: {
        message: error.message,
        stack: error.stack,
      },
      metadata,
    };

    sendToLogger(entry);
    console.error(JSON.stringify(entry));
  },
};

// Usage
log.info('Order created', {
  orderId: 123,
  correlationId: req.headers['x-correlation-id'],
});
```

### D.3 Template JWT Validation Middleware

```javascript
// JWT validation middleware
const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: 'No token provided',
    });
  }

  const token = authHeader.split(' ')[1]; // Bearer TOKEN

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request
    req.user = {
      id: decoded.sub,
      roles: decoded.roles,
      permissions: decoded.permissions,
    };

    next();
  } catch (error) {
    return res.status(403).json({
      error: 'Invalid token',
    });
  }
};

// Usage
app.get('/orders', authenticateJWT, (req, res) => {
  // req.user is available
  const userId = req.user.id;
  // ...
});
```

### D.4 Template Event Publisher

```javascript
// Event publisher utility (Redis Streams)
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

const publishEvent = async (eventType, payload) => {
  const event = {
    type: eventType,
    timestamp: new Date().toISOString(),
    service: process.env.SERVICE_NAME,
    payload,
  };

  try {
    await redis.xadd(
      'events', // Stream name
      '*', // Auto-generate ID
      'data',
      JSON.stringify(event)
    );

    log.info(`Event published: ${eventType}`, {
      eventType,
      payload,
    });
  } catch (error) {
    log.error('Failed to publish event', error, {
      eventType,
    });
  }
};

// Usage
await publishEvent('OrderCreated', {
  orderId: 123,
  customerId: 456,
  total: 99.99,
});
```

### D.5 Template Dockerfile Microservizio

```dockerfile
# Multi-stage build for Node.js microservice
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package*.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "src/index.js"]
```

### D.6 Template Docker Compose (Sviluppo)

```yaml
version: '3.8'

services:
  orders:
    build: ./services/orders
    ports:
      - '3001:3000'
    environment:
      - NODE_ENV=development
      - DATABASE_URL=mongodb://mongo:27017/business_db
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=dev_secret_change_in_production
      - SERVICE_NAME=orders.miodominio.it
    depends_on:
      - mongo
      - redis
    volumes:
      - ./services/orders/src:/app/src
    networks:
      - microservices

  auth:
    build: ./services/auth
    ports:
      - '3002:3000'
    environment:
      - NODE_ENV=development
      - DATABASE_URL=mongodb://mongo:27017/auth_db
      - JWT_SECRET=dev_secret_change_in_production
      - SERVICE_NAME=auth.miodominio.it
    depends_on:
      - mongo
    networks:
      - microservices

  mongo:
    image: mongo:latest
    ports:
      - '27017:27017'
    volumes:
      - mongo_data:/data/db
    networks:
      - microservices

  redis:
    image: redis:alpine
    ports:
      - '6379:6379'
    networks:
      - microservices

volumes:
  mongo_data:

networks:
  microservices:
    driver: bridge
```

---

## Appendice E: FAQ e Troubleshooting

### E.1 Domande Frequenti

**Q: Quanti microservizi dovrei creare all'inizio?**  
A: Inizia con 3-5 servizi core: auth, log, 1-2 servizi business. Aggiungi altri solo quando necessario.

**Q: Devo separare il database per ogni microservizio?**  
A: No, segui le regole della Sezione 4.2. Separa solo quando porta valore reale (sicurezza, performance, scaling).

**Q: Come gestisco transazioni che coinvolgono più servizi?**  
A: Usa il Saga Pattern (Sezione 6.2) con eventi compensativi.

**Q: Come faccio debug in un sistema distribuito?**  
A: Usa Correlation ID in tutte le richieste e centralizza i log in EdgLogger.

**Q: Quando implementare l'API Gateway?**  
A: Subito, nella Fase 1. È fondamentale per gestire routing e autenticazione centralizzata.

**Q: Posso usare database SQL e NoSQL insieme?**  
A: Sì! Usa la tecnologia migliore per ogni caso d'uso. MongoDB per documenti flessibili, MySQL per relazioni complesse.

**Q: Come gestisco i segreti (password, API keys)?**  
A: Docker Secrets in produzione, variabili d'ambiente in sviluppo. Mai hardcodare.

**Q: Serve Kubernetes fin dall'inizio?**  
A: No! Docker + Plesk è sufficiente. Kubernetes aggiunge complessità necessaria solo con molti servizi e traffico alto.

### E.2 Problemi Comuni e Soluzioni

**Problema: Servizio non raggiungibile**

```
Checklist:
□ Container in esecuzione? (docker ps)
□ Port mapping corretto? (docker port <container>)
□ Firewall aperto? (provider + server)
□ DNS sottodominio configurato?
□ Gateway routing configurato?
```

**Problema: Database connection failed**

```
Checklist:
□ Container database running?
□ Connection string corretta?
□ Credenziali corrette?
□ Network Docker configurato?
□ Firewall database aperto?
```

**Problema: JWT validation fails**

```
Checklist:
□ Token presente nell'header Authorization?
□ Formato: "Bearer <token>"?
□ JWT_SECRET uguale su tutti i servizi?
□ Token non scaduto?
□ Firma token valida?
```

**Problema: Eventi non consumati dalla queue**

```
Checklist:
□ Consumer in esecuzione?
□ Connessione a RabbitMQ/Redis OK?
□ Queue/Stream esiste?
□ Consumer subscribed al topic corretto?
□ Errori nei log del consumer?
```

**Problema: Performance degradate**

```
Diagnosi:
□ Controllare metriche CPU/RAM
□ Verificare slow queries database
□ Controllare network latency
□ Verificare connection pool size
□ Controllare log per errori ripetuti
```

---

## Conclusione

Questo documento rappresenta la base architetturale per lo sviluppo del sistema di gestione logistica. L'approccio pragmatico bilancia:

- ✅ **Best practices** dei microservizi
- ✅ **Realtà operativa** (risorse, complessità)
- ✅ **Evolutività** (crescita graduale)
- ✅ **Mantenibilità** (codice pulito, documentato)

L'architettura è progettata per:

1. **Partire semplice** (Fase 1-2)
2. **Crescere con il business** (Fase 3-4)
3. **Scalare quando necessario** (Fase 5-6)

**Prossimi step immediati:**

1. ✅ Connessione MongoDB configurata
2. 🔧 Implementare `auth.miodominio.it`
3. 🔧 Setup `gateway.miodominio.it`
4. 🔧 Primo servizio operativo (`orders.miodominio.it`)

---

**Documento vivo:** Questo documento verrà aggiornato durante lo sviluppo con decisioni, pattern emersi e lesson learned.

**Versione:** 1.0  
**Ultima modifica:** Ottobre 2025───────────────────────────────────────────┐
│ LAYER FRONTEND │
├─────────────────────────────────────────────────────────────┤
│ app.miodominio.it │ admin.miodominio.it │
└────────────┬────────┴────────────┬───────────────────────────┘
│ │
└──────────┬──────────┘
↓
┌─────────────────────────────────────────────────────────────┐
│ gateway.miodominio.it (API Gateway) │
└─────────────────────────────────────────────────────────────┘
│
┌───────────────┼───────────────┐
↓ ↓ ↓
┌──────────────────
