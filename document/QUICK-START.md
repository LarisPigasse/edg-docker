# Quick Start - EDG Auth Service

Guida rapida per avviare il sistema di autenticazione in meno di 5 minuti.

---

## Prerequisiti

- ✅ Node.js 18+ installato
- ✅ MySQL 8+ installato e in esecuzione
- ✅ npm 9+ installato

---

## Setup in 5 Minuti ⚡

### 1. Clona e Installa (1 min)

```bash
cd auth-service
npm install
```

### 2. Configura Database (1 min)

**Crea il database:**
```bash
mysql -u root -p
```

```sql
CREATE DATABASE edg_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'edg_auth_admin'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON edg_auth.* TO 'edg_auth_admin'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Configura Environment (30 sec)

Copia `.env.example` in `.env`:
```bash
cp .env.example .env
```

Modifica `.env`:
```env
# Database
DB_NAME=edg_auth
DB_USER=edg_auth_admin
DB_PASSWORD=your_secure_password
DB_HOST=localhost
DB_PORT=3306

# JWT (CAMBIA IN PRODUCTION!)
JWT_SECRET=your-super-secret-key-minimum-32-characters-long
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Service
SERVICE_NAME=EDG Auth Service
PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Security
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_ATTEMPTS=100
```

### 4. Sync Database (30 sec)

```bash
npm run db:sync
```

**Output atteso:**
```
✅ Connessione database edg_auth stabilita
📄 Modello registrato: Role
📄 Modello registrato: RolePermission
📄 Modello registrato: Account
📄 Modello registrato: Session
📄 Modello registrato: ResetToken
🔗 Associazioni database configurate
🔄 Sincronizzazione database...
✅ Database sincronizzato
```

### 5. Seed Ruoli (30 sec)

```bash
npm run seed:roles
```

**Output atteso:**
```
✅ Ruolo "root" configurato con 1 permessi
✅ Ruolo "admin" configurato con 3 permessi
✅ Ruolo "operatore" configurato con 4 permessi
✅ Ruolo "guest" configurato con 2 permessi
✅ Totale ruoli: 4
```

### 6. Avvia Server (10 sec)

```bash
npm run dev
```

**Output atteso:**
```
✅ EDG Auth Service avviato con successo!
🌐 Server: http://localhost:3001
📊 Database: edg_auth@localhost:3306
📦 Moduli: auth
🚀 Pronto per ricevere richieste!
```

---

## Test Rapido ⚡

### 1. Health Check

```bash
curl http://localhost:3001/health
```

✅ **Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "service": "EDG Auth Service",
    "uptime": 1.234
  }
}
```

### 2. Registra Account

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@edg.com",
    "password": "Admin123!@#",
    "accountType": "operatore",
    "entityId": "550e8400-e29b-41d4-a716-446655440000",
    "roleId": 1
  }'
```

✅ **Response:**
```json
{
  "success": true,
  "data": {
    "uuid": "...",
    "email": "admin@edg.com",
    "roleId": 1,
    "isActive": true
  },
  "message": "Account creato con successo"
}
```

### 3. Login

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@edg.com",
    "password": "Admin123!@#",
    "accountType": "operatore"
  }'
```

✅ **Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "...",
    "account": {
      "id": 1,
      "email": "admin@edg.com",
      "roleId": 1
    }
  }
}
```

**Salva l'accessToken** per i prossimi test!

### 4. Test Endpoint Protetto

```bash
# Sostituisci YOUR_TOKEN con l'accessToken dal login
curl -X GET http://localhost:3001/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

✅ **Response:**
```json
{
  "success": true,
  "data": {
    "accountId": 1,
    "email": "admin@edg.com",
    "roleId": 1,
    "permissions": ["*"]
  }
}
```

---

## Comandi Utili 🛠️

### Development

```bash
npm run dev              # Avvia con hot reload
npm run db:sync          # Sync database (crea tabelle)
DB_SYNC=true npm run dev # Avvia con sync automatico
```

### Build & Production

```bash
npm run build            # Compila TypeScript
npm start                # Avvia production
```

### Testing

```bash
npm test                 # Run tests
npm run test:coverage    # Coverage report
```

### Database

```bash
npm run seed:roles       # Seed ruoli predefiniti
npm run seed:all         # Seed completo
```

