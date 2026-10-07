# Ripartenza — prossima sessione

> Documento di passaggio tra conversazioni. Leggerlo **dopo** `get-dev-briefing`
> (che riassume moduli, ADR e lezioni da `modules.json`, `decisions.json`,
> `lessons.json`). Qui c'è ciò che quei file non contengono: il punto esatto in
> cui siamo, il prossimo argomento con la proposta già ragionata e le domande
> ancora aperte. Aggiornato: 2026-10-06 sera (gestione moduli fasi 1-3, aspetto, home a riquadri, vetrina, versione, tenant ↔ cliente, settori — ADR048-ADR059). Prossimo: **commit** (fase 3 + settori, se non già fatto), poi fase 4 (gateway e app-frontend).

---

## 1. Dove siamo

Conclusa la parte **gestione e monitoraggio del sistema** (ADR034–ADR046), tutta
verificata dal vivo e committata in edg-docker ed edg-system.

| Area | Stato | Riferimenti |
|---|---|---|
| Log: audit "chi ha fatto cosa" con prima/dopo, transazioneId, log mai cancellabili | fatto | ADR034, ADR037, ADR039 |
| Coda in memoria nei logger (nessun evento perso) | fatto | ADR041 |
| SISTEMA → Info: Salute / Regole / Storico | fatto | ADR038 |
| Riavvii, crash, gravità per regola, build/deploy | fatto | ADR042–ADR044 |
| Processi pianificati monitorati (job.completed/failed/missed) | fatto | ADR039 |
| Backup locale giornaliero (backup-service) | fatto | ADR045, L044 |
| Riepilogo giornaliero via email | fatto | ADR046 |
| Gestione moduli fase 1: catalogo, attivazioni, JWT, API, scadenza | fatto | ADR047, ADR048, L045, L046 |
| Account gestibili dall'admin EDG, root intoccabile (passo 3b) | fatto | ADR049 |
| Menu SISTEMA per permessi (admin: Account e Tenant), Blocca/Sblocca all'admin | fatto, verificato a video | ADR050 |
| `systemTenant` nel JWT, `sistema.*` di log-service solo personale EDG; catalogo permessi completo + "Altri permessi del ruolo" | fatto | ADR051 |
| Ritocchi UI: pannello permessi a 3 colonne (Modal `xxxl`), Logs compatta senza scroll (Table `size='xs'` + `fit`), scheda **Guida** in Info con valori dal vivo | fatto, verificato a video | ADR052, L047 |
| Gestione moduli fase 2 (UI): SISTEMA → Moduli (root), moduli del tenant in finestra a due colonne, settore del tenant | fatto, verificato a video | ADR053 |
| Aspetto dei moduli: icona, logo, titolo (immagine o testo Tailwind), finestra Aspetto, scheda del modulo | fatto, verificato a video | ADR054 |
| Home a riquadri (frontend + moduli, 5:4, ScaleToFit) in @edg/ui; pro-frontend la usa | fatto, verificato a video | ADR055 |
| Moduli in vetrina (flag `showcase`) e versione del modulo | fatto; filtro per i clienti nella fase 4 | ADR056, ADR057 |
| Menu a tendina: icone su tutte le voci o su nessuna (`TableRowAction` con icona obbligatoria) | fatto | L048 |
| Fase 3: tenant ↔ cliente dell'anagrafica EDG (1:1, "Crea tenant" da Anagrafiche, eliminazione del cliente collegato bloccata); prime rotte interne `/internal` di auth-service | fatto, verificato dal vivo (13/13); UI da provare a video | ADR058 |
| Settore sull'anagrafica (tabella di base Settori), tolto dal tenant; `LookupTableTab` generico per le tabelle di base | fatto, verificato dal vivo (10/10); UI da provare a video | ADR059 |
| Limite richieste su Redis con ripiego in memoria | fatto | ADR040 |

## 2. Rimandato (non dimenticare)

