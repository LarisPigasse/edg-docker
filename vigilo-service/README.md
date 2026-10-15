# vigilo-service

Scadenze, manutenzioni, abilitazioni, pagamenti e promemoria di veicoli,
macchine, attrezzature, sedi, persone e azienda: il backend di **Vigilo**.

- Analisi e decisioni: `docs/vigilo/01-dominio.md` … `07-interfaccia.md`,
  ADR064-ADR070.
- Porta **3006**, database **`edg_vigilo`** (PostgreSQL), API sotto
  **`/api/vigilo`** dietro il gateway con inoltro a flusso (`stream: true`).

## Struttura

| Cartella | Contenuto |
|---|---|
| `src/config/` | database |
| `src/core/` | middleware (gateway, permessi, validazione, errori), logger, contesto della richiesta, processi monitorati, risposte standard |
| `src/regole/` | funzioni pure: cadenze, stati, ereditarietà, avvisi (blocco B2, con test in `tests/`) |
| `src/domini/` | un modulo per area: model · schemas · service · controller · routes |
| `src/libreria/` | libreria EDG in file versionati: categorie, controlli e modelli di settore (blocco B4, contenuto in `docs/vigilo/libreria-bozza.md`) |
| `src/processi/` | ricalcolo notturno, riepilogo, consegne (blocchi B5, B8) |
| `src/migrations/` | migrazioni Sequelize (blocco B3) |

## Primo avvio su un volume PostgreSQL esistente (una volta sola)

1. In `.env`: `POSTGRES_VIGILO_USER` e `POSTGRES_VIGILO_PASSWORD`.
2. Ricreare PostgreSQL perché legga le nuove variabili (i dati restano nel volume):
   `docker compose up -d postgres`
3. Creare utente e database (script idempotente):
   `docker exec edg-postgres bash /docker-entrypoint-initdb.d/02-vigilo.sh`
4. Avviare il servizio: `docker compose up -d --build vigilo-service`
5. Creare o aggiornare le tabelle: `docker exec vigilo-service npm run migration:run`

Su un volume nuovo il passo 3 avviene da solo al primo avvio di PostgreSQL;
il passo 5 va ripetuto dopo ogni rebuild che porta migrazioni nuove.

## Libreria EDG

I file di `src/libreria/` (uno per tipo di soggetto, più `modelli.ts`) si
sincronizzano nelle tabelle `libreria_*` a ogni avvio; l'app legge solo le
tabelle. Per cambiare una voce:

1. modificarla nel file e **aumentarne la `versione`**;
2. `npm run libreria:versioni` (registra le impronte in `versioni.json`; rifiuta
   un contenuto cambiato senza nuova versione);
3. `npm test`, commit, rebuild: i clienti vedono "Aggiornamento disponibile".

Una voce tolta dai file diventa *ritirata* (si segnala, non si cancella).

Il cliente riceve le voci con la **procedura di avvio** (`src/domini/avvio`):
le copia con la fotografia dei valori (`origine`) e scrive ogni scelta, inclusa
o tolta, nel registro `decisioni_libreria` (ADR074, ADR076).

## Comandi

- `npm run dev` — sviluppo con ricaricamento
- `npm run build` / `npm start`
- `npm test` — test unitari delle regole e della libreria
- `npm run libreria:versioni` — registra versioni e impronte della libreria
- `npm run migration:run` — migrazioni (anche dentro il container)
