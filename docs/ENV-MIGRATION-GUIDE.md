# 🔄 MIGRAZIONE .env - GUIDA PASSO PASSO

## 📊 MODIFICHE NECESSARIE

### ✅ COSA MANTENERE (già corretto)

```env
# MySQL - OK, non toccare
MYSQL_ROOT_PASSWORD=root_password_change_in_prod
MYSQL_DATABASE=edg_auth
MYSQL_USER=edg_auth_admin
MYSQL_PASSWORD=Auth2025Db!

# JWT & Gateway - OK, non toccare
JWT_SECRET=EDGsSDeocMK4a6NEo0TxUTSolWTixI0GioO0PhWnvp4ag025
GATEWAY_SECRET=7d8b8851976626f5d3fd19ebf85a1432985e91ac0b0aa99852763b9e5324c727

# CORS - OK, non toccare
CORS_ORIGINS=https://app.edg.com,https://admin.edg.com,https://partner.edg.com
```

---

### ⚠️ COSA MODIFICARE

#### 1. MongoDB Variables (RINOMINA + CAMBIA VALORI)

**RIMUOVI queste righe:**
```env
MONGO_DATABASE=edg_logger
MONGO_ROOT_USER=edg_logger_admin
MONGO_ROOT_PASSWORD=Logger2025Db!
```

**AGGIUNGI al loro posto:**
```env
MONGO_LOG_USER=edg_logger
MONGO_LOG_PASSWORD=LoggerMongo2025!
MONGO_LOG_DATABASE=edg_logs
```

**Perché?**
- Nomi variabili consistenti con docker-compose
- `MONGO_LOG_*` più chiaro che è per log-service
- Database si chiama `edg_logs` non `edg_logger`

---

#### 2. Log Service API Key (AGGIUNGI)

**AGGIUNGI questa nuova sezione:**
```env
# -----------------------------------------------------------------------------
# LOG SERVICE API KEY
# -----------------------------------------------------------------------------
LOG_API_KEY_SECRET=edg_logger_api_key_2025_secure_random_string_change_in_production
```

**Perché?**
- Log-service richiede API key per autenticazione
- Usata da altri microservizi per inviare log

---

## 🚀 APPLICAZIONE MODIFICHE

### Opzione A: Modifica Manuale (Raccomandato)

```bash
cd edg-docker

# 1. Backup del vecchio .env
cp .env .env.backup.$(date +%Y%m%d)

# 2. Apri .env con editor
nano .env
# oppure
vim .env
# oppure
code .env
```

**Dentro l'editor:**

1. **Trova queste righe (circa riga 19-22):**
   ```env
   MONGO_DATABASE=edg_logger
   MONGO_ROOT_USER=edg_logger_admin
   MONGO_ROOT_PASSWORD=Logger2025Db!
   ```

2. **SOSTITUISCI con:**
   ```env
   MONGO_LOG_USER=edg_logger
   MONGO_LOG_PASSWORD=LoggerMongo2025!
   MONGO_LOG_DATABASE=edg_logs
   ```

3. **Aggiungi dopo GATEWAY_SECRET (circa riga 36):**
   ```env
   
   # -----------------------------------------------------------------------------
   # LOG SERVICE API KEY
   # -----------------------------------------------------------------------------
   LOG_API_KEY_SECRET=edg_logger_api_key_2025_secure_random_string_change_in_production
   ```

4. **Salva e chiudi** (Ctrl+X per nano, :wq per vim)

---

### Opzione B: Sostituisci Tutto (Veloce ma Attenzione!)

```bash
cd edg-docker

# 1. Backup
cp .env .env.backup.$(date +%Y%m%d)

# 2. Copia il nuovo .env
cp /path/to/env-updated.txt .env

# 3. ⚠️ IMPORTANTE: Verifica che i secrets siano giusti!
# Se avevi customizzato JWT_SECRET, GATEWAY_SECRET, password, etc.
# devi riportarli manualmente nel nuovo file
```

---

## ✅ VERIFICA MODIFICHE

### Check 1: Variabili Corrette

```bash
# Verifica che ci siano tutte le variabili necessarie
grep -E "MONGO_LOG_USER|MONGO_LOG_PASSWORD|MONGO_LOG_DATABASE|LOG_API_KEY_SECRET" .env

# Output atteso:
# MONGO_LOG_USER=edg_logger
# MONGO_LOG_PASSWORD=LoggerMongo2025!
# MONGO_LOG_DATABASE=edg_logs
# LOG_API_KEY_SECRET=edg_logger_api_key_2025_secure_random_string_change_in_production
```

### Check 2: Nessuna Variabile Vecchia

```bash
# Verifica che NON ci siano le vecchie variabili
grep -E "^MONGO_DATABASE=|^MONGO_ROOT_USER=|^MONGO_ROOT_PASSWORD=" .env

# Output atteso: NESSUN OUTPUT (vuoto)
```

### Check 3: Tutte le Variabili Essenziali