**Alla pubblicazione in produzione**
- Copia dei backup **fuori sede e cifrata** (idea: rclone verso hosting Aruba o storage a oggetti), conservazione definitiva (oggi 2/1/1), **prova di ripristino** vera.
- Monitor esterno della piattaforma (serve approvazione della direzione).
- `CRON_RUN_ON_START: 'false'` in produzione (auth-service e vehicle-service).
- Sul server, una volta: `node dist/scripts/normalizeServiceNames.js` nel container log-service (ADR044).
- Sul server, una volta: migrazione `auth-service/migrations/2026-10-01-module-catalog.sql` (ADR048) **insieme** al deploy del nuovo auth-service (toglie la riga `*` di EDG: con il vecchio codice EDG resterebbe senza moduli). Poi `auth-service/migrations/2026-10-01-admin-account-permission.sql` (ADR049), `2026-10-05-module-branding.sql` (ADR054), `2026-10-06-module-showcase.sql` (ADR056), `2026-10-06-module-version.sql` (ADR057), `2026-10-06-tenant-cliente.sql` (ADR058), `2026-10-06-tenant-drop-sector.sql` (ADR059). In system-service: `npx sequelize db:migrate` (migrazione `20261006-01-settori.js`, ADR059). Nei compose c'è la nuova variabile `AUTH_SERVICE_URL` per system-service (ADR058).
- ADR039 punto 5: utente MongoDB con permessi minimi, scadenza/archiviazione dei log (ADR037), riepilogo settimanale di igiene.
- Allarme cancellazioni in massa: non serve codice, si crea da SISTEMA → Info → Regole (tipo `crud.delete`, es. 16 in 16 min, raggruppa per utente).

**Su indicazione dell'utente**
- Rotazione dei log Docker anche in locale (`docker-compose.yml`): **aspettare che lo dica lui**.
- Tabella `vehicle_deadlines` mancante (il controllo giornaliero veicoli fallisce): con la **revisione del modulo veicoli**.

## 3. Prossimo argomento: gestione dei moduli

### 3.1 Richiesta dell'utente (sintesi fedele)
- Un **modulo** è un'applicazione del "Sistema EDG" (es. **Vigilo**: scadenze di veicoli e mezzi) oppure una parte di un'applicazione (es. **tracking** delle spedizioni, **gestione** delle spedizioni).
- Un modulo ha un **nome** e un **menu** (si configura come una feature) e si **assegna a un tenant**.
- Possibile attrito **tenant ↔ cliente in anagrafica**: va pensato bene.
- **Root e admin** devono poter gestire i moduli.
- Assegnazione **in prova** per un periodo determinato.
- Ogni modulo ha una **versione demo** su un tenant demo, da mostrare ai potenziali clienti, con un modo per **ripulire i dati inseriti durante la dimostrazione** e tornare ai dati di prova originali. **La demo si fa dopo la versione normale.**

### 3.2 Cosa esiste già (verificato il 2026-10-01)
- auth-service (MySQL): tabelle `tenants` (name, slug, isSystem, isActive, defaultLocale) e `tenant_modules` (tenantId, `module` **stringa libera**, nessun catalogo). Tenant di sistema "Express Delivery Group" con modulo jolly `*`.
- `modules` nel JWT, calcolati a **login e refresh** (`AuthService.loadTenantModules`); access token 15 min.
- Gateway: `middleware/moduleGuard.js` (`requireModule`) applicato **solo** a `/api/vehicles` con chiave `'vehicles'` (mentre il prodotto si chiama Vigilo: chiavi incoerenti).
- Tenant CRUD root-only in auth-service (`/auth/tenants`, ADR024); pagina Tenant in pro-frontend.
- system-service: `anagrafiche` con `idTenant` (rubrica isolata per tenant, ADR022); `accounts.accountType` + `entityId` collegano un account a un'anagrafica.
- ADR009 (feature toggling), ADR010 (due frontend: app-frontend per gli utenti con i moduli, pro-frontend per gli operatori EDG; i moduli non si importano fra loro), ADR012 (branding per dominio).

### 3.3 Proposta ragionata (approvata: vedi 3.4 per le decisioni)

1. **Il modulo nasce nel codice, il database lo accende.** Un modulo non si può "creare" dalla UI: rotte, menu, permessi e schermate sono codice. Proposta:
   - *Manifest* nel frontend: `features/<modulo>/module.ts` (chiave, etichetta, menu, rotte, permessi).
   - *Catalogo* nel database (auth-service): stessa chiave + dati gestibili (nome visualizzato, descrizione, prodotto di appartenenza, dipendenze, stato: in sviluppo / disponibile / dismesso, durata predefinita della prova).
   - Chiavi uniche e stabili ovunque (JWT, gateway, permessi): niente più `vehicles` vs `vigilo`.
