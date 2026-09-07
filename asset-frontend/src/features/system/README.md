# System Module

## 📋 Overview

Il modulo **System** fornisce una **dashboard di salute dell'infrastruttura** EDG, mostrando in tempo reale lo stato di tutti i servizi, le statistiche operative e l'attività del sistema di alerting. Accessibile esclusivamente agli utenti `root`, è il punto di riferimento per il monitoraggio globale della piattaforma.

**Responsabilità principali:**
- Monitoraggio health status di tutti i servizi (auth, email, log, mongodb)
- Visualizzazione metriche operative ultime 24 ore (log, critici, errori)
- Dashboard alerting (regole attive, alert inviati, fallimenti)
- Auto-refresh ogni 60 secondi per dati sempre aggiornati
- Indicatore visivo "Ultimo aggiornamento" con timestamp

---

## 🏗 Architettura

**Pattern:** Type-First (types → api → hooks → components → pages)
```
types → api → hooks (polling automatico) → components → pages
```

**Stato:**
- **Locale React hooks** con polling automatico ogni 60 secondi
- Nessun Redux necessario (dashboard read-only)
- Indicatore visivo ultimo aggiornamento

**Dipendenze esterne:**
- Backend: `log-service` porta 4001 endpoint `/api/system/health`
- Il log-service interroga internamente:
  - `auth-service:3001/health`
  - `email-service:3002/health`
  - MongoDB via mongoose connection

**Architettura aggregazione:**
```
Browser → log-service:4001/api/system/health
              ↓ chiama internamente (server-to-server)
         auth-service:3001/health
         email-service:3002/health
         mongoose.connection.readyState (MongoDB)
              ↓ aggrega in risposta unica
         { services: [...], stats: {...}, lastAlert: {...} }
```

---

## 📂 Struttura File

```
features/system/
├── api/
│   └── systemApi.ts                # Fetch /api/system/health
├── hooks/
│   ├── useSystem.ts                # Polling automatico 60s
│   └── index.ts
├── components/
│   ├── ServiceStatusCard.tsx      # Card stato singolo servizio
│   └── index.ts
├── pages/
│   ├── SystemPage.tsx              # Dashboard completa
│   └── index.ts
├── index.ts                        # Barrel export pubblico
└── README.md                       # Questo file
```

---

## 🔌 API Integration

**Base URL:** `http://localhost:4001` (log-service diretto)

### Endpoint utilizzato

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| `GET` | `/api/system/health` | Stato salute aggregato sistema |

**Autenticazione:** Nessuna (endpoint pubblico, protezione a livello route frontend)

### Esempio Request/Response

**Health aggregato:**
```typescript
// Request
GET /api/system/health

// Response 200
{
  "success": true,
  "data": {
    "services": [
      {
        "id": "log-service",
        "name": "Log Service",
        "status": "UP",
        "responseTime": null,
        "checkedAt": "2026-02-17T12:00:00Z"
      },
      {
        "id": "mongodb",
        "name": "MongoDB (Logs)",
        "status": "UP",
        "responseTime": null,
        "checkedAt": "2026-02-17T12:00:00Z"
      },
      {
        "id": "auth-service",
        "name": "Auth Service",
        "status": "UP",
        "responseTime": 12,           // ms
        "checkedAt": "2026-02-17T12:00:00Z"
      },
      {
        "id": "email-service",
        "name": "Email Service",
        "status": "DEGRADED",         // responseTime > 3000ms
        "responseTime": 3500,
        "checkedAt": "2026-02-17T12:00:00Z"
      }
    ],
    "stats": {
      "logs24h": 1243,
      "critici24h": 2,
      "errori24h": 14,
      "alertRules": 4,
      "alertsWeek": 3,
      "alertsFailed": 0
    },
    "lastAlert": {
      "_id": "65f9...",
      "ruleName": "Login falliti ripetuti",
      "sentTo": "system@edg.com",
      "status": "SENT",
      "createdAt": "2026-02-17T10:30:00Z"
    },
    "generatedAt": "2026-02-17T12:00:00.255Z"
  }
}
```

**Servizio DOWN (esempio):**
```json
{
  "id": "email-service",
  "name": "Email Service",
  "status": "DOWN",
  "responseTime": null,
  "error": "Connection refused",
  "checkedAt": "2026-02-17T12:00:00Z"
}
```

---

## 📊 Data Models

