# ⚡ EDG PLATFORM - QUICK START

Guida rapida per iniziare con EDG Platform in 10 minuti.

---

## 🎯 COSA OTTERRAI

Alla fine di questa guida avrai:

- ✅ Sistema completo funzionante in locale
- ✅ Auth service attivo con JWT
- ✅ Log service attivo
- ✅ API Gateway configurato
- ✅ Database MySQL e MongoDB accessibili

---

## 📋 PREREQUISITI

```bash
# Verifica versioni
docker --version          # Docker 24+
docker-compose --version  # Docker Compose 2.20+
curl --version           # Per testing
```

**Opzionale:**
- DBeaver (per visualizzare database)
- Postman (per testing API)

---

## 🚀 SETUP COMPLETO (3 Step)

### Step 1: Clone e Configurazione (2 minuti)

```bash
# 1. Vai nella directory Docker
cd edg-docker

# 2. Crea file .env
cat > .env << 'EOF'
# MySQL
MYSQL_ROOT_PASSWORD=RootMySQL2025!
MYSQL_DATABASE=edg_auth
MYSQL_USER=edg_auth_admin
MYSQL_PASSWORD=Auth2025Db!

# MongoDB
MONGO_LOG_USER=edg_logger
MONGO_LOG_PASSWORD=LoggerMongo2025!
MONGO_LOG_DATABASE=edg_logs

# JWT & Gateway
JWT_SECRET=EDGsSDeocMK4a6NEo0TxUTSolWTixI0GioO0PhWnvp4ag025
GATEWAY_SECRET=7d8b8851976626f5d3fd19ebf85a1432985e91ac0b0aa99852763b9e5324c727
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Log Service
LOG_API_KEY_SECRET=edg_logger_api_key_2025_secure_random_string_change_in_production
EOF
```

### Step 2: Avvia Tutto (5 minuti)

```bash
# Build e avvio
docker-compose up -d --build

# Attendi che tutti i servizi siano healthy (circa 1-2 minuti)
watch docker-compose ps

# Output atteso:
# NAME                 STATUS                  PORTS
# edg-mysql            Up (healthy)           0.0.0.0:3306->3306/tcp
# edg-logger-mongo     Up (healthy)           0.0.0.0:27017->27017/tcp
# edg-auth-service     Up (healthy)
# edg-log-service      Up (healthy)
# edg-api-gateway      Up (healthy)           0.0.0.0:80->8080/tcp

# Quando tutti mostrano "Up (healthy)", sei pronto!
# Premi Ctrl+C per uscire da watch
```

### Step 3: Verifica (1 minuto)

```bash
# Test 1: Gateway health
curl http://localhost/health
# ✅ {"status":"healthy","service":"api-gateway",...}

# Test 2: Auth service health
curl http://localhost/auth/health
# ✅ {"success":true,"data":{"status":"healthy","service":"EDG Auth Service",...}}

# Test 3: Vedi log in tempo reale
docker-compose logs -f
# ✅ Dovresti vedere log di tutti i servizi
# Premi Ctrl+C per uscire
```

---

## ✅ SISTEMA FUNZIONANTE!

Se tutti i test sono passati, il sistema è pronto! 🎉

---

## 🧪 TEST COMPLETO (5 minuti)

### Test Auth Service

```bash
# 1. Registra un account
curl -X POST http://localhost/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@edg.com",
    "password": "Test123!@#",
    "accountType": "operatore",
    "roleId": 1
  }'

# ✅ Risposta attesa:
# {"success":true,"message":"Account creato con successo",...}

# 2. Login
curl -X POST http://localhost/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@edg.com",
    "password": "Test123!@#",
    "accountType": "operatore"
  }'

# ✅ Risposta attesa:
# {"success":true,"data":{"accessToken":"eyJ...","refreshToken":"..."}}

# 3. Salva il token
TOKEN="<copia accessToken dalla risposta>"

# 4. Test endpoint protetto
curl http://localhost/auth/me \
  -H "Authorization: Bearer $TOKEN"

# ✅ Risposta attesa:
# {"success":true,"data":{"uuid":"...","email":"test@edg.com",...}}
```

---

## 📊 ACCESSO DATABASE (DBeaver)

### MySQL (Auth Data)

```
Host:         localhost
Port:         3306
Database:     edg_auth
Username:     edg_auth_admin
Password:     Auth2025Db!
```

