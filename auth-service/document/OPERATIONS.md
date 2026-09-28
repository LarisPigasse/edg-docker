# Operazioni e Manutenzione - EDG Auth Service

Guida completa per testing, seed database, troubleshooting e deployment.

---

## Indice

1. [Testing](#testing)
2. [Seed Database](#seed-database)
3. [Troubleshooting](#troubleshooting)
4. [Deployment](#deployment)
5. [Monitoring e Logs](#monitoring-e-logs)
6. [Backup e Restore](#backup-e-restore)

---

## Testing

### Prerequisiti

Prima di iniziare i test:

```bash
# Database sincronizzato
npm run db:sync

# Ruoli creati
npm run seed:roles

# Server in esecuzione
npm run dev
```

### Test 1: Verifica Database

**Query SQL:**

```sql
-- Mostra tutti i ruoli
SELECT id, name, description FROM roles ORDER BY name;

-- Mostra permessi per ruolo
SELECT 
  r.name as ruolo,
  GROUP_CONCAT(rp.permission ORDER BY rp.permission SEPARATOR ', ') as permessi
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.roleId
GROUP BY r.id, r.name
ORDER BY r.name;
```

**✅ Checkpoint:** 4 ruoli con permessi corretti

### Test 2: Registrazione Account

Registra 4 account (uno per ruolo):

```bash
# ROOT (roleId: 1)
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "root@edg.com",
    "password": "Root123!@#",
    "accountType": "operatore",
    "entityId": "123e4567-e89b-12d3-a456-426614174000",
    "roleId": 1
  }'

# ADMIN (roleId: 2)
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@edg.com",
    "password": "Admin123!@#",
    "accountType": "operatore",
    "entityId": "123e4567-e89b-12d3-a456-426614174001",
    "roleId": 2
  }'

# OPERATORE (roleId: 3)
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "operatore@edg.com",
    "password": "Oper123!@#",
    "accountType": "operatore",
    "entityId": "123e4567-e89b-12d3-a456-426614174002",
    "roleId": 3
  }'

# GUEST (roleId: 4)
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "guest@edg.com",
    "password": "Guest123!@#",
    "accountType": "operatore",
    "entityId": "123e4567-e89b-12d3-a456-426614174003",
    "roleId": 4
  }'
```

**Response attesa:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "uuid": "...",
    "email": "root@edg.com",
    "roleId": 1,
    "isActive": true
  },
  "message": "Account creato con successo"
}
```

**✅ Checkpoint:** 4 account creati

### Test 3: Login e Verifica JWT

```bash
# Login ROOT
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "root@edg.com",
    "password": "Root123!@#",
    "accountType": "operatore"
  }'
```

**Decodifica JWT su jwt.io:**

```json
{
  "accountId": 1,
  "email": "root@edg.com",
  "accountType": "operatore",
  "roleId": 1,
  "permissions": ["*"],  // ← IMPORTANTE!
  "iat": 1234567890,
  "exp": 1234568790
}
```

**Tabella Permessi Attesi:**

| Ruolo | Permissions nel JWT |
|-------|---------------------|
| root | `["*"]` |
| admin | `["spedizioni.*", "gestione.*", "report.*"]` |
| operatore | `["spedizioni.*", "report.read", "report.create", "report.export"]` |
| guest | `["spedizioni.read", "report.read"]` |

**✅ Checkpoint:** JWT contiene `permissions` corretti

### Test 4: Endpoint Protetti

```bash
# GET /auth/me
curl -X GET http://localhost:3001/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response attesa:**

```json
{
  "success": true,
  "data": {
    "accountId": 1,
    "email": "root@edg.com",
    "roleId": 1,
    "permissions": ["*"]
  }
}
```

### Test 5: Cambio Password

```bash
curl -X POST http://localhost:3001/auth/change-password \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "Oper123!@#",
    "newPassword": "NewOper123!@#"
  }'
```

**✅ Checkpoint:** Password cambiata, nuovo login funziona

### Test 6: Logout e Refresh

```bash
# Logout
curl -X POST http://localhost:3001/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'

# Verifica revoca (deve fallire)
curl -X POST http://localhost:3001/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

### Test 7: Reset Password

```bash
# Step 1: Richiedi reset
curl -X POST http://localhost:3001/auth/request-reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "guest@edg.com",
    "accountType": "operatore"
  }'

# Step 2: Trova token nel DB
mysql -u edg_auth_admin -p edg_auth -e \
  "SELECT token FROM reset_tokens WHERE used=false ORDER BY createdAt DESC LIMIT 1"

# Step 3: Usa token
curl -X POST http://localhost:3001/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "TOKEN_FROM_DB",
    "newPassword": "GuestNew123!@#"
  }'
```

### Test 8: Verifica RBAC (CRITICO!)

**Crea endpoint di test:**

```typescript
// In auth.routes.ts (SOLO PER TEST - rimuovi dopo)
router.get('/test/admin-only', 
  authenticate, 
  requirePermission('gestione', 'read'),
  (req, res) => res.json({ success: true, message: 'Admin OK!' })
);

router.get('/test/read-only', 
  authenticate, 
  requirePermission('spedizioni', 'read'),
  (req, res) => res.json({ success: true, message: 'Read OK!' })
);
```

**Test con ROOT (deve passare tutto):**

```bash
ROOT_TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"root@edg.com","password":"Root123!@#","accountType":"operatore"}' \
  | jq -r '.data.accessToken')