```typescript
// Stato servizio
type ServiceStatus = 'UP' | 'DOWN' | 'DEGRADED';

// Health singolo servizio
interface ServiceHealth {
  id:           string;        // es. "auth-service"
  name:         string;        // es. "Auth Service"
  status:       ServiceStatus;
  responseTime: number | null; // ms (null se DOWN o self-check)
  error?:       string;        // messaggio errore se DOWN
  checkedAt:    string;        // ISO timestamp
}

// Statistiche operative
interface SystemStats {
  logs24h:      number;   // eventi log ultime 24h
  critici24h:   number;   // eventi CRITICAL ultime 24h
  errori24h:    number;   // eventi ERROR ultime 24h
  alertRules:   number;   // regole alert attive
  alertsWeek:   number;   // alert inviati ultimi 7gg
  alertsFailed: number;   // alert falliti (totale)
}

// Ultimo alert inviato
interface LastAlert {
  _id:       string;
  ruleName:  string;
  sentTo:    string;
  status:    'SENT' | 'FAILED';
  createdAt: string;
}

// Risposta completa endpoint
interface SystemHealthData {
  services:    ServiceHealth[];
  stats:       SystemStats;
  lastAlert:   LastAlert | null;
  generatedAt: string;
}
```

---

## 🧩 Componenti

### `ServiceStatusCard`
Card visiva stato singolo servizio.

**Props:**
```typescript
interface ServiceStatusCardProps {
  service:  ServiceHealth;
  loading?: boolean;
}
```

**UI dinamica in base a status:**

| Status | Dot | Icon | Border | Behavior |
|--------|-----|------|--------|----------|
| UP | 🟢 Animato | CheckCircle verde | Border verde | Pulse animation |
| DEGRADED | 🟠 | AlertTriangle arancio | Border arancio | — |
| DOWN | 🔴 | XCircle rosso | Border rosso | — |

**Visualizza:**
- Nome servizio (es. "Auth Service")
- Stato + dot colorato
- Response time (se disponibile e UP)
- Messaggio errore (se DOWN)

---

### Pagina principale: `SystemPage`

**Layout sezioni:**

```
┌─────────────────────────────────────────────────┐
│ 🖥 Salute del Sistema          [Aggiorna]       │
│ Ultimo aggiornamento: 12:34:56 (auto ogni 60s) │
├─────────────────────────────────────────────────┤
│ SERVIZI                                         │
│ [Card auth] [Card email] [Card mongo] [Card log]│
├─────────────────────────────────────────────────┤
│ ATTIVITÀ ULTIME 24 ORE                          │
│ [Log totali] [Critici] [Errori]                │
├─────────────────────────────────────────────────┤
│ ALERTING                                        │
│ [Regole attive] [Alert 7gg] [Falliti]          │
├─────────────────────────────────────────────────┤
│ ULTIMO ALERT INVIATO                            │
│ [Card singola con dettagli ultimo alert]       │
└─────────────────────────────────────────────────┘
```

**Header dinamico:**
- Icona Monitor colorata in base allo stato:
  - 🟢 Verde se tutti i servizi UP
  - 🔴 Rosso se almeno un servizio DOWN
- Timestamp ultimo aggiornamento (HH:MM:SS)
- Nota "(auto ogni 60s)" per chiarire il polling

**Banner errore globale:**
- Se fetch fallisce → banner rosso in alto con messaggio + bottone "Riprova"

---

## 🎣 Hooks

### `useSystem()`

Hook principale con polling automatico.

**Ritorna:**
```typescript
{
  data:       SystemHealthData | null;
  loading:    boolean;
  error:      string | null;
  lastUpdate: Date | null;        // timestamp locale ultimo fetch
  refetch:    () => Promise<void>;
}
```

**Comportamento:**
- **Fetch iniziale:** al mount del componente
- **Polling automatico:** ogni 60 secondi (60_000 ms)
- **Loading intelligente:** solo al primo fetch (evita flickering durante polling)
- **Cleanup:** clearInterval al unmount

**Esempio utilizzo:**
```tsx
const SystemPage = () => {
  const { data, loading, error, lastUpdate, refetch } = useSystem();

  const lastUpdateStr = lastUpdate
    ? lastUpdate.toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '—';

  return (
    <div>
      <p>Ultimo aggiornamento: {lastUpdateStr}</p>
      <Button onClick={refetch}>Aggiorna ora</Button>
      {/* ... */}
    </div>
  );
};
```

---

## 🗺 Routing & Permessi

**Route protetta:**
```tsx
<Route
  path="/sistema/health"
  element={
    <PrivateRoute requiredPermission="system.health">
      <SystemPage />
    </PrivateRoute>
  }
/>
```

**Permesso richiesto:** `system.health` (solo utenti `root`)

**Navigation:**
- Menu: `Sistema → Health`
- Icon: `Monitor`
- URL: `/sistema/health`

---

## 💡 Usage Examples

### Monitoraggio servizi DOWN

