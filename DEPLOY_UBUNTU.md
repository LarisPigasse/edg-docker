# 🚀 Deploy EDG Platform su Ubuntu/Plesk

## 📋 Prerequisiti Server

- Ubuntu 20.04+ o 22.04 LTS
- Docker 24.0+
- Docker Compose v2
- Plesk (opzionale)
- Dominio configurato (es: edg.tuodominio.com)

---

## 🔧 Installazione Docker (se non presente)

```bash
# Aggiorna sistema
sudo apt update && sudo apt upgrade -y

# Installa Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Aggiungi utente a gruppo docker
sudo usermod -aG docker $USER

# Installa Docker Compose v2
sudo apt install docker-compose-plugin -y

# Verifica installazione
docker --version
docker compose version
```

---

## 📁 Setup Progetto

### 1. Clona Repository

```bash
# Crea directory
sudo mkdir -p /var/www/edg-docker
sudo chown $USER:$USER /var/www/edg-docker
cd /var/www/edg-docker

# Clona progetto (o trasferisci file)
git clone <tuo-repository> .
# OPPURE usa rsync/scp per trasferire
```

### 2. Configura Environment

```bash
# Copia template produzione
cp .env.production .env

# Modifica configurazione
nano .env
```

**IMPORTANTE - Modifica questi valori in `.env`:**

```bash
# ✅ TRAEFIK - ABILITA DOCKER PROVIDER
TRAEFIK_USE_DOCKER=true          # ← CAMBIA DA false!
TRAEFIK_INSECURE=false           # ← CAMBIA DA true!

# ✅ DATABASE - Genera password sicure
MYSQL_ROOT_PASSWORD=<genera-password-sicura>
MYSQL_PASSWORD=<genera-password-sicura>
MONGO_LOG_PASSWORD=<genera-password-sicura>

# ✅ SECRETS - Genera chiavi
JWT_SECRET=<genera-con-comando-sotto>
GATEWAY_SECRET=<genera-con-comando-sotto>
LOG_API_KEY_SECRET=<genera-con-comando-sotto>

# ✅ CORS - Domini produzione
CORS_ORIGINS=https://app.tuodominio.com,https://admin.tuodominio.com

# ✅ EMAIL - Configura SMTP
EMAIL_HOST=smtp.tuodominio.com
EMAIL_USER=noreply@tuodominio.com
EMAIL_PASS=<password-email>
EMAIL_NOREPLY_FROM=noreply@tuodominio.com
EMAIL_ALERTS_TO=admin@tuodominio.com

# ✅ FRONTEND URL
FRONTEND_URL=https://app.tuodominio.com
```

### 3. Genera Secrets Sicuri

```bash
# JWT Secret (32 byte = 64 caratteri hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Gateway Secret (32 byte = 64 caratteri hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Log API Key (32 byte base64)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copia i valori generati nel file `.env`.

---

## 🚀 Avvio Applicazione

### Build e Start

```bash
cd /var/www/edg-docker

# Build immagini
docker compose build

# Avvia tutti i servizi
docker compose up -d

# Verifica status
docker compose ps
```

**Output atteso:**
```
NAME                IMAGE                   STATUS
traefik             traefik:v2.10           Up (healthy)
auth-mysql          mysql:8.0               Up (healthy)
log-mongo           mongo:7.0               Up (healthy)
auth-service        edg-auth-service        Up (healthy)
log-service         edg-log-service         Up (healthy)
email-service       edg-email-service       Up (healthy)
pro-frontend        edg-pro-frontend        Up (healthy)
app-frontend        edg-app-frontend        Up (healthy)
edg-frontend        edg-edg-frontend        Up (healthy)
api-gateway-1       edg-api-gateway         Up (healthy)
api-gateway-2       edg-api-gateway         Up (healthy)
```

### Verifica Logs

```bash
# Tutti i servizi
docker compose logs -f

# Singolo servizio
docker compose logs -f traefik
docker compose logs -f api-gateway-1
```

**✅ Su Linux, dovresti vedere in Traefik:**
```
level=info msg="Configuration loaded from provider docker"
level=info msg="Server configuration reloaded on changes"
```

**❌ NON dovresti vedere:**
```
"Provider connection error"
```

---

## 🌐 Configurazione DNS/Plesk

### Con Plesk

1. **Aggiungi Dominio** → `edg.tuodominio.com`
2. **Hosting & DNS** → **DNS Settings**
3. **Aggiungi Record A:**
   ```
   @ → IP_SERVER
   app → IP_SERVER
   admin → IP_SERVER
   partner → IP_SERVER
   ```

### Senza Plesk (DNS Provider)

Nel pannello del tuo provider DNS:
```
A    @         IP_SERVER
A    app       IP_SERVER  
A    admin     IP_SERVER
A    partner   IP_SERVER
```

---

## 🔒 HTTPS/SSL (Opzionale ma Consigliato)

### Con Plesk

1. **SSL/TLS Certificates** → **Let's Encrypt**
2. Seleziona domini e sottomini
3. **Install**

Plesk configurerà automaticamente reverse proxy con HTTPS.

### Senza Plesk (Certbot)

```bash
# Installa Certbot
sudo apt install certbot python3-certbot-nginx -y