curl -X GET http://localhost:3001/auth/test/admin-only \
  -H "Authorization: Bearer $ROOT_TOKEN"
# ✅ Deve funzionare (ha '*')
```

**Test con GUEST (deve fallire admin):**

```bash
GUEST_TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"guest@edg.com","password":"GuestNew123!@#","accountType":"operatore"}' \
  | jq -r '.data.accessToken')

curl -X GET http://localhost:3001/auth/test/admin-only \
  -H "Authorization: Bearer $GUEST_TOKEN"
# ❌ Deve fallire con 403

curl -X GET http://localhost:3001/auth/test/read-only \
  -H "Authorization: Bearer $GUEST_TOKEN"
# ✅ Deve funzionare (ha 'spedizioni.read')
```

**Response attesa per 403:**

```json
{
  "success": false,
  "error": "Permessi insufficienti",
  "required": {
    "module": "gestione",
    "action": "read",
    "permission": "gestione.read"
  }
}
```

**✅ Checkpoint:** Sistema RBAC funziona correttamente!

### Test 9: Health Check

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
      "connection": "OK",
      "modelsRegistered": 5
    }
  }
}
```

### Checklist Completa

#### Database
- [ ] 4 ruoli creati
- [ ] Permessi assegnati
- [ ] 5 tabelle create

#### Autenticazione
- [ ] Registrazione funziona
- [ ] Login funziona per tutti i ruoli
- [ ] JWT contiene `permissions`
- [ ] Refresh token funziona

#### Autorizzazione RBAC
- [ ] `requirePermission` blocca accessi non autorizzati
- [ ] ROOT può accedere a tutto
- [ ] GUEST bloccato su endpoint admin
- [ ] Permessi verificati correttamente

### Script Automatico

Salva come `test-auth.sh`:

```bash
#!/bin/bash
BASE_URL="http://localhost:3001"

echo "=== Testing EDG Auth Service ==="

# Test 1: Health
echo -e "\n1. Health Check"
curl -s $BASE_URL/health | jq '.status'

# Test 2: Register
echo -e "\n2. Register ROOT"
curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"root@edg.com","password":"Root123!@#","accountType":"operatore","entityId":"123e4567-e89b-12d3-a456-426614174000","roleId":1}' \
  | jq '.success'

# Test 3: Login
echo -e "\n3. Login ROOT"
ROOT_TOKEN=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"root@edg.com","password":"Root123!@#","accountType":"operatore"}' \
  | jq -r '.data.accessToken')
echo "Token: ${ROOT_TOKEN:0:20}..."

# Test 4: Get me
echo -e "\n4. Get /me"
curl -s -X GET $BASE_URL/auth/me \
  -H "Authorization: Bearer $ROOT_TOKEN" \
  | jq '.data.permissions'

echo -e "\n=== Tests completed! ==="
```

Esegui:

```bash
chmod +x test-auth.sh
./test-auth.sh
```

---

## Seed Database

### Cosa fa lo script seed

Lo script `roles.seed.ts` popola il database con i 4 ruoli base:

| Ruolo | Permessi | Descrizione |
|-------|----------|-------------|
| **root** | `*` | Super admin |
| **admin** | `spedizioni.*`, `gestione.*`, `report.*` | Admin completo |
| **operatore** | `spedizioni.*`, `report.read/create/export` | Operativo |
| **guest** | `spedizioni.read`, `report.read` | Solo lettura |

### Come Eseguire

```bash
# Prima volta (database vuoto)
npm run db:sync
npm run seed:roles

# Re-seed (aggiorna permessi)
npm run seed:roles  # Idempotente - può essere eseguito più volte
```

**Output atteso:**

```
🚀 Avvio script seed ruoli...
📊 Connessione al database...
✅ Database sincronizzato

╔═══════════════════════════════════════════════════════════╗
║         SEED RUOLI BASE - EDG Auth Service                ║
╚═══════════════════════════════════════════════════════════╝

📝 Processando ruolo: root
   ✅ Ruolo "root" configurato con 1 permessi

📝 Processando ruolo: admin
   ✅ Ruolo "admin" configurato con 3 permessi

[...operatore e guest...]

╔═══════════════════════════════════════════════════════════╗
║              SEED COMPLETATO CON SUCCESSO                 ║
╚═══════════════════════════════════════════════════════════╝

✅ Totale ruoli: 4
```

### Verifica Seed

```bash
# Query SQL
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

### Personalizzare Permessi

Edita `src/modules/auth/seed/roles.seed.ts`:

```typescript
const DEFAULT_ROLES: RoleDefinition[] = [
  {
    name: 'operatore',
    description: 'Operatore standard',
    isSystem: true,
    permissions: [
      'spedizioni.*',
      'report.read',
      'report.create',
      'report.export',
      'gestione.read',  // ✅ AGGIUNGI questo
    ],
  },
  // ...altri ruoli
];
```

Poi ri-esegui: `npm run seed:roles`

### Aggiungere Ruoli Custom

```typescript
{
  name: 'supervisore',
  description: 'Supervisore operativo',
  isSystem: false,  // false = custom (non di sistema)
  permissions: [
    'spedizioni.*',
    'report.*',
    'gestione.read'  // Solo visualizzazione gestione
  ]
}
```

### Trovare roleId

```sql
SELECT id, name FROM roles ORDER BY name;
```

Usa l'`id` nella registrazione:

```bash
curl -X POST http://localhost:3001/auth/register \
  -d '{"roleId": 3, ...}'  # 3 = operatore
```

---

## Troubleshooting

### Server non si avvia

**Errore:** `ECONNREFUSED` o `Cannot connect to database`

**Causa:** MySQL non in esecuzione o credenziali errate

**Soluzione:**

```bash
# Verifica MySQL
systemctl status mysql

# Test connessione
mysql -u edg_auth_admin -p edg_auth -e "SELECT 1"

# Verifica .env
cat .env | grep DB_
```

### Endpoint 404

**Errore:** `Endpoint POST /auth/register non trovato`

**Causa:** Ordine errato middleware (error handlers prima delle route)

**Soluzione:**

Verifica nei log:
```
✅ Route moduli registrate      ← PRIMA
✅ Error handlers registrati    ← DOPO
```

Se l'ordine è sbagliato, controlla `src/app.ts`:

```typescript
// ✅ CORRETTO
server.registerModuleRoutes();   // PRIMA: route
server.setupErrorHandlers();     // DOPO: error handlers
```

### UUID non valido

**Errore:** `EntityId non valido`

**Causa:** UUID non è v4 (terzo gruppo deve iniziare con '4')

**Soluzione:**

```bash
# Genera UUID v4 valido
node -e "console.log(require('crypto').randomUUID())"

# Esempio valido:
# 550e8400-e29b-41d4-a716-446655440000
#          ^^^^
#          Deve essere 4xxx
```

### Role non trovato

**Errore:** `Ruolo non trovato o non valido`

**Soluzione:**

```bash
# Re-seed
npm run seed:roles

