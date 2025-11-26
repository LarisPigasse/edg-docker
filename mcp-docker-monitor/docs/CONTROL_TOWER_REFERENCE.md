# 📚 Control Tower MCP - Technical Reference

**Versione Corrente:** v2.5.0  
**Data Documento:** 19 Novembre 2025  
**Status:** Production Ready

---

## 📋 Indice

1. [Panoramica Sistema](#panoramica-sistema)
2. [Storia Evolutiva](#storia-evolutiva)
3. [Architettura Attuale](#architettura-attuale)
4. [Tool Reference](#tool-reference)
5. [Configurazione e Deploy](#configurazione-e-deploy)
6. [Performance e Metriche](#performance-e-metriche)

---

## 🎯 Panoramica Sistema

Control Tower MCP è un sistema enterprise-grade di monitoring e automazione per architetture Docker HA. Fornisce 59 tool organizzati in 7 categorie per gestione completa dell'infrastruttura.

### Capabilities

```
📊 MONITORING              🎮 CONTROL              🤖 AUTOMATION
├─ Diagnostica (7)        ├─ Container (16)       ├─ Backup (6)
├─ Logs (4)               ├─ Orchestration (2)    ├─ Auto-Healing (3)
├─ Metrics (4)            └─ Network (4)          └─ Alerts (4)
└─ Volumes (4)
```

### Stack Tecnologico

```typescript
{
  "runtime": "Node.js v20+",
  "language": "TypeScript",
  "docker": "Docker API (dockerode)",
  "scheduling": "node-cron",
  "filesystem": "fs-extra",
  "protocol": "Model Context Protocol (MCP)"
}
```

---

## 📈 Storia Evolutiva

### v1.0.0 - Base Foundation

**Problema Iniziale:**

```typescript
// Nomi hardcoded non corrispondenti
frontends: {
  pro: await checkContainerHealth('frontend-pro'),      // ❌ Nome errato
  app: await checkContainerHealth('frontend-app'),      // ❌ Nome errato
  admin: await checkContainerHealth('frontend-admin'),  // ❌ Non esiste
}

// Risultato: Tutti i frontend risultavano "not_found"
```

**Limitazioni:**

- ❌ 0/3 frontend rilevati correttamente
- ❌ Nessun rilevamento microservizi
- ❌ Nessun rilevamento database
- ❌ Modifiche manuali richieste per ogni cambio

---

### v2.0.0 - Diagnostica Intelligente

**Soluzione Implementata:**

```typescript
// Rilevamento automatico
frontends: (await detectFrontends()) - // ✅ Trova tutti i frontend
  // Funzioni aggiunte:
  detectFrontends() - // Ricerca intelligente
  detectMicroservices() - // Categorizzazione auto
  detectDatabases() - // Pattern matching avanzato
  diagnoseArchitecture(); // Scansione completa
```

**Risultati:**

- ✅ 3/3 frontend rilevati (100%)
- ✅ 2/2 microservizi rilevati (100%)
- ✅ 2/2 database rilevati (100%)
- ✅ Zero manutenzione richiesta

**Nuovi Tool:**

- `health-report` - Report sintetico
- `detect-frontends` - Lista frontend
- `detect-microservices` - Lista microservizi
- `detect-databases` - Lista database

---

### v2.1.0 - FASE 1 Step 1: Logs

**Obiettivo:** Aumentare visibilità con accesso completo ai logs

**Tool Aggiunti (4):**

1. **get-logs** - Ultimi N log di un container

   ```
   Parametri: containerId, lines (max 1000), since (30s/5m/1h/2d)
   Uso: "Mostrami gli ultimi 200 log di api-gateway"
   ```

2. **stream-logs** - Real-time streaming

   ```
   Parametri: containerId, duration (max 60s)
   Uso: "Segui i logs di traefik per 30 secondi"
   ```

3. **search-logs** - Ricerca pattern (regex)

   ```
   Parametri: containerId, pattern, lines (max 1000)
   Uso: "Cerca errori in api-gateway"
   ```

4. **get-logs-multi** - Confronto multi-container (max 5)
   ```
   Parametri: containerIds[], lines (max 1000)
   Uso: "Confronta logs dei due gateway"
   ```

**Limiti di Sicurezza:**

- Max 1000 linee per richiesta
- Max 60s streaming duration
- Max 5 container simultanei
- Output plain text formattato

---

### v2.2.0 - FASE 1 Step 2: Metrics

**Obiettivo:** Monitoring risorse real-time

**Tool Aggiunti (4):**

1. **get-container-metrics** - Metriche singolo container

   ```
   Output:
   - CPU Usage (%)
   - Memory (MB/GB + %)
   - Network RX/TX (cumulative)
   - Disk I/O Read/Write
   - PIDs, Uptime, Health
   ```

2. **get-all-metrics** - Tabella comparativa

   ```
   Parametri: sortBy ('cpu' | 'memory')
   Output: Tabella tutti i container running
   ```

3. **compare-metrics** - Confronto side-by-side (max 5)

   ```
   Uso: Verifica bilanciamento load tra repliche
   ```

4. **system-resources** - Snapshot sistema
   ```
   Output:
   - CPU count e platform
   - RAM totale/usata/libera
   - Container Docker running/total
   - Memoria usata da Docker
   ```

**Metriche Fornite:**

- **CPU %** - Utilizzo processore
- **Memory** - RAM con limite e percentuale
- **Network** - Traffico ricevuto/inviato
- **Disk I/O** - Operazioni lettura/scrittura
- **PIDs** - Numero processi attivi

---

### v2.3.0 - FASE 1 Step 3: Network & Volumes

**Tool Network (2):**

1. **inspect-network** - Configurazione rete container

   ```
   Output: IP, gateway, subnet, porte mappate
   ```

2. **test-connectivity** - Test ping tra container
   ```
   Uso: Debug problemi di connettività
   ```

**Tool Volumes (2):**

3. **list-volumes** - Lista volumi con dettagli

   ```
   Output: Driver, mountpoint, labels, created date
   ```

4. **volume-usage** - Analisi spazio utilizzato
   ```
   Output: Size per volume + container associati
   ```

---

### v2.4.0 - FASE 2: Controllo Completo

**Tool Aggiunti (16):**

**Operazioni Base (7):**

- `start-container` - Avvia container fermo
- `stop-container` - Graceful stop (timeout configurabile)
- `restart-container-improved` - Riavvio con health check
- `pause-container` - Pausa esecuzione
- `unpause-container` - Riprendi da pausa
- `kill-container` - Force stop con segnale personalizzabile
- `get-container-status` - Status dettagliato

**Operazioni Batch (2):**

- `restart-multiple-containers` - Riavvio sequenziale multipli
- `scale-service` - Scale up/down servizi Docker Compose

**Manutenzione (4):**

- `enable-maintenance-mode` - Pausa tutti i frontend
- `disable-maintenance-mode` - Riprendi frontend
- `health-check-and-restart` - Check + auto-restart opzionale
- `list-scalable-services` - Lista servizi scalabili

**Cleanup (3):**

- `remove-container` - Rimozione con safety checks
- `prune-volumes` - Cleanup volumi (DRY RUN default)
- `prune-containers` - Cleanup container fermati (DRY RUN default)

**Caratteristiche:**

- ✅ Safety checks su operazioni pericolose
- ✅ DRY RUN default per cleanup
- ✅ Timeout configurabili
- ✅ Health verification post-restart

---

### v2.5.0 - FASE 3: Automazione Completa ⭐ CORRENTE

**Tool Backup (6):**

1. **backup-mysql** - Export SQL database

   ```typescript
   Parametri: {
     containerName: 'mysql',
     database: string,
     user: 'root',
     password: string
   }
   Output: mysql_{db}_{timestamp}.sql
   ```

2. **backup-mongodb** - Export archive MongoDB

   ```typescript
   Parametri: {
     containerName: 'mongodb',
     database: string
   }
   Output: mongo_{db}_{timestamp}.archive
   ```

3. **backup-volumes** - Snapshot tar.gz volumi

   ```typescript
   Parametri: {
     volumeNames: string[]  // vuoto = tutti
   }
   Output: volume_{name}_{timestamp}.tar
   Metodo: Alpine container + tar compression
   ```

4. **backup-all** - Backup completo sistema

   ```typescript
   Esegue: MySQL + MongoDB + Volumes in sequenza
   Tempo: ~80s per 1.35 GB
   ```

5. **list-backups** - Lista con metadata

   ```typescript
   Output: Categorizzato per tipo (mysql/mongo/volume)
   Info: Size, timestamp, filename
   ```

6. **cleanup-old-backups** - Retention policy
   ```typescript
   Parametri: { retentionDays: 30 }
   Azione: Rimuove backup > N giorni
   ```

**Tool Auto-Healing (3):**

1. **start-auto-healing** - Avvia monitor

   ```typescript
   Parametri: { intervalMinutes: 5 }  // min: 3
   Azione:
   - Check periodico container unhealthy
   - Riavvio automatico
   - Alert per problemi persistenti
   ```

2. **stop-auto-healing** - Ferma monitor

   ```typescript
   Uso: Durante debug o manutenzione
   ```

3. **get-auto-healing-status** - Statistiche
   ```typescript
   Output:
   - Status (ACTIVE/INACTIVE)
   - Checks performed
   - Containers restarted
   - Alerts sent
   - Uptime monitor
   ```

**Tool Monitoring & Alerts (4):**

1. **configure-thresholds** - Configura soglie alert

   ```typescript
   Parametri: {
     cpuWarning: 80,        cpuCritical: 95,
     memoryWarning: 85,     memoryCritical: 95,
     unhealthyWarning: 1,   unhealthyCritical: 3
   }
   ```

2. **check-system-thresholds** - Verifica manuale

   ```typescript
   Esegue check immediato vs threshold configurati
   Genera alert se necessario
   ```

3. **get-alert-history** - Storico alert

   ```typescript
   Parametri: { limit: 100 }
   Output: Alert con timestamp, tipo, dettagli
   Statistiche: Count per livello (CRITICAL/WARNING/INFO)
   ```

4. **clear-alert-history** - Reset storico
   ```typescript
   Uso: Pulizia periodica o reset dopo manutenzione
   ```

**Sistema Alert a 3 Livelli:**

**🚨 CRITICAL** (Email + Log):

- Database down
- Container critico crashed
- Multiple container unhealthy (≥3)
- Backup fallito

**⚠️ WARNING** (Log):

- CPU > 80%
- Memory > 85%
- Single container unhealthy
- Backup lento

**ℹ️ INFO** (Log):

- Backup completato
- Container restarted
- Cleanup eseguito
- Configuration changes

---

## 🏗️ Architettura Attuale

### File Structure

```
control-tower-mcp/
├── src/
│   ├── index.ts                 # Entry point (59 tool)
│   ├── services/
│   │   ├── docker.service.ts    # Core Docker operations
│   │   ├── logs.service.ts      # Logs management
│   │   ├── metrics.service.ts   # Resource metrics
│   │   ├── network.service.ts   # Network & volumes
│   │   ├── control.service.ts   # Container control
│   │   ├── automation.service.ts # Backup + auto-healing
│   │   ├── email.service.ts     # Alert notifications
│   │   └── monitor.service.ts   # Background monitoring
│   └── tools/
│       ├── diagnostics.tools.ts
│       └── orchestration.tools.ts
├── package.json
└── tsconfig.json
```

### Service Layer Architecture

```
┌─────────────────────────────────────────────┐
│           MCP Server (index.ts)             │
│              59 Tool Handlers               │
└─────────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
   ┌─────────┐  ┌──────────┐  ┌──────────┐
   │ Docker  │  │  Logs    │  │ Metrics  │
   │ Service │  │ Service  │  │ Service  │
   └─────────┘  └──────────┘  └──────────┘
        │             │             │
        ▼             ▼             ▼
   ┌─────────┐  ┌──────────┐  ┌──────────┐
   │ Control │  │ Network  │  │Automation│
   │ Service │  │ Service  │  │ Service  │
   └─────────┘  └──────────┘  └──────────┘
                      │
                      ▼
              ┌──────────────┐
              │ Docker Engine│
              └──────────────┘
```

### Data Flow Example (Backup)

```
User Request → Claude → MCP Tool → automation.service
                                         ↓
                                   ┌──────────┐
                                   │ Docker   │
                                   │ Container│
                                   └──────────┘
                                         ↓
                                   mysqldump/
                                   mongodump/
                                   tar
                                         ↓
                                   d:/sviluppo/
                                   claude/backups/
```

---

## 📖 Tool Reference

### Categorie Complete (59 tool)

#### 🏥 Diagnostics (7 tool)

```
list-containers          Lista tutti i container
diagnose-architecture    Diagnostica completa intelligente
health-report           Report sintetico stato salute
detect-frontends        Rileva automaticamente frontend
detect-microservices    Rileva automaticamente microservizi
detect-databases        Rileva automaticamente database
inspect-container       Dettagli specifici container
```

#### 🔄 Orchestration (2 tool)

```
restart-container       Riavvio con alert email
start-backup-gateway    Avvia istanza backup gateway
```

#### 📋 Logs (4 tool)

```
get-logs               Ultimi N log (max 1000)
stream-logs            Real-time streaming (max 60s)
search-logs            Ricerca pattern regex
get-logs-multi         Confronto multi-container (max 5)
```

#### 📊 Metrics (4 tool)

```
get-container-metrics  CPU/RAM/Network/Disk singolo
get-all-metrics        Tabella tutti container
compare-metrics        Confronto side-by-side (max 5)
system-resources       Snapshot risorse sistema
```

#### 🎮 Control (16 tool)

```
# Base Operations
start-container              Avvia container
stop-container              Stop graceful (timeout)
restart-container-improved  Riavvio + health check
pause-container             Pausa esecuzione
unpause-container           Riprendi da pausa
kill-container              Force stop (SIGKILL)
get-container-status        Status dettagliato

# Batch Operations
restart-multiple-containers Batch restart sequenziale
scale-service              Scale Docker Compose

# Maintenance
enable-maintenance-mode    Pausa tutti frontend
disable-maintenance-mode   Riprendi frontend
health-check-and-restart   Check + auto-restart
list-scalable-services     Lista servizi scalabili

# Cleanup
remove-container           Rimozione sicura
prune-volumes             Cleanup volumi (DRY RUN)
prune-containers          Cleanup container (DRY RUN)
```

#### 🌐 Network & Volumes (4 tool)

```
inspect-network      Configurazione rete (IP/gateway)
test-connectivity    Test ping tra container
list-volumes        Lista volumi con dettagli
volume-usage        Analisi spazio utilizzato
```

#### 🤖 Automation (13 tool)

```
# Backup (6)
backup-mysql              Export SQL database
backup-mongodb            Export MongoDB archive
backup-volumes            Snapshot volumi tar.gz
backup-all               Full system backup
list-backups             Lista con metadata
cleanup-old-backups      Retention policy

# Auto-Healing (3)
start-auto-healing       Avvia monitor
stop-auto-healing        Ferma monitor
get-auto-healing-status  Statistiche e status

# Monitoring (4)
configure-thresholds     Configura soglie alert
check-system-thresholds  Verifica manuale
get-alert-history       Storico alert
clear-alert-history     Reset storico
```

---

## ⚙️ Configurazione e Deploy

### Requisiti Sistema

```
Node.js:  v20+
Docker:   Engine API 1.41+
RAM:      Minimo 4GB disponibili
Disk:     Spazio per backup (stimato: 2-5GB)
Network:  Accesso Docker socket
```

### Dipendenze npm

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.4",
    "dockerode": "^4.0.2",
    "nodemailer": "^6.9.16",
    "node-cron": "^3.0.3",
    "fs-extra": "^11.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

### Configurazione Claude Desktop

**Windows:**

```json
{
  "mcpServers": {
    "docker-monitor": {
      "command": "node",
      "args": ["d:/sviluppo/edg-docker/mcp-docker-monitor/build/index.js"],
      "env": {
        "BACKUP_DIR": "d:/sviluppo/claude/backups"
      }
    }
  }
}
```

**Linux/Ubuntu (Production):**

```json
{
  "mcpServers": {
    "docker-monitor": {
      "command": "node",
      "args": ["/opt/mcp-docker-monitor/build/index.js"],
      "env": {
        "BACKUP_DIR": "/var/backups/docker"
      }
    }
  }
}
```

### Path Backup Configurabile

```typescript
// In automation.service.ts
const BACKUP_DIR = process.env.BACKUP_DIR || 'd:/sviluppo/claude/backups';

// Vantaggi:
// ✅ Stesso codice per Windows e Linux
// ✅ Path configurabile via env
// ✅ Fallback su default
// ✅ Zero modifiche al codice per deploy
```

### Installazione

```bash
# 1. Clone repository
git clone <repo-url> control-tower-mcp
cd control-tower-mcp

# 2. Install dependencies
npm install

# 3. Build TypeScript
npm run build

# 4. Configure Claude Desktop
# Edita ~/.config/Claude/claude_desktop_config.json

# 5. Create backup directory
mkdir -p d:/sviluppo/claude/backups  # Windows
# oppure
sudo mkdir -p /var/backups/docker && sudo chown $USER:$USER /var/backups/docker  # Linux

# 6. Restart Claude Desktop
```

---

## 📊 Performance e Metriche

### Tempi di Esecuzione Verificati

| Operazione        | Dimensione    | Tempo  | Performance |
| ----------------- | ------------- | ------ | ----------- |
| MySQL Backup      | 3.67 MB       | 0.74s  | 4.96 MB/s   |
| MongoDB Backup    | 188 B         | 0.19s  | Istantaneo  |
| Volume Backup     | 307.55 MB     | 15.08s | 20.4 MB/s   |
| Full Backup       | 1.35 GB       | 83.08s | 16.6 MB/s   |
| Get Logs          | 100 lines     | <1s    | -           |
| Stream Logs       | 30s           | 30s    | Real-time   |
| Container Metrics | Single        | <1s    | -           |
| All Metrics       | 10 containers | 1-2s   | Parallel    |

### Impatto Risorse Sistema

```
CPU Usage:      <5% durante operazioni normali
                <15% durante backup completo

Memory Usage:   ~50MB per operazione
                ~200MB per backup completo

Network:        Zero (tutto locale)
Disk I/O:       Solo durante backup
```

### Limiti di Sicurezza

```typescript
// Logs
MAX_LINES = 1000;
MAX_STREAM_DURATION = 60; // secondi
MAX_MULTI_CONTAINERS = 5;

// Metrics
MAX_COMPARE_CONTAINERS = 5;

// Backup
BACKUP_RETENTION_DAYS = 30; // default

// Auto-Healing
MIN_INTERVAL_MINUTES = 3;
```

### Threshold Default

```typescript
// CPU
cpuWarning: 80%
cpuCritical: 95%

// Memory
memoryWarning: 85%
memoryCritical: 95%

// Unhealthy Containers
unhealthyWarning: 1
unhealthyCritical: 3
```

---

## 🎯 Use Cases Documentati

### 1. Check Mattutino Completo

```
1. health-report (5s)
2. get-all-metrics sortBy=cpu (2s)
3. get-alert-history limit=20 (1s)
Total: ~8 secondi
```

### 2. Debug Container Lento

```
1. get-container-metrics {container} (1s)
2. get-logs {container} lines=200 (1s)
3. search-logs pattern="ERROR|timeout" (1s)
Total: ~3 secondi + analisi
```

### 3. Pre-Deploy Checklist

```
1. backup-all (80s)
2. health-report (5s)
3. system-resources (1s)
Total: ~86 secondi
```

### 4. Incident Response

```
1. diagnose-architecture (2s)
2. get-logs-multi {affected containers} (2s)
3. restart-container-improved {container} (5-10s)
4. health-report verification (5s)
Total: ~15-20 secondi
```

---

## 🔐 Security & Safety

### Operazioni Protette

**DRY RUN by Default:**

- `prune-volumes`
- `prune-containers`

**Safety Checks:**

- `remove-container` - Verifica stato prima rimozione
- `backup-all` - Verifica spazio disco disponibile
- `cleanup-old-backups` - Preview prima eliminazione

**Graceful Operations:**

- `stop-container` - Timeout configurabile per shutdown pulito
- `restart-container-improved` - Health verification post-restart
- `enable-maintenance-mode` - Sequenza ordinata pausa frontend

### Alert System

**CRITICAL → Email + Log:**

- Richiede configurazione SMTP in `email.service.js`
- Solo per eventi che richiedono azione immediata

**WARNING/INFO → Log only:**

- Nessuna configurazione richiesta
- Storico consultabile con `get-alert-history`

---

## 📚 Riferimenti Rapidi

### Comandi Frequenti

```bash
# Diagnostica
"Come sta il sistema?" → health-report
"Tutti i container" → list-containers
"Diagnostica completa" → diagnose-architecture

# Logs
"Logs di {container}" → get-logs
"Cerca errori in {container}" → search-logs
"Segui logs di {container}" → stream-logs

# Performance
"Metriche di {container}" → get-container-metrics
"Chi usa più CPU?" → get-all-metrics sortBy=cpu
"Confronta {A} e {B}" → compare-metrics

# Backup
"Backup completo" → backup-all
"Lista backup" → list-backups
"Cleanup backup vecchi" → cleanup-old-backups

# Manutenzione
"Attiva auto-healing" → start-auto-healing
"Modalità manutenzione ON" → enable-maintenance-mode
"Riavvia {container}" → restart-container-improved
```

### Pattern Recognition

**Frontend Detection:**

- Pattern: `*frontend*` (case-insensitive)
- Esempi: pro-frontend, app-frontend, edg-frontend

**Microservices Detection:**

- Pattern: `*service*`
- Esempi: auth-service, log-service, shipping-service

**Database Detection:**

- Keywords: mysql, mongo, postgres, redis, mariadb
- Esempi: auth-mysql, log-mongo, cache-redis

---

## 🎓 Best Practices

### Routine Quotidiana

1. Check mattutino (health-report)
2. Review alert (get-alert-history)
3. Verifica risorse (system-resources)

### Routine Settimanale

1. Backup completo (backup-all)
2. Cleanup backup vecchi (cleanup-old-backups)
3. Review performance trends

### Pre-Deploy

1. Backup preventivo
2. Health check completo
3. Verifica risorse disponibili
4. Maintenance mode se necessario

### Post-Deploy

1. Health verification
2. Logs check per errori
3. Metrics comparison
4. Disabilita maintenance mode

---

**Documento Versione:** 1.0  
**Control Tower:** v2.5.0  
**Status:** Production Ready ✅
