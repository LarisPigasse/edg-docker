# Documentazione EdgLogger

## Panoramica

EdgLogger è un sistema di logging avanzato progettato per registrare azioni, transazioni ed errori nelle applicazioni. Il sistema utilizza MongoDB come database di archiviazione e offre un'API RESTful per la registrazione e la consultazione dei log.

## Architettura

Il sistema EdgLogger è implementato come un servizio standalone, accessibile tramite API HTTP, con le seguenti caratteristiche:

- **Backend**: Node.js con Express e TypeScript
- **Database**: MongoDB
- **Autenticazione**: API Key
- **Formato dati**: JSON

### Struttura del progetto

```
edglogger/
├── dist/                   # Codice compilato
├── logs/                   # File di log del sistema
├── src/
│   ├── config/             # Configurazioni
│   │   ├── database.ts     # Configurazione MongoDB
│   │   └── logger.ts       # Configurazione logger Winston
│   ├── controllers/        # Controller Express
│   │   └── logController.ts # Implementazione logica di business
│   ├── middleware/         # Middleware Express
│   │   └── authMiddleware.ts # Autenticazione API key
│   ├── models/             # Modelli dati
│   │   └── AzioneLog.ts    # Schema e interfaccia per i log
│   ├── routes/             # Definizione delle route API
│   │   └── logRoutes.ts    # Route per le operazioni sui log
│   ├── scripts/            # Script di utilità
│   │   └── testApi.ts      # Script per testare l'API
│   ├── types/              # Definizioni di tipo
│   │   └── express.ts      # Estensioni di tipo per Express
│   ├── utils/              # Funzioni di utilità
│   │   └── diffUtils.ts    # Utilità per calcolo differenze
│   └── server.ts           # Entry point dell'applicazione
├── .env                    # Variabili d'ambiente
├── .env.example            # Template per variabili d'ambiente
├── package.json            # Dipendenze e script
└── tsconfig.json           # Configurazione TypeScript
```

## Modello dati

### AzioneLog

Rappresenta un'azione registrata nel sistema, con la seguente struttura:

```typescript
interface IAzioneLog extends Document {
  timestamp: Date; // Data e ora dell'evento

  origine: {
    // Chi ha eseguito l'azione
    tipo: "utente" | "sistema"; // Origine utente o sistema
    id: string; // ID dell'utente o sistema
    dettagli: Record<string, any>; // Dettagli aggiuntivi
  };

  azione: {
    // Cosa è stato fatto
    tipo: "create" | "update" | "delete" | "custom"; // Tipo di azione
    entita: string; // Tipo di entità (es. 'operatore')
    idEntita: string; // ID dell'entità
    operazione: string; // Nome dell'operazione
    dettagli: Record<string, any>; // Dettagli dell'operazione
  };

  stato: {
    // Per tracciare cambiamenti
    precedente: Record<string, any> | null; // Stato precedente
    nuovo: Record<string, any> | null; // Stato nuovo
    diff: Record<string, any> | null; // Differenze calcolate
  };

  contesto: {
    // Informazioni di contesto
    transazioneId?: string; // ID transazione
    causalita?: string[]; // ID eventi correlati
    sessione?: string; // ID sessione
    ip?: string; // Indirizzo IP
    userAgent?: string; // User agent
    ambiente: string; // Ambiente (es. 'production')
  };

  risultato: {
    // Esito dell'operazione
    esito: "successo" | "fallito" | "parziale";
    codice?: string; // Codice di errore
    messaggio?: string; // Messaggio esplicativo
    stackTrace?: string; // Stack trace (per errori)
    tempoEsecuzione?: number; // Tempo di esecuzione in ms
  };

  tags: string[]; // Tag per categorizzazione
}
```

## API

### Endpoints

| Metodo | Endpoint                   | Descrizione                                |
| ------ | -------------------------- | ------------------------------------------ |
| POST   | `/api/log/azione`          | Registra un nuovo log di azione            |
| GET    | `/api/log/azioni`          | Recupera log con filtri e paginazione      |
| GET    | `/api/log/azioni/:id`      | Recupera un log specifico per ID           |
| GET    | `/api/log/transazioni/:id` | Recupera i log associati a una transazione |
| GET    | `/api/log/statistiche`     | Recupera statistiche aggregate sui log     |
| GET    | `/health`                  | Verifica lo stato del servizio             |

