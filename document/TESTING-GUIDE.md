# Guida Testing - EDG Auth Service

**Scopo:** Verificare che il sistema di autenticazione e autorizzazione RBAC funzioni correttamente

---

## Prerequisiti

- ✅ Database sincronizzato (`npm run db:sync`)
- ✅ Ruoli creati (`npm run seed:roles`)
- ✅ Server in esecuzione (`npm run dev`)

---

## Test 1: Verifica Database e Ruoli

### Query SQL per verificare ruoli

```sql
-- 1. Mostra tutti i ruoli
SELECT id, name, description FROM roles ORDER BY name;

-- Output atteso:
-- +----+-----------+---------------------------------------------------+
-- | id | name      | description                                       |
-- +----+-----------+---------------------------------------------------+
-- |  2 | admin     | Amministratore sistema...                         |
-- |  4 | guest     | Ospite - accesso in sola lettura                  |
-- |  3 | operatore | Operatore standard...                             |
-- |  1 | root      | Accesso completo al sistema - super amministratore|
-- +----+-----------+---------------------------------------------------+

-- 2. Mostra permessi per ruolo
SELECT
  r.name as ruolo,
  GROUP_CONCAT(rp.permission ORDER BY rp.permission SEPARATOR ', ') as permessi
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.roleId
GROUP BY r.id, r.name
ORDER BY r.name;

-- Output atteso:
-- +-----------+-------------------------------------------------------+
-- | ruolo     | permessi                                              |
-- +-----------+-------------------------------------------------------+
-- | admin     | gestione.*, report.*, spedizioni.*                    |
-- | guest     | report.read, spedizioni.read                          |
-- | operatore | report.create, report.export, report.read, spediz...  |
-- | root      | *                                                     |
-- +-----------+-------------------------------------------------------+
```

**✅ Checkpoint:** 4 ruoli con i permessi corretti

---

## Test 2: Registrazione Account

### Registra 4 account (uno per ruolo)

```bash
# 1. ROOT (roleId: 1)
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "root@edg.com",
    "password": "Root123!@#",
    "accountType": "operatore",
    "entityId": "123e4567-e89b-12d3-a456-426614174000",
    "roleId": 1
  }'

# 2. ADMIN (roleId: 2)
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@edg.com",
    "password": "Admin123!@#",
    "accountType": "operatore",
    "entityId": "123e4567-e89b-12d3-a456-426614174001",
    "roleId": 2
  }'

# 3. OPERATORE (roleId: 3)
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "operatore@edg.com",
    "password": "Oper123!@#",
    "accountType": "operatore",
    "entityId": "123e4567-e89b-12d3-a456-426614174002",
    "roleId": 3
  }'

# 4. GUEST (roleId: 4)
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

**Response attesa (per ogni richiesta):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "uuid": "...",
    "email": "root@edg.com",
    "accountType": "operatore",
    "entityId": "...",
    "roleId": 1,
    "isActive": true,
    "isVerified": false
  },
  "message": "Account creato con successo"
}
```

**✅ Checkpoint:** 4 account creati

---

## Test 3: Login e Verifica JWT

### Login con ogni ruolo

```bash
# ROOT
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "root@edg.com",
    "password": "Root123!@#",
    "accountType": "operatore"
  }'
```

