# 🔧 Traefik Configuration - Windows vs Linux

## 🎯 Problema Risolto

Traefik ha comportamenti diversi su **Windows** e **Linux** riguardo al provider Docker.

### Windows (Sviluppo)
- ❌ **Provider Docker NON funziona** (problema socket Unix)
- ✅ **Soluzione**: Provider File (configurazione statica)

### Linux (Produzione)
- ✅ **Provider Docker funziona perfettamente**
- ✅ **Consigliato**: Auto-discovery dinamico dei container

---

## 📋 Configurazione Dual-Mode

Abbiamo implementato una **configurazione intelligente** che si adatta automaticamente all'ambiente tramite variabili d'ambiente.

### File: `.env` (Windows - Sviluppo)

```bash
# Provider Docker: DISABILITATO su Windows
TRAEFIK_USE_DOCKER=false

# Dashboard: APERTA per debug
TRAEFIK_INSECURE=true
```

### File: `.env.production` (Linux - Produzione)

```bash
# Provider Docker: ABILITATO su Linux  
TRAEFIK_USE_DOCKER=true

# Dashboard: PROTETTA per sicurezza
TRAEFIK_INSECURE=false
```

---

## 🏗️ Architettura

### Windows (File Provider)

```
Traefik
  ├─ Provider File: traefik/dynamic.yml ✅
  │  ├─ Router: api-gateway
  │  └─ Service: api-gateway-service
  │      ├─ Server: http://api-gateway-1:8080
  │      └─ Server: http://api-gateway-2:8080
  │
  └─ Provider Docker: DISABLED ❌
```

**File**: `traefik/dynamic.yml`
- Configurazione statica manuale
- Load balancing tra gateway-1 e gateway-2
- Health check su `/health`

### Linux (Docker Provider)

```
Traefik
  ├─ Provider Docker: /var/run/docker.sock ✅
  │  ├─ Auto-discovery container con label
  │  ├─ Router: api-gateway@docker
  │  └─ Service: api-gateway@docker
  │      ├─ Server: http://api-gateway-1:8080 (auto)
  │      └─ Server: http://api-gateway-2:8080 (auto)
  │
  └─ Provider File: traefik/dynamic.yml ✅ (fallback)
```

**Label** in `docker-compose.yml`:
```yaml
labels:
  - 'traefik.enable=true'
  - 'traefik.http.routers.api-gateway.rule=PathPrefix(`/`)'
  - 'traefik.http.services.api-gateway.loadbalancer.server.port=8080'
```

---

## 🚀 Come Funziona

### docker-compose.yml (Configurazione Dinamica)

```yaml
traefik:
  command:
    # Dashboard insecure: controllata da variabile
    - '--api.insecure=${TRAEFIK_INSECURE:-false}'
    
    # Provider Docker: controllato da variabile
    - '--providers.docker=${TRAEFIK_USE_DOCKER:-false}'
    
    # Provider File: sempre attivo (fallback)
    - '--providers.file.filename=/etc/traefik/dynamic.yml'
    
  volumes:
    # File provider config
    - ./traefik/dynamic.yml:/etc/traefik/dynamic.yml:ro
    
    # Docker socket (usato solo se TRAEFIK_USE_DOCKER=true)
    - /var/run/docker.sock:/var/run/docker.sock:ro
```

### Comportamento

**Windows** (`.env` con `TRAEFIK_USE_DOCKER=false`):
```bash
--providers.docker=false  → Provider Docker DISABILITATO
--providers.file=...      → Provider File ATTIVO
```
→ Traefik legge configurazione da `traefik/dynamic.yml`

**Linux** (`.env.production` con `TRAEFIK_USE_DOCKER=true`):
```bash
--providers.docker=true   → Provider Docker ATTIVO
--providers.file=...      → Provider File ATTIVO (backup)
```
→ Traefik legge label dai container + file come fallback

---

## ✅ Vantaggi Soluzione