### Dettaglio degli Endpoints

#### POST `/api/log/azione`

Registra un nuovo log di azione.

**Request body**:

```json
{
  "origine": {
    "tipo": "utente",
    "id": "user-123",
    "dettagli": { "nome": "Mario Rossi" }
  },
  "azione": {
    "tipo": "update",
    "entita": "operatore",
    "idEntita": "op-456",
    "operazione": "aggiorna_profilo",
    "dettagli": { "campi": ["nome", "email"] }
  },
  "stato": {
    "precedente": { "nome": "Mario", "email": "mario@example.com" },
    "nuovo": { "nome": "Mario Rossi", "email": "mario.rossi@example.com" }
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

**Response** (201 Created):

```json
{
  "_id": "60f7b0b9c2e4d83a40f98e1c",
  ... // Tutti i campi del log inclusi quelli generati dal server
}
```

#### GET `/api/log/azioni`

Recupera log con filtri e paginazione.

**Query parameters**:

- `page`: Numero di pagina (default: 0)
- `limit`: Numero di risultati per pagina (default: 50, max: 100)
- `entita`: Filtra per tipo di entità
- `tipoAzione`: Filtra per tipo di azione
- `esito`: Filtra per esito
- `origineId`: Filtra per ID origine
- `from`: Data inizio (formato ISO)
- `to`: Data fine (formato ISO)
- `tags`: Tag da filtrare (separati da virgola)

**Response** (200 OK):

```json
{
  "logs": [...],
  "totalCount": 123,
  "page": 0,
  "limit": 50,
  "totalPages": 3
}
```

#### GET `/api/log/azioni/:id`

Recupera un log specifico per ID.

**Parameters**:

- `id`: ID del log

**Response** (200 OK):

```json
{
  "_id": "60f7b0b9c2e4d83a40f98e1c",
  ... // Tutti i campi del log
}
```

#### GET `/api/log/transazioni/:transazioneId`

Recupera i log associati a una transazione.

**Parameters**:

- `transazioneId`: ID della transazione

**Response** (200 OK):

```json
{
  "transazioneId": "tr-789",
  "name": "Aggiornamento Profilo",
  "status": "completed",
  "startTimestamp": "2023-07-21T09:30:00.000Z",
  "endTimestamp": "2023-07-21T09:30:05.000Z",
  "logs": [...]
}
```

#### GET `/api/log/statistiche`

Recupera statistiche aggregate sui log.

**Query parameters**:

- `days`: Numero di giorni da considerare (default: 7)

**Response** (200 OK):

```json
{
  "period": {
    "days": 7,
    "startDate": "2023-07-14T00:00:00.000Z",
    "endDate": "2023-07-21T00:00:00.000Z"
  },
  "actionStats": [
    { "_id": "update", "count": 50 },
    { "_id": "create", "count": 30 },
    ...
  ],
  "entityStats": [...],
  "resultStats": [...],
  "originStats": [...],
  "summary": {
    "totalLogs": 100,
    "successCount": 95,
    "failedCount": 5
  }
}
```

## Autenticazione

Per accedere alle API è necessario utilizzare un'API key nel seguente modo:

- Header HTTP: `x-api-key: your_api_key_here`
- Oppure come query parameter: `?apiKey=your_api_key_here`

La chiave API è configurata nella variabile d'ambiente `API_KEY_SECRET`.

## Funzionalità avanzate

### Calcolo automatico delle differenze

Quando si registra un log con informazioni di stato (`precedente` e `nuovo`), il sistema calcola automaticamente le differenze e le memorizza nel campo `diff`.

### Tracciamento delle transazioni

Le transazioni sono sequenze di azioni correlate. Una transazione è identificata da un ID univoco e può contenere più log.

La convenzione per le transazioni è:

1. Log di inizio transazione con `operazione: 'start'`
2. Log delle operazioni della transazione
3. Log di fine transazione con `operazione: 'end'`

Questo permette di tenere traccia dell'intero flusso di un'operazione complessa.

### Analisi statistiche

L'endpoint `/api/log/statistiche` fornisce analisi aggregate sui log, utili per monitorare l'attività del sistema nel tempo.

## Configurazione

Variabili d'ambiente (`.env`):

```
# Server
PORT=4000
NODE_ENV=development
SKIP_AUTH=false  # Solo per sviluppo