**Response attesa:**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "f8a7b2c3d4e5...",
    "account": {
      "id": 1,
      "email": "root@edg.com",
      "accountType": "operatore",
      "roleId": 1
    }
  },
  "message": "Login effettuato con successo"
}
```

### Decodifica JWT (jwt.io)

1. Copia il `accessToken` dalla response
2. Vai su **https://jwt.io**
3. Incolla il token nel campo "Encoded"
4. Verifica il **Payload**:

```json
{
  "accountId": 1,
  "email": "root@edg.com",
  "accountType": "operatore",
  "roleId": 1,
  "permissions": ["*"], // ⬅️ IMPORTANTE: Verifica che ci siano i permissions!
  "iat": 1234567890,
  "exp": 1234568790,
  "iss": "edg-auth-service"
}
```

**✅ Checkpoint:** JWT contiene il campo `permissions` con i permessi corretti

### Tabella Permessi Attesi

| Ruolo     | Permissions nel JWT                                                 |
| --------- | ------------------------------------------------------------------- |
| root      | `["*"]`                                                             |
| admin     | `["spedizioni.*", "gestione.*", "report.*"]`                        |
| operatore | `["spedizioni.*", "report.read", "report.create", "report.export"]` |
| guest     | `["spedizioni.read", "report.read"]`                                |

**Ripeti il login per ogni ruolo e verifica che i permissions siano corretti!**

---

## Test 4: Endpoint Protetti

### Test 4.1: GET /auth/me

Verifica che l'endpoint `/me` ritorni i dati dell'account con permissions

```bash
# Usa il token di ROOT
curl -X GET http://localhost:3001/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

**Response attesa:**

```json
{
  "success": true,
  "data": {
    "accountId": 1,
    "email": "root@edg.com",
    "accountType": "operatore",
    "roleId": 1,
    "permissions": ["*"],
    "iat": 1234567890,
    "exp": 1234568790
  }
}
```

**✅ Checkpoint:** Endpoint `/me` ritorna account con permissions

---

## Test 5: Cambio Password

```bash
# Usa il token di OPERATORE
curl -X POST http://localhost:3001/auth/change-password \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "Oper123!@#",
    "newPassword": "NewOper123!@#"
  }'
```

**Response attesa:**

```json
{
  "success": true,
  "message": "Password modificata con successo"
}
```

**Testa il nuovo login:**

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "operatore@edg.com",
    "password": "NewOper123!@#",
    "accountType": "operatore"
  }'
```

**✅ Checkpoint:** Cambio password funziona

---

## Test 6: Logout

```bash
# Logout singola sessione
curl -X POST http://localhost:3001/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

**Response attesa:**

```json
{
  "success": true,
  "message": "Logout effettuato con successo"
}
```

**Verifica che il refresh token sia revocato:**

```bash
curl -X POST http://localhost:3001/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

**Response attesa:**

```json
{
  "success": false,
  "error": "Sessione revocata"
}
```

**✅ Checkpoint:** Logout revoca correttamente la sessione

---

## Test 7: Refresh Token

```bash
# Fai login per ottenere un nuovo token
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@edg.com",
    "password": "Admin123!@#",
    "accountType": "operatore"
  }'

# Salva il refreshToken dalla response

# Usa il refresh token per ottenere un nuovo access token
curl -X POST http://localhost:3001/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

**Response attesa:**

```json
{
  "success": true,
  "data": {
    "accessToken": "NEW_ACCESS_TOKEN...",
    "refreshToken": "SAME_REFRESH_TOKEN...",
    "account": {
      "id": 2,
      "email": "admin@edg.com",
      "accountType": "operatore",
      "roleId": 2
    }
  },
  "message": "Token aggiornato con successo"
}
```

**Decodifica il nuovo access token su jwt.io e verifica che contenga:**

- `permissions`: `["spedizioni.*", "gestione.*", "report.*"]`
- `sessionId`: ID della sessione

**✅ Checkpoint:** Refresh token genera nuovo access token con permissions corretti

---

## Test 8: Reset Password

### Step 1: Richiedi reset

```bash
curl -X POST http://localhost:3001/auth/request-reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "guest@edg.com",
    "accountType": "operatore"
  }'
```

**Response attesa:**

```json
{
  "success": true,
  "message": "Se l'account esiste, riceverai un'email con il link di reset"
}
```

### Step 2: Trova token nel database

```sql
SELECT token, accountId, expiresAt, used
FROM reset_tokens
WHERE used = false
ORDER BY createdAt DESC
LIMIT 1;
```

