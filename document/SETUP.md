# Setup e Configurazione - EDG Auth Service

Guida completa per installare e configurare il sistema di autenticazione.

---

## Indice

1. [Prerequisiti](#prerequisiti)
2. [Installazione](#installazione)
3. [Configurazione Database](#configurazione-database)
4. [Environment Variables](#environment-variables)
5. [Database Sync](#database-sync)
6. [Seed Dati Iniziali](#seed-dati-iniziali)
7. [Avvio Server](#avvio-server)
8. [Verifica Installazione](#verifica-installazione)
9. [Comandi Disponibili](#comandi-disponibili)

---

## Prerequisiti

### Software Richiesto

- **Node.js** 18.0.0 o superiore
- **npm** 9.0.0 o superiore
- **MySQL** 8.0 o superiore
- **Git** (per clonare il repository)

### Verifica Prerequisiti

```bash
# Verifica versioni installate
node --version    # Deve essere >= 18.0.0
npm --version     # Deve essere >= 9.0.0
mysql --version   # Deve essere >= 8.0
```

### Conoscenze Consigliate

- Familiarità con Node.js e npm
- Conoscenze base di MySQL
- Comprensione di REST API
- Esperienza con TypeScript (opzionale)

---

## Installazione

### 1. Clone Repository

```bash
cd /percorso/tuo/progetto
cd auth-service
```

### 2. Installa Dipendenze

```bash
npm install
```

**Output atteso:**
```
added 250 packages in 15s
```

### 3. Verifica Installazione

```bash
npm list --depth=0
```

Dovresti vedere le dipendenze principali:
- express@^5.x
- sequelize@^6.x
- mysql2@^3.x
- jsonwebtoken@^9.x
- bcrypt@^5.x
- helmet@^7.x

---

## Configurazione Database

### 1. Avvia MySQL

```bash
# Su Linux/Mac
sudo systemctl start mysql

# Su Windows
net start MySQL80

# Verifica che sia in esecuzione
systemctl status mysql
```

### 2. Crea Database

```bash
mysql -u root -p
```

```sql
-- Crea database
CREATE DATABASE edg_auth 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

-- Crea utente dedicato (RECOMMENDED)
CREATE USER 'edg_auth_admin'@'localhost' 
  IDENTIFIED BY 'your_secure_password_here';

-- Assegna privilegi
GRANT ALL PRIVILEGES ON edg_auth.* 
  TO 'edg_auth_admin'@'localhost';

FLUSH PRIVILEGES;

-- Verifica
SHOW DATABASES LIKE 'edg_auth';
SELECT User, Host FROM mysql.user WHERE User = 'edg_auth_admin';

EXIT;
```

### 3. Testa Connessione

```bash
mysql -u edg_auth_admin -p edg_auth -e "SELECT 1 AS test"
```

**Output atteso:**
```
+------+
| test |
+------+
|    1 |
+------+
```

---

## Environment Variables

### 1. Crea File .env

```bash
cp .env.example .env
```

### 2. Configura Variabili

Apri `.env` e configura:

```env
#######################
# DATABASE CONFIG
#######################
DB_NAME=edg_auth
DB_USER=edg_auth_admin
DB_PASSWORD=your_secure_password_here
DB_HOST=localhost
DB_PORT=3306

#######################
# JWT CONFIG
#######################
# ⚠️ IMPORTANTE: Cambia in production!
# Genera con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-super-secret-key-minimum-32-characters-long-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

#######################
# SERVICE CONFIG
#######################
SERVICE_NAME=EDG Auth Service
PORT=3001
NODE_ENV=development

#######################
# CORS CONFIG
#######################
# Aggiungi i tuoi domini (separati da virgola)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:8080

#######################
# SECURITY CONFIG
#######################
# Rate limiting: 100 richieste ogni 15 minuti per IP
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_ATTEMPTS=100

#######################
# LOGGING (opzionale)
#######################
LOG_LEVEL=info
```

### 3. Genera JWT Secret Sicuro

```bash
# Genera una chiave sicura
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Esempio output:
# a3f8b2c9d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1
```

Copia l'output e sostituisci il valore di `JWT_SECRET` nel `.env`.

### 4. Verifica Configurazione

```bash
# Mostra le variabili (senza password)
cat .env | grep -v PASSWORD
```

---

## Database Sync

Il database sync crea tutte le tabelle necessarie.

### 1. Esegui Sync

```bash
npm run db:sync
```

**Output atteso:**
```
🔧 [DB] Connessione a edg_auth@localhost:3306...
✅ Connessione database edg_auth stabilita

📄 Modello registrato: Role
📄 Modello registrato: RolePermission
📄 Modello registrato: Account
📄 Modello registrato: Session
📄 Modello registrato: ResetToken

🔗 Associazioni database configurate

🔄 Sincronizzazione database...
   Tabella: roles
   Tabella: role_permissions
   Tabella: accounts
   Tabella: sessions
   Tabella: reset_tokens

✅ Database sincronizzato con successo
```

### 2. Verifica Tabelle Create

```bash
mysql -u edg_auth_admin -p edg_auth -e "SHOW TABLES"
```

**Output atteso:**
```
+--------------------+
| Tables_in_edg_auth |
+--------------------+
| accounts           |
| reset_tokens       |
| role_permissions   |
| roles              |
| sessions           |
+--------------------+
```

### 3. Verifica Schema

```bash
mysql -u edg_auth_admin -p edg_auth -e "DESCRIBE roles"
```

**Output atteso:**
```
+-------------+-------------+------+-----+---------+----------------+
| Field       | Type        | Null | Key | Default | Extra          |
+-------------+-------------+------+-----+---------+----------------+
| id          | int         | NO   | PRI | NULL    | auto_increment |
| uuid        | char(36)    | NO   | UNI | NULL    |                |
| name        | varchar(50) | NO   | UNI | NULL    |                |
| description | text        | YES  |     | NULL    |                |
| isSystem    | tinyint(1)  | NO   |     | 0       |                |
| createdAt   | datetime    | NO   |     | NULL    |                |
| updatedAt   | datetime    | NO   |     | NULL    |                |
+-------------+-------------+------+-----+---------+----------------+
```

---

## Seed Dati Iniziali

### 1. Seed Ruoli Predefiniti

```bash
npm run seed:roles
```

**Output atteso:**
```
🚀 Avvio script seed ruoli...
📊 Connessione al database...
🔄 Sincronizzazione database...
✅ Database sincronizzato

╔═══════════════════════════════════════════════════════════╗
║         SEED RUOLI BASE - EDG Auth Service                ║
╚═══════════════════════════════════════════════════════════╝

📝 Processando ruolo: root
   ✅ Creazione ruolo "root"...
   🔑 Configurazione permessi per "root"...
      → *
   ✅ Ruolo "root" configurato con 1 permessi

📝 Processando ruolo: admin
   ✅ Creazione ruolo "admin"...
   🔑 Configurazione permessi per "admin"...
      → spedizioni.*
      → gestione.*
      → report.*
   ✅ Ruolo "admin" configurato con 3 permessi

[...output per operatore e guest...]

✅ Totale ruoli: 4
✅ Connessione database chiusa
```

### 2. Verifica Ruoli

```bash
mysql -u edg_auth_admin -p edg_auth -e "
  SELECT r.id, r.name, GROUP_CONCAT(rp.permission) as permissions
  FROM roles r
  LEFT JOIN role_permissions rp ON r.id = rp.roleId
  GROUP BY r.id, r.name
  ORDER BY r.name
"
```

**Output atteso:**
```
+----+-----------+-----------------------------------------------+
| id | name      | permissions                                   |
+----+-----------+-----------------------------------------------+
|  2 | admin     | gestione.*,report.*,spedizioni.*              |
|  4 | guest     | report.read,spedizioni.read                   |
|  3 | operatore | report.create,report.export,report.read,sp... |
|  1 | root      | *                                             |
+----+-----------+-----------------------------------------------+
```

---

## Avvio Server

### 1. Development Mode

```bash
npm run dev
```

**Output atteso:**
```
╔═══════════════════════════════════════════════════════════╗
║         EDG AUTH SERVICE - SERVER AVVIATO                 ║
╚═══════════════════════════════════════════════════════════╝

🌐 Server: http://localhost:3001
📊 Database: edg_auth@localhost:3306
📦 Moduli: auth
⚙️  Environment: development

🚀 Pronto per ricevere richieste!
```

### 2. Production Mode

```bash
# Build
npm run build

# Start
npm start
```

### 3. Con Auto-Sync (Development)

```bash
DB_SYNC=true npm run dev
```

---

## Verifica Installazione

### 1. Health Check

```bash
curl http://localhost:3001/health
```

**Response attesa:**
```json
{
  "status": "healthy",
  "service": "EDG Auth Service",
  "database": {
    "status": "healthy",
    "details": {
      "connection": "OK"
    }
  }
}
```

### 2. Test Registrazione

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@edg.com",
    "password": "Test123!@#",
    "accountType": "operatore",
    "entityId": "550e8400-e29b-41d4-a716-446655440000",
    "roleId": 3
  }'
```

### Checklist Verifica

- [ ] ✅ Health check ritorna 200 OK
- [ ] ✅ Registrazione account funziona
- [ ] ✅ Login ritorna access e refresh token
- [ ] ✅ Database contiene 4 ruoli

---

## Comandi Disponibili

### Development

```bash
npm run dev              # Avvia server con hot reload
npm run db:sync          # Sincronizza database
DB_SYNC=true npm run dev # Avvia con sync automatico
```

### Build & Production

```bash
npm run build            # Compila TypeScript
npm start                # Avvia server production
npm run clean            # Pulisce directory dist/
```

### Database

```bash
npm run seed:roles       # Seed ruoli predefiniti
npm run seed:all         # Seed completo
```

### Testing

```bash
npm test                 # Esegue test suite
npm run test:coverage    # Test con coverage
```

### Code Quality

```bash
npm run lint             # Esegue ESLint
npm run lint:fix         # Auto-fix
```

---

## Troubleshooting Setup

### "Cannot connect to database"

**Soluzione:**
```bash
# Verifica MySQL
systemctl status mysql
mysql -u edg_auth_admin -p edg_auth -e "SELECT 1"
```

### "Port 3001 already in use"

**Soluzione:**
```bash
# Trova processo
lsof -i :3001
kill -9 <PID>
```

### "JWT_SECRET not set"

**Soluzione:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Aggiungi a .env
```

---

## Prossimi Passi

1. **Leggi l'architettura:** [ARCHITECTURE.md](ARCHITECTURE.md)
2. **Comprendi RBAC:** [RBAC.md](RBAC.md)
3. **Testa il sistema:** [OPERATIONS.md](OPERATIONS.md)

---

**Setup completato! 🎉**
