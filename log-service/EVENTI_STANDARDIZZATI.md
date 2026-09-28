# EDG Log Service - Guida Eventi Standardizzati

## 📚 Panoramica

Il sistema di logging ora supporta **eventi standardizzati** con categorie predefinite, mantenendo la retrocompatibilità con i log legacy.

---

## 🎯 Categorie Eventi

| Categoria | Descrizione | Esempi |
|-----------|-------------|--------|
| `AUTH` | Autenticazione e autorizzazione | Login, logout, password reset, MFA |
| `DATA` | Operazioni CRUD su entità | Create, update, delete, import, export |
| `EMAIL` | Tracking email | Sent, delivered, failed, bounced |
| `SYSTEM` | Eventi di sistema | Cron jobs, API calls, batch processes |
| `AUDIT` | Auditing e compliance | Permission changes, policy violations |
| `SECURITY` | Eventi di sicurezza | Suspicious activity, brute force, data breach |

---

## 🚀 Utilizzo con Event Builder (Consigliato)

### Esempio 1: Login Utente

```typescript
import { EventBuilder } from "./utils/eventBuilder";
import AzioneLog from "./models/azioneLog";

// Login riuscito
const loginEvent = EventBuilder.auth
  .login()
  .user("user_123", "john.doe", "john@example.com")
  .fromIp("192.168.1.100")
  .withUserAgent("Mozilla/5.0...")
  .session("sess_abc123")
  .withTags("authentication", "user-action")
  .build();

await AzioneLog.create(loginEvent);

// Login fallito
const failedLoginEvent = EventBuilder.auth
  .loginFailed()
  .user("user_123", "john.doe")
  .fromIp("192.168.1.100")
  .failureReason("Password non valida")
  .severity(EventSeverity.WARNING)
  .build();

await AzioneLog.create(failedLoginEvent);
```

### Esempio 2: Operazioni su Dati

```typescript
// Creazione entità
const createEvent = EventBuilder.data
  .create("order", "ord_789")
  .entityName("Ordine #789")
  .byUser("user_456")
  .withState(null, { status: "pending", amount: 150.00 })
  .withTags("order-management", "sales")
  .build();

await AzioneLog.create(createEvent);

// Aggiornamento entità
const updateEvent = EventBuilder.data
  .update("order", "ord_789")
  .entityName("Ordine #789")
  .byUser("user_456")
  .fieldsChanged("status", "shippingAddress")
  .withState(
    { status: "pending", shippingAddress: "Via Roma 1" },
    { status: "shipped", shippingAddress: "Via Milano 10" }
  )
  .build();

await AzioneLog.create(updateEvent);

// Cancellazione fallita
const deleteEvent = EventBuilder.data
  .delete("order", "ord_789")
  .byUser("user_456")
  .failed("L'ordine è già stato spedito")
  .severity(EventSeverity.WARNING)
  .build();

await AzioneLog.create(deleteEvent);
```

### Esempio 3: Email Tracking

```typescript
// Email inviata con successo
const emailSent = EventBuilder.email
  .sent("customer@example.com", "Conferma ordine #789")
  .emailId("email_123")
  .template("order-confirmation")
  .provider("sendgrid")
  .withTags("transactional", "order")
  .build();

await AzioneLog.create(emailSent);

// Email fallita
const emailFailed = EventBuilder.email
  .failed(
    "customer@example.com",
    "Newsletter Gennaio",
    "SMTP timeout dopo 3 tentativi"
  )
  .template("newsletter-monthly")
  .provider("mailgun")
  .errorCode("SMTP_TIMEOUT")
  .severity(EventSeverity.WARNING)
  .build();

await AzioneLog.create(emailFailed);

// Email bounce
const emailBounced = EventBuilder.email
  .bounced("invalid@example.com", "Benvenuto", "hard")
  .template("welcome-email")
  .build();

await AzioneLog.create(emailBounced);
```

### Esempio 4: Eventi di Sistema

```typescript
// Cron job completato
const cronEvent = EventBuilder.system
  .cronJob("daily-report-generator")
  .completed(3500, 1250) // 3.5 secondi, 1250 record processati
  .withTags("automation", "reports")
  .build();

await AzioneLog.create(cronEvent);

// Cron job fallito
const cronFailed = EventBuilder.system
  .cronJob("data-sync")
  .failed("Connessione al database remoto rifiutata")
  .severity(EventSeverity.ERROR)
  .build();

await AzioneLog.create(cronFailed);

// API call esterna
const apiCall = EventBuilder.system
  .apiCall("stripe", "/v1/charges")
  .statusCode(200)
  .context({ transactionId: "txn_abc123" })
  .build();

await AzioneLog.create(apiCall);
```

---

## 🔍 Query Eventi Standardizzati

### Trova eventi per categoria

```typescript
import { EventCategory } from "./types/eventCategories";

// Tutti gli eventi di autenticazione degli ultimi 7 giorni
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
const authEvents = await AzioneLog.findByCategory(
  EventCategory.AUTH,
  sevenDaysAgo
);
```

### Trova eventi critici

```typescript
// Ultimi 100 eventi critici o errori
const criticalEvents = await AzioneLog.findCriticalEvents(100);

// Filtra solo eventi che richiedono attenzione
const alertEvents = criticalEvents.filter(event => event.requiresAlert());
```

### Statistiche per categoria

