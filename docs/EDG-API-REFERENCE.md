# 📡 EDG PLATFORM - API REFERENCE

**Versione:** 2.0  
**Data:** 16 Ottobre 2025

---

## INDICE

1. [Auth Service API](#auth-service-api)
2. [Log Service API](#log-service-api)
3. [Esempi d'Uso](#esempi-duso)
4. [Error Handling](#error-handling)

---

## AUTH SERVICE API

**Base URL:** `http://localhost/auth` (via Gateway)

### Endpoints Pubblici (No Auth)

#### POST `/auth/register`

Registra un nuovo account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "accountType": "operatore",
  "roleId": 1
}
```

**accountType values:**
- `operatore` - Operatore EDG
- `partner` - Partner esterno
- `cliente` - Cliente finale
- `agente` - Agente vendita

**Response 201:**
```json
{
  "success": true,
  "message": "Account creato con successo",
  "data": {
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "accountType": "operatore",
    "roleId": 1
  }
}
```

**Errors:**
- 400: Email già registrata
- 400: Validazione fallita
- 500: Errore server

**Rate Limit:** 10 richieste/ora per IP

---

#### POST `/auth/login`

Effettua il login e ottiene i token JWT.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "accountType": "operatore"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "a1b2c3d4e5f6g7h8i9j0...",
    "account": {
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "accountType": "operatore",
      "role": {
        "id": 1,
        "name": "Operatore Base",
        "permissions": [
          {"resource": "users", "action": "read"},
          {"resource": "orders", "action": "create"}
        ]
      }
    }
  }
}
```

**JWT Payload (accessToken):**
```json
{
  "accountId": 123,
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "accountType": "operatore",
  "roleId": 1,
  "permissions": [
    {"resource": "users", "action": "read"},
    {"resource": "orders", "action": "create"}
  ],
  "iat": 1697453200,
  "exp": 1697454100
}
```

**Errors:**
- 401: Credenziali invalide
- 404: Account non trovato
- 500: Errore server

**Rate Limit:** 5 tentativi/15min per email

---

#### POST `/auth/refresh`

Rinnova l'access token usando il refresh token.

**Request Body:**
```json
{
  "refreshToken": "a1b2c3d4e5f6g7h8i9j0..."
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Errors:**
- 401: Refresh token invalido o scaduto
- 500: Errore server

**Rate Limit:** No limit

---

#### POST `/auth/logout`

Invalida il refresh token corrente.

**Request Body:**
```json
{
  "refreshToken": "a1b2c3d4e5f6g7h8i9j0..."
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Logout effettuato con successo"
}
```

**Errors:**
- 500: Errore server

---

#### POST `/auth/request-reset-password`

Richiede un token per reset password (invia email in produzione).

**Request Body:**
```json
{
  "email": "user@example.com",
  "accountType": "operatore"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Email di reset inviata",
  "data": {
    "resetToken": "abc123def456..."  // Solo in development!
  }
}
```

**Errors:**
- 404: Account non trovato
- 500: Errore server

**Rate Limit:** 3 richieste/ora per email

---

#### POST `/auth/reset-password`

Conferma reset password con token.

**Request Body:**
```json
{
  "resetToken": "abc123def456...",
  "newPassword": "NewSecurePass123!"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Password modificata con successo"
}
```

**Errors:**
- 400: Token invalido o scaduto
- 400: Validazione password fallita
- 500: Errore server

---

### Endpoints Protetti (Require JWT)

#### GET `/auth/me`

Ottiene informazioni sull'account corrente.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "accountType": "operatore",
    "role": {
      "id": 1,
      "name": "Operatore Base",
      "permissions": [
        {"resource": "users", "action": "read"}
      ]
    },
    "createdAt": "2025-10-15T10:00:00.000Z"
  }
}
```

**Errors:**
- 401: Token mancante o invalido
- 404: Account non trovato
- 500: Errore server

---

#### POST `/auth/logout-all`

Invalida tutti i refresh token dell'account (logout da tutti i dispositivi).

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response 200:**
```json
{
  "success": true,
  "message": "Logout effettuato da tutti i dispositivi"
}
```

**Errors:**
- 401: Token mancante o invalido
- 500: Errore server

---

#### POST `/auth/change-password`

Cambia la password dell'account corrente.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Password modificata con successo"
}
```

**Errors:**
- 401: Token mancante o invalido
- 400: Password corrente errata
- 400: Validazione nuova password fallita
- 500: Errore server

---

## LOG SERVICE API

**Base URL:** `http://localhost/log` (via Gateway)  
**Authentication:** API Key required in header `x-api-key`

### POST `/log/azione`

Crea un nuovo log di azione.

**Headers:**
```
Content-Type: application/json
x-api-key: your_api_key_here
```

**Request Body:**
```json
{
  "origine": {
    "tipo": "utente",
    "id": "user-123",
    "dettagli": {
      "nome": "Mario Rossi",
      "ip": "192.168.1.100"
    }
  },
  "azione": {
    "tipo": "update",
    "entita": "operatore",
    "idEntita": "op-456",
    "operazione": "aggiorna_profilo",
    "dettagli": {
      "campi": ["nome", "email"]
    }
  },
  "stato": {
    "precedente": {
      "nome": "Mario",
      "email": "mario@example.com"
    },
    "nuovo": {
      "nome": "Mario Rossi",
      "email": "mario.rossi@example.com"
    }
  },
  "contesto": {
    "transazioneId": "tr-789",
    "ambiente": "production",
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0..."
  },
  "risultato": {
    "esito": "successo",
    "tempoEsecuzione": 123
  },
  "tags": ["operatore", "profilo", "update"]
}
```

**Field Types:**
- `origine.tipo`: `"utente"` | `"sistema"`
- `azione.tipo`: `"create"` | `"update"` | `"delete"` | `"custom"`
- `risultato.esito`: `"successo"` | `"fallito"` | `"parziale"`

**Response 201:**
```json
{
  "_id": "60f7b0b9c2e4d83a40f98e1c",
  "timestamp": "2025-10-16T10:30:00.000Z",
  "origine": { ... },
  "azione": { ... },
  "stato": {
    "precedente": { ... },
    "nuovo": { ... },
    "diff": {
      "nome": {"old": "Mario", "new": "Mario Rossi"}
    }
  },
  "contesto": { ... },
  "risultato": { ... },
  "tags": [ ... ]
}
```

**Note:** Il campo `stato.diff` viene calcolato automaticamente dal sistema.

---

### GET `/log/azioni`

Recupera log con filtri e paginazione.

**Headers:**
```
x-api-key: your_api_key_here
```

**Query Parameters:**
- `page` (number): Numero di pagina (default: 0)
- `limit` (number): Risultati per pagina (default: 50, max: 100)
- `entita` (string): Filtra per tipo entità
- `tipoAzione` (string): Filtra per tipo azione (create, update, delete, custom)
- `esito` (string): Filtra per esito (successo, fallito, parziale)
- `origineId` (string): Filtra per ID origine
- `from` (ISO date): Data inizio
- `to` (ISO date): Data fine
- `tags` (string): Tag separati da virgola

**Example:**
```
GET /log/azioni?entita=operatore&esito=successo&limit=20
```

**Response 200:**
```json
{
  "logs": [
    {
      "_id": "...",
      "timestamp": "...",
      ...
    }
  ],
  "totalCount": 123,
  "page": 0,
  "limit": 50,
  "totalPages": 3
}
```

---

### GET `/log/azioni/:id`

Recupera un log specifico per ID.

**Headers:**
```
x-api-key: your_api_key_here
```

**Response 200:**
```json
{
  "_id": "60f7b0b9c2e4d83a40f98e1c",
  "timestamp": "...",
  "origine": { ... },
  ...
}
```

**Errors:**
- 404: Log non trovato

---

### GET `/log/transazioni/:transazioneId`

Recupera tutti i log associati a una transazione.

**Headers:**
```
x-api-key: your_api_key_here
```

**Response 200:**
```json
{
  "transazioneId": "tr-789",
  "name": "Aggiornamento Profilo",
  "status": "completed",
  "startTimestamp": "2025-10-16T09:30:00.000Z",
  "endTimestamp": "2025-10-16T09:30:05.000Z",
  "logs": [
    {
      "_id": "...",
      "timestamp": "...",
      "azione": {
        "operazione": "start",
        ...
      }
    },
    {
      "_id": "...",
      "timestamp": "...",
      "azione": {
        "operazione": "update_profile",
        ...
      }
    },
    {
      "_id": "...",
      "timestamp": "...",
      "azione": {
        "operazione": "end",
        ...
      }
    }
  ]
}
```

**Errors:**
- 404: Transazione non trovata

---

### GET `/log/statistiche`

Recupera statistiche aggregate sui log.

**Headers:**
```
x-api-key: your_api_key_here
```

**Query Parameters:**
- `days` (number): Numero di giorni da considerare (default: 7)

**Example:**
```
GET /log/statistiche?days=30
```

**Response 200:**
```json
{
  "period": {
    "days": 30,
    "startDate": "2025-09-16T00:00:00.000Z",
    "endDate": "2025-10-16T00:00:00.000Z"
  },
  "actionStats": [
    {"_id": "update", "count": 150},
    {"_id": "create", "count": 80},
    {"_id": "delete", "count": 20},
    {"_id": "custom", "count": 50}
  ],
  "entityStats": [
    {"_id": "operatore", "count": 120},
    {"_id": "order", "count": 90},
    {"_id": "product", "count": 60}
  ],
  "resultStats": [
    {"_id": "successo", "count": 280},
    {"_id": "fallito", "count": 15},
    {"_id": "parziale", "count": 5}
  ],
  "originStats": [
    {"_id": "user-123", "count": 50},
    {"_id": "system-cron", "count": 30}
  ],
  "summary": {
    "totalLogs": 300,
    "successCount": 280,
    "failedCount": 15
  }
}
```

---

## ESEMPI D'USO

### Esempio 1: Flusso Completo Autenticazione

```bash
# 1. Register
curl -X POST http://localhost/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mario.rossi@example.com",
    "password": "SecurePass123!",
    "accountType": "operatore",
    "roleId": 1
  }'

# 2. Login
curl -X POST http://localhost/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mario.rossi@example.com",
    "password": "SecurePass123!",
    "accountType": "operatore"
  }'

# Response:
# {
#   "success": true,
#   "data": {
#     "accessToken": "eyJ...",
#     "refreshToken": "abc123..."
#   }
# }

# 3. Get account info (protected)
TOKEN="eyJ..." # from login response

curl http://localhost/auth/me \
  -H "Authorization: Bearer $TOKEN"

# 4. Refresh token
curl -X POST http://localhost/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "abc123..."
  }'

# 5. Logout
curl -X POST http://localhost/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "abc123..."
  }'
```

### Esempio 2: Logging da Microservizio

```typescript
// auth-service logging to log-service
import axios from 'axios';

async function logUserRegistration(account: any) {
  try {
    await axios.post('http://log-service:4000/api/log/azione', {
      origine: {
        tipo: 'sistema',
        id: 'auth-service',
        dettagli: {
          module: 'AuthController',
          method: 'register'
        }
      },
      azione: {
        tipo: 'create',
        entita: 'account',
        idEntita: account.uuid,
        operazione: 'register',
        dettagli: {
          email: account.email,
          accountType: account.accountType
        }
      },
      contesto: {
        ambiente: process.env.NODE_ENV,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      risultato: {
        esito: 'successo',
        tempoEsecuzione: Date.now() - startTime
      },
      tags: ['auth', 'register', 'account']
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.LOG_API_KEY_SECRET
      }
    });
  } catch (error) {
    console.error('Failed to send log:', error.message);
    // Non bloccare l'operazione principale se il logging fallisce
  }
}
```

### Esempio 3: Transazione Completa con Log

```typescript
// Business operation with transaction logging
async function updateUserProfileTransaction(userId: string, updates: any) {
  const transactionId = `tr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  
  try {
    // Log: Transaction start
    await logAction({
      origine: {tipo: 'sistema', id: 'user-service'},
      azione: {
        tipo: 'custom',
        entita: 'transaction',
        idEntita: transactionId,
        operazione: 'start',
        dettagli: {name: 'Update User Profile'}
      },
      contesto: {transazioneId, ambiente: 'production'},
      risultato: {esito: 'successo'},
      tags: ['transaction', 'start']
    });
    
    // Get current user data
    const currentUser = await getUserById(userId);
    
    // Update user
    const updatedUser = await updateUser(userId, updates);
    
    // Log: Profile update
    await logAction({
      origine: {tipo: 'sistema', id: 'user-service'},
      azione: {
        tipo: 'update',
        entita: 'user',
        idEntita: userId,
        operazione: 'update_profile',
        dettagli: {fields: Object.keys(updates)}
      },
      stato: {
        precedente: currentUser,
        nuovo: updatedUser
      },
      contesto: {transazioneId, ambiente: 'production'},
      risultato: {esito: 'successo'},
      tags: ['user', 'profile', 'update']
    });
    
    // Log: Transaction end
    await logAction({
      origine: {tipo: 'sistema', id: 'user-service'},
      azione: {
        tipo: 'custom',
        entita: 'transaction',
        idEntita: transactionId,
        operazione: 'end',
        dettagli: {name: 'Update User Profile'}
      },
      contesto: {transazioneId, ambiente: 'production'},
      risultato: {
        esito: 'successo',
        tempoEsecuzione: Date.now() - startTime
      },
      tags: ['transaction', 'end', 'success']
    });
    
    return updatedUser;
    
  } catch (error) {
    // Log: Transaction failure
    await logAction({
      origine: {tipo: 'sistema', id: 'user-service'},
      azione: {
        tipo: 'custom',
        entita: 'transaction',
        idEntita: transactionId,
        operazione: 'end',
        dettagli: {name: 'Update User Profile'}
      },
      contesto: {transazioneId, ambiente: 'production'},
      risultato: {
        esito: 'fallito',
        messaggio: error.message,
        stackTrace: error.stack,
        tempoEsecuzione: Date.now() - startTime
      },
      tags: ['transaction', 'end', 'error']
    });
    
    throw error;
  }
}
```

---

## ERROR HANDLING

### Standard Error Format

Tutti gli endpoint seguono questo formato per gli errori:

```json
{
  "success": false,
  "error": "Error Type",
  "message": "Detailed error message",
  "details": {
    // Additional error details (optional)
  }
}
```

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input, validation failed |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authenticated but no permission |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 502 | Bad Gateway | Service unavailable |
| 503 | Service Unavailable | Service temporarily down |

### Common Error Examples

#### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Token JWT mancante o invalido"
}
```

#### 400 Bad Request (Validation)
```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Dati di input non validi",
  "details": {
    "fields": {
      "email": "Email non valida",
      "password": "Password deve essere almeno 8 caratteri"
    }
  }
}
```

#### 429 Rate Limit
```json
{
  "success": false,
  "error": "Troppi tentativi di login",
  "message": "Hai superato il limite di tentativi. Riprova tra 15 minuti."
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "Si è verificato un errore interno del server"
}
```

---

**Fine API Reference**

**Versione:** 2.0  
**Ultimo Aggiornamento:** 16 Ottobre 2025
