# EDG API Gateway - Documentazione Tecnica

**Versione:** 2.0  
**Data:** 29 Gennaio 2026  
**Autore:** Mormegil + Claude

---

## 📋 Indice

1. [Panoramica](#panoramica)
2. [Architettura](#architettura)
3. [Flusso Richieste](#flusso-richieste)
4. [Route Pubbliche vs Protette](#route-pubbliche-vs-protette)
5. [Middleware](#middleware)
6. [Configurazione](#configurazione)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Panoramica

L'API Gateway è il punto di ingresso unico per tutte le richieste HTTP verso i microservizi EDG. Gestisce:

- **Autenticazione JWT** per route protette
- **Header injection** per comunicazione sicura con microservizi
- **Load balancing** tramite Traefik (2 istanze)
- **Rate limiting** e **CORS**
- **Proxy** verso frontend e backend services

---

## 🏗️ Architettura

```
┌─────────────────────────────────────────────────────────────┐
│                         BROWSER                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   Traefik (port 80)  │
              │   Load Balancer      │
              └──────────┬───────────┘
                         │
           ┌─────────────┴─────────────┐
           │                           │
    ┌──────▼──────┐            ┌──────▼──────┐
    │ Gateway-1   │            │ Gateway-2   │
    │  (port 8080)│            │  (port 8080)│
    └──────┬──────┘            └──────┬──────┘
           │                           │
           └─────────────┬─────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐    ┌─────▼─────┐   ┌───▼────┐
    │ Auth    │    │ Frontends │   │ Other  │
    │ Service │    │ (3x)      │   │ Services│
    └─────────┘    └───────────┘   └────────┘
```

---

## 🔄 Flusso Richieste

### Route Pubbliche (es. `/auth/login`)

```
Browser
  │
  ├─ POST /auth/login { email, password }
  │
  ▼
Gateway
  │
  ├─ Nessun body parsing (stream intatto)
  ├─ Proxy diretto → auth-service:3001
  │
  ▼
Auth-Service
  │
  ├─ Valida credenziali
  ├─ Genera JWT token
  │
  ▼
Response { accessToken, refreshToken, account }
```

### Route Protette (es. `/auth/change-password`)

```
Browser
  │
  ├─ POST /auth/change-password
  ├─ Headers: { Authorization: "Bearer <JWT>" }
  ├─ Body: { currentPassword, newPassword }
  │
  ▼
Gateway
  │
  ├─ [1] Body parsing (express.json)
  │
  ├─ [2] JWT Validation (middleware/jwtValidator.js)
  │     ├─ Estrae token da Authorization header
  │     ├─ Verifica firma con JWT_SECRET
  │     ├─ Estrae user data (accountId, email, roleId, permissions)
  │     └─ Inietta in req.userData
  │
  ├─ [3] Header Injection (middleware/gatewayHeaders.js)
  │     ├─ Aggiungi x-gateway-secret (GATEWAY_SECRET)
  │     └─ Aggiungi x-user-data (JSON con dati utente)
  │
  ├─ [4] Body Transformation
  │     └─ currentPassword → oldPassword (compatibilità backend)
  │
  ├─ [5] Axios Forward
  │     ├─ URL: http://auth-service:3001/auth/change-password
  │     ├─ Headers: x-gateway-secret, x-user-data, Content-Type
  │     └─ Body: { oldPassword, newPassword }
  │
  ▼
Auth-Service
  │
  ├─ [GATEWAY_MODE=true]
  ├─ Verifica x-gateway-secret (middleware/verifyGateway.ts)
  ├─ Estrae dati da x-user-data
  ├─ Esegue cambio password
  │
  ▼
Response { success: true, message: "..." }
```

---

## 🔐 Route Pubbliche vs Protette

### Route Pubbliche (Proxy Diretto)

| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/auth/login` | POST | Login con email/password |
| `/auth/register` | POST | Registrazione nuovo account |
| `/auth/refresh` | POST | Rinnovo access token |
| `/auth/request-reset-password` | POST | Richiesta reset password |
| `/auth/reset-password` | POST | Conferma reset password |
| `/auth/logout` | POST | Logout singolo dispositivo |

**Caratteristiche:**
- ✅ Body stream intatto
- ✅ Proxy middleware (http-proxy-middleware)
- ❌ No JWT validation
- ❌ No header injection

---

### Route Protette (JWT + Headers)

| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/auth/change-password` | POST | Cambio password utente loggato |
| `/auth/logout-all` | POST | Logout da tutti i dispositivi |
| `/auth/me` | GET | Dati account corrente |

**Caratteristiche:**
- ✅ Body parsing (express.json)
- ✅ JWT validation
- ✅ Header injection (x-gateway-secret, x-user-data)
- ✅ Axios forward (controllo totale)

**Codice di riconoscimento:**
```javascript
const PROTECTED_AUTH_ROUTES = [
  '/change-password',
  '/logout-all',
  '/me',
];

function isProtectedRoute(path) {
  return PROTECTED_AUTH_ROUTES.some(route => path === route);
}
```

---

## 🔧 Middleware

### 1. jwtValidator.js

**Scopo:** Validare token JWT e estrarre dati utente

**Input:**
- `req.headers.authorization` → `"Bearer <token>"`

**Output:**
- `req.userData` → `{ accountId, email, accountType, roleId, permissions }`

**Errori:**
- `401` - Token mancante
- `401` - Token non valido o scaduto
- `500` - JWT_SECRET non configurato

**Funzioni esportate:**
```javascript
module.exports = {
  extractToken,           // Helper: estrae token da header
  validateToken,          // Helper: valida e decodifica token
  jwtValidatorMiddleware, // Middleware Express
}
```

---

### 2. gatewayHeaders.js

**Scopo:** Iniettare header richiesti dall'auth-service in GATEWAY_MODE

**Input:**
- `req.userData` (da jwtValidatorMiddleware)

**Output:**
- `req.headers['x-gateway-secret']` → `GATEWAY_SECRET` env
- `req.headers['x-user-data']` → JSON stringificato con dati utente

**Errori:**
- `500` - GATEWAY_SECRET non configurato
- `500` - userData mancante (middleware chiamato fuori ordine)

**Funzioni esportate:**
```javascript
module.exports = {
  injectGatewayHeaders,    // Middleware Express
  logHeadersInjection,     // Helper per logging
}
```

---

## ⚙️ Configurazione

### Variabili d'Ambiente (docker-compose.yml)

```yaml
api-gateway-1:
  environment:
    # JWT
    JWT_SECRET: ${JWT_SECRET}           # Secret per validare token
    
    # Gateway
    GATEWAY_SECRET: ${GATEWAY_SECRET}   # Secret condiviso con microservizi
    
    # Services
    AUTH_SERVICE_URL: http://auth-service:3001
    FRONTEND_PRO_URL: http://pro-frontend:5173
    FRONTEND_APP_URL: http://app-frontend:5174
    FRONTEND_EDG_URL: http://edg-frontend:5175
    
    # CORS
    CORS_ORIGINS: http://localhost:5173,http://localhost:5174,http://localhost:5175
    
    # Rate Limiting
    RATE_LIMIT_WINDOW: 16          # minuti
    RATE_LIMIT_MAX_ATTEMPTS: 1024  # richieste per finestra
```

### File .env

```bash
JWT_SECRET=your-super-secret-jwt-key-change-in-production
GATEWAY_SECRET=your-gateway-secret-key-change-in-production
```

⚠️ **IMPORTANTE:** Cambiare questi secret in produzione!

---

## 🐛 Troubleshooting

### Problema: Login non funziona (403/404)

**Causa:** Route pubblica viene trattata come protetta

**Soluzione:** Verificare che la route sia in `PROTECTED_AUTH_ROUTES`

```javascript
// ❌ SBAGLIATO
const PROTECTED_AUTH_ROUTES = ['/login', '/change-password'];

// ✅ CORRETTO
const PROTECTED_AUTH_ROUTES = ['/change-password', '/logout-all', '/me'];
```

---

### Problema: Cambio password ritorna "Token non valido"

**Causa:** JWT_SECRET diverso tra gateway e auth-service

**Soluzione:** Verificare che `JWT_SECRET` sia identico in docker-compose.yml

```bash
# Verifica
docker exec api-gateway-1 printenv JWT_SECRET
docker exec auth-service printenv JWT_SECRET
# Devono essere IDENTICI
```

---

### Problema: "Accesso diretto non consentito" (403)

**Causa:** Header `x-gateway-secret` mancante o errato

**Soluzione:** 
1. Verificare `GATEWAY_SECRET` identico tra gateway e auth-service
2. Verificare che la route sia in `PROTECTED_AUTH_ROUTES`
3. Controllare log gateway per vedere se header viene iniettato

---

### Problema: "Password attuale e nuova password richieste" (400)

**Causa:** Body transformation non funziona

**Soluzione:** Verificare che il gateway trasformi `currentPassword` → `oldPassword`

```javascript
// In gateway.js, sezione axios forward
const requestData = { ...req.body };
if (path === '/change-password' && requestData.currentPassword) {
  requestData.oldPassword = requestData.currentPassword;
  delete requestData.currentPassword;
}
```

---

### Problema: Body arriva vuoto all'auth-service

**Causa:** Body parsing applicato a tutte le route `/auth`

**Soluzione:** Parsare body SOLO per route protette

```javascript
// ❌ SBAGLIATO
app.use('/auth', express.json(), (req, res, next) => { ... });

// ✅ CORRETTO
app.use('/auth', async (req, res, next) => {
  if (isProtectedRoute(req.path)) {
    await new Promise(resolve => express.json()(req, res, resolve));
  }
  // ... resto codice
});
```

---

## 📊 Log Standard

### Login (Route Pubblica)
```
[2026-01-29T10:00:00.000Z] POST /auth/login - Host: localhost
```

### Cambio Password (Route Protetta) - Successo
```
[2026-01-29T10:00:00.000Z] POST /auth/change-password - Host: localhost
```

### Cambio Password - Errore
```
[2026-01-29T10:00:00.000Z] POST /auth/change-password - Host: localhost
❌ [GATEWAY] Error forwarding to auth-service: <message>
```

---

## 🔄 Manutenzione

### Aggiungere una Nuova Route Protetta

1. Aggiungi la route a `PROTECTED_AUTH_ROUTES`:

```javascript
const PROTECTED_AUTH_ROUTES = [
  '/change-password',
  '/logout-all',
  '/me',
  '/new-protected-route',  // ← NUOVA
];
```

2. Riavvia il gateway:

```bash
docker-compose restart api-gateway-1 api-gateway-2
```

3. Testa che JWT validation funzioni

---

### Aggiornare Dipendenze

```bash
cd api-gateway
npm update
docker-compose build api-gateway-1 api-gateway-2
docker-compose up -d api-gateway-1 api-gateway-2
```

---

## 📚 Riferimenti

- **http-proxy-middleware:** https://github.com/chimurai/http-proxy-middleware
- **jsonwebtoken:** https://github.com/auth0/node-jsonwebtoken
- **express-rate-limit:** https://github.com/express-rate-limit/express-rate-limit

---

## ✅ Checklist Deploy Produzione

- [ ] Cambiare `JWT_SECRET` in produzione
- [ ] Cambiare `GATEWAY_SECRET` in produzione
- [ ] Configurare CORS con domini reali
- [ ] Abilitare HTTPS (Traefik Let's Encrypt)
- [ ] Configurare rate limiting appropriato
- [ ] Rimuovere log di debug
- [ ] Test completi su tutte le route
- [ ] Monitoraggio e alerting attivi

---

**Fine Documentazione**