```typescript
// Statistiche ultimi 30 giorni
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
const stats = await AzioneLog.getStatsByCategory(thirtyDaysAgo);

// Output esempio:
// [
//   {
//     _id: "AUTH",
//     totalEvents: 15420,
//     bySeverity: [
//       { severity: "info", count: 14500 },
//       { severity: "warning", count: 800 },
//       { severity: "error", count: 120 }
//     ]
//   },
//   ...
// ]
```

---

## 🛡️ Validazione Manuale

Se non usi l'Event Builder, puoi validare manualmente:

```typescript
import { validateStandardizedEvent } from "./utils/eventValidator";

const payload = {
  categoria: EventCategory.DATA,
  sottoCategoria: DataEventType.CREATE,
  criticita: EventSeverity.INFO,
  metadata: {
    entityType: "order",
    entityId: "ord_123"
  },
  risultato: {
    esito: "successo"
  }
};

const validation = validateStandardizedEvent(payload);

if (!validation.valid) {
  console.error("Errori:", validation.errors);
  console.warn("Avvisi:", validation.warnings);
} else {
  await AzioneLog.create(payload);
}
```

---

## 🔄 Retrocompatibilità

Il sistema mantiene la piena compatibilità con i log legacy:

```typescript
// Vecchio formato - continua a funzionare
const legacyLog = {
  origine: {
    tipo: "utente",
    id: "user_123",
    dettagli: {}
  },
  azione: {
    tipo: "update",
    entita: "ordine",
    idEntita: "ord_789",
    operazione: "Aggiornamento stato ordine"
  },
  risultato: {
    esito: "successo",
    messaggio: "Ordine aggiornato correttamente"
  },
  contesto: {
    ambiente: "production",
    ip: "192.168.1.100"
  },
  stato: {
    precedente: { status: "pending" },
    nuovo: { status: "shipped" }
  },
  tags: ["ordini"]
};

await AzioneLog.create(legacyLog);
```

---

## 📊 Livelli di Criticità

| Livello | Quando Usarlo | Esempi |
|---------|---------------|--------|
| `INFO` | Operazioni normali | Login successo, email inviata, record creato |
| `WARNING` | Situazioni anomale ma non critiche | Login fallito (1 tentativo), email bounced soft |
| `ERROR` | Errori che impediscono operazioni | Batch process fallito, API timeout |
| `CRITICAL` | Errori che richiedono intervento immediato | Brute force attack, data breach attempt, sistema down |

---

## 🎨 Best Practices

### ✅ DO

```typescript
// Usa i builder per consistenza
const event = EventBuilder.auth.login()
  .user("user_123")
  .fromIp(req.ip)
  .build();

// Specifica sempre la criticità per eventi non standard
const customEvent = EventBuilder.system
  .apiCall("external-api", "/endpoint")
  .severity(EventSeverity.WARNING)
  .build();

// Usa tag significativi
.withTags("payment-processing", "stripe", "critical-path")
```

### ❌ DON'T

```typescript
// Non mischiare campi legacy e standardizzati senza motivo
const badEvent = {
  categoria: EventCategory.AUTH,  // Nuovo
  azione: {                        // Legacy
    tipo: "custom",
    entita: "user",
    idEntita: "123"
  }
  // ❌ Confusione! Usa solo un approccio
};

// Non omettere metadata importanti
const incompleteEvent = EventBuilder.data
  .create("order", "123")
  .build();
  // ❌ Manca informazione su chi ha creato l'ordine

// Non usare criticità non appropriate
const overblown = EventBuilder.email
  .sent("user@example.com", "Newsletter")
  .severity(EventSeverity.CRITICAL)  // ❌ Eccessivo per email normale
  .build();
```

---

## 🔐 Eventi di Sicurezza

Gli eventi di sicurezza hanno gestione speciale:

```typescript
// Automaticamente marcato come critico
const securityEvent = {
  categoria: EventCategory.SECURITY,
  sottoCategoria: SecurityEventType.BRUTE_FORCE_ATTEMPT,
  criticita: EventSeverity.CRITICAL,
  metadata: {
    threatLevel: "high",
    attackType: "credential-stuffing",
    blockedIp: "203.0.113.42",
    attemptCount: 15
  },
  risultato: {
    esito: "fallito",
    messaggio: "IP bloccato dopo 15 tentativi falliti"
  }
};

await AzioneLog.create(securityEvent);

// Viene automaticamente segnalato per alert
if (securityEvent.requiresAlert()) {
  // Invia notifica al team security
}
```

---

## 📈 Monitoraggio e Dashboard

### Query per Dashboard Real-time

```typescript
// Eventi ultimi 15 minuti
const recent = await AzioneLog.find({
  timestamp: { $gte: new Date(Date.now() - 15 * 60 * 1000) }
}).sort({ timestamp: -1 });

// Eventi critici non risolti
const unresolved = await AzioneLog.find({
  criticita: EventSeverity.CRITICAL,
  "risultato.esito": "fallito",
  timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
});

// Tasso di errore per categoria (ultimi 60 min)
const errorRate = await AzioneLog.aggregate([
  {
    $match: {
      timestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
    }
  },
  {
    $group: {
      _id: {
        categoria: "$categoria",
        esito: "$risultato.esito"
      },
      count: { $sum: 1 }
    }
  }
]);
```

---

## 🚀 Prossimi Passi

1. **Client Library**: Libreria TypeScript per semplificare logging dai microservizi
2. **Dashboard UI**: Interfaccia React per visualizzare e filtrare eventi
3. **Alerting**: Sistema di notifiche per eventi critici
4. **Retention Policy**: Archiviazione automatica eventi vecchi

---

## 📞 Supporto

Per domande o problemi, contatta il team Platform Engineering.