### 1. Zero Modifiche al Codice
- ✅ Stesso `docker-compose.yml` per dev e prod
- ✅ Cambi solo `.env` quando fai deploy
- ✅ Nessun branch separato dev/prod

### 2. Robustezza
- ✅ File provider come fallback sempre disponibile
- ✅ Se Docker provider fallisce, file provider funziona
- ✅ Configurazione dual-mode testata

### 3. Flessibilità
- ✅ Provider File: controllo manuale, configurazione esplicita
- ✅ Provider Docker: auto-discovery, flessibilità dinamica
- ✅ Puoi usare entrambi contemporaneamente

### 4. Sviluppo Fluido
- ✅ Su Windows: nessun errore di connessione Docker
- ✅ Su Linux: massima automazione con label
- ✅ Dashboard sempre accessibile in dev

---

## 🔄 Migrazione Dev → Prod

### Passo 1: Sul Server Linux

```bash
cd /var/www/edg-docker

# Copia template produzione
cp .env.production .env
```

### Passo 2: Modifica `.env`

```bash
nano .env

# Cambia questi valori:
TRAEFIK_USE_DOCKER=true    # ← DA false A true
TRAEFIK_INSECURE=false     # ← DA true A false
```

### Passo 3: Deploy

```bash
docker compose up -d
```

**FATTO!** Nessun'altra modifica necessaria. 🎉

---

## 🧪 Verifica Funzionamento

### Su Windows (File Provider)

```bash
# Logs Traefik
docker compose logs traefik | grep "provider"

# Output atteso:
# "Starting provider *file.Provider" ✅
# NO errori "Provider connection error"
```

### Su Linux (Docker Provider)

```bash
# Logs Traefik  
docker compose logs traefik | grep "provider"

# Output atteso:
# "Starting provider *file.Provider" ✅
# "Starting provider *docker.Provider" ✅
# "Configuration loaded from provider docker" ✅
```

---

## 📁 File di Configurazione

```
edg-docker/
├── docker-compose.yml          # Configurazione dinamica
├── .env                        # Windows (dev)
├── .env.production             # Linux (prod) - template
├── traefik/
│   └── dynamic.yml            # Configurazione statica
└── DEPLOY_UBUNTU.md           # Guida deploy produzione
```

---

## 🔍 Troubleshooting

### "Provider connection error" su Windows
✅ **Normale** - Provider Docker disabilitato  
✅ Verifica che File Provider sia attivo
✅ Controlla `TRAEFIK_USE_DOCKER=false` in `.env`

### "Provider connection error" su Linux
❌ **Problema** - Provider Docker dovrebbe funzionare  
🔧 Verifica `TRAEFIK_USE_DOCKER=true` in `.env`  
🔧 Verifica socket: `ls -la /var/run/docker.sock`

### Dashboard non si apre
🔧 Verifica `TRAEFIK_INSECURE=true` in `.env`  
🔧 Accedi su: `http://localhost:8888/dashboard/`  
⚠️ Ricorda il trailing slash `/`

### Load balancing non funziona
🔧 **Windows**: Verifica `traefik/dynamic.yml` presente  
🔧 **Linux**: Verifica label su gateway in `docker-compose.yml`  
🔧 Dashboard → HTTP Services → `api-gateway-service@file` o `api-gateway@docker`

---

## 📚 Riferimenti

- [Traefik File Provider](https://doc.traefik.io/traefik/providers/file/)
- [Traefik Docker Provider](https://doc.traefik.io/traefik/providers/docker/)
- [Guida Deploy Ubuntu](./DEPLOY_UBUNTU.md)

---

## ✨ Conclusione

Questa configurazione dual-mode garantisce:

✅ **Sviluppo Windows**: funzionamento stabile senza errori  
✅ **Produzione Linux**: automazione e flessibilità massima  
✅ **Zero modifiche** al codice tra ambienti  
✅ **Fallback robusto** con provider File sempre disponibile

**Deployment sicuro garantito!** 🚀