2. **Gerarchia leggera.** Catalogo piatto con due attributi: **prodotto** (Vigilo, Logistica, … usato per raggruppare il menu e per il branding per dominio, ADR012) e **dipendenze** ("tracking richiede spedizioni"). Più semplice di un albero applicazione → modulo.
3. **Assegnazione = attivazione con periodo e stato.** `tenant_modules` diventa *attivazione*: stato `prova | attivo | sospeso | scaduto`, data inizio, data fine (obbligatoria per la prova), note, chi l'ha concessa. Ogni cambio auditato (ADR039).
   - Il JWT include solo le attivazioni valide **adesso**; il gateway resta l'unico controllo vero. A scadenza l'accesso cessa al più tardi al refresh successivo (≤ 15 min).
   - **Alla scadenza della prova i dati non si cancellano**: il modulo si blocca, i dati restano; se il cliente acquista, si riattiva e ritrova tutto.
   - Processo pianificato in auth-service (`runJob`) che porta a `scaduto` le prove finite; **prove in scadenza** nel riepilogo giornaliero (ADR046) o email al commerciale EDG.
4. **Tenant ≠ cliente, collegamento facoltativo.**
   - *Tenant* = chi ha un proprio spazio nella piattaforma (utenti e dati isolati).
   - *Cliente* = soggetto commerciale nell'anagrafica di EDG (fatturazione, contratti).
   - Relazione 0..1: non ogni cliente è un tenant (chi spedisce senza accedere), non ogni tenant è un cliente (EDG stesso, tenant demo). Proposta: campo facoltativo sul tenant con l'UUID dell'anagrafica cliente (database diversi: riferimento "morbido" via UUID, ADR014), azione "Crea tenant da questo cliente" con dati precompilati, dati commerciali solo sull'anagrafica.
5. **Root e admin.** Nuovi permessi (es. `sistema.moduli`): **admin** gestisce attivazioni e prove; **root** anche il catalogo (dati tecnici: chiave, dipendenze, stato). Oggi i tenant sono solo root (ADR024): decidere se anche admin può crearli.
6. **Gateway dichiarativo.** Da `requireModule('vehicles')` scritto a mano a una tabella "prefisso di rotta → modulo" in un unico punto.
7. **Menu in app-frontend** costruito dai manifest dei moduli attivi nel JWT (ADR010); pro-frontend resta per gli operatori.
8. **Pensare alla demo fin da subito (anche se si fa dopo).**
   - Regola: **ogni tabella di modulo deve avere il tenant** (come `anagrafiche.idTenant`), altrimenti non si può ripulire un solo tenant.
   - Dati di prova come *fixture* versionate nel codice di ogni modulo, con **date relative a oggi** (fondamentale per Vigilo: una demo con scadenze di due anni fa non convince).
   - Ripristino = cancellare i dati del tenant demo + ricaricare le fixture: pulsante "Ripristina demo" e/o processo notturno.
9. **Per dopo, non ora:** limiti per piano (numero utenti, veicoli), fatturazione.

### 3.4 Decisioni dell'utente (2026-10-01, ADR047)
1. **Catalogo senza gerarchia**: ogni modulo ha *prodotto* e *dipendenze*. Confermato.
2. **Permessi**: il **root** gestisce anche il **catalogo**; l'**admin** gestisce attivazioni e prove e **può creare tenant e account** (oggi i tenant sono solo root, ADR024: da estendere).
3. **Fine prova**: modulo bloccato, **dati conservati fino a 64 giorni**; un **admin può eliminarli prima**. Dopo i 64 giorni l'eliminazione e' automatica.
4. **Avvisi**: ad **admin e root**, **8 giorni e 1 giorno prima** dell'eliminazione dei dati.
5. **Tenant ↔ cliente**: collegamento facoltativo dal tenant all'anagrafica cliente, confermato.
6. **Chiavi dei primi moduli**: `vigilo`, `spedizioni`, `tracking`, … **`vehicles` sparisce e diventa `vigilo`.**
   Vigilo sarà **configurabile per tipologia di attività del tenant** (trasportatore, azienda agricola, movimento terra, …): veicoli, mezzi e addetti cambiano da un settore all'altro. Le differenze sono **ancora da stabilire**: prevedere nel catalogo/attivazione una *configurazione per tenant* (es. `settore` + opzioni), senza definirne ora il contenuto.