# Genera certificato
sudo certbot --nginx -d edg.tuodominio.com -d app.tuodominio.com

# Rinnovo automatico
sudo certbot renew --dry-run
```

---

## 🧪 Test Funzionamento

### 1. Health Check Servizi

```bash
# Traefik Dashboard (solo se TRAEFIK_INSECURE=true)
curl http://localhost:8888/api/overview

# API Gateway Health
curl http://localhost/health
curl http://localhost:8080/health  # Gateway diretto

# Auth Service (interno)
docker exec api-gateway-1 wget -O- http://auth-service:3001/health
```

### 2. Test Login Frontend

Apri browser:
```
http://IP_SERVER:5173          # Pro Frontend (diretto)
http://IP_SERVER               # Via Traefik Load Balancer
https://app.tuodominio.com     # Con dominio (dopo DNS)
```

### 3. Verifica Load Balancing

```bash
# Fai 10 richieste - dovresti vedere entrambi i gateway
for i in {1..10}; do
  curl -s http://localhost/health | jq -r .instance
  sleep 0.5
done
```

Output:
```
gateway-1
gateway-2
gateway-1
gateway-2
...
```

---

## 🔍 Troubleshooting

### Container non parte

```bash
# Verifica logs
docker compose logs <container_name>

# Riavvia singolo container
docker compose restart <container_name>

# Riavvia tutto
docker compose restart
```

### Database non si connette

```bash
# Verifica MySQL
docker exec -it auth-mysql mysql -u root -p

# Verifica MongoDB
docker exec -it log-mongo mongosh
```

### Traefik non vede i container

```bash
# Verifica Provider Docker ATTIVO
docker compose logs traefik | grep "provider docker"

# Output atteso:
# "Starting provider *docker.Provider"
# "Configuration loaded from provider docker"

# Se vedi errori di connessione:
# Verifica che TRAEFIK_USE_DOCKER=true nel .env
```

### Porta 80 già occupata

```bash
# Trova processo su porta 80
sudo lsof -i :80

# Ferma Apache/Nginx se presente
sudo systemctl stop apache2
sudo systemctl stop nginx
```

---

## 📊 Monitoraggio

### Logs in Real-time

```bash
# Tutti i servizi
docker compose logs -f

# Filtra per severity
docker compose logs -f | grep ERROR
docker compose logs -f | grep WARNING
```

### Statistiche Risorse

```bash
# Stats tutti container
docker stats

# Stats singolo
docker stats api-gateway-1
```

### Dashboard Traefik

Se `TRAEFIK_INSECURE=true`:
```
http://IP_SERVER:8888/dashboard/
```

⚠️ **IN PRODUZIONE metti `TRAEFIK_INSECURE=false`** per sicurezza!

---

## 🔐 Sicurezza Produzione

### Checklist

- ✅ `TRAEFIK_INSECURE=false`
- ✅ Password sicure in `.env`
- ✅ `.env` NON committato in Git
- ✅ Firewall configurato (solo porte 80, 443, 22)
- ✅ SSL/HTTPS attivo
- ✅ Backup database giornaliero
- ✅ Log rotation configurato

### Firewall (UFW)

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

## 🔄 Aggiornamento Applicazione

```bash
cd /var/www/edg-docker

# Pull nuove modifiche
git pull origin main

# Rebuild e restart
docker compose build
docker compose up -d

# Verifica
docker compose ps
```

---

## 💾 Backup

### Database

```bash
# MySQL dump
docker exec auth-mysql mysqldump -u root -p<PASSWORD> edg_auth > backup_mysql.sql

# MongoDB dump
docker exec log-mongo mongodump --uri="mongodb://edg_logger:<PASSWORD>@localhost:27017/edg_logs"
```

### Volumi

```bash
# Backup volumi Docker
docker run --rm -v edg-docker_mysql-data:/data -v $(pwd):/backup \
  ubuntu tar czf /backup/mysql-data-backup.tar.gz /data
```

---

## ✅ Checklist Deploy Completo

- [ ] Docker installato
- [ ] Repository clonato
- [ ] `.env` configurato con `TRAEFIK_USE_DOCKER=true`
- [ ] Secrets generati e inseriti
- [ ] `docker compose up -d` eseguito
- [ ] Tutti container healthy
- [ ] Logs senza errori
- [ ] DNS configurato
- [ ] SSL attivato
- [ ] Test login frontend OK
- [ ] Load balancing funzionante
- [ ] Firewall configurato
- [ ] Backup configurato

---

## 📞 Supporto

In caso di problemi:

1. Verifica logs: `docker compose logs -f`
2. Controlla health: `docker compose ps`
3. Verifica `.env`: `TRAEFIK_USE_DOCKER=true`

---

## 🎉 Congratulazioni!

Se tutti i check sono ✅, la tua applicazione EDG è online e funzionante!

**Accesso:**
- Pro Frontend: `https://admin.tuodominio.com`
- App Frontend: `https://app.tuodominio.com`
- EDG Frontend: `https://partner.tuodominio.com`