```tsx
const SystemPage = () => {
  const { data } = useSystem();

  const downServices = data?.services.filter(s => s.status === 'DOWN') ?? [];

  if (downServices.length > 0) {
    return (
      <Alert variant="danger">
        <p>⚠️ {downServices.length} servizio/i non disponibile/i:</p>
        <ul>
          {downServices.map(s => (
            <li key={s.id}>
              {s.name}: {s.error}
            </li>
          ))}
        </ul>
      </Alert>
    );
  }

  return <p>✓ Tutti i servizi operativi</p>;
};
```

### Indicatore health globale

```tsx
const SystemHealthIndicator = () => {
  const { data } = useSystem();

  const allUp = data?.services.every(s => s.status === 'UP') ?? false;

  return (
    <div className={allUp ? 'bg-green-100' : 'bg-red-100'}>
      <Monitor className={allUp ? 'text-green-600' : 'text-red-600'} />
      <span>{allUp ? 'Sistema operativo' : 'Problemi rilevati'}</span>
    </div>
  );
};
```

### Alert su fallimenti email

```tsx
const { data } = useSystem();
const alertsFailed = data?.stats.alertsFailed ?? 0;

if (alertsFailed > 0) {
  toast.danger({
    title: `${alertsFailed} alert falliti`,
    description: 'Verificare email-service',
  });
}
```

---

## 🧪 Testing Notes

### Scenari di test

**Polling automatico:**
- ✅ Fetch iniziale al mount
- ✅ Refresh automatico ogni 60s
- ✅ Cleanup clearInterval al unmount
- ✅ Timestamp "Ultimo aggiornamento" si aggiorna ad ogni fetch

**Gestione errori:**
- ❌ Fetch fallisce → banner errore visibile
- ✅ Bottone "Riprova" → chiama refetch manualmente
- ✅ Errore temporaneo → polling successivo risolve automaticamente

**Servizi DOWN:**
- ✅ Email service DOWN → card rossa con errore
- ✅ Header icona diventa rossa
- ✅ Nessun crash se tutti i servizi DOWN

**Stato DEGRADED:**
- ✅ Response time > 3000ms → status DEGRADED
- ✅ Card arancio con warning
- ✅ Servizio funzionante ma lento

**Statistiche:**
- ✅ Eventi critici > 0 → card rossa con subtitle "Richiedono attenzione"
- ✅ Alert falliti > 0 → card rossa con "Verificare email-service"
- ✅ Valori 0 → card grigie neutre

**Ultimo alert:**
- ✅ lastAlert = null → messaggio "Nessun alert inviato finora"
- ✅ lastAlert SENT → badge verde + check
- ✅ lastAlert FAILED → badge rosso + X

---

## 🔮 Future Improvements

### Funzionalità
- [ ] **Grafici trend** — Recharts per visualizzare metriche temporali
- [ ] **Alert dashboard** — soglie configurabili (es. >5 critici → alert)
- [ ] **Export report** — PDF snapshot stato sistema
- [ ] **History comparison** — confronta health tra timestamp diversi
- [ ] **Container stats** — integrazione con Docker stats (CPU, RAM)

### UX
- [ ] **Pause polling** — bottone per mettere in pausa auto-refresh
- [ ] **Configurabile polling** — scegli intervallo (30s/60s/120s)
- [ ] **Sound notification** — beep se servizio va DOWN
- [ ] **Browser notification** — notifica desktop per eventi critici

### Monitoring avanzato
- [ ] **Response time chart** — grafico latenza servizi nel tempo
- [ ] **Uptime percentage** — SLA tracking (es. 99.9% uptime mensile)
- [ ] **Incident history** — log downtime passati
- [ ] **Health score** — punteggio aggregato 0-100

### Integrations
- [ ] **Prometheus metrics** — endpoint `/metrics` per Grafana
- [ ] **Slack webhook** — notifica canale quando servizio DOWN
- [ ] **PagerDuty** — escalation automatica su DOWN
- [ ] **StatusPage** — pagina pubblica stato servizi

---

## 📝 Notes

**Perché endpoint aggregato?**
- `auth-service` e `email-service` non sono esposti direttamente al browser
- Solo `log-service` ha porta pubblica (4001)
- Il log-service fa da proxy per health check interni

**Blind spot accettato:**
- Se `log-service` va completamente DOWN, la dashboard non si carica
- Mitigazione: Control Tower MCP auto-healing + monitoraggio esterno opzionale

**Performance:**
- Polling ogni 60s → circa 1 request/min per utente
- Aggregazione server-side in ~10-20ms (chiamate parallele)
- Nessun impatto su performance servizi (health check lightweight)

**Sicurezza:**
- Endpoint `/api/system/health` pubblico (no API key)
- Protezione a livello route frontend (solo root)
- Nessun dato sensibile esposto (solo status UP/DOWN)

---

**Autore:** Mormegil  
**Ultima modifica:** 2026-02-17  
**Versione modulo:** 2.0
