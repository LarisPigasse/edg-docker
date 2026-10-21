# Vigilo — 5. Permessi e chi fa cosa

> Passo 5 dell'analisi (ADR064). Stato: **approvato dall'utente il 2026-10-08**.
> Parte dai passi 1-4 (approvati).

## 5.1 Com'è la piattaforma oggi

- I permessi sono stringhe `<modulo>.<azione>` assegnate ai **ruoli**; i ruoli
  sono **globali** (root, admin, operatore, guest), uguali per tutti i tenant.
- Il gateway lascia passare le API di Vigilo solo se il tenant ha il modulo
  in vigore (ADR060); i permessi li controlla il servizio.
- La home e il menu mostrano Vigilo solo a chi ha **almeno un** permesso
  `vigilo.*` (ADR061, ADR063).
- Gli account dei clienti oggi li crea **solo EDG** (`/auth/accounts` richiede
  il tenant di sistema, ADR049).

## 5.2 Permessi di Vigilo — proposta

Pochi permessi, ciascuno una **capacità** chiara (non un elenco di
create/update/delete per ogni tabella):

| Permesso | Che cosa consente |
|---|---|
| `vigilo.config` | procedura di avvio, categorie e campi, controlli, aggiornamenti dalla libreria, impostazioni del tenant (orari, richiami) |
| `vigilo.write` | soggetti, assegnazioni, contatori e letture, scadenze, registrazioni, rinvii, fornitori, allegati |
| `vigilo.read` | vede tutto il tenant in sola lettura |
| `vigilo.costi` | vede importi, costi e resoconti (dati economici: non a tutti) |
| `vigilo.own` | **addetto**: solo le proprie scadenze (patente, visite, corsi) e quelle dei mezzi che ha assegnati; legge i contatori, carica documenti |

- `vigilo.write` comprende la lettura; `vigilo.config` comprende la lettura ma
  non la scrittura dei dati operativi (chi configura non è per forza chi
  registra): si combinano.
- Le **preferenze di avviso** (passo 4) sono di ogni utente, senza permessi.
- Chi è **ufficio** per gli avvisi: chi ha `vigilo.write` o `vigilo.read`.

## 5.3 Ruoli

**Proposta: ruoli globali di oggi + un ruolo nuovo, `addetto`.**

| Ruolo | Permessi Vigilo |
|---|---|
| admin | `vigilo.*` (tutto) |
| operatore | `vigilo.write`, `vigilo.costi` |
| guest | `vigilo.read` |
| **addetto** (nuovo) | `vigilo.own` |
| root | tutto (jolly) |

> Applicato il 2026-10-21 (ADR084): migrazione `auth-service/migrations/2026-10-21-vigilo-permissions.sql`
> e seed dei ruoli; gruppo Vigilo nel pannello Ruoli di pro-frontend.

I ruoli personalizzati **per tenant** (ogni cliente con i suoi ruoli) sono un
cambiamento della piattaforma, non di Vigilo: si rimanda, e i permessi di
Vigilo sono già pensati per funzionare anche con ruoli del cliente.

## 5.4 L'addetto

- È un account collegato a un **soggetto di tipo persona**
  (`soggetti.idAccount`).
- Vede: le scadenze della sua persona; quelle dei soggetti che ha **assegnati
  adesso**; i documenti relativi.
- Può: registrare **letture** dei contatori dei mezzi assegnati; caricare
  **documenti** (foto della patente rinnovata, del certificato); **segnalare
  "fatto"** su una sua scadenza ("ho rinnovato la patente", con data e foto).
- La segnalazione è una registrazione **da confermare**: la scadenza mostra
  *"segnalata da Mario Rossi, da confermare"* accanto al suo stato (che non
  cambia finché l'ufficio non conferma); l'ufficio **conferma** con un clic
  (eventualmente correggendo i dati) o **respinge** con un motivo, e l'addetto
  riceve l'esito. Aggiunta al modello: `registrazioni.stato` (confermata · da
  confermare · respinta), `confermataDa`, `confermataIl`, `motivoRifiuto`; le
  registrazioni da confermare sono anche un evento di avviso per l'ufficio.
- Non vede: costi, altre persone, impostazioni.
- Senza un soggetto persona collegato, l'addetto vede Vigilo vuoto con un
  messaggio chiaro ("Il tuo profilo non è ancora collegato: rivolgiti
  all'ufficio").

## 5.5 Dove si controlla

| Livello | Controllo |
|---|---|
| Gateway | modulo `vigilo` in vigore per il tenant (ADR060, ADR062) |
| vigilo-service | **tenant** (sempre dal JWT, mai dal client), **permesso** per ogni rotta, **ambito** per `vigilo.own` (filtro sui soggetti propri e assegnati) |
| app-frontend | solo cosa mostrare: pagine e azioni secondo i permessi (manifest, ADR063) |

## 5.6 Non ora (annotato)

- **Accesso di supporto di EDG** ai dati di un cliente: oggi il personale EDG
  vede solo il proprio tenant. Un accesso di assistenza, tracciato e
  temporaneo, si progetterà a parte.
- **Ambito per sede** (un responsabile vede solo il suo magazzino): i
  permessi e il filtro dell'ambito sono già il punto dove aggiungerlo.

## 5.7 Decisioni (2026-10-08)

1. **Cinque permessi**: `vigilo.config`, `vigilo.write`, `vigilo.read`,
   `vigilo.costi`, `vigilo.own`.
2. **Ruoli globali + nuovo ruolo `addetto`**; ruoli per tenant rimandati
   (cambiamento della piattaforma).
3. **L'addetto segnala "fatto"**, l'ufficio conferma o respinge (5.4).
4. **Account dei clienti**: per ora li crea EDG su richiesta; l'autogestione
   degli utenti da parte del cliente (inviti, ruoli) diventa un passo della
   piattaforma, da fare prima di avere molti clienti.