**Test Query:**
```sql
SELECT * FROM accounts;
SELECT * FROM roles;
```

### MongoDB (Log Data)

```
Connection String:
mongodb://edg_logger:LoggerMongo2025!@localhost:27017/edg_logs?authSource=admin
```

**Test Query:**
```javascript
db.azionelogs.find({}).limit(10)
```

---

## 🛑 STOP E CLEANUP

```bash
# Stop tutto
docker-compose down

# Stop e rimuovi volumi (⚠️ cancella dati!)
docker-compose down -v

# Riavvia
docker-compose up -d
```

---

## 📚 PROSSIMI PASSI

Ora che il sistema funziona:

1. **Leggi la documentazione completa:**
   - [EDG-PLATFORM-DOCUMENTATION.md](EDG-PLATFORM-DOCUMENTATION.md)

2. **Esplora le API:**
   - [EDG-API-REFERENCE.md](EDG-API-REFERENCE.md)

3. **Sviluppa il frontend:**
   ```javascript
   // Esempio chiamata API
   const response = await fetch('http://localhost/auth/login', {
     method: 'POST',
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({
       email: 'test@edg.com',
       password: 'Test123!@#',
       accountType: 'operatore'
     })
   });
   const data = await response.json();
   localStorage.setItem('accessToken', data.data.accessToken);
   ```

4. **Aggiungi nuovi microservizi:**
   - Segui la stessa struttura di auth-service e log-service
   - Aggiungi al docker-compose.yml
   - Configura routing nel gateway

---

## 🆘 PROBLEMI?

### Servizio non parte (not healthy)

```bash
# Vedi log specifico
docker-compose logs auth-service

# Ricrea container
docker-compose up -d --force-recreate auth-service
```

### Porta già in uso

```bash
# Trova processo che usa porta 80
sudo lsof -i :80

# Ferma il processo o cambia porta gateway in docker-compose.yml:
# ports:
#   - '8080:8080'  # Invece di '80:8080'
```

### Database connection refused

```bash
# Verifica che database sia up
docker-compose ps mysql

# Ricrea database
docker-compose stop mysql
docker-compose rm mysql
docker-compose up -d mysql

# Attendi health
docker-compose ps mysql
```

### 404 su tutti gli endpoint

```bash
# Verifica routing gateway
docker-compose logs api-gateway

# Ricrea gateway
docker-compose up -d --force-recreate api-gateway
```

---

## 💡 TIPS

### Development Workflow

```bash
# Vedi log live di un servizio
docker-compose logs -f auth-service

# Entra nel container
docker-compose exec auth-service sh

# Riavvia un servizio dopo modifiche
docker-compose restart auth-service

# Rebuild dopo cambio codice
docker-compose build auth-service
docker-compose up -d auth-service
```

### Performance

```bash
# Vedi risorse usate
docker stats

# Pulisci risorse non usate
docker system prune -a
```

### Backup Database

```bash
# MySQL
docker exec edg-mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} edg_auth > backup.sql

# MongoDB
docker exec edg-logger-mongo mongodump --uri="mongodb://edg_logger:LoggerMongo2025!@localhost:27017/edg_logs?authSource=admin" --out=/tmp/backup
docker cp edg-logger-mongo:/tmp/backup ./mongo_backup
```

---

## 📖 DOCUMENTAZIONE COMPLETA

- **[EDG-PLATFORM-DOCUMENTATION.md](EDG-PLATFORM-DOCUMENTATION.md)** - Documentazione completa
- **[EDG-API-REFERENCE.md](EDG-API-REFERENCE.md)** - Reference API
- **[EDG-CHANGELOG.md](EDG-CHANGELOG.md)** - Storia modifiche

---

## ✅ CHECKLIST SETUP COMPLETO

- [ ] Docker e Docker Compose installati
- [ ] File `.env` creato in `edg-docker/`
- [ ] `docker-compose up -d --build` eseguito
- [ ] Tutti i servizi mostrano "Up (healthy)"
- [ ] `curl http://localhost/health` funziona
- [ ] `curl http://localhost/auth/health` funziona
- [ ] Test register/login funziona
- [ ] DBeaver connesso a MySQL (opzionale)
- [ ] DBeaver connesso a MongoDB (opzionale)

**Setup completo!** 🎉

---

**Tempo totale:** ~10 minuti  
**Difficoltà:** Facile  
**Prerequisiti:** Docker, curl

---

**Ultima revisione:** 16 Ottobre 2025