Copia il `token` dalla query.

### Step 3: Usa il token per reset

```bash
curl -X POST http://localhost:3001/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "TOKEN_FROM_DATABASE",
    "newPassword": "GuestNew123!@#"
  }'
```

**Response attesa:**

```json
{
  "success": true,
  "message": "Password reimpostata con successo"
}
```

### Step 4: Verifica nuovo login

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "guest@edg.com",
    "password": "GuestNew123!@#",
    "accountType": "operatore"
  }'
```

**✅ Checkpoint:** Reset password funziona

---

## Test 9: Verifica Permissions (CRITICO!)

Questo test verifica che il sistema RBAC funzioni correttamente.

### Scenario: Endpoint protetto con `requirePermission`

**Crea un endpoint di test in `auth.routes.ts`:**

```typescript
// SOLO PER TEST - rimuovi dopo
router.get('/test/admin-only', authenticate, requirePermission('gestione', 'read'), (req, res) => {
  res.json({ success: true, message: 'Accesso admin consentito!' });
});

router.get('/test/read-only', authenticate, requirePermission('spedizioni', 'read'), (req, res) => {
  res.json({ success: true, message: 'Puoi leggere spedizioni!' });
});
```

### Test con ROOT (deve passare tutto)

```bash
# Login ROOT
ROOT_TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"root@edg.com","password":"Root123!@#","accountType":"operatore"}' \
  | jq -r '.data.accessToken')

# Test endpoint admin
curl -X GET http://localhost:3001/auth/test/admin-only \
  -H "Authorization: Bearer $ROOT_TOKEN"
# ✅ Deve funzionare (ha '*')

# Test endpoint read
curl -X GET http://localhost:3001/auth/test/read-only \
  -H "Authorization: Bearer $ROOT_TOKEN"
# ✅ Deve funzionare (ha '*')
```

### Test con ADMIN (deve passare admin, fallire altri)

```bash
# Login ADMIN
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@edg.com","password":"Admin123!@#","accountType":"operatore"}' \
  | jq -r '.data.accessToken')

# Test endpoint admin
curl -X GET http://localhost:3001/auth/test/admin-only \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# ✅ Deve funzionare (ha 'gestione.*')

# Test endpoint read
curl -X GET http://localhost:3001/auth/test/read-only \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# ✅ Deve funzionare (ha 'spedizioni.*')
```

### Test con GUEST (deve fallire admin, passare read)

```bash
# Login GUEST
GUEST_TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"guest@edg.com","password":"GuestNew123!@#","accountType":"operatore"}' \
  | jq -r '.data.accessToken')

# Test endpoint admin
curl -X GET http://localhost:3001/auth/test/admin-only \
  -H "Authorization: Bearer $GUEST_TOKEN"
# ❌ Deve fallire con 403 (non ha 'gestione.read')

# Test endpoint read
curl -X GET http://localhost:3001/auth/test/read-only \
  -H "Authorization: Bearer $GUEST_TOKEN"
