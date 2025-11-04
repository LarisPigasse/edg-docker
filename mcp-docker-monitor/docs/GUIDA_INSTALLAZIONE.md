# 🚀 Guida Rapida di Installazione - Docker Monitor v2.0

## 📦 File da Aggiornare

Hai ricevuto 3 file TypeScript aggiornati che implementano l'Approccio 2:

1. **docker_service.ts** → `src/services/docker_service.ts`
2. **index.ts** → `src/index.ts`
3. **diagnostics_tools.ts** → `src/tools/diagnostics_tools.ts`

---

## 🔧 Procedura di Installazione

### Passo 1: Backup dei File Esistenti

Prima di procedere, crea un backup della versione attuale:

```bash
# Dalla directory del progetto mcp-docker-monitor
mkdir -p backup/v1.0
cp src/services/docker_service.ts backup/v1.0/
cp src/index.ts backup/v1.0/
cp src/tools/diagnostics_tools.ts backup/v1.0/

echo "✅ Backup completato in backup/v1.0/"
```

---

### Passo 2: Sostituisci i File

Copia i nuovi file nelle rispettive posizioni:

```bash
# Copia docker_service.ts
cp docker_service.ts src/services/docker_service.ts

# Copia index.ts
cp index.ts src/index.ts

# Copia diagnostics_tools.ts
cp diagnostics_tools.ts src/tools/diagnostics_tools.ts

echo "✅ File aggiornati"
```

---

### Passo 3: Verifica le Dipendenze

Assicurati che tutte le dipendenze siano installate:

```bash
npm install
```

Le dipendenze richieste (già presenti nel tuo package.json):
- ✅ `dockerode` - per interagire con Docker
- ✅ `@modelcontextprotocol/sdk` - per MCP
- ✅ `node-cron` - per il monitoring
- ✅ `nodemailer` - per gli alert email
- ✅ `zod` - per la validazione

---

### Passo 4: Compila il Progetto

```bash
npm run build
```

Dovresti vedere:

```
✅ Compilazione completata senza errori
✅ File generati in build/
```

---

### Passo 5: Test delle Funzionalità

Puoi testare le nuove funzionalità in due modi:

#### A. Test Rapido (Script standalone)

```bash
# Esegui lo script di test fornito
node test_diagnostics.js
```

Questo script testa tutte le funzioni di rilevamento senza avviare il server MCP completo.

#### B. Test Completo (Server MCP)

```bash
# Avvia il server in modalità debug
npm run debug
```

Oppure:

```bash
# Avvia il server normalmente
npm start
```

---

### Passo 6: Verifica i Nuovi Tool

Una volta avviato il server, verifica che i nuovi tool siano disponibili:

```bash
# I nuovi tool dovrebbero essere:
- list-containers (esistente, invariato)
- diagnose-architecture (aggiornato ✨)
- health-report (nuovo ✨)
- detect-frontends (nuovo ✨)
- detect-microservices (nuovo ✨)
- detect-databases (nuovo ✨)
- inspect-container (esistente, invariato)
- restart-container (esistente, invariato)
- start-backup-gateway (esistente, invariato)
```

---

## 🧪 Test delle Nuove Funzionalità

### Test 1: Diagnostica Completa

Prova il tool aggiornato:

```javascript
// Dalla CLI MCP o da Claude
docker-monitor:diagnose-architecture
```

**Output atteso:**
```json
{
  "timestamp": "...",
  "summary": {
    "total_containers": 8,
    "running": 8,
    "stopped": 0,
    "healthy": 8,
    "unhealthy": 0
  },
  "api_gateway": { ... },
  "frontends": [
    { "name": "app-frontend", ... },
    { "name": "edg-frontend", ... },
    { "name": "pro-frontend", ... }
  ],
  "microservices": [ ... ],
  "databases": [ ... ]
}
```

### Test 2: Health Report

```javascript
docker-monitor:health-report
```

**Output atteso (tutto OK):**
```json
{
  "healthy": true,
  "issues": [],
  "summary": { ... }
}
```

### Test 3: Rilevamento Frontend

```javascript
docker-monitor:detect-frontends
```

