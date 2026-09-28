# Changelog - EDG Log Service

Tutte le modifiche importanti al progetto saranno documentate in questo file.

Il formato si basa su [Keep a Changelog](https://keepachangelog.com/it/1.0.0/),
e questo progetto aderisce al [Semantic Versioning](https://semver.org/lang/it/).

---

## [1.1.0] - 2026-02-09

### 🎉 Added - Eventi Standardizzati + Client Library (FASE 1 + 2A)

#### Nuove Funzionalità
- **Sistema categorie eventi standardizzate** con 6 categorie principali:
  - `AUTH` - Autenticazione e autorizzazione (13 sottotipi)
  - `DATA` - Operazioni CRUD su entità (9 sottotipi)
  - `EMAIL` - Tracking email (8 sottotipi)
  - `SYSTEM` - Eventi di sistema (13 sottotipi)
  - `AUDIT` - Auditing e compliance (9 sottotipi)
  - `SECURITY` - Eventi di sicurezza (7 sottotipi)

- **Event Builder API fluent** per creazione eventi semplificata
  - `EventBuilder.auth.login()` - Eventi autenticazione
  - `EventBuilder.data.create()` - Eventi CRUD
  - `EventBuilder.email.sent()` - Tracking email
  - `EventBuilder.system.cronJob()` - Eventi sistema

- **Sistema di validazione robusto**
  - Validazione payload con errori/warning dettagliati
  - Auto-normalizzazione eventi legacy
  - Suggerimento criticità intelligente

- **Nuovi metodi modello AzioneLog**
  - `isCritical()` - Verifica se evento è critico
  - `getDescription()` - Descrizione human-readable
  - `requiresAlert()` - Verifica necessità alert
  - `findByCategory()` - Query per categoria
  - `findCriticalEvents()` - Query eventi critici
  - `getStatsByCategory()` - Statistiche aggregate

#### Client Library Integrato
- **LogClient HTTP** - Client per inviare log ai microservizi
  - Retry automatico su failure (configurabile)
  - Offline queue in-memory (max 1000 eventi)
  - Health check del log-service
  - Type-safe con TypeScript

- **Event Builder Client-Side** - API fluent riutilizzabile
  - Builder AUTH per eventi autenticazione
  - Builder DATA per eventi CRUD
  - Generazione automatica campi legacy

- **Express Middleware** - Auto-logging richieste HTTP
  - Configurazione filtri path/metodi
  - Estrazione automatica userId
  - Metadata custom per richiesta
  - Logging asincrono (non blocca response)

- **Offline Queue** - Resilienza a downtime log-service
  - Buffer FIFO in-memory
  - Auto-flush ogni 10 secondi
  - Retry su eventi falliti

#### Nuovi File Server
- `src/types/eventCategories.ts` - Definizioni tipi TypeScript (415 righe)
- `src/utils/eventValidator.ts` - Sistema validazione (360 righe)
- `src/utils/eventBuilder.ts` - Builder API server-side (550 righe)
- `src/scripts/testStandardizedEvents.ts` - Test suite (600 righe)
- `EVENTI_STANDARDIZZATI.md` - Documentazione completa
- `FASE1_COMPLETATA.md` - Riepilogo implementazione

#### Nuovi File Client
- `src/client/index.ts` - Export principale client library
- `src/client/LogClient.ts` - HTTP client con retry (150 righe)
- `src/client/EventBuilder.ts` - Builder client-side (200 righe)
- `src/client/types.ts` - Types client + re-export server
- `src/client/queue/OfflineQueue.ts` - Queue offline (120 righe)
- `src/client/middleware/expressLogger.ts` - Middleware Express (100 righe)

#### Modifiche File Esistenti
- **src/models/azioneLog.ts**
  - Aggiunti 4 campi opzionali: `categoria`, `sottoCategoria`, `criticita`, `metadata`
  - Aggiunti 12 indici MongoDB (7 semplici + 5 composti)
  - Aggiunti 6 metodi helper (3 istanza + 3 statici)
  - Retrocompatibilità 100% mantenuta

- **package.json**
  - Nome: `edglogger` → `@edg/log-service`
  - Versione: `1.0.0` → `1.1.0`
  - Aggiunta dipendenza: `axios` ^1.6.0 (per client HTTP)
  - Aggiunto export: `"./client"` per import client library
  - Aggiunto script: `"test:events": "ts-node src/scripts/testStandardizedEvents.ts"`

### 🔧 Changed

#### Performance
- **Indici MongoDB ottimizzati**
  - Indici compound per query dashboard: `{ categoria, criticita, timestamp }`
  - Partial index per eventi critici: `{ criticita, timestamp }` con filter ERROR/CRITICAL
  - Partial index per compliance: `{ categoria, timestamp }` con filter SECURITY
  - Indici per audit trail utente: `{ "origine.id", timestamp }`
  - Indici per storia entità: `{ "azione.entita", "azione.idEntita", timestamp }`

#### Developer Experience
- **API fluent chainable** per costruzione eventi
- **Validazione type-safe** con TypeScript strict mode
- **Metadata tipizzati** per ogni categoria evento
- **Helper functions** per mapping categoria/sottotipo

### 📊 Metriche

- **Righe codice aggiunte:** ~2,000
- **Coverage TypeScript:** 100% dei nuovi file
- **Categorie eventi:** 6
- **Sottotipi totali:** 59
- **Indici MongoDB:** 12
- **Scenari test:** 7
- **Esempi documentazione:** 15+

### 🔄 Retrocompatibilità

- ✅ **100% compatibile** con formato log legacy
- ✅ **0 breaking changes** per API esistenti
- ✅ **Migrazione progressiva** supportata
- ✅ Log esistenti continuano a funzionare normalmente

---

## [1.0.0] - 2024-12-15

### 🎉 Added - Release Iniziale

#### Core Features
- Sistema di logging centralizzato per microservizi EDG Platform
- Modello MongoDB con schema `AzioneLog`
- API REST per registrazione e query log
- Supporto tracking transazioni multi-step
- Calcolo differenziale automatico (stato precedente/nuovo)
- Sistema tag per categorizzazione flessibile

#### Campi Modello
- `timestamp` - Data/ora evento
- `origine` - Utente o sistema che ha generato l'evento
- `azione` - Tipo operazione (create/update/delete/custom)
- `risultato` - Esito operazione (successo/fallito/parziale)
- `contesto` - Metadati aggiuntivi (IP, user agent, ambiente)
- `stato` - Stato precedente/nuovo con diff automatico
- `tags` - Array tag per categorizzazione

#### Endpoints API
- `POST /api/log/azione` - Registra nuovo evento
- `GET /api/log/azioni` - Query eventi con filtri
- `GET /api/log/azioni/stats` - Statistiche aggregate

#### Filtri Query
- Per utente: `origine.id`
- Per tipo azione: `azione.tipo`
- Per entità: `azione.entita` e `azione.idEntita`
- Per esito: `risultato.esito`
- Per transazione: `contesto.transazioneId`
- Per tag: `tags`
- Per intervallo temporale: `startDate`/`endDate`

#### Sicurezza
- Autenticazione via API Key
- Middleware Helmet per sicurezza HTTP
- CORS configurabile
- Validazione input

#### Configurazione
- Supporto variabili ambiente (.env)
- Configurazione MongoDB flessibile
- Logging Winston per diagnostica
- Hot-reload con nodemon (dev)

#### Scripts
- `npm start` - Avvia server (produzione)
- `npm run dev` - Avvia con hot-reload (sviluppo)
- `npm run build` - Compila TypeScript
- `npm test:api` - Test endpoint API

#### Dipendenze Principali
- Express 5.1.0 - Web framework
- Mongoose 8.15.0 - MongoDB ODM
- Winston 3.17.0 - Logging
- Helmet 8.1.0 - Sicurezza HTTP
- TypeScript 5.8.3 - Type safety

---

## [Unreleased]

### 🚀 Planned - FASE 2 (Q1 2025)

#### Client Library
- [ ] Package NPM `@edg/log-client`
- [ ] Wrapper HTTP per API log-service
- [ ] Middleware Express auto-logging
- [ ] Gestione retry e queue offline
- [ ] Documentazione e esempi

#### Dashboard UI
- [ ] Interfaccia React per visualizzazione eventi
- [ ] Filtri avanzati (categoria, severità, data)
- [ ] Vista timeline real-time
- [ ] Grafici statistiche
- [ ] Export CSV/JSON
- [ ] Ricerca full-text

#### Sistema Alerting
- [ ] Regole alert configurabili
- [ ] Notifiche Slack/Email
- [ ] Soglie dinamiche
- [ ] Escalation automatica
- [ ] Dashboard alert attivi

### 🚀 Planned - FASE 3 (Q2 2025)

#### Retention Policy
- [ ] Configurazione policy per categoria
- [ ] Archiviazione automatica eventi vecchi
- [ ] Compressione storage ottimizzata
- [ ] Restore selettivo archivio

#### Compliance e GDPR
- [ ] Export dati utente (GDPR Article 15)
- [ ] Right to erasure (GDPR Article 17)
- [ ] Audit trail immutabile
- [ ] Report compliance automatici

---

## Note di Versioning

### Major (X.0.0)
Breaking changes che richiedono migrazione:
- Modifiche schema MongoDB incompatibili
- Rimozione endpoint API
- Cambio formato payload

### Minor (0.X.0)
Nuove funzionalità backward-compatible:
- Nuovi endpoint API
- Nuove categorie eventi
- Nuovi metodi modello
- Miglioramenti performance

### Patch (0.0.X)
Bug fix e miglioramenti minori:
- Correzione bug
- Aggiornamenti documentazione
- Ottimizzazioni minori
- Aggiornamenti dipendenze

---

**Maintained by:** Mormegil @ Express Delivery Group  
**License:** ISC  
**Repository:** https://github.com/LarisPigasse/EdgLogger