# Verifica
mysql -u edg_auth_admin -p edg_auth -e "SELECT id, name FROM roles"
```

### JWT non contiene permissions

**Causa:** `AuthService` non carica i permessi dal ruolo

**Soluzione:**

1. Verifica che `AuthService` riceva `RolePermission` model nel constructor
2. Controlla che `loadAccountPermissions()` sia chiamato in login
3. Debug: aggiungi `console.log(permissions)` in `AuthService.login()`

### 403 anche con permessi corretti

**Causa:** `permissionMiddleware` non trova `req.account.permissions`

**Soluzione:**

1. Verifica che `authMiddleware` carichi `req.account` dal JWT
2. Debug: `console.log(req.account)` in `requirePermission`
3. Verifica JWT su jwt.io

### Tutti i test falliscono con 500

**Causa:** Modelli non sincronizzati o errore database

**Soluzione:**

```bash
# Drop e ricrea database
mysql -u root -p -e "DROP DATABASE IF EXISTS edg_auth; CREATE DATABASE edg_auth"

# Resync
npm run db:sync

# Re-seed
npm run seed:roles

# Riprova
./test-auth.sh
```

### Port 3001 already in use

**Soluzione:**

```bash
# Trova processo
lsof -i :3001

# Uccidi processo
kill -9 <PID>

# O cambia porta in .env
PORT=3002
```

---

## Deployment

### Production Checklist

#### Security

- [ ] ⚠️ **Cambia JWT_SECRET** - Genera con 32+ caratteri casuali
- [ ] ⚠️ **Usa HTTPS** - Mai HTTP in production
- [ ] ⚠️ **Configura CORS_ORIGINS** - Solo domini autorizzati
- [ ] ⚠️ **Rate Limiting** - Adatta ai tuoi volumi
- [ ] ⚠️ **Helmet security headers** - Verifica configurazione

#### Database

- [ ] ⚠️ **Backup automatizzato** - Giornaliero minimo
- [ ] ⚠️ **Credenziali sicure** - Password complesse
- [ ] ⚠️ **Connection pool** - Configurato per il carico
- [ ] ⚠️ **Indexes** - Ottimizzati per query frequenti

#### Environment

- [ ] ⚠️ **NODE_ENV=production**
- [ ] ⚠️ **Log su file** - Non solo console
- [ ] ⚠️ **Monitoring** - Uptime, errors, performance
- [ ] ⚠️ **Error reporting** - Sentry, Rollbar, etc.

### Build & Start

```bash
# Build TypeScript
npm run build

# Start production
NODE_ENV=production npm start

# Con PM2 (recommended)
pm2 start dist/app.js --name auth-service
pm2 startup
pm2 save
```

### Docker (quando disponibile)

```bash
docker-compose up -d
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name auth.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Monitoring e Logs

### Log Levels

```env
# Development
LOG_LEVEL=debug

# Production
LOG_LEVEL=info
```

### Monitoring Endpoints

```bash
# Health check
curl http://localhost:3001/health

# Metrics (quando implementato)
curl http://localhost:3001/metrics
```

### Cosa monitorare

- **Uptime** - Server availability
- **Response time** - P50, P95, P99
- **Error rate** - 4xx, 5xx
- **Database** - Connection pool, query time
- **JWT** - Token generation/validation time
- **Rate limiting** - Blocked requests

---

## Backup e Restore

### Backup Database

```bash
# Backup completo
mysqldump -u edg_auth_admin -p edg_auth > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup automatico (cron)
0 2 * * * mysqldump -u edg_auth_admin -p[PASSWORD] edg_auth > /backups/edg_auth_$(date +\%Y\%m\%d).sql
```

### Restore Database

```bash
# Restore da backup
mysql -u edg_auth_admin -p edg_auth < backup_20250113_020000.sql
```

### Backup Strategy

- **Giornaliero:** Backup completo
- **Retention:** 30 giorni minimo
- **Storage:** Offsite (S3, Google Cloud Storage)
- **Test restore:** Mensile

---

**Ultimo aggiornamento:** 21 Gennaio 2026  
**Versione:** 1.0.0
