# 🌐 EDG PLATFORM - GATEWAY & TRAEFIK ARCHITECTURE

**Versione:** 1.0.0  
**Data:** 26 Novembre 2025  
**Complemento a:** EDG-MANUAL.md v2.1.0

---

## 📋 INDICE

1. [Introduzione](#1-introduzione)
2. [Architettura di Routing](#2-architettura-di-routing)
3. [Traefik: Load Balancer & Reverse Proxy](#3-traefik-load-balancer--reverse-proxy)
4. [API Gateway: Production-Ready](#4-api-gateway-production-ready)
5. [Flusso Richieste](#5-flusso-richieste)
6. [Network Docker](#6-network-docker)
7. [Configurazione Avanzata](#7-configurazione-avanzata)
8. [Pattern Architetturali](#8-pattern-architetturali)
9. [Troubleshooting Specifico](#9-troubleshooting-specifico)
10. [Decisioni Architetturali](#10-decisioni-architetturali)

---

## 1. INTRODUZIONE

### 1.1 Scopo del Documento

Questo documento fornisce una **comprensione approfondita** dell'architettura di routing e proxy della EDG Platform, complementando il manuale generale (`EDG-MANUAL.md`) con dettagli tecnici specifici su:

- Traefik come entry point e load balancer
- API Gateway come orchestratore intelligente
- Pattern di routing multi-frontend e multi-servizio
- Decisioni architetturali e motivazioni

### 1.2 Stack di Routing

```
Layer 1: Traefik v2.10        → Load Balancing, SSL Termination, Routing
Layer 2: API Gateway (Express) → Intelligent Routing, Security, Proxy
Layer 3: Microservices         → Business Logic
```

### 1.3 Relazione con EDG-MANUAL.md

| Documento         | Focus                        | Dettaglio |
| ----------------- | ---------------------------- | --------- |
| **EDG-MANUAL.md** | Setup, deployment, API usage | Generale  |
| **Questo Doc**    | Routing, proxy, architettura | Tecnico   |

---

## 2. ARCHITETTURA DI ROUTING

### 2.1 Schema Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                │
│                    (HTTP/HTTPS Traffic)                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Port 80 (HTTP)
                             │ Port 443 (HTTPS - future)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TRAEFIK v2.10                                │
│                Load Balancer & Reverse Proxy                    │
│                                                                 │
│  Features:                                                      │
│  • Docker Provider (auto-discovery)                            │
│  • Health Checks (10s interval)                                │
│  • Load Balancing (Round Robin)                                │
│  • Routing Rules (Host + PathPrefix)                           │
│                                                                 │
│  Ports:                                                         │
│  • 80:80    → HTTP entry point                                 │
│  • 443:443  → HTTPS entry point (future)                       │
│  • 8888:8080 → Dashboard (traefik.localhost)                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
┌───────────────────────┐         ┌───────────────────────┐
│   API Gateway 1       │         │   API Gateway 2       │
│   (High Availability) │         │   (High Availability) │
│                       │         │                       │
│   IP: 172.21.0.6      │         │   IP: 172.21.0.7      │
│   Port: 8080          │         │   Port: 8080          │
│                       │         │                       │
│   Health: /health     │         │   Health: /health     │
│   Status: ✅ Healthy   │         │   Status: ✅ Healthy   │
└───────────────────────┘         └───────────────────────┘
              │                             │
              └──────────────┬──────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Pro Frontend  │   │ App Frontend  │   │ Auth Service  │
│ Vite :5173    │   │ Vite :5174    │   │ Express :3001 │
│               │   │               │   │               │
│ Operators     │   │ Clients       │   │ JWT + RBAC    │
│ Interface     │   │ Interface     │   │ MySQL         │
└───────────────┘   └───────────────┘   └───────────────┘
```

### 2.2 Routing Decision Tree

```
Richiesta HTTP in arrivo
         │
         ▼
┌─────────────────────┐
│   TRAEFIK           │
│   Analizza:         │
│   • Host header     │
│   • Path            │
└─────────┬───────────┘
          │
          ├─── Host: traefik.localhost && Path: /dashboard
          │    └─→ Traefik Dashboard (interno)
          │
          ├─── Host: *.edg.local || *.edgdominio.com
          │    └─→ API Gateway (Load Balanced)
          │
          └─── Altri host
               └─→ 404 Not Found

API Gateway riceve richiesta
         │
         ▼
┌─────────────────────┐
│   API GATEWAY       │
│   Analizza:         │
│   • Path prefix     │
│   • Host header     │
└─────────┬───────────┘
          │
          ├─── Path: /health, /liveness, /readiness
          │    └─→ Health Check Response (200 OK)
          │
          ├─── Path: /auth/*
          │    └─→ Auth Service :3001
          │         • CORS Enabled
          │         • Rate Limited (1024 req/16min)
          │         • Body Parsing
          │
          └─── Altri path (/, /dashboard, /explorer, ecc.)
               └─→ Frontend Proxy
                    • Hostname: pro.edg.local → Pro Frontend :5173
                    • Hostname: app.edg.local → App Frontend :5174
                    • Hostname: edg.edg.local → EDG Frontend :5175
                    • Default: Pro Frontend
```

---

## 3. TRAEFIK: LOAD BALANCER & REVERSE PROXY

### 3.1 Ruolo e Responsabilità

Traefik agisce come **entry point unico** del sistema con le seguenti responsabilità:

1. **Service Discovery**: Auto-discovery dei container Docker tramite labels
2. **Load Balancing**: Distribuisce il traffico tra le 2 istanze API Gateway
3. **Health Checks**: Verifica la salute dei backend ogni 10 secondi
4. **SSL Termination**: (Futuro) Gestione certificati HTTPS
5. **Dashboard**: Monitoring visuale su `http://traefik.localhost:8888/dashboard/`

### 3.2 Configurazione Docker Compose

```yaml
traefik:
  image: traefik:v2.10
  command:
    # API e Dashboard
    - '--api.dashboard=true'
    - '--api.insecure=false'

    # Provider Docker
    - '--providers.docker=true'
    - '--providers.docker.exposedbydefault=false'
    - '--providers.docker.network=edg-external'

    # Entrypoints
    - '--entrypoints.web.address=:80'
    - '--entrypoints.websecure.address=:443'

    # Logs e Metrics
    - '--log.level=INFO'
    - '--accesslog=true'
    - '--ping=true'
    - '--metrics.prometheus=true'

  ports:
    - '80:80' # HTTP
    - '443:443' # HTTPS (futuro)
    - '8888:8080' # Dashboard

  labels:
    - 'traefik.enable=true'
    # Dashboard accessibile SOLO su traefik.localhost
    - 'traefik.http.routers.traefik-dashboard.rule=Host(`traefik.localhost`)'
    - 'traefik.http.routers.traefik-dashboard.service=api@internal'
```

### 3.3 Routing Rules per API Gateway

I Gateway sono configurati tramite labels Docker:

```yaml
api-gateway-1:
  labels:
    - 'traefik.enable=true'
    - 'traefik.http.routers.api-gateway.rule=Host(`pro.edg.local`) || Host(`app.edg.local`) || Host(`edg.edg.local`) || Host(`pro.edgdominio.com`) || Host(`app.edgdominio.com`) || Host(`edg.edgdominio.com`)'
    - 'traefik.http.routers.api-gateway.entrypoints=web'
    - 'traefik.http.services.api-gateway.loadbalancer.server.port=8080'
    - 'traefik.http.services.api-gateway.loadbalancer.healthcheck.path=/health'
    - 'traefik.http.services.api-gateway.loadbalancer.healthcheck.interval=10s'
```

**Spiegazione:**

- `rule`: Richieste con questi host vengono instradate al Gateway
- `loadbalancer.server.port`: Backend ascolta su porta 8080
- `healthcheck`: Traefik verifica `/health` ogni 10s

### 3.4 Load Balancing Algorithm

**Default:** Round Robin

```
Request 1 → Gateway 1 (172.21.0.6:8080)
Request 2 → Gateway 2 (172.21.0.7:8080)
Request 3 → Gateway 1 (172.21.0.6:8080)
Request 4 → Gateway 2 (172.21.0.7:8080)
...
```

Se un Gateway è **unhealthy** (risponde 404/500 a `/health`), Traefik lo esclude dal load balancing finché non ritorna healthy.

### 3.5 Problema Risolto: Conflitto `/dashboard`

**Problema Iniziale:**
Traefik intercettava **tutte** le richieste a `/dashboard` pensando fossero per la sua dashboard interna, causando 404 per la route frontend `/dashboard`.

**Regola Originale (ERRATA):**

```yaml
rule=Host(`traefik.localhost`) || PathPrefix(`/dashboard`) || PathPrefix(`/api`)
```

Questa regola diceva: "Qualsiasi richiesta a `/dashboard` su **qualsiasi host** va alla dashboard Traefik."

**Regola Corretta:**

```yaml
rule=Host(`traefik.localhost`)
```

Ora la dashboard Traefik è accessibile **SOLO** su `http://traefik.localhost:8888/dashboard/`, e `/dashboard` sugli altri host (es. `pro.edg.local/dashboard`) passa correttamente al Gateway.

---

## 4. API GATEWAY: PRODUCTION-READY

### 4.1 Ruolo e Responsabilità

L'API Gateway è il **cervello** del routing interno:

1. **Intelligent Routing**: Instrada basato su hostname e path
2. **Security Layer**: CORS, Rate Limiting, Security Headers
3. **Proxy Management**: Proxy trasparente verso frontend e servizi
4. **Health Monitoring**: Endpoint `/health` con metriche dettagliate

### 4.2 Architettura Interna

```
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY (Express)                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Layer 1: Security Middleware (ordine di esecuzione)       │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 1. Helmet          → Security Headers                 │ │
│  │ 2. Body Parsing    → JSON + URL-encoded (10MB)        │ │
│  │ 3. CORS            → Applied ONLY to /auth/*          │ │
│  │ 4. Rate Limiting   → Applied ONLY to /auth/*          │ │
│  │ 5. Logging         → Request logging (skip /health)   │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Layer 2: Routing Logic                                    │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ GET  /health       → Health check with metrics        │ │
│  │ GET  /liveness     → Kubernetes liveness probe        │ │
│  │ GET  /readiness    → Kubernetes readiness probe       │ │
│  │ ALL  /auth/*       → Proxy to Auth Service :3001      │ │
│  │ ALL  /*            → Proxy to Frontend (by hostname)  │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Layer 3: Proxy Engine (http-proxy-middleware)             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ • WebSocket Support (HMR for Vite)                    │ │
│  │ • Timeout: 30s                                        │ │
│  │ • changeOrigin: true                                  │ │
│  │ • Error Handling: 503 on failure                      │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Middleware Stack Dettagliato

#### 4.3.1 Helmet (Security Headers)

```javascript
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabilitato per non interferire con Vite
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
```

**Headers Aggiunti:**

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-Download-Options: noopen`
- `X-XSS-Protection: 0`

**Motivazione:** Protezione da vulnerabilità comuni (XSS, clickjacking, MIME sniffing).

#### 4.3.2 Body Parsing

```javascript
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

**Motivazione:** Necessario per parsare POST/PUT/PATCH su `/auth/*`. Limite 10MB per prevenire attacchi DoS.

#### 4.3.3 CORS (Solo /auth)

```javascript
const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Mobile apps, curl
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
});

app.use('/auth', corsMiddleware); // ✅ Applicato SOLO a /auth
```

**Configurazione:**

```yaml
CORS_ORIGINS: http://localhost:5173,http://localhost:5174,http://localhost:5175,http://pro.edg.local,http://app.edg.local,http://edg.edg.local
```

**Motivazione:**

- **API REST** (`/auth`) hanno bisogno di CORS per chiamate cross-origin
- **Proxy frontend** NON ha bisogno di CORS (il Gateway agisce da reverse proxy trasparente)

#### 4.3.4 Rate Limiting (Solo /auth)

```javascript
const limiter = rateLimit({
  windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  skip: req => {
    const healthPaths = ['/health', '/liveness', '/readiness'];
    return healthPaths.includes(req.path);
  },
});

app.use('/auth', limiter); // ✅ Applicato SOLO a /auth
```

**Configurazione:**

```yaml
RATE_LIMIT_WINDOW: 16 # minuti
RATE_LIMIT_MAX_ATTEMPTS: 1024 # richieste per finestra
```

**Headers Inviati:**

```
RateLimit-Limit: 1024
RateLimit-Remaining: 1023
RateLimit-Reset: 1732632900
```

**Motivazione:**

- Protegge `/auth` da attacchi brute force
- Frontend libero di caricare centinaia di file senza rate limit

### 4.4 Routing Frontend (Multi-Domain)

```javascript
function getFrontendByHostname(hostname) {
  const cleanHostname = hostname?.split(':')[0];

  // Controlla subdomain mappings
  for (const [key, frontend] of Object.entries(FRONTENDS)) {
    if (frontend.subdomains.some(sub => cleanHostname === sub)) {
      return { key, ...frontend };
    }
  }

  // Default: Pro Frontend
  return { key: 'pro', ...FRONTENDS.pro };
}
```

**Mapping Configurazione:**

```javascript
const FRONTENDS = {
  pro: {
    url: 'http://pro-frontend:5173',
    subdomains: ['pro.edg.local', 'pro.edgdominio.com'],
    name: 'Pro (Operators)',
  },
  app: {
    url: 'http://app-frontend:5174',
    subdomains: ['app.edg.local', 'app.edgdominio.com'],
    name: 'App (Clients)',
  },
  edg: {
    url: 'http://edg-frontend:5175',
    subdomains: ['edg.edg.local', 'edg.edgdominio.com'],
    name: 'EDG (Partners)',
  },
};
```

**Flusso:**

1. Richiesta arriva: `http://app.edg.local/dashboard`
2. Gateway estrae hostname: `app.edg.local`
3. Trova mapping: `app` → `http://app-frontend:5174`
4. Proxy richiesta: `GET http://app-frontend:5174/dashboard`
5. Vite risponde con `index.html`
6. Browser carica React Router gestisce `/dashboard`

### 4.5 WebSocket Support (HMR)

```javascript
const proxy = createProxyMiddleware({
  target: frontend.url,
  ws: true, // ✅ WebSocket enabled
  onProxyReqWs: (proxyReq, req) => {
    proxyReq.setHeader('Connection', 'Upgrade');
    proxyReq.setHeader('Upgrade', 'websocket');
    proxyReq.setHeader('Origin', `${scheme}://${hostname}`);
    proxyReq.setHeader('Host', hostname);
  },
});
```

**Motivazione:** Vite usa WebSocket per Hot Module Replacement (HMR). Senza supporto WS, i cambiamenti al codice non si rifletterebbero automaticamente nel browser.

### 4.6 Health Check Endpoint

```javascript
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'api-gateway',
    version: 'step-4-final',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
    },
    services: {
      auth: AUTH_SERVICE,
      frontends: {
        pro: FRONTENDS.pro.url,
        app: FRONTENDS.app.url,
        edg: FRONTENDS.edg.url,
      },
    },
    cors: {
      enabled: true,
      allowedOrigins: [...],
      appliedTo: ['/auth/*'],
    },
    rateLimit: {
      enabled: true,
      window: '16 minutes',
      maxAttempts: 1024,
      appliedTo: ['/auth/*'],
      excludedPaths: ['/health', '/liveness', '/readiness'],
    },
  });
});
```

**Utilizzo:**

- **Traefik**: Chiama `/health` ogni 10s per verificare che il Gateway sia alive
- **Monitoring**: Dashboard di monitoring possono interrogare `/health` per metriche
- **Debug**: Sviluppatori possono vedere configurazione attiva

---

## 5. FLUSSO RICHIESTE

### 5.1 Scenario: Frontend Request (GET /dashboard)

```
1. Browser
   └─→ GET http://pro.edg.local/dashboard
        Host: pro.edg.local

2. Traefik :80
   ├─→ Riceve richiesta
   ├─→ Analizza Host header: "pro.edg.local"
   ├─→ Match rule: Host(`pro.edg.local`)
   ├─→ Seleziona backend: api-gateway (Load Balanced)
   └─→ Invia a Gateway 1 o Gateway 2

3. API Gateway :8080
   ├─→ Riceve: GET /dashboard
   ├─→ Middleware Stack:
   │    ├─→ Helmet: Aggiunge security headers
   │    ├─→ Body Parsing: Skip (GET request)
   │    ├─→ CORS: Skip (non /auth)
   │    ├─→ Rate Limit: Skip (non /auth)
   │    └─→ Logging: Log request
   ├─→ Routing:
   │    ├─→ Non /health, non /auth
   │    └─→ Proxy Frontend
   ├─→ getFrontendByHostname('pro.edg.local')
   │    └─→ Trova: pro-frontend:5173
   └─→ Proxy: GET http://pro-frontend:5173/dashboard

4. Vite Dev Server :5173
   ├─→ Riceve: GET /dashboard
   ├─→ History API Fallback (SPA)
   ├─→ Serve: index.html (200 OK)
   └─→ Risponde con HTML + Vite dev client

5. API Gateway
   └─→ Passa risposta al client

6. Traefik
   └─→ Passa risposta al client

7. Browser
   ├─→ Riceve index.html
   ├─→ Carica React app
   ├─→ React Router gestisce /dashboard
   └─→ Renderizza Dashboard component
```

**Tempo Totale:** ~50-100ms (in dev mode con Vite)

### 5.2 Scenario: API Request (POST /auth/login)

```
1. Browser
   └─→ POST http://pro.edg.local/auth/login
        Content-Type: application/json
        Body: {"email": "...", "password": "..."}

2. Traefik :80
   └─→ Proxy to API Gateway

3. API Gateway :8080
   ├─→ Riceve: POST /auth/login
   ├─→ Middleware Stack:
   │    ├─→ Helmet: ✅ Security headers
   │    ├─→ Body Parsing: ✅ Parse JSON body
   │    ├─→ CORS: ✅ Check origin, set CORS headers
   │    ├─→ Rate Limit: ✅ Check limit, decrement counter
   │    └─→ Logging: ✅ Log request
   ├─→ Routing: Match /auth/*
   └─→ Proxy: POST http://auth-service:3001/auth/login
        Body: Re-serialized JSON

4. Auth Service :3001
   ├─→ Riceve: POST /auth/login
   ├─→ Valida credentials
   ├─→ Genera JWT tokens
   └─→ Risponde: 200 OK + { accessToken, refreshToken }

5. API Gateway
   ├─→ Riceve risposta
   ├─→ Passa headers CORS
   └─→ Invia al client

6. Traefik
   └─→ Passa risposta

7. Browser
   ├─→ Riceve tokens
   └─→ Salva in localStorage/cookie
```

**Tempo Totale:** ~100-200ms (include DB query + JWT generation)

### 5.3 Scenario: WebSocket (HMR)

```
1. Browser (Vite Client)
   └─→ UPGRADE http://pro.edg.local/__vite_hmr
        Connection: Upgrade
        Upgrade: websocket

2. Traefik
   ├─→ Riconosce WebSocket upgrade
   └─→ Passa a API Gateway

3. API Gateway
   ├─→ Proxy middleware detecta WS upgrade
   ├─→ onProxyReqWs: Set WS headers
   └─→ Stabilisce WS connection to pro-frontend:5173

4. Vite Dev Server
   ├─→ Accetta WS connection
   └─→ Invia HMR updates quando file cambia

5. Browser
   ├─→ Riceve HMR update
   └─→ Ricarica modulo senza full page reload
```

---

## 6. NETWORK DOCKER

### 6.1 Architettura Network

```yaml
networks:
  external:
    driver: bridge
    name: edg-external
  internal:
    driver: bridge
    name: edg-internal
```

**Topologia:**

```
┌─────────────────────────────────────────┐
│     edg-external (172.21.0.0/16)        │
│  (Accessibile da Traefik e Gateway)     │
├─────────────────────────────────────────┤
│  • Traefik           172.21.0.2         │
│  • API Gateway 1     172.21.0.6         │
│  • API Gateway 2     172.21.0.7         │
│  • Pro Frontend      172.21.0.3         │
│  • App Frontend      172.21.0.4         │
│  • EDG Frontend      172.21.0.5         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│     edg-internal (172.20.0.0/16)        │
│    (Isolata da internet)                │
├─────────────────────────────────────────┤
│  • API Gateway 1     172.20.0.5         │
│  • API Gateway 2     172.20.0.6         │
│  • Auth Service      172.20.0.3         │
│  • Log Service       172.20.0.4         │
│  • MySQL             172.20.0.7         │
│  • MongoDB           172.20.0.8         │
│  • Pro Frontend      172.20.0.2         │
│  • App Frontend      172.20.0.9         │
│  • EDG Frontend      172.20.0.10        │
└─────────────────────────────────────────┘
```

### 6.2 Motivazione Design Network

**Perché 2 Reti?**

1. **Security by Design**: Database e servizi interni NON sono esposti su rete external
2. **Separation of Concerns**: Traffico pubblico (external) separato da traffico interno
3. **Defense in Depth**: Anche se un attaccante compromette Traefik, non può accedere direttamente ai database

**Perché Frontend su Entrambe le Reti?**

- **External**: Traefik deve poter fare health check e routing
- **Internal**: Frontend deve poter chiamare microservizi (future auth diretta)

**Perché Gateway su Entrambe le Reti?**

- **External**: Traefik deve poter inviare richieste
- **Internal**: Gateway deve poter chiamare Auth/Log service e Frontend

### 6.3 DNS Interno Docker

Docker fornisce **DNS interno** automatico:

```
# Da API Gateway
curl http://auth-service:3001/health  # ✅ Risolve a 172.20.0.3
curl http://pro-frontend:5173/        # ✅ Risolve a 172.20.0.2

# Da Traefik (su rete external)
curl http://api-gateway-1:8080/health # ✅ Risolve a 172.21.0.6
```

**Motivazione:** Nessun bisogno di IP hardcoded. I container si trovano per nome.

---

## 7. CONFIGURAZIONE AVANZATA

### 7.1 Variabili d'Ambiente Gateway

```yaml
api-gateway-1:
  environment:
    # Network & Services
    PORT: 8080
    AUTH_SERVICE_URL: http://auth-service:3001
    LOG_SERVICE_URL: http://log-service:4000

    # Frontend URLs
    FRONTEND_PRO_URL: http://pro-frontend:5173
    FRONTEND_APP_URL: http://app-frontend:5174
    FRONTEND_EDG_URL: http://edg-frontend:5175

    # Frontend Subdomains (comma-separated)
    FRONTEND_PRO_SUBDOMAINS: pro.edg.local,pro.edgdominio.com
    FRONTEND_APP_SUBDOMAINS: app.edg.local,app.edgdominio.com
    FRONTEND_EDG_SUBDOMAINS: edg.edg.local,edg.edgdominio.com

    # Security
    CORS_ORIGINS: http://localhost:5173,http://localhost:5174,http://localhost:5175,http://pro.edg.local,http://app.edg.local,http://edg.edg.local

    # Rate Limiting
    RATE_LIMIT_WINDOW: 16 # minutes
    RATE_LIMIT_MAX_ATTEMPTS: 1024 # requests per window

    # Secrets (CHANGE IN PRODUCTION!)
    JWT_SECRET: ${JWT_SECRET}
    GATEWAY_SECRET: ${GATEWAY_SECRET}
```

### 7.2 Tuning Performance

#### 7.2.1 Timeout Configuration

```javascript
// Nel proxy middleware
timeout: 30000,        // 30 secondi - timeout request
proxyTimeout: 30000,   // 30 secondi - timeout connessione backend
```

**Quando Modificare:**

- **Aumentare** se backend lenti (es. report generation)
- **Diminuire** se vuoi fail-fast su errori

#### 7.2.2 Rate Limiting per Ambiente

```yaml
# Development
RATE_LIMIT_WINDOW: 15
RATE_LIMIT_MAX_ATTEMPTS: 1000

# Staging
RATE_LIMIT_WINDOW: 15
RATE_LIMIT_MAX_ATTEMPTS: 100

# Production
RATE_LIMIT_WINDOW: 10
RATE_LIMIT_MAX_ATTEMPTS: 50

# Production High Security
RATE_LIMIT_WINDOW: 5
RATE_LIMIT_MAX_ATTEMPTS: 20
```

#### 7.2.3 Resource Limits

```yaml
deploy:
  resources:
    limits:
      cpus: '0.50' # Max 50% di 1 CPU
      memory: 512M # Max 512MB RAM
    reservations:
      cpus: '0.10' # Min 10% CPU garantito
      memory: 128M # Min 128MB RAM garantito
```

**Motivazione:** Previene che un container monopolizzi risorse sistema.

---

## 8. PATTERN ARCHITETTURALI

### 8.1 Pattern: API Gateway

**Descrizione:** Single entry point per tutti i client. Il Gateway fa da orchestratore e proxy.

**Vantaggi:**

- ✅ Client non conosce topologia interna
- ✅ Single point per security (CORS, rate limit)
- ✅ Facilita aggiunta/rimozione microservizi
- ✅ Logging centralizzato

**Svantaggi:**

- ⚠️ Single point of failure (mitigato con HA)
- ⚠️ Latenza aggiuntiva (~10-20ms)

### 8.2 Pattern: Multi-Frontend Routing

**Descrizione:** Un singolo Gateway gestisce multipli frontend basandosi su hostname.

**Implementazione:**

```javascript
// Configurazione statica
const FRONTENDS = { pro: {...}, app: {...}, edg: {...} };

// Routing dinamico
const frontend = getFrontendByHostname(req.hostname);
proxy(frontend.url, req, res);
```

**Vantaggi:**

- ✅ Codice gateway unificato
- ✅ Facile aggiungere nuovi frontend
- ✅ Nessun duplicato di logica security

### 8.3 Pattern: Selective Middleware

**Descrizione:** Middleware (CORS, rate limit) applicati selettivamente solo dove servono.

**Implementazione:**

```javascript
// ✅ GIUSTO - Applicato solo a /auth
app.use('/auth', corsMiddleware);
app.use('/auth', rateLimitMiddleware);

// ❌ SBAGLIATO - Applicato globalmente
app.use(corsMiddleware);
app.use(rateLimitMiddleware);
```

**Motivazione:**

- Frontend proxy non ha bisogno di CORS/rate limit
- Evita falsi positivi (es. rate limit su caricamento asset)
- Performance: meno overhead per richieste frontend

### 8.4 Pattern: Health Check Separation

**Descrizione:** Diversi endpoint per diversi tipi di health check.

```javascript
// Liveness: "Il container è alive?"
app.get('/liveness', (req, res) => res.sendStatus(200));

// Readiness: "Il container è pronto a ricevere traffico?"
app.get('/readiness', (req, res) => res.status(200).json({
  status: 'ready',
  timestamp: new Date().toISOString()
}));

// Health: Metriche dettagliate
app.get('/health', (req, res) => res.status(200).json({
  status: 'healthy',
  memory: { ... },
  services: { ... },
  // ...
}));
```

**Utilizzo:**

- **Kubernetes**: Usa `/liveness` e `/readiness` per gestire restart
- **Traefik**: Usa `/health` per decidere se instradare traffico
- **Monitoring**: Usa `/health` per dashboard metriche

---

## 9. TROUBLESHOOTING SPECIFICO

### 9.1 Gateway Non Riceve Richieste

**Sintomo:** Log del Gateway vuoti, Traefik restituisce 503.

**Diagnosi:**

```bash
# 1. Verifica health check Traefik
docker logs traefik | grep -i "health check"

# 2. Verifica IP Gateway
docker inspect api-gateway-1 | grep IPAddress

# 3. Testa connettività Traefik → Gateway
docker exec traefik wget -O- http://api-gateway-1:8080/health
```

**Soluzioni:**

- Se health check fail → Verifica che Gateway risponda su `/health`
- Se IP wrong → Riavvia container
- Se timeout → Aumenta timeout health check in Traefik config

### 9.2 Frontend 404 al Reload

**Sintomo:** `http://pro.edg.local/` funziona, ma `http://pro.edg.local/dashboard` dà 404 al refresh.

**Causa:** Vite non ha history fallback, oppure Traefik intercetta la route.

**Diagnosi:**

```bash
# 1. Verifica log Gateway quando fai richiesta
docker logs api-gateway-1 -f
# Fai reload su /dashboard e vedi se arriva la richiesta

# 2. Se NON arriva → Traefik intercetta
docker logs traefik | grep dashboard
```

**Soluzioni:**

- Se Traefik intercetta → Modifica rule Traefik (vedi sezione 3.5)
- Se arriva a Gateway → Problema Vite config (history fallback)

### 9.3 CORS Errors su Frontend

**Sintomo:** Browser console mostra errori CORS su caricamento file JS/CSS.

**Causa:** CORS applicato erroneamente al proxy frontend.

**Diagnosi:**

```bash
# Verifica se risposta ha header Access-Control-*
curl -i http://pro.edg.local/src/main.tsx | grep Access-Control
```

**Soluzione:**
Assicurati che CORS sia applicato **SOLO a /auth**:

```javascript
app.use('/auth', corsMiddleware); // ✅ CORRETTO
```

### 9.4 Rate Limit su Frontend

**Sintomo:** Dopo aver navigato un po', ottieni `429 Too Many Requests`.

**Causa:** Rate limit applicato globalmente invece che solo a `/auth`.

**Diagnosi:**

```bash
# Controlla response headers
curl -i http://pro.edg.local/ | grep RateLimit
# Se vedi RateLimit-* headers → SBAGLIATO
```

**Soluzione:**
Assicurati che rate limit sia applicato **SOLO a /auth**:

```javascript
app.use('/auth', limiter); // ✅ CORRETTO
```

### 9.5 WebSocket HMR Non Funziona

**Sintomo:** Modifiche al codice non si riflettono automaticamente. Devi fare refresh manuale.

**Causa:** WebSocket non passa attraverso Gateway.

**Diagnosi:**

```bash
# 1. Verifica nel browser DevTools → Network → WS
# Cerca connessione a /__vite_hmr

# 2. Controlla log Gateway
docker logs api-gateway-1 | grep -i websocket
```

**Soluzione:**
Assicurati che proxy abbia `ws: true`:

```javascript
const proxy = createProxyMiddleware({
  ws: true, // ✅ Essenziale per HMR
  onProxyReqWs: (proxyReq, req) => {
    // Setup WS headers
  },
});
```

### 9.6 Traefik Dashboard 404

**Sintomo:** `http://localhost:8888/dashboard` restituisce 404.

**Causa:** Manca lo slash finale.

**Soluzione:**
Usa: `http://localhost:8888/dashboard/` (con trailing slash).

Oppure configura redirect in Traefik:

```yaml
- 'traefik.http.middlewares.dashboard-redirect.redirectregex.regex=^(.*)/dashboard$$'
- 'traefik.http.middlewares.dashboard-redirect.redirectregex.replacement=$${1}/dashboard/'
```

---

## 10. DECISIONI ARCHITETTURALI

### 10.1 Perché Traefik invece di Nginx?

**Scelta:** Traefik v2.10

**Motivazioni:**

1. **Docker-native**: Auto-discovery via labels, no config files
2. **Dynamic**: Aggiorna configurazione senza restart
3. **Dashboard**: Monitoring visuale built-in
4. **Let's Encrypt**: Certificati SSL automatici (futuro)
5. **Metrics**: Prometheus integration out-of-the-box

**Contro Nginx:**

- Nginx richiede config file statico
- Reload necessario per cambi configurazione
- No auto-discovery

### 10.2 Perché 2 Istanze Gateway?

**Scelta:** High Availability con 2 istanze

**Motivazioni:**

1. **Zero Downtime**: Durante deploy, 1 istanza resta up
2. **Load Distribution**: Traffico distribuito
3. **Resilience**: Se 1 istanza crasha, l'altra gestisce traffico

**Costo:**

- 2x resource usage (~16MB RAM per istanza)

**Alternative Scartate:**

- 1 istanza → Single point of failure
- 3+ istanze → Overkill per sistema attuale

### 10.3 Perché CORS Solo su /auth?

**Scelta:** CORS middleware applicato selettivamente.

**Motivazioni:**

1. **API REST** (`/auth`) fanno chiamate cross-origin → Servono CORS headers
2. **Proxy frontend** agisce da reverse proxy trasparente → CORS inutile e dannoso
3. **Performance**: Meno overhead per richieste frontend (50-200 file per caricamento pagina)

**Risultato:**

- Vite può caricare infinite file senza restrizioni
- API protette da cross-origin attacks

### 10.4 Perché Rate Limit Solo su /auth?

**Scelta:** Rate limiting selettivo.

**Motivazioni:**

1. **Brute Force Protection**: `/auth/login` vulnerabile a attacchi
2. **Frontend Needs**: Caricamento pagina = 50-200 richieste HTTP
3. **HMR**: Hot Module Replacement genera centinaia di richieste durante sviluppo

**Esempio Pratico:**

- Senza rate limit selettivo: Frontend blocca dopo 2-3 reload
- Con rate limit solo /auth: Frontend illimitato, API protette

### 10.5 Perché Express invece di Fastify/Hapi?

**Scelta:** Express.js 5.x

**Motivazioni:**

1. **Ecosistema**: Librerie middleware mature (helmet, cors, express-rate-limit)
2. **Documentazione**: Abbondante e collaudata
3. **Team Familiarity**: Curva apprendimento zero
4. **http-proxy-middleware**: Eccellente integrazione

**Contro Fastify:**

- Fastify è più veloce (~2x) ma differenza irrilevante per proxy use-case
- Ecosistema middleware meno maturo

### 10.6 Perché Dual-Network invece di Single Network?

**Scelta:** 2 Docker networks (external + internal)

**Motivazioni:**

1. **Security**: Database isolati da internet
2. **Principle of Least Privilege**: Solo Gateway ha accesso a entrambe le reti
3. **Compliance**: Molte certificazioni richiedono network segmentation

**Alternative Scartate:**

- Single network → Tutti i container esposti
- 3+ networks → Overkill di complessità

---

## 11. RIFERIMENTI E RISORSE

### 11.1 Documentazione Ufficiale

- **Traefik**: https://doc.traefik.io/traefik/v2.10/
- **Express**: https://expressjs.com/
- **http-proxy-middleware**: https://github.com/chimurai/http-proxy-middleware
- **Docker Networking**: https://docs.docker.com/network/

### 11.2 File Correlati

- `EDG-MANUAL.md` - Manuale generale sistema
- `docker-compose.yml` - Orchestrazione container
- `api-gateway/gateway.js` - Codice Gateway production-ready
- `.env` - Variabili configurazione

### 11.3 Changelog Documento

| Versione | Data       | Modifiche                             |
| -------- | ---------- | ------------------------------------- |
| 1.0.0    | 26/11/2025 | Creazione iniziale documento completo |

---

**Fine Documento**

_Questo documento è complementare a `EDG-MANUAL.md` e fornisce approfondimenti tecnici sull'architettura di routing e proxy della EDG Platform._
