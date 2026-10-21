# Accesso assistito — analisi

> Blocco della piattaforma previsto da ADR077 (punto 2), anticipato da ADR084.
> Stato: **approvato dall'utente il 2026-10-21** (ADR085).

## 1. Che cos'è

Il personale EDG entra nel tenant di un cliente **dal proprio account**, per un
tempo limitato, senza conoscere password altrui e senza account di comodo.
Ogni azione resta attribuita alla persona che la compie.

Due modalità:

| Modalità | Per che cosa | Che cosa si può fare |
|---|---|---|
| **Preparazione** | preparare un modulo per il cliente (Vigilo) | scrivere, con i permessi che avrebbe l'admin del cliente |
| **Assistenza** | "vedi come l'utente X" per capire un problema | solo leggere, con i permessi di X |

Si realizza **prima la Preparazione**; l'Assistenza arriva dopo, sullo stesso
impianto.

Non è: un modo per cambiare password o dati dell'account del cliente; un
accesso permanente; un accesso alle funzioni di SISTEMA dentro il tenant del
cliente.

## 2. Com'è la piattaforma oggi

- **Token**: auth-service firma un JWT di 15 minuti (`accountId`, `tenantId`,
  `accountType`, `permissions`, `modules`, `systemTenant`, `sessionId`) e un
  refresh token di 7 giorni legato a una riga di `sessions`.
- **Gateway**: verifica il JWT e lo passa ai servizi nell'header `x-user-data`;
  `moduleGuard` controlla i moduli del tenant; `sessionGuard` respinge subito
  account bloccati e sessioni revocate (chiavi Redis `blocked:*`).
- **Servizi**: prendono tenant, account e permessi da `x-user-data`; le colonne
  di audit (es. `creato_da` in Vigilo) e i log usano `accountId`.
- **Frontend**: `@edg/auth` legge il token prima da `localStorage`, poi da
  `sessionStorage`.
- **Account**: l'email è unica su tutta la piattaforma; gli id degli account
  sono unici su tutta la piattaforma (tabella unica in `edg_auth`).

## 3. Il modello

### 3.1 La sessione assistita

Nuova tabella `assisted_sessions` in `edg_auth`:

| Campo | Significato |
|---|---|
| `id`, `uuid` | identità della sessione |
| `operatorAccountId` | chi agisce davvero (account EDG) |
| `tenantId` | il tenant del cliente |
| `modo` | `preparazione` · `assistenza` |
| `perContoAccountId` | solo in Assistenza: l'utente di cui si vede la vista |
| `motivo` | testo breve obbligatorio ("Preparazione Vigilo") |
| `startedAt`, `expiresAt` | inizio e scadenza (64 minuti) |
| `endedAt`, `endReason` | fine: `uscita` · `scaduta` · `chiusa da EDG` |
| `ipAddress`, `userAgent` | da dove |

### 3.2 Il token assistito

Un JWT normale, così gateway e servizi non cambiano, con un campo in più:

| Campo | Preparazione | Assistenza (dopo) |
|---|---|---|
| `accountId` | l'operatore EDG | l'utente X |
| `tenantId` | il cliente | il cliente |
| `permissions` | quelli dell'**admin**, limitati ai moduli attivi del tenant, **mai** `sistema.*` | quelli di X |
| `systemTenant` | `false` | `false` |
| `assistenza` | `{ id, modo, operatore, tenant, scade }` | idem, con `perConto` |

- In Preparazione `accountId` è l'operatore: audit e log attribuiscono ogni
  azione alla persona giusta senza toccare i servizi.
- `systemTenant: false` impedisce, dentro il tenant del cliente, qualsiasi
  funzione di SISTEMA e l'apertura di un'altra sessione assistita.
- Durata **64 minuti**, **nessun refresh token**: alla scadenza si esce.
  Chiusura immediata con la chiave Redis `blocked:assist:<id>`, controllata
  da `sessionGuard` come le sessioni revocate di oggi.

### 3.3 Chi può entrare

- Permesso nuovo **`sistema.assistenza`** (gruppo Sistema del pannello Ruoli),
  valido solo per il personale EDG (tenant di sistema, come gli altri
  `sistema.*`).
- Solo tenant **attivi** e **non di sistema**.
- Una sola sessione assistita aperta per operatore.

## 4. Il flusso

1. **pro-frontend**, scheda del tenant: *Entra nel tenant* → modalità e motivo.
2. `POST /auth/assistenza` crea la sessione e restituisce un **codice
   monouso** (valido 64 secondi, una sola volta, in Redis).
3. Si apre una nuova scheda di **app-frontend** su `/assistenza#<codice>`.
   Il codice sta dopo `#`, quindi non arriva ai server né ai loro log; il
   token non è mai nell'indirizzo.
