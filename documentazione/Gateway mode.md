# Gateway Mode - Documentazione Completa

Guida completa per lavorare con EDG Auth Service in modalità Standalone (development) e Gateway (production).

---

## 📋 Indice

1. [Concetto: Dual Mode](#concetto-dual-mode)
2. [Standalone Mode (Development)](#standalone-mode-development)
3. [Gateway Mode (Production)](#gateway-mode-production)
4. [Configurazione](#configurazione)
5. [Testing](#testing)
6. [Architettura](#architettura)
7. [Security](#security)
8. [Troubleshooting](#troubleshooting)

---

## 🔄 Concetto: Dual Mode

Auth-service supporta **DUE modalità operative**:

### 🟢 Standalone Mode (Development)
```
Frontend → Auth-Service:3001
           ↓
       Valida JWT direttamente
       Gestisce CORS
       Rate limiting generale
```

**Quando usarlo:**
- ✅ Development sul tuo notebook
- ✅ Testing locale
- ✅ Debug
- ✅ Non serve Docker/Gateway

**Configurazione:**
```env
GATEWAY_MODE=false
```

### 🔵 Gateway Mode (Production)
```
Frontend → API Gateway:80 → Auth-Service:3001 (rete interna)
           ↓                ↓
       Valida JWT       Trust X-User-Data
       CORS             Verifica X-Gateway-Secret
       Rate limiting    Business logic
```

**Quando usarlo:**
- ✅ Production con Docker
- ✅ Architettura microservizi completa
- ✅ Scalabilità
- ✅ Centralizzazione security

**Configurazione:**
```env
GATEWAY_MODE=true
```

---

## 🟢 Standalone Mode (Development)

### Setup

**1. Configura .env:**
```env
NODE_ENV=development
GATEWAY_MODE=false  # ← Standalone mode

# Database locale
DB_HOST=localhost
DB_PORT=3306
DB_NAME=edg_auth
DB_USER=edg_auth_admin
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-dev-secret-min-32-chars

# CORS (frontend locali)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_ATTEMPTS=100
```

**2. Avvia servizio:**
```bash
npm run dev
```

**3. Testa:**
```bash
# Chiamata DIRETTA al servizio
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@edg.com",
    "password": "Test123!@#",
    "accountType": "operatore"
  }'
```

### Comportamento

**Cosa fa il servizio:**
- ✅ Valida JWT dal header `Authorization: Bearer TOKEN`
- ✅ Gestisce CORS per browser
- ✅ Rate limiting generale (100 req/15min per IP)
- ✅ Rate limiting specifico (login attempts, etc.)
- ✅ Risponde direttamente al client

**Log tipico:**
```
💻 [SERVER] Standalone mode: CORS e rate limiting generale attivi
🔐 [AUTH] Standalone mode: valida JWT
✅ [AUTH] Standalone mode: utente autenticato (test@edg.com)
```

### Vantaggi
- ⚡ Veloce (no overhead gateway)
- 🐛 Facile debug
- 🧪 Semplice testing
- 📦 No Docker necessario

---

## 🔵 Gateway Mode (Production)

### Setup

**1. Configura .env per auth-service:**
```env
NODE_ENV=production
GATEWAY_MODE=true  # ← Gateway mode

# Gateway Secret (STESSO nel gateway!)
GATEWAY_SECRET=your-gateway-secret-min-32-chars

# Database
DB_HOST=mysql  # Nome servizio Docker
DB_PORT=3306
DB_NAME=edg_auth

# JWT (STESSO nel gateway!)
JWT_SECRET=your-production-secret-min-32-chars

# NO CORS (gestito dal gateway)
# NO RATE LIMITING GENERALE (gestito dal gateway)

# Rate Limiting Specifico (sempre attivo)
LOGIN_RATE_LIMIT_WINDOW=15
LOGIN_RATE_LIMIT_MAX_ATTEMPTS=5
```

**2. Configura gateway (gateway.config.yml):**
```yaml
# JWT validation nel gateway
jwt:
  secretOrPublicKey: your-production-secret-min-32-chars  # STESSO!

# Inject headers verso microservizi
expression:
  jmespath:
    target: req.headers['x-user-data']
    expression: '{
      accountId: claims.accountId,
      uuid: claims.uuid,
      email: claims.email,
      roleId: claims.roleId,
      permissions: claims.permissions
    }'

# Inject gateway secret
expression:
  target: req.headers['x-gateway-secret']
  value: your-gateway-secret-min-32-chars  # STESSO!
```

**3. Avvia con Docker:**
```bash
docker-compose up -d
```

**4. Testa:**
```bash
# Chiamata al GATEWAY (non direttamente al servizio!)
curl -X POST http://localhost/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@edg.com",
    "password": "Test123!@#",
    "accountType": "operatore"
  }'
```

### Comportamento

**Flusso richiesta:**

1. **Frontend → Gateway**
   ```
   POST /auth/login
   Headers:
     Authorization: Bearer TOKEN
   ```

2. **Gateway processa:**
   - ✅ Valida JWT
   - ✅ Estrae payload (accountId, permissions, etc.)
   - ✅ Inietta header `X-User-Data` (JSON)
   - ✅ Inietta header `X-Gateway-Secret`
   - ✅ Gestisce CORS
   - ✅ Rate limiting generale

3. **Gateway → Auth-Service**
   ```
   POST http://auth-service:3001/auth/login
   Headers:
     X-User-Data: {"accountId":1,"uuid":"...","permissions":["*"]}
     X-Gateway-Secret: your-gateway-secret
   ```

4. **Auth-Service processa:**
   - ✅ Verifica `X-Gateway-Secret` (sicurezza!)
   - ✅ Estrae user data da `X-User-Data`
   - ✅ NO validazione JWT (già fatto dal gateway)
   - ✅ Rate limiting specifico (business logic)
   - ✅ Business logic

5. **Auth-Service → Gateway → Frontend**
   ```json
   {
     "success": true,
     "data": { ... }
   }
   ```

**Log tipico:**
```
🌐 [SERVER] Gateway mode: CORS e rate limiting generale disattivati
🔐 [AUTH] Gateway mode: verifica provenienza e estrai user data
✅ [AUTH] Gateway mode: utente autenticato (test@edg.com)
```

### Vantaggi
- 🔒 Security centralizzata
- 📊 Monitoring/logging centralizzato
- ⚖️ Load balancing
- 🚀 Scalabilità
- 🔄 Zero downtime deployments

---

## ⚙️ Configurazione

### Environment Variables

#### Comuni (entrambi i mode)
```env
NODE_ENV=development|production
PORT=3001
DB_HOST=localhost|mysql
DB_NAME=edg_auth
JWT_SECRET=...  # DEVE essere uguale nel gateway!
```

#### Standalone Mode Only
```env
GATEWAY_MODE=false
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_ATTEMPTS=100
```

#### Gateway Mode Only
```env
GATEWAY_MODE=true
GATEWAY_SECRET=...  # DEVE essere uguale nel gateway!
```

#### Sempre Attivi (business logic)
```env
LOGIN_RATE_LIMIT_WINDOW=15
LOGIN_RATE_LIMIT_MAX_ATTEMPTS=5
RESET_PASSWORD_RATE_LIMIT_WINDOW=60
RESET_PASSWORD_RATE_LIMIT_MAX_ATTEMPTS=3
REGISTER_RATE_LIMIT_WINDOW=60
REGISTER_RATE_LIMIT_MAX_ATTEMPTS=10
```

---

## 🧪 Testing

### Standalone Mode

```bash
# 1. Avvia servizio
npm run dev

# 2. Health check
curl http://localhost:3001/health

# 3. Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@edg.com","password":"Test123!@#","accountType":"operatore"}'

# 4. Endpoint protetto
curl http://localhost:3001/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Gateway Mode

```bash
# 1. Avvia Docker
docker-compose up -d

# 2. Health check gateway
curl http://localhost/health

# 3. Health check auth-service (interno)
docker exec edg-auth-service curl http://localhost:3001/health

# 4. Login via gateway
curl -X POST http://localhost/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@edg.com","password":"Test123!@#","accountType":"operatore"}'

# 5. Endpoint protetto via gateway
curl http://localhost/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Switch tra Mode

```bash
# Development → Production
export GATEWAY_MODE=true
npm run build
docker-compose up -d

# Production → Development
export GATEWAY_MODE=false
npm run dev
```

---

## 🏗️ Architettura

### Standalone Mode
```
┌──────────────────────────────────────────┐
│               Frontend                    │
│         (Browser/Mobile App)              │
└───────────────┬──────────────────────────┘
                │ HTTP :3001
                │ Authorization: Bearer TOKEN
                │
┌───────────────▼──────────────────────────┐
│          Auth-Service:3001               │
├──────────────────────────────────────────┤
│ ✅ Valida JWT                            │
│ ✅ CORS                                  │
│ ✅ Rate Limiting Generale                │
│ ✅ Rate Limiting Specifico               │
│ ✅ Business Logic                        │
└───────────────┬──────────────────────────┘
                │
┌───────────────▼──────────────────────────┐
│            Database:3306                 │
└──────────────────────────────────────────┘
```

### Gateway Mode
```
┌──────────────────────────────────────────┐
│               Frontend                    │
│         (Browser/Mobile App)              │
└───────────────┬──────────────────────────┘
                │ HTTP :80
                │ Authorization: Bearer TOKEN
                │
┌───────────────▼──────────────────────────┐
│         API Gateway:8080                 │
├──────────────────────────────────────────┤
│ ✅ Valida JWT                            │
│ ✅ CORS                                  │
│ ✅ Rate Limiting Generale                │
│ ✅ Inject X-User-Data                    │
│ ✅ Inject X-Gateway-Secret               │
└───────────────┬──────────────────────────┘
                │ Internal Network
                │ X-User-Data: {...}
                │ X-Gateway-Secret: ...
                │
┌───────────────▼──────────────────────────┐
│      Auth-Service:3001 (internal)        │
├──────────────────────────────────────────┤
│ ✅ Verifica X-Gateway-Secret             │
│ ✅ Trust X-User-Data                     │
│ ✅ Rate Limiting Specifico               │
│ ✅ Business Logic                        │
└───────────────┬──────────────────────────┘
                │
┌───────────────▼──────────────────────────┐
│       Database:3306 (internal)           │
└──────────────────────────────────────────┘
```

---

## 🔒 Security

### Standalone Mode

**Protezioni:**
- ✅ JWT validation nel microservizio
- ✅ CORS per browser
- ✅ Rate limiting generale
- ✅ Rate limiting specifico
- ✅ Input validation

**Rischi:**
- ⚠️ Endpoint esposto pubblicamente
- ⚠️ Nessuna centralizzazione security

### Gateway Mode

**Protezioni:**
- ✅ JWT validation centralizzata (gateway)
- ✅ CORS centralizzato
- ✅ Rate limiting centralizzato
- ✅ Network isolation (microservizi interni)
- ✅ Gateway secret per prevenire bypass
- ✅ Input validation
- ✅ Rate limiting specifico

**Protezione Bypass Gateway:**

```typescript
// verifyGateway middleware
if (process.env.GATEWAY_MODE === 'true') {
  // Verifica che la richiesta provenga dal gateway
  if (req.headers['x-gateway-secret'] !== process.env.GATEWAY_SECRET) {
    return res.status(403).json({ error: 'Accesso diretto non consentito' });
  }
}
```

**Docker Network Isolation:**

```yaml
# docker-compose.yml
services:
  auth-service:
    expose:
      - '3001'  # ✅ Solo rete interna
    # NO ports: - '3001:3001'  ❌ Esporrebbe all'esterno
    networks:
      - internal  # ✅ Rete isolata
```

---

## 🔧 Troubleshooting

### Problema: "Accesso diretto non consentito" in Development

**Causa:** `GATEWAY_MODE=true` ma chiami direttamente il servizio

**Soluzione:**
```env
GATEWAY_MODE=false  # Per development
```

### Problema: CORS error in Gateway Mode

**Causa:** CORS configurato nel microservizio invece che nel gateway

**Soluzione:**
- Gateway mode: CORS nel gateway
- Standalone mode: CORS nel microservizio (automatico)

### Problema: "X-Gateway-Secret" mismatch

**Causa:** Secret diversi nel gateway e microservizio

**Soluzione:**
```env
# DEVONO essere UGUALI!
# .env (auth-service)
GATEWAY_SECRET=abc123...

# gateway.config.yml
GATEWAY_SECRET=abc123...  # STESSO!
```

### Problema: JWT validation fails

**Causa:** JWT_SECRET diversi nel gateway e microservizio

**Soluzione:**
```env
# DEVONO essere UGUALI!
# .env (auth-service)
JWT_SECRET=xyz789...

# gateway.config.yml
JWT_SECRET=xyz789...  # STESSO!
```

### Problema: Rate limiting duplicato

**Causa:** Rate limiting generale attivo sia nel gateway che nel microservizio

**Soluzione:**
```env
# Gateway mode: rate limiting generale SOLO nel gateway
GATEWAY_MODE=true

# Il microservizio disattiva automaticamente rate limiting generale
# Rate limiting SPECIFICO (login attempts) rimane sempre attivo
```

---

## 📊 Comparison Table

| Feature | Standalone Mode | Gateway Mode |
|---------|----------------|--------------|
| **JWT Validation** | Microservizio | Gateway |
| **CORS** | Microservizio | Gateway |
| **Rate Limit Generale** | Microservizio | Gateway |
| **Rate Limit Specifico** | Microservizio | Microservizio |
| **Network Exposure** | Pubblico (:3001) | Interno (no accesso esterno) |
| **Complexity** | Bassa | Media |
| **Performance** | Alta (diretto) | Media (hop extra) |
| **Scalability** | Bassa | Alta |
| **Security** | Media | Alta |
| **Use Case** | Development | Production |

---

## 🚀 Best Practices

### Development
1. ✅ Usa Standalone mode
2. ✅ `.env` locale con `GATEWAY_MODE=false`
3. ✅ Database locale
4. ✅ No Docker necessario
5. ✅ Hot reload attivo

### Production
1. ✅ Usa Gateway mode
2. ✅ `.env.docker` con `GATEWAY_MODE=true`
3. ✅ Network isolation (Docker internal)
4. ✅ Gateway secret configurato
5. ✅ JWT secret condiviso correttamente
6. ✅ HTTPS/SSL attivo
7. ✅ Monitoring e logging
8. ✅ Backup automatizzati

### Secrets Management
1. ✅ Usa secrets manager (AWS Secrets Manager, Azure Key Vault, etc.)
2. ✅ NO secrets hardcoded nel codice
3. ✅ NO secrets nei file committati
4. ✅ Ruota secrets periodicamente
5. ✅ Secrets diversi per environment (dev/staging/prod)

---

**Documento aggiornato:** 13 Ottobre 2025  
**Versione:** 1.0  
**Status:** Production Ready
