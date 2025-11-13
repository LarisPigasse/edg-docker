# 🔧 Troubleshooting Guide - EDG Platform

> **Soluzioni ai problemi più comuni**

---

## 📋 Indice Rapido

- [Problemi Avvio](#problemi-avvio)
- [Problemi Porte](#problemi-porte)
- [Problemi Container](#problemi-container)
- [Problemi Database](#problemi-database)
- [Problemi Gateway](#problemi-gateway)
- [Problemi Frontend](#problemi-frontend)
- [Problemi Traefik](#problemi-traefik)
- [Problemi Performance](#problemi-performance)
- [Comandi Debug](#comandi-debug)

---

## 🚀 Problemi Avvio

### ❌ "Cannot start service: port is already allocated"

**Sintomo:**
```
Error starting userland proxy: listen tcp4 0.0.0.0:80: bind: address already in use
```

**Causa:** Porta 80 (o altra) già occupata da altro servizio.

**Soluzione:**

```bash
# 1. Verifica cosa occupa la porta
# Linux/Mac:
lsof -i :80

# Windows:
netstat -ano | findstr :80

# 2A. Se è un container Docker:
docker ps -a | grep :80
docker stop <container-name>

# 2B. Se è altro servizio (Apache, nginx, etc):
# Linux:
sudo systemctl stop apache2
sudo systemctl stop nginx

# Windows:
# Ferma il servizio da Services o Task Manager

# 3. Riprova avvio
docker-compose up -d
```

**Soluzione alternativa - Cambia porta:**

```yaml
# In docker-compose.yml, modifica:
traefik:
  ports:
    - "8080:80"  # Usa 8080 invece di 80
```

---

### ❌ "ERROR: Version in './docker-compose.yml' is unsupported"

**Sintomo:**
```
ERROR: Version in './docker-compose.yml' is unsupported
```

**Causa:** Docker Compose troppo vecchio.

**Soluzione:**

```bash
# Verifica versione
docker-compose --version

# Se < 2.0, aggiorna:
# Linux:
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Windows/Mac:
# Aggiorna Docker Desktop dalla dashboard
```

---

### ❌ "no configuration file provided: not found"

**Sintomo:**
```
Can't find a suitable configuration file in this directory or any parent
```

**Causa:** Non sei nella directory corretta o file mancante.

**Soluzione:**

```bash
# Verifica di essere nella directory giusta
ls -la docker-compose.yml

# Se non c'è, vai nella directory corretta
cd /path/to/edg-docker

# Oppure specifica il file
docker-compose -f /path/to/docker-compose.yml up -d
```

---

## 🔌 Problemi Porte

### ❌ Dashboard Traefik non risponde (porta 8888)

**Sintomo:** http://localhost:8888/dashboard/ non carica.

**Diagnosi:**

```bash
# 1. Verifica container Traefik attivo
docker ps | grep traefik

# 2. Verifica porta esposta
docker port traefik

# 3. Controlla logs
docker logs traefik | tail -50
```

**Soluzioni:**

```bash
# Soluzione A: Restart Traefik
docker-compose restart traefik

# Soluzione B: Verifica configurazione
docker-compose config | grep -A5 traefik

# Soluzione C: Rebuild
docker-compose build traefik
docker-compose up -d traefik
```

---

### ❌ Frontend non risponde (porte 5173-5175)

**Sintomo:** http://localhost:5173 non carica.

**Diagnosi:**

```bash
# Verifica container frontend
docker ps | grep frontend

# Verifica porte
docker port pro-frontend
docker port app-frontend
docker port edg-frontend
```

**Soluzioni:**

```bash
# Soluzione A: Restart frontend
docker-compose restart pro-frontend

# Soluzione B: Verifica build
docker logs pro-frontend | tail -50

# Soluzione C: Rebuild
docker-compose build pro-frontend
docker-compose up -d pro-frontend
```

---

## 📦 Problemi Container

### ❌ Container si riavvia continuamente (CrashLoopBackOff)

**Sintomo:**
```bash
$ docker ps
CONTAINER ID   STATUS
abc123         Restarting (1) 3 seconds ago
```

**Diagnosi:**

```bash
# Controlla logs per errori
docker logs <container-name> --tail=100

# Controlla exit code
docker inspect <container-name> | grep -A5 ExitCode
```

**Cause comuni:**

**1. Errore applicazione:**
```bash
# Logs mostrano:
Error: Cannot find module 'express'
TypeError: Cannot read property 'x' of undefined

# Soluzione:
docker-compose build --no-cache <service>
docker-compose up -d <service>
```

**2. Database non pronto:**
```bash
# Logs mostrano:
Error: connect ECONNREFUSED 172.18.0.2:3306

# Soluzione: Verifica dipendenze in docker-compose.yml
depends_on:
  mysql:
    condition: service_healthy
```

**3. Variabili ambiente mancanti:**
```bash
# Logs mostrano:
Error: JWT_SECRET is required

# Soluzione: Verifica .env
cat .env | grep JWT_SECRET
```

---

### ❌ Container bloccato in "Starting"

**Sintomo:**
```bash
$ docker ps
CONTAINER ID   STATUS
abc123         Up 2 minutes (health: starting)
```

**Diagnosi:**

```bash
# Controlla health check
docker inspect <container> | grep -A20 Health

# Controlla logs
docker logs <container> -f
```

**Soluzioni:**

```bash
# 1. Attendi più tempo (alcuni servizi impiegano 30-60s)
sleep 60
docker ps

# 2. Verifica endpoint health check
docker exec <container> wget -qO- http://localhost:<port>/health

# 3. Se fallisce dopo 5 minuti, restart
docker-compose restart <service>
```

---

### ❌ Container "Exited (0)" ma dovrebbe essere attivo

**Sintomo:**
```bash
$ docker ps -a
CONTAINER ID   STATUS
abc123         Exited (0) 2 minutes ago
```

**Causa:** Comando terminato normalmente (script finito).

**Diagnosi:**

```bash
# Verifica comando eseguito
docker inspect <container> | grep -A3 Cmd

# Verifica logs
docker logs <container>
```

**Soluzione:**

```bash
# Assicurati che docker-compose.yml abbia processo long-running
# Ad esempio:
command: ["node", "server.js"]  # ✅ Corretto (resta attivo)
# NON:
command: ["echo", "hello"]      # ❌ Sbagliato (termina subito)
```

---

## 💾 Problemi Database

### ❌ MySQL: "ERROR 2002: Can't connect to server"

**Sintomo:**
```bash
ERROR 2002 (HY000): Can't connect to MySQL server on 'mysql' (111)
```

**Diagnosi:**

```bash
# 1. Verifica container MySQL
docker ps | grep mysql

# 2. Verifica health
docker inspect auth-mysql | grep -A10 Health

# 3. Controlla logs
docker logs auth-mysql | tail -50
```

**Soluzioni:**

```bash
# Soluzione A: Attendi che diventi healthy
# MySQL impiega 30-60s all'avvio
sleep 60
docker inspect auth-mysql | grep Healthy

# Soluzione B: Restart MySQL
docker-compose restart mysql

# Soluzione C: Verifica password in .env
cat .env | grep MYSQL

# Soluzione D: Ricrea volumi (CANCELLA DATI!)
docker-compose down
docker volume rm edg-docker_mysql-data
docker-compose up -d
```

---

### ❌ MongoDB: "MongoServerError: Authentication failed"

**Sintomo:**
```bash
MongoServerError: Authentication failed
```

**Causa:** Username/password errati o database non inizializzato.

**Soluzione:**

```bash
# 1. Verifica credenziali in .env
cat .env | grep MONGO

# 2. Verifica container Mongo
docker logs log-mongo | grep -i auth

# 3. Se password cambiata, ricrea volume
docker-compose down
docker volume rm edg-docker_mongo-data
docker-compose up -d logger-mongo

# 4. Verifica connessione
docker exec log-mongo mongosh --username ${MONGO_LOG_USER} --password ${MONGO_LOG_PASSWORD}
```

---

### ❌ Database: "Table doesn't exist" o "Collection not found"

**Sintomo:**
```bash
Error: Table 'edg_auth.users' doesn't exist
```

**Causa:** Database non popolato o migrations non eseguite.

**Soluzione:**

```bash
# Per MySQL - Verifica tabelle
docker exec auth-mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "SHOW TABLES FROM edg_auth;"

# Se vuote, esegui migrations
docker exec auth-service npm run migrate

# Oppure ricrea database
docker-compose down
docker volume rm edg-docker_mysql-data
docker-compose up -d mysql
# Attendi 60s poi esegui migrations
docker exec auth-service npm run migrate
```

---

## 🌐 Problemi Gateway

### ❌ Gateway: "503 Service Unavailable"

**Sintomo:** http://localhost/ risponde con 503.

**Causa:** Gateway non healthy o backend non raggiungibili.

**Diagnosi:**

```bash
# 1. Verifica gateway
docker ps | grep api-gateway
docker logs api-gateway-1 | tail -50

# 2. Verifica Traefik vede i gateway
curl http://localhost:8888/api/http/services

# 3. Test diretto gateway (bypass Traefik)
docker exec api-gateway-1 wget -qO- http://localhost:8080/health
```

**Soluzioni:**

```bash
# Soluzione A: Restart gateway
docker-compose restart api-gateway-1 api-gateway-2

# Soluzione B: Verifica servizi backend
docker-compose ps | grep -E "auth-service|frontend"

# Soluzione C: Verifica network
docker network inspect edg-external
docker network inspect edg-internal

# Soluzione D: Rebuild gateway
docker-compose build api-gateway-1
docker-compose up -d api-gateway-1
```

---

### ❌ Gateway: "502 Bad Gateway"

**Sintomo:** http://localhost/ risponde con 502.

**Causa:** Gateway attivo ma backend service down o non risponde.

**Diagnosi:**

```bash
# Verifica auth-service
docker logs auth-service | tail -50

# Verifica connettività gateway → auth-service
docker exec api-gateway-1 ping auth-service
docker exec api-gateway-1 wget -qO- http://auth-service:3001/health
```

**Soluzioni:**

```bash
# Restart auth-service
docker-compose restart auth-service

# Verifica che sia healthy
docker inspect auth-service | grep Healthy

# Se non healthy, controlla .env
cat .env | grep -E "MYSQL|JWT"
```

---

### ❌ Gateway: Solo uno dei due funziona

**Sintomo:** Traefik dashboard mostra gateway-1 ✅ e gateway-2 ❌.

**Diagnosi:**

```bash
# Controlla stato gateway-2
docker ps | grep api-gateway-2
docker logs api-gateway-2 | tail -50

# Verifica health
docker exec api-gateway-2 wget -qO- http://localhost:8080/health
```

**Soluzioni:**

```bash
# Restart gateway-2
docker-compose restart api-gateway-2

# Se persiste, rebuild
docker-compose build api-gateway-2
docker-compose up -d api-gateway-2

# Verifica dopo 20s
sleep 20
curl http://localhost:8888/api/http/services
```

---

## 🎨 Problemi Frontend

### ❌ Frontend: Pagina bianca / blank page

**Sintomo:** Browser mostra pagina bianca senza errori.

**Diagnosi:**

```bash
# 1. Verifica container
docker ps | grep pro-frontend

# 2. Controlla logs
docker logs pro-frontend | tail -100

# 3. Apri browser console (F12)
# Cerca errori JavaScript
```

**Soluzioni:**

```bash
# Soluzione A: Verifica build
docker logs pro-frontend | grep -i error
docker logs pro-frontend | grep -i warning

# Soluzione B: Rebuild frontend
docker-compose build --no-cache pro-frontend
docker-compose up -d pro-frontend

# Soluzione C: Verifica variabili ambiente
docker exec pro-frontend env | grep VITE
```

---

### ❌ Frontend: "Failed to fetch" o CORS error

**Sintomo:**
```
Access to fetch at 'http://localhost/api/...' has been blocked by CORS policy
```

**Causa:** API Gateway non autorizza l'origin del frontend.

**Soluzione:**

```bash
# 1. Verifica CORS_ORIGINS in .env
cat .env | grep CORS_ORIGINS

# Deve includere:
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175

# 2. Riavvia gateway
docker-compose restart api-gateway-1 api-gateway-2

# 3. Verifica in browser console
# Dovrebbe mostrare header Access-Control-Allow-Origin
```

---

### ❌ Frontend: Hot reload non funziona

**Sintomo:** Modifichi codice ma browser non si aggiorna.

**Causa:** Volumi non montati correttamente o polling non configurato.

**Soluzione:**

```bash
# Verifica volumi montati
docker inspect pro-frontend | grep -A10 Mounts

# Deve mostrare:
# Source: /path/to/pro-frontend
# Destination: /app

# Se manca, aggiungi in docker-compose.yml:
volumes:
  - ./pro-frontend:/app
  - /app/node_modules

# Poi restart
docker-compose restart pro-frontend
```

---

## 🔀 Problemi Traefik

### ❌ Traefik: "404 page not found"

**Sintomo:** http://localhost/ → 404 Not Found.

**Causa:** Traefik non trova route per la richiesta.

**Diagnosi:**

```bash
# Verifica routers configurati
curl http://localhost:8888/api/http/routers

# Verifica labels sui gateway
docker inspect api-gateway-1 | grep traefik
```

**Soluzioni:**

```bash
# Soluzione A: Verifica labels in docker-compose.yml
# Devono essere presenti:
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.api-gateway.rule=PathPrefix(`/`)"
  - "traefik.http.routers.api-gateway.service=api-gateway"

# Soluzione B: Restart Traefik
docker-compose restart traefik

# Soluzione C: Rebuild gateway con labels corretti
docker-compose up -d --force-recreate api-gateway-1
```

---

### ❌ Traefik: Dashboard non mostra gateway

**Sintomo:** Dashboard Traefik vuota o non mostra api-gateway.

**Causa:** Labels mancanti o network sbagliato.

**Diagnosi:**

```bash
# Verifica che gateway siano nella rete corretta
docker inspect api-gateway-1 | grep -A20 Networks

# Deve includere: edg-external

# Verifica labels
docker inspect api-gateway-1 | grep -i traefik
```

**Soluzioni:**

```bash
# Recreate gateway forzando network
docker-compose up -d --force-recreate api-gateway-1

# Verifica in dashboard dopo 10s
sleep 10
# Apri http://localhost:8888/dashboard/
```

---

## ⚡ Problemi Performance

### ❌ Sistema lento / alta latenza

**Sintomo:** Richieste impiegano >2 secondi.

**Diagnosi:**

```bash
# Verifica risorse container
docker stats --no-stream

# Controlla CPU e RAM usage
# Se >80%, sistema sovraccarico
```

**Soluzioni:**

```bash
# Soluzione A: Limita risorse container
# In docker-compose.yml aggiungi:
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 512M

# Soluzione B: Aumenta risorse Docker
# Docker Desktop > Settings > Resources
# RAM: 4GB → 8GB
# CPU: 2 → 4

# Soluzione C: Ottimizza query database
# Aggiungi indici in auth-service migrations
```

---

### ❌ Disco pieno / No space left

**Sintomo:**
```
Error: no space left on device
```

**Diagnosi:**

```bash
# Verifica spazio Docker
docker system df

# Mostra dettagli
docker system df -v
```

**Soluzioni:**

```bash
# Soluzione A: Pulizia immagini unused
docker image prune -a -f

# Soluzione B: Pulizia container stopped
docker container prune -f

# Soluzione C: Pulizia build cache
docker builder prune -a -f

# Soluzione D: Pulizia COMPLETA (ATTENZIONE!)
docker system prune -a --volumes -f
# ⚠️ Cancella TUTTO inclusi volumi database!
```

---

### ❌ RAM esaurita / OOM Killed

**Sintomo:**
```
Container killed (OOMKilled)
```

**Diagnosi:**

```bash
# Verifica container killed
docker ps -a | grep Exited
docker inspect <container> | grep OOMKilled
```

**Soluzioni:**

```bash
# Soluzione A: Aumenta memoria Docker Desktop
# Settings > Resources > Memory: 4GB → 8GB

# Soluzione B: Limita memoria per servizio
# In docker-compose.yml:
deploy:
  resources:
    limits:
      memory: 512M
    reservations:
      memory: 256M

# Soluzione C: Ottimizza Node.js
environment:
  - NODE_OPTIONS=--max-old-space-size=512
```

---

## 🔍 Comandi Debug

### Verifica Completa Sistema

```bash
#!/bin/bash
echo "=== VERIFICA SISTEMA EDG ==="
echo ""

echo "1. Container Status:"
docker-compose ps
echo ""

echo "2. Health Checks:"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep healthy
echo ""

echo "3. Porte Esposte:"
docker ps --format "table {{.Names}}\t{{.Ports}}"
echo ""

echo "4. Spazio Disco:"
docker system df
echo ""

echo "5. Risorse Container:"
docker stats --no-stream --format "table {{.Name}}\t{{CPUPerc}}\t{{MemUsage}}"
echo ""

echo "6. Test Endpoint:"
curl -s http://localhost/health
echo ""

echo "7. Traefik Services:"
curl -s http://localhost:8888/api/http/services | grep -o '"name":"[^"]*"'
echo ""

echo "=== FINE VERIFICA ==="
```

### Test Connettività Interna

```bash
# Test gateway → auth-service
docker exec api-gateway-1 sh -c "wget -qO- http://auth-service:3001/health"

# Test gateway → frontend
docker exec api-gateway-1 sh -c "wget -qO- http://pro-frontend:5173"

# Test auth-service → mysql
docker exec auth-service sh -c "nc -zv mysql 3306"

# Test log-service → mongo
docker exec log-service sh -c "nc -zv logger-mongo 27017"
```

### Dump Configurazione

```bash
# Dump configurazione Docker Compose
docker-compose config > config-dump.yml

# Dump variabili ambiente container
docker exec api-gateway-1 env > gateway-env.txt

# Dump network info
docker network inspect edg-external > network-external.json
docker network inspect edg-internal > network-internal.json
```

---

## 🆘 Ultimo Resort

### Reset Completo Sistema

**⚠️ ATTENZIONE: Cancella tutti i dati!**

```bash
# 1. Stop tutto
docker-compose down

# 2. Rimuovi container
docker rm -f $(docker ps -aq)

# 3. Rimuovi volumi (DATI PERSI!)
docker volume rm $(docker volume ls -q | grep edg-docker)

# 4. Rimuovi network
docker network prune -f

# 5. Rimuovi immagini
docker rmi $(docker images -q edg-docker*)

# 6. Pulizia cache
docker builder prune -a -f
docker system prune -a -f

# 7. Restart da zero
docker-compose build --no-cache
docker-compose up -d

# 8. Attendi inizializzazione (2-3 minuti)
sleep 180

# 9. Verifica
docker-compose ps
curl http://localhost/health
```

---

## 📞 Quando Chiedere Aiuto

Se dopo aver provato queste soluzioni il problema persiste:

### Informazioni da Fornire

```bash
# 1. Versioni
docker --version
docker-compose --version
uname -a  # Linux/Mac
systeminfo  # Windows

# 2. Stato sistema
docker-compose ps
docker system df

# 3. Logs rilevanti
docker-compose logs --tail=200 > logs.txt

# 4. Configurazione
docker-compose config > config.yml

# 5. Variabili ambiente (rimuovi secrets!)
cat .env | grep -v PASSWORD | grep -v SECRET > env-safe.txt
```

### Checklist Pre-Supporto

- [ ] Ho provato a riavviare il servizio?
- [ ] Ho controllato i logs?
- [ ] Ho verificato .env corretto?
- [ ] Ho provato rebuild --no-cache?
- [ ] Ho consultato questa guida?
- [ ] Ho cercato l'errore online?

---

**Ricorda:** Il 90% dei problemi si risolve con:
1. Verifica logs
2. Verifica .env
3. Restart servizio
4. Rebuild con --no-cache

**Buona fortuna! 🍀**