4. app-frontend scambia il codice (`POST /auth/assistenza/scambio`) e riceve
   il token assistito.
5. Il token si conserva **solo in quella scheda** (`sessionStorage`, chiavi
   proprie) e ha la precedenza sulla sessione normale, che resta intatta
   nelle altre schede.
6. Una **barra sempre visibile** in alto: *Assistenza · Preparazione ·
   Trasporti Rossi srl · scade alle 11:42 · Esci*. Avviso 8 minuti prima della
   scadenza.
7. *Esci* (o la scadenza) chiude la sessione: `POST /auth/assistenza/fine`, la
   scheda torna a una pagina "Sessione di assistenza terminata".
8. In pro-frontend, una pagina **Assistenze** elenca le sessioni aperte e
   passate; root (o chi ha `sistema.assistenza`) può chiudere quelle aperte.

## 5. Tracce

- Inizio, fine e motivo: log-service, categoria sicurezza, con operatore e
  tenant.
- Ogni azione: già registrata dai servizi con l'`accountId` dell'operatore.
- Il gateway passa anche `assistenza` in `x-user-data`, così un servizio può
  scrivere nei propri log che l'azione è avvenuta in assistenza.
- Più avanti: il cliente vede gli accessi dell'assistenza nel suo tenant e,
  eventualmente, li consente o meno.

## 6. Che cosa cambia, servizio per servizio

| Dove | Che cosa |
|---|---|
| auth-service | tabella, tre rotte, token assistito, permesso `sistema.assistenza`, log |
| auth-service (AA2) | cambio password e logout da tutti i dispositivi vietati col token assistito (`vietatoInAssistenza`) |
| api-gateway | `assistenza` in `x-user-data`; `blocked:assist:*` in `sessionGuard`; più avanti blocco delle scritture in Assistenza |
| `@edg/auth` | sessione assistita per scheda con precedenza; nessun rinnovo; stato `assistenza` esposto a chi lo chiede |
| `@edg/ui` | spazio `banner` sopra l'header in `MainLayout` (`--edg-banner-h`); la barra sta in `@edg/auth` (`AssistenzaBar`) perché legge la sessione |
| app-frontend | pagina `/assistenza`, barra, pagina di fine; header col nome del tenant del cliente |
| pro-frontend | *Entra nel tenant* nella scheda del tenant; pagina Assistenze |
| vigilo-service | (blocco successivo) chi può avviare = sessione in Preparazione |

## 7. Punti delicati

- **Precedenza del token**: oggi `localStorage` vince; senza la nuova
  precedenza la scheda assistita userebbe la sessione normale dell'operatore.
- **Nome del tenant**: l'header oggi mostra il tenant dell'account (EDG); in
  assistenza deve mostrare il cliente, dal campo `assistenza` del token.
- **Preferenze personali** dell'operatore dentro il tenant del cliente (es.
  avvisi di Vigilo): non si salvano in modalità assistita.
- **Lavoro in corso alla scadenza**: la procedura di avvio di Vigilo si
  conferma in un colpo solo, quindi non resta a metà; i campi non salvati di
  un modulo si perdono, da qui l'avviso a 8 minuti.
- **Codice che vede tipo di account `operatore`** in un tenant cliente: va
  cercato e verificato nel blocco di realizzazione.

## 8. Blocchi

| Blocco | Contenuto |
|---|---|
| **AA1** ✅ | auth-service (tabella, rotte, token, permesso, log) e gateway; prove dal vivo 58/58 sui due gateway (2026-10-21) |
| **AA2** ✅ | `@edg/auth`, `@edg/ui` e app-frontend: scambio del codice, sessione per scheda, barra, fine; visto a video e prove dal vivo 62/62 (2026-10-21) |
| **AA3** ✅ | pro-frontend: *Accesso assistito* nelle azioni del tenant (finestra con modalità e motivo; scheda aperta nel clic, collegamento a mano se il browser la blocca) e pagina *SISTEMA › Assistenze* (aperte/tutte, chiusura); visto a video il 2026-10-21 |
| AA4 (dopo) | Assistenza "vedi come X" in sola lettura |
| AA5 (dopo) | accessi dell'assistenza visibili al cliente |

## 9. Decisioni (2026-10-21)

1. **Permessi in Preparazione**: quelli dell'admin, limitati ai moduli attivi
   del tenant, mai `sistema.*`.
2. **Chi può entrare**: chiunque abbia `sistema.assistenza`, con motivo
   obbligatorio e tracce. La restrizione all'operatore che segue il cliente
   si potrà aggiungere più avanti.
3. **Durata**: 64 minuti fissi, senza proroga (ADR077); per continuare si
   apre una nuova sessione.
