# Vigilo — 6. Servizio e API

> Passo 6 dell'analisi (ADR064). Stato: **approvato dall'utente il 2026-10-08**.
> Parte dai passi 1-5 (approvati).

## 6.1 vigilo-service in breve

- Node + TypeScript + Express + Sequelize su PostgreSQL (`edg_vigilo`), come
  system-service; porta **3006**; container `vigilo-service`.
- Riusa, copiandoli, i moduli collaudati: `logger` (audit verso log-service,
  ADR034/039), `requestContext`, `jobRunner` (processi monitorati), `buildInfo`,
  `response`, `errors`, middleware di autenticazione dal gateway e `validate`
  (Joi con `stripUnknown`, L049).
- Database e utente: lo script `postgres/init` vale solo per un volume nuovo;
  sul volume esistente si crea `edg_vigilo` una volta a mano (comando nel
  README del servizio), come fatto per `edg_system`.

## 6.2 Struttura (divide et impera)

```text
vigilo-service/src/
  app.ts
  config/            database, variabili d'ambiente
  core/              middleware (gateway, permessi + ambito, validazione, errori),
                     logger, requestContext, jobRunner, response
  regole/            FUNZIONI PURE, nessun accesso al database:
                       eredita.ts     fusione dei 4 gruppi (cadenza, preavvisi, tolleranza, destinatari)
                       cadenza.ts     prossima scadenza (tempo, uso, combinata, prima, fine mese, fine)
                       stato.ts       stato, limiteIl, urgenzaIl, testo leggibile ("scade tra 8 giorni")
                       contatori.ts   uso giornaliero, data stimata, letture anomale
                       avvisi.ts      eventi dovuti a una data (preavvisi, tolleranza, scaduta, richiami)
  domini/            un modulo per area, ciascuno con model · schemas · service · controller · routes:
                       impostazioni, categorie, soggetti, contatori, assegnazioni, fornitori,
                       controlli, scadenze, registrazioni, allegati, avvisi, libreria, avvio, dashboard
  libreria/          file versionati (categorie, controlli, modelli) + sincronizzazione all'avvio
  processi/          ricalcolo notturno, riepilogo, consegne
  migrations/
tests/regole/        test unitari delle regole (Jest, come auth-service)
```

Le **regole** sono il cuore: cadenze, stati e avvisi sbagliati sarebbero il
difetto più grave. Stanno in funzioni pure, verificate da **test unitari**
con i casi della tabella 1.5 (revisione 4 anni poi 2, tagliando 12 mesi o
16000 km, RCA con tolleranza, rate fino al 2028…). I servizi le chiamano e
basta.

## 6.3 API (via gateway: `/api/vigilo/…`, identificativi `uuid`)