**Output atteso:**
```json
[
  {
    "id": "01f8a0e73fa7",
    "name": "app-frontend",
    "state": "running",
    "healthy": true,
    ...
  },
  ...
]
```

---

## 🐛 Troubleshooting

### Problema: Errore di compilazione TypeScript

**Sintomo:**
```
error TS2307: Cannot find module './services/docker.service.js'
```

**Soluzione:**
```bash
# Assicurati che il file sia nella posizione corretta
ls -la src/services/docker_service.ts

# Ricompila da zero
rm -rf build/
npm run build
```

---

### Problema: Docker non risponde

**Sintomo:**
```
Error: connect ENOENT /var/run/docker.sock
```

**Soluzione:**
```bash
# Su Windows con Docker Desktop
# Assicurati che Docker Desktop sia avviato

# Su Linux
sudo systemctl start docker
sudo usermod -aG docker $USER
# Poi fai logout e login
```

---

### Problema: I nuovi tool non appaiono

**Sintomo:**
I nuovi tool (health-report, detect-*) non sono disponibili

**Soluzione:**
```bash
# 1. Verifica che la compilazione sia andata a buon fine
npm run build

# 2. Riavvia il server MCP
# Termina il processo attuale (Ctrl+C)
npm start

# 3. Verifica la versione
# Dovresti vedere: "Docker Monitor MCP Server v2.0 running on stdio"
```

---

## 📊 Confronto Prima/Dopo

### Prima (v1.0) - Diagnostica Hardcoded
```typescript
frontends: {
  pro: await checkContainerHealth('frontend-pro'),     // ❌ Non esiste
  app: await checkContainerHealth('frontend-app'),     // ❌ Non esiste  
  admin: await checkContainerHealth('frontend-admin'), // ❌ Non esiste
}
```

**Risultato:**
```json
{
  "frontends": {
    "pro": { "healthy": false, "status": "not_found" },
    "app": { "healthy": false, "status": "not_found" },
    "admin": { "healthy": false, "status": "not_found" }
  }
}
```

---

### Dopo (v2.0) - Rilevamento Automatico
```typescript
frontends: await detectFrontends()  // ✅ Rileva automaticamente
```

**Risultato:**
```json
{
  "frontends": [
    { "name": "app-frontend", "healthy": true, "state": "running" },
    { "name": "edg-frontend", "healthy": true, "state": "running" },
    { "name": "pro-frontend", "healthy": true, "state": "running" }
  ]
}
```

---

## ✅ Checklist Post-Installazione

- [ ] Backup dei file originali completato
- [ ] Nuovi file copiati nelle posizioni corrette
- [ ] Compilazione TypeScript completata senza errori
- [ ] Server MCP avviato con successo
- [ ] Test `diagnose-architecture` funzionante
- [ ] Test `health-report` funzionante
- [ ] Test `detect-frontends` funzionante
- [ ] Tutti i container rilevati correttamente
- [ ] Nessun "not_found" nella diagnostica

---

## 🎯 Prossimi Passi

Dopo aver verificato che tutto funzioni:

1. **Personalizza i criteri di health** (se necessario)
2. **Aggiungi categorie personalizzate** (es. cache, message queues)
3. **Configura gli alert email** per il monitoring automatico
4. **Integra con la tua dashboard** se ne hai una

---

## 📚 Documentazione Completa

Per maggiori dettagli, consulta:
- **MIGLIORAMENTI_v2.md** - Documentazione completa delle modifiche
- **EXAMPLE_OUTPUT.json** - Esempio di output della diagnostica
- **test_diagnostics.js** - Script di test delle funzionalità

---

## 🆘 Supporto

In caso di problemi:

1. Controlla i log del server:
   ```bash
   npm start 2>&1 | tee server.log
   ```

2. Verifica che Docker sia accessibile:
   ```bash
   docker ps
   ```

3. Testa la connessione a Docker da Node.js:
   ```bash
   node -e "const Docker = require('dockerode'); new Docker().ping().then(() => console.log('OK'))"
   ```

---

**Buona implementazione! 🚀**

_Se hai domande o problemi durante l'installazione, non esitare a chiedere._