```bash
# Conta variabili
grep -c "^[A-Z]" .env

# Dovrebbe essere almeno 11:
# 1. MYSQL_ROOT_PASSWORD
# 2. MYSQL_DATABASE
# 3. MYSQL_USER
# 4. MYSQL_PASSWORD
# 5. MONGO_LOG_USER
# 6. MONGO_LOG_PASSWORD
# 7. MONGO_LOG_DATABASE
# 8. JWT_SECRET
# 9. GATEWAY_SECRET
# 10. LOG_API_KEY_SECRET
# 11. CORS_ORIGINS
```

---

## ⚠️ IMPATTO MODIFICHE

### Se MongoDB Era Già Avviato

**Scenario A: MongoDB NON aveva ancora dati importanti**
```bash
# Soluzione: Ricrea container MongoDB con nuove credenziali
docker-compose stop logger-mongo
docker-compose rm logger-mongo
docker volume rm edg-docker_mongo-log-data  # ⚠️ Cancella dati!
docker-compose up -d logger-mongo
```

**Scenario B: MongoDB aveva già dati da mantenere**
```bash
# Soluzione: Aggiorna credenziali manualmente
docker-compose exec logger-mongo mongosh admin -u edg_logger_admin -p Logger2025Db!

# Dentro mongosh:
use admin
db.createUser({
  user: "edg_logger",
  pwd: "LoggerMongo2025!",
  roles: [
    { role: "readWrite", db: "edg_logs" },
    { role: "dbAdmin", db: "edg_logs" }
  ]
})

# Rinomina database se necessario
use edg_logger
db.copyDatabase("edg_logger", "edg_logs")
```

---

## 🧪 TEST DOPO MODIFICHE

### Test 1: Docker Compose Load .env

```bash
# Verifica che docker-compose carichi le variabili
docker-compose config | grep -A 5 "MONGO_LOG"

# Dovrebbe mostrare:
# MONGO_LOG_USER: edg_logger
# MONGO_LOG_PASSWORD: LoggerMongo2025!
# MONGO_LOG_DATABASE: edg_logs
```

### Test 2: Riavvia Sistema

```bash
# Stop tutto
docker-compose down

# Avvia con nuove variabili
docker-compose up -d

# Attendi che tutti siano healthy
docker-compose ps

# Verifica log service
docker-compose logs log-service | head -20
```

### Test 3: Connessione MongoDB

```bash
# Test connessione con nuove credenziali
docker exec -it edg-logger-mongo mongosh \
  "mongodb://edg_logger:LoggerMongo2025!@localhost:27017/edg_logs?authSource=admin"

# Dentro mongosh:
show dbs
use edg_logs
show collections
exit
```

### Test 4: DBeaver

```
Connection String:
mongodb://edg_logger:LoggerMongo2025!@localhost:27017/edg_logs?authSource=admin

Host:               localhost
Port:               27017
Database:           edg_logs
Username:           edg_logger
Password:           LoggerMongo2025!
Authentication DB:  admin
```

---

## 📋 CHECKLIST COMPLETA

- [ ] ✅ Backup `.env` creato
- [ ] ✅ Variabili `MONGO_*` vecchie rimosse
- [ ] ✅ Variabili `MONGO_LOG_*` aggiunte
- [ ] ✅ `LOG_API_KEY_SECRET` aggiunto
- [ ] ✅ Verificato con `grep` (check 1, 2, 3)
- [ ] ✅ `docker-compose config` funziona
- [ ] ✅ Sistema riavviato: `docker-compose down && up -d`
- [ ] ✅ Tutti i servizi `healthy`: `docker-compose ps`
- [ ] ✅ MongoDB accessibile con nuove credenziali
- [ ] ✅ DBeaver connesso a MongoDB

---

## 💾 CONFRONTO VISIVO

### PRIMA (TUO ATTUALE):
```env
# MongoDB (righe 19-22)
MONGO_DATABASE=edg_logger
MONGO_ROOT_USER=edg_logger_admin
MONGO_ROOT_PASSWORD=Logger2025Db!

# (nessuna API key per log-service)
```

### DOPO (CORRETTO):
```env
# MongoDB (righe 19-22)
MONGO_LOG_USER=edg_logger
MONGO_LOG_PASSWORD=LoggerMongo2025!
MONGO_LOG_DATABASE=edg_logs

# Log Service API Key (nuova sezione)
LOG_API_KEY_SECRET=edg_logger_api_key_2025_secure_random_string_change_in_production
```

---

## 🎯 RIEPILOGO MODIFICHE

| Cosa | Azione | Criticità |
|------|--------|-----------|
| `MONGO_DATABASE` | RINOMINA → `MONGO_LOG_DATABASE` + cambia valore | 🔴 Alta |
| `MONGO_ROOT_USER` | RINOMINA → `MONGO_LOG_USER` | 🔴 Alta |
| `MONGO_ROOT_PASSWORD` | RINOMINA → `MONGO_LOG_PASSWORD` + cambia valore | 🔴 Alta |
| `LOG_API_KEY_SECRET` | AGGIUNGI (nuovo) | 🔴 Alta |
| Resto | MANTIENI invariato | ✅ OK |

---

**Applica queste modifiche e poi possiamo procedere con l'aggiornamento di docker-compose.yml!** 🚀