| Area | Rotte principali | Permesso |
|---|---|---|
| Io | `GET /me` — permessi effettivi, persona collegata, avvio fatto | tutti |
| Dashboard | `GET /dashboard` — conteggi per stato, per controllo, per mese (12 + arretrato), soggetti per tipo, fatte in tempo; stessi filtri dell'elenco (tipo, categoria, sede, natura, testo). L'elenco è `GET /scadenze` (ADR078) | read · own |
| Calendario | `GET /calendario?dal&al` (al massimo 64 giorni; scadenze aperte nel giorno `urgenzaIl`, `stimata` se arriva prima la stima; `arretrato`; stessi filtri dell'elenco; ADR083) | read · own |
| Scadenze | `GET /scadenze` (filtro `controllo` = uno o più uuid separati da virgola, fino a 32), `GET /scadenze/:id` (con impostazioni effettive, ultime registrazioni, `prossimaSeRegistrataOggi`, `richieste` dato per dato e `rinviabile`, per il pannello delle azioni), `POST /scadenze` (anche promemoria), `PATCH /scadenze/:id` (data, ridefinizioni, note) | read / write |
| Registrazioni | `GET /registrazioni?soggetto=` (storico del soggetto, le più recenti per prime, con il titolo della scadenza), `POST /scadenze/:id/registrazioni` (esecuzione; dall'addetto = segnalazione), `POST /scadenze/:id/rinvio`, `POST /registrazioni/:id/conferma`, `POST /registrazioni/:id/rifiuto` | write · own |
| Soggetti | `GET/POST /soggetti`, `GET/PATCH /soggetti/:id`, `POST /soggetti/:id/stato` (fermo, dismesso) | read / write |
| Contatori | `POST /soggetti/:id/contatori`, `POST /contatori/:id/letture`, `GET /contatori/:id/letture` | write · own |
| Assegnazioni | `POST /assegnazioni`, `PATCH /assegnazioni/:id` | write |
| Fornitori | `GET/POST/PATCH /fornitori` | read / write |
| Allegati | `POST /allegati` (multipart), `GET /allegati/:id` (download), `DELETE /allegati/:id` | write · own |
| Categorie, controlli | `GET/POST/PATCH /categorie`, `/controlli`; `GET /controlli/aggiornamenti`, `POST /controlli/:id/aggiornamento` | config |
| Libreria e avvio | `GET /avvio` (modelli e stato), `GET /avvio/proposta?modelli=…` (voci dei modelli scelti), `POST /avvio` (copia, registro, scadenze; anche "Parto da zero" e "Aggiungi dalla libreria") — B6, ADR076. `GET /libreria` solo se servirà | config |
| Impostazioni | `GET/PUT /impostazioni` | config |
| Avvisi | `GET /avvisi`, `POST /avvisi/:id/letto`, `GET/PUT /preferenze` | tutti (i propri) |
| Costi | `GET /resoconti/…` (passo successivo) | costi |

- **Liste paginate** lato server con filtri e ordinamento (come i log), mai
  "tutto e filtra nel browser".
- Gli **importi** escono solo a chi ha `vigilo.costi` (il servizio li toglie
  dalle risposte, non il frontend).
- **Audit** di ogni modifica con prima/dopo (`clone: true`, L045).

## 6.4 Gateway

Una riga nella tabella (ADR060), con una novità: **inoltro a flusso**
(`stream: true`). Oggi il gateway legge il corpo come JSON e risponde in JSON:
così non passerebbero né il **caricamento** degli allegati (multipart) né lo
**scaricamento** (file). Con `stream: true` il gateway non legge il corpo e
inoltra la richiesta così com'è, aggiungendo gli stessi controlli e header.

```js
{ prefix: '/api/vigilo', target: VIGILO_SERVICE, upstream: '/api/vigilo',
  module: 'vigilo', service: 'vigilo-service', stream: true }
```

## 6.5 Processi pianificati (registrati in log-service, ADR039)

| Processo | Quando | Che cosa |
|---|---|---|
| `vigilo.ricalcolo` | ogni notte (00:16) | stati, date stimate, rinnovi taciti, eventi di avviso del giorno |
| `vigilo.riepilogo` | ogni ora | invia i riepiloghi ai tenant il cui orario cade in quell'ora (predefinito 8:00, giorni lavorativi) |
| `vigilo.consegne` | ogni 16 minuti | consegne email urgenti e nuovi tentativi di quelle fallite |

## 6.6 Integrazioni

- **log-service**: audit ed eventi (come gli altri servizi), processi attesi.
- **email-service**: `POST /send` con template nuovi `vigilo/avviso` e
  `vigilo/riepilogo`.
- **auth-service** (rotte interne, ADR058): account del tenant con i permessi
  `vigilo.*` e i loro indirizzi, per sapere chi è "ufficio". Da aggiungere.
- **auth-service** (dati): ruolo `addetto` e permessi `vigilo.*` sui ruoli
  (migrazione); **pro-frontend**: gruppo Vigilo nel catalogo dei permessi e
  modello suggerito nella finestra di attivazione.

## 6.7 Ordine di costruzione (ogni blocco verificato prima del successivo)

| Blocco | Contenuto | Verifica |
|---|---|---|
| **B1** | scheletro del servizio, database, compose, riga nel gateway con `stream`, `/health`, `/me` | risponde via gateway solo con il modulo in vigore |
| **B2** | regole pure + test unitari | tutti i casi di 1.5 verdi |
| **B3** | modelli e migrazione **completa** (tutte le tabelle dei passi 2-5) | schema creato, nessuna tabella da aggiungere dopo |
| **B4** | libreria: struttura e sincronizzazione, poche voci di prova | sincronizzazione idempotente |
| **B5** | API di categorie, controlli, soggetti, contatori, scadenze, registrazioni + ricalcolo | prove dal vivo come per i moduli |
| **B6** | procedura di avvio (API) | avvio con più modelli, ripetibile |
| **B7** | interfaccia (passo 7): avvio, dashboard, soggetti, scheda, scadenze | a video |
| **B8** | avvisi: processi, campanella, email, preferenze | avvisi veri su dati di prova |
| **B9** | addetto (ambito, segnalazioni) e allegati | con un account addetto |
| **B10** | aggiornamenti della libreria, resoconti dei costi | |

La **libreria vera** (bozza con fonti, validata) si inserisce fra B4 e B6.

## 6.8 Decisioni (2026-10-08)

1. **Inoltro a flusso** (`stream: true`) per tutto `/api/vigilo`.
2. **Test unitari delle regole** con Jest.
3. **Ordine di costruzione B1-B10** confermato.