# MongoDB
MONGODB_URI=mongodb://username:password@host:port/database

# Sicurezza
API_KEY_SECRET=your_api_key_here

# Test
API_URL=http://localhost:4000
```

## Sviluppo

### Prerequisiti

- Node.js 18+
- MongoDB

### Script disponibili

- `npm run dev`: Avvia il server in modalità sviluppo
- `npm run build`: Compila il progetto TypeScript
- `npm start`: Avvia il server in modalità produzione
- `npm run test:api`: Esegue i test dell'API

## Chiamate di esempio

### Registrare un log semplice

```typescript
fetch("http://localhost:4000/api/log/azione", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "your_api_key_here",
  },
  body: JSON.stringify({
    origine: {
      tipo: "utente",
      id: "user-123",
      dettagli: { nome: "Mario Rossi" },
    },
    azione: {
      tipo: "custom",
      entita: "articolo",
      idEntita: "art-456",
      operazione: "view",
      dettagli: { sezione: "homepage" },
    },
    risultato: {
      esito: "successo",
    },
    tags: ["articolo", "view"],
  }),
});
```

### Registrare un log con stato (cambio dati)

```typescript
fetch("http://localhost:4000/api/log/azione", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "your_api_key_here",
  },
  body: JSON.stringify({
    origine: {
      tipo: "utente",
      id: "user-123",
      dettagli: { nome: "Mario Rossi" },
    },
    azione: {
      tipo: "update",
      entita: "prodotto",
      idEntita: "prod-789",
      operazione: "update_price",
      dettagli: { campo: "prezzo" },
    },
    stato: {
      precedente: { prezzo: 19.99, nome: "Prodotto A" },
      nuovo: { prezzo: 24.99, nome: "Prodotto A" },
    },
    risultato: {
      esito: "successo",
    },
    tags: ["prodotto", "prezzo", "update"],
  }),
});
```

### Registrare un errore

```typescript
fetch("http://localhost:4000/api/log/azione", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "your_api_key_here",
  },
  body: JSON.stringify({
    origine: {
      tipo: "sistema",
      id: "batch-process",
      dettagli: { job: "import-data" },
    },
    azione: {
      tipo: "custom",
      entita: "import",
      idEntita: "imp-123",
      operazione: "process_file",
      dettagli: { filename: "data.csv" },
    },
    risultato: {
      esito: "fallito",
      codice: "INVALID_FORMAT",
      messaggio: "File CSV non valido: formato non riconosciuto",
      stackTrace: "Error: Invalid CSV format\n    at parseCsv (/app/src/utils/parser.ts:45)",
    },
    tags: ["import", "error", "csv"],
  }),
});
```

## Note di Implementazione

- Il sistema utilizza TypeScript per garantire tipizzazione sicura e migliore manutenibilità
- Le rotte Express sono separate dai controller per seguire il pattern MVC
- Il calcolo delle differenze (`diffUtils.ts`) avviene automaticamente quando si forniscono stati precedente e nuovo
- Sono configurati indici MongoDB per ottimizzare le query più comuni
- L'autenticazione avviene tramite un semplice middleware che verifica l'API key

## Future Evoluzioni

- Implementare un client SDK che faciliti l'integrazione con altre applicazioni
- Aggiungere un pannello di amministrazione web per visualizzare e analizzare i log
- Implementare retention policy per archiviare o eliminare log vecchi
- Aggiungere funzionalità di esportazione (CSV, JSON)
- Implementare ricerca full-text nei log