### Code Quality

```bash
npm run lint             # Linting
npm run lint:fix         # Auto-fix
```

---

## Verifica Setup ✅

Controlla che tutto funzioni:

- [ ] ✅ `curl http://localhost:3001/health` → 200 OK
- [ ] ✅ `curl http://localhost:3001/` → Info servizio
- [ ] ✅ Registrazione account → 201 Created
- [ ] ✅ Login → 200 OK con tokens
- [ ] ✅ GET /me con token → 200 OK
- [ ] ✅ GET /me senza token → 401 Unauthorized

---

## Troubleshooting 🔧

### Server non si avvia

**Errore:** `ECONNREFUSED` o `Cannot connect to database`

**Soluzione:**
```bash
# Verifica che MySQL sia in esecuzione
mysql -u root -p -e "SELECT 1"

# Verifica credenziali in .env
cat .env | grep DB_
```

### Endpoint 404

**Errore:** `Endpoint POST /auth/register non trovato`

**Soluzione:**
- Riavvia il server
- Verifica nei log: `✅ Route moduli registrate`
- Se il problema persiste, controlla `server.ts` e `app.ts`

### UUID non valido

**Errore:** `EntityId non valido`

**Soluzione:**
Usa UUID v4 valido. Genera con:
```bash
node -e "console.log(require('crypto').randomUUID())"
```

Il terzo gruppo deve iniziare con `4`:
```
550e8400-e29b-41d4-a716-446655440000
             ^^
             Deve essere 4x
```

### Role non trovato

**Errore:** `Ruolo non trovato o non valido`

**Soluzione:**
```bash
npm run seed:roles
```

Verifica:
```sql
SELECT id, name FROM roles;
```

---

## Ruoli Predefiniti 👥

Dopo il seed, hai questi ruoli disponibili:

| ID  | Nome      | Permessi                                        | Uso                      |
| --- | --------- | ----------------------------------------------- | ------------------------ |
| 1   | root      | `*`                                             | Super admin              |
| 2   | admin     | `spedizioni.*`, `gestione.*`, `report.*`        | Admin completo           |
| 3   | operatore | `spedizioni.*`, `report.read/create/export`     | Operatore standard       |
| 4   | guest     | `spedizioni.read`, `report.read`                | Solo lettura             |

**Per registrare un account, usa `roleId` da questa tabella.**

---

## Endpoint Disponibili 📡

### Pubblici (no auth)

- `POST /auth/register` - Registrazione
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh token
- `POST /auth/request-reset-password` - Richiesta reset
- `POST /auth/reset-password` - Conferma reset

### Protetti (require auth)

- `GET /auth/me` - Info account
- `POST /auth/change-password` - Cambio password
- `POST /auth/logout` - Logout
- `POST /auth/logout-all` - Logout da tutti i dispositivi

### System

- `GET /` - Info servizio
- `GET /health` - Health check

---

## Prossimi Passi 🚀

1. **Leggi la documentazione completa:**
   - `PROJECT-STATUS.md` - Stato completo progetto
   - `RBAC-SYSTEM.md` - Sistema autorizzazione
   - `TESTING-GUIDE.md` - Test dettagliati

2. **Testa tutti gli endpoint:**
   ```bash
   # Segui TESTING-GUIDE.md per test completi
   ```

3. **Crea account con diversi ruoli:**
   ```bash
   # root (roleId: 1)
   # admin (roleId: 2)
   # operatore (roleId: 3)
   # guest (roleId: 4)
   ```

4. **Implementa features RBAC avanzate:**
   - PermissionService
   - Permission middleware
   - Endpoint admin

---

## Risorse 📚

- **Documentazione:** `docs/`
- **RBAC System:** `RBAC-SYSTEM.md`
- **Testing:** `TESTING-GUIDE.md`
- **Seed Guide:** `SEED-GUIDE.md`
- **Changelog:** `CHANGELOG.md`

---

## Supporto 💬

Per problemi o domande:
1. Controlla `CHANGELOG.md` (problemi risolti)
2. Leggi `PROJECT-STATUS.md` (troubleshooting)
3. Verifica i log del server
4. Contatta il team EDG

---

**Buon lavoro! 🎉**

Il sistema è pronto per l'uso. Per test completi, segui la `TESTING-GUIDE.md`.