# ✅ Deve funzionare (ha 'spedizioni.read')
```

**Response attesa per accesso negato:**

```json
{
  "success": false,
  "error": "Permessi insufficienti",
  "required": {
    "module": "gestione",
    "action": "read",
    "permission": "gestione.read"
  },
  "message": "Questo endpoint richiede il permesso: gestione.read"
}
```

**✅ Checkpoint:** Sistema RBAC funziona correttamente!

---

## Test 10: Health Check

```bash
curl -X GET http://localhost:3001/health
```

**Response attesa:**

```json
{
  "status": "healthy",
  "service": "EDG Auth Service",
  "timestamp": "2025-10-13T12:00:00.000Z",
  "uptime": 123.456,
  "database": {
    "status": "healthy",
    "details": {
      "connection": "OK",
      "database": "edg_auth",
      "host": "localhost",
      "modelsRegistered": 5,
      "modelNames": ["Role", "RolePermission", "Account", "Session", "ResetToken"]
    }
  }
}
```

**✅ Checkpoint:** Health check funziona

---

## Checklist Completa

### Database

- [ ] 4 ruoli creati (root, admin, operatore, guest)
- [ ] Permessi assegnati correttamente
- [ ] Tabelle: roles, role_permissions, accounts, sessions, reset_tokens

### Registrazione

- [ ] Account ROOT creato
- [ ] Account ADMIN creato
- [ ] Account OPERATORE creato
- [ ] Account GUEST creato

### Login & JWT

- [ ] Login funziona per tutti i ruoli
- [ ] JWT contiene campo `permissions`
- [ ] Permissions corretti per ogni ruolo
- [ ] Access token ha expiry corretto (15min)
- [ ] Refresh token funziona

### Endpoint Protetti

- [ ] `/me` ritorna account con permissions
- [ ] `/change-password` funziona
- [ ] `/logout` revoca sessione
- [ ] `/logout-all` revoca tutte le sessioni

### RBAC

- [ ] `requirePermission` blocca accessi non autorizzati
- [ ] ROOT può accedere a tutto
- [ ] GUEST bloccato su endpoint admin
- [ ] Permessi verificati correttamente

### Reset Password

- [ ] Request reset genera token
- [ ] Confirm reset cambia password
- [ ] Token usato viene marcato come used

---

## Script Automatico (Bash)

Salva come `test-auth.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3001"

echo "🧪 Testing EDG Auth Service"
echo "============================"

# Test 1: Health Check
echo -e "\n1️⃣ Health Check"
curl -s $BASE_URL/health | jq '.status'

# Test 2: Register ROOT
echo -e "\n2️⃣ Register ROOT"
curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"root@edg.com","password":"Root123!@#","accountType":"operatore","entityId":"123e4567-e89b-12d3-a456-426614174000","roleId":1}' \
  | jq '.success'

# Test 3: Login ROOT
echo -e "\n3️⃣ Login ROOT"
ROOT_TOKEN=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"root@edg.com","password":"Root123!@#","accountType":"operatore"}' \
  | jq -r '.data.accessToken')

echo "Token obtained: ${ROOT_TOKEN:0:20}..."

# Test 4: Get /me
echo -e "\n4️⃣ Get /me"
curl -s -X GET $BASE_URL/auth/me \
  -H "Authorization: Bearer $ROOT_TOKEN" \
  | jq '.data.permissions'

echo -e "\n✅ Tests completed!"
```

**Esegui:**

```bash
chmod +x test-auth.sh
./test-auth.sh
```

---

## Troubleshooting

### Problema: JWT non contiene `permissions`

**Causa:** AuthService non carica i permessi dal ruolo

**Soluzione:**

1. Verifica che `AuthService` riceva `rolePermissionModel` nel constructor
2. Controlla che `loadAccountPermissions()` sia chiamato in `login()` e `refreshToken()`
3. Debug: aggiungi `console.log(permissions)` in `AuthService.login()`

### Problema: 403 anche con permessi corretti

**Causa:** `permissionMiddleware` non trova `req.account.permissions`

**Soluzione:**

1. Verifica che `authMiddleware` carichi `req.account` dal JWT payload
2. Debug: aggiungi `console.log(req.account)` in `requirePermission`
3. Verifica che il JWT contenga effettivamente il campo `permissions`

### Problema: Tutti i test falliscono con 500

**Causa:** Modelli non sincronizzati o errore database

**Soluzione:**

```bash
# Drop e ricrea database
mysql -u root -p -e "DROP DATABASE IF EXISTS edg_auth; CREATE DATABASE edg_auth;"

# Resync
npm run db:sync

# Re-seed
npm run seed:roles

# Riprova i test
```

**Happy Testing! 🎉**