**Punti ancora da chiarire con l'utente quando si arriva alla fase relativa**
- Avvisare anche alla **scadenza della prova** (oltre che prima dell'eliminazione dei dati)? A chi: admin/root di EDG, o anche gli utenti del tenant?
- Eliminazione dei dati "per modulo": ogni servizio deve esporre un modo per cancellare i dati di un tenant per un modulo (servirà anche alla demo): definire il contratto comune.
- Dove vive la "tipologia di attività": sul tenant (vale per tutti i moduli) o sull'attivazione di Vigilo?

### 3.5 Fasi proposte (una alla volta, con verifica)
1. ✅ **Fatta (ADR048)** — Catalogo moduli + attivazioni con periodo e stato (auth-service: migrazione da `tenant_modules`, JWT, processo di scadenza).
2. ✅ **Fatta (ADR049-053)** — pro-frontend: SISTEMA → Moduli (catalogo, root) e finestra Moduli dalla lista Tenant (attivazioni, prove); permessi admin.
   ✅ **Aggiunte (ADR054-057)** — aspetto dei moduli, home a riquadri, vetrina, versione.
3. ✅ **Fatta (ADR058)** — Collegamento tenant ↔ cliente anagrafica. Con essa (ADR059) il settore passa all'anagrafica.
4. Gateway con mappa rotte → moduli; menu di app-frontend dai manifest. Inoltre (ADR054-056): endpoint per gli utenti dei tenant con i propri moduli e quelli in vetrina (filtrati nel backend, con branding e versione); home di app-frontend con `HomeAppTile` + `HomeModuleTile` (stato attivo / non-attivo / sviluppo; scaduti e sospesi sempre visibili; niente moduli senza permessi del ruolo); header con il titolo del modulo; clic su un modulo in vetrina = scheda con descrizione e contatti EDG.
5. Demo: tenant demo, fixture con date relative, ripristino.

### 3.6 Stato dopo la fase 1 (2026-10-01)
**Fatto e verificato dal vivo** (36/36 controlli via gateway, audit con diff in MongoDB, processo di scadenza):
- auth-service: `modules` (catalogo), `tenant_modules` come attivazione, `tenants.sector`; `ModuleService` (moduli del JWT), `moduleRules.ts` (regole pure), `ModuleCatalogService`, `ModuleActivationService`, `ModuleController`, `routes/module.routes.ts`, `middleware/tenantMiddleware.ts` (`requireSystemTenant`).
- API: `/auth/modules` (lettura `sistema.moduli`, scrittura root) e `/auth/tenants/:tenantId/modules` (`sistema.moduli`); `/auth/tenants` con `sistema.tenant` (eliminazione solo root). **Solo account del tenant di sistema**: il ruolo admin è globale e `demo@` (tenant `ted`) è admin.
- Processo `auth.module-expiry` alle 00:08, nei processi attesi di log-service. Gateway su `requireModule('vigilo')`.
- Dati attuali: catalogo con `vigilo`, `spedizioni`, `tracking` (stato `sviluppo`); nessuna attivazione; nessun settore.

**Prossimi passi, in ordine**
1. ✅ **Passo 3b fatto (ADR049)**: `/auth/accounts` con `sistema.account` + `requireSystemTenant`; `AccountController.checkActorLimits` (mai ruolo root, mai account root, mai il proprio ruolo); eliminazione definitiva e permessi dei ruoli solo root; l'admin può creare altri admin. 21/21 controlli.
2. ✅ **Menu SISTEMA per permessi (ADR050)**: `getModules(hasPermission)`; admin vede **solo Account e Tenant** (deciso dall'utente); azioni sui root, Elimina definitivamente, Vedi attività ed Elimina tenant nascoste all'admin. Blocca/Sblocca anche all'admin (`utils/actorLimits.ts` condiviso). Verificato a video (dopo Ctrl+Shift+R: il ricaricamento a caldo di Vite non riapplica il menu calcolato in App.tsx).
   ✅ **ADR051**: JWT con `systemTenant`; log-service richiede `systemTenant` per `sistema.*`; pannello Ruoli con gruppo "Sistema (piattaforma)" completo e sezione "Altri permessi del ruolo". Ora è sicuro dare all'admin anche Log/Salute/Allarmi (menu: voci Logs/Info restano `permission: '*'`, da aprire all'admin se lo si decide).
3. ✅ **Fase 2 fatta (ADR053)** — scelta dell'utente: moduli del tenant in una **finestra** (non una pagina). Dettaglio originale della proposta: SISTEMA → Moduli (catalogo, **solo root**, voce con `permission: '*'`) e **scheda Moduli dentro la pagina Tenant** (attivazioni, prove, proroghe, sospensioni; mostrare `inForce`, `purgeAt`, `lostModules`) usabile anche dall'admin (`sistema.moduli`); campo Settore nel form Tenant.
4. Rinviati (serve il contratto comune "cancella i dati di un tenant per un modulo", condiviso con la demo): eliminazione dati dopo 64 giorni da `expiredAt`, eliminazione anticipata da parte dell'admin, avvisi ad admin e root a 8 giorni e a 1 giorno.

**Domande ancora aperte**: avviso anche alla scadenza della prova (a chi?). Settore per i moduli (ADR059): un tenant senza cliente (demo) non ha settore; ipotesi di un "profilo" in `tenant_modules.config` che parte dal settore del cliente. Da decidere con Vigilo. Account collegati a un'anagrafica: oggi non bloccano l'eliminazione (scelta dell'utente "per ora"); la rotta interna li conta già.

## 4. Come lavorare con Mormegil (promemoria)
- Lingua italiana. **Quantità come potenze di 2** ovunque possibile (16, 32, 64… non 15, 30, 60).
- Un passo alla volta, con dialogo; proporre e attendere conferma sulle decisioni; codice semplice, elegante, modulare ("divide et impera"); app belle e funzionali.
- Ogni funzionalità proposta va valutata con **"il gioco vale la candela"** (costo/beneficio).
- Le questioni amministrative/commerciali richiedono l'approvazione della **direzione**.
- Lui esegue rebuild e commit; dopo ogni rebuild si verifica dal vivo (log dei container, MongoDB, endpoint) prima di dichiarare finito.

## 5. Note operative per l'assistente
- Repository: `D:\Sviluppo\edg-docker` (backend, compose, docs/dev-knowledge) e `D:\Sviluppo\edg-system` (frontend monorepo). Backup in `D:\Sviluppo\edg-backups`.
- Modificare i file **in place** sul PC (device_bash + patch python), controllare con `tsc --noEmit`. Alcuni file sono **CRLF** (es. `log-service/Dockerfile`): conservare i fine riga.
- Non lanciare `git status` mentre l'utente lavora (lascia `index.lock`, L038); i commit li fa l'utente.
- `exec-in-container` dell'MCP: niente `sh -c '…'` (passa da Windows) e niente comandi con `throw` (bloccati). MongoDB dei log: interrogarlo con `node -e` dentro il container log-service (`MONGODB_URI`); collezioni `azionelogs`, `alerthistory`, `alertrules`, `alertrecipients`, `alertingmeta`.
- Tipi di evento: campo `sottoCategoria`; servizio: `azione.entita` (nome del container, ADR044).
- Prima di dichiarare un percorso Docker valido su Windows: `grep <dest> /proc/mounts` nel container (L044).
- `exec-in-container` passa da cmd di Windows e poi da `sh`: nei `node -e` niente `=>`, `||`, `&&`, `$`, backtick (L046). Script lunghi: gzip+base64 scritto nel container e poi eseguito; nel gateway `workDir` = `/usr/src/app`.
- Struttura servizi moduli in auth-service: `ModuleService` (solo moduli in vigore per il JWT; nome deciso dall'utente, NON rinominarlo), `moduleRules.ts`, `ModuleCatalogService`, `ModuleActivationService` (anche `expireEnded`), `ModuleError`.
- Joi `.email()` rifiuta domini non reali (es. `.local`): nelle prove usare `example.com`.
- Prove delle API senza password: firmare un JWT di prova dentro api-gateway-1 con `JWT_SECRET` (account reali: 1 root, 3 admin EDG, 2 operatore, 4 admin di `ted`) e chiamare `http://localhost:8080/auth/...`. Ripulire sempre i dati di prova.
- Audit di una modifica: verificare `stato.diff` in `azionelogs`, non solo che l'evento esista (L045).
