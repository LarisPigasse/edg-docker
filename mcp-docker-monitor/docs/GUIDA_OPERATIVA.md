# 🎯 Control Tower MCP v2.5.0 - Guida Operativa Quotidiana

**Per:** Mormegil  
**Scopo:** Dialogo costruttivo per gestione ottimale sistema EDG Docker HA  
**Versione:** 2.5.0 (59 tool disponibili)  

---

## 🤝 FILOSOFIA D'USO

Questa guida è pensata per facilitare il **dialogo naturale** tra te e Claude per gestire il sistema. Non serve ricordare i nomi esatti dei tool - basta **parlare normalmente** di ciò che vuoi fare o verificare.

### Come Comunicare
✅ **Parla naturalmente**: "Come sta andando il sistema?"  
✅ **Chiedi suggerimenti**: "Cosa mi consigli di controllare?"  
✅ **Spiega il problema**: "MongoDB sembra lento, vediamo cosa succede"  
✅ **Richiedi azioni**: "Facciamo un backup completo"  

❌ Non serve: "Esegui docker-monitor:health-report"  
✅ Basta dire: "Fammi vedere lo stato di salute del sistema"

---

## 📊 SCENARI D'USO QUOTIDIANI

### 🌅 Check Mattutino (5 minuti)

**Tu dici:**
> "Buongiorno Claude, come sta il sistema? Fammi un check completo"

**Claude farà:**
1. Health report generale
2. Verifica container critici
3. Check risorse sistema (CPU, RAM)
4. Alert recenti (se presenti)
5. Suggerimenti se nota anomalie

**Esempio di risposta:**
```
✅ Sistema in salute
- 10 container running, tutti healthy
- CPU sistema: 23%, RAM: 58%
- Nessun alert critico nelle ultime 24h
- API Gateway primario: 99.2% uptime
- Database: MySQL 4.2GB, MongoDB stabile

💡 Suggerimento: L'ultimo backup risale a 3 giorni fa,
   potremmo farne uno nuovo.
```

---

### 🔍 Investigare un Problema

**Scenario:** Noti che il sito è lento

**Tu dici:**
> "Il frontend sembra lento, controlliamo cosa succede"

**Claude farà:**
1. Check metriche frontend (CPU, RAM, Network)
2. Verifica connettività con API Gateway
3. Check load balancer (Traefik)
4. Analisi logs recenti per errori
5. Verifica database performance

**Poi suggerirà:**
```
🔍 Ho trovato:
- Frontend CPU al 78% (sopra la media del 30%)
- API Gateway ha 234 richieste in coda
- MongoDB ha un query lento nei logs

💡 Suggerimenti:
1. Possiamo riavviare il frontend per liberare memoria
2. Controlliamo i logs MongoDB per query problematiche
3. Verifichiamo se ci sono picchi di traffico inusuali

Vuoi che approfondisca uno di questi punti?
```

---

### 🛠️ Manutenzione Programmata

**Tu dici:**
> "Devo aggiornare il microservizio shipping, come procediamo?"

**Claude suggerirà:**
```
📋 Piano di manutenzione per shipping-service:

1. Abilito maintenance mode (pauso i frontend)
2. Faccio backup del database prima dell'aggiornamento
3. Fermo il container shipping-service
4. Tu fai l'update (pull nuova immagine)
5. Riavvio il container
6. Verifico health status
7. Disabilito maintenance mode

Procediamo? Oppure preferisci un approccio diverso?
```

---

### 📦 Gestione Backup

**Tu dici:**
> "È ora di fare i backup, facciamo tutto"

**Claude farà:**
```
🔄 Avvio backup completo...

✅ MySQL backup: 3.4 MB completato
✅ MongoDB backup: 156 MB completato  
✅ Volumi Docker: 1.2 GB completati

📊 Backup salvati in: d:/sviluppo/claude/backups
Spazio totale: 1.35 GB
Durata: 1m 23s

💡 Ultimo cleanup: 5 giorni fa
   Vuoi che verifichi i backup vecchi da rimuovere?
```

---

### 🚨 Gestione Alert e Incidenti

**Claude ti avviserà autonomamente se:**

**Alert CRITICAL:**
```
🚨 ALERT CRITICO
Database MySQL non risponde!

🔍 Diagnostica rapida:
- Container: stopped (unexpected)
- Last log: connection timeout
- Uptime prima del crash: 48h

🛠️ Azioni immediate che posso fare:
1. Riavvio container MySQL
2. Verifico logs dettagliati
3. Check spazio disco
4. Verifico integrità volume

Procedo con il riavvio? Oppure vuoi prima vedere i logs?
```

**Alert WARNING:**
```
⚠️  Attenzione: CPU API Gateway al 82%

📊 Analisi:
- Media ultima ora: 78%
- Trend: in aumento
- Traffico: +34% rispetto a ieri

💡 Suggerimenti:
- Potrebbe essere traffico legittimo (picco orario)
- Oppure potremmo scalare il gateway (aggiungere replica)
- Monitoriamo ancora 10 minuti prima di agire?

Fammi sapere come vuoi procedere.
```

---

## 🎯 COMANDI RAPIDI PER SITUAZIONI COMUNI

### Check Veloce Sistema
**Tu:** "Status rapido"  
**Claude:** Health report + metriche principali

### Container Problematico
**Tu:** "auth-mysql non risponde"  
**Claude:** Diagnostica + logs + suggerisce restart

### Performance Check
**Tu:** "Come vanno le performance?"  
**Claude:** CPU/RAM tutti i container + confronto con baseline

### Backup Urgente
**Tu:** "Backup immediato di MySQL"  
**Claude:** Esegue backup + conferma + dimensione file

### Container Lento
**Tu:** "frontend-1 è lento"  
**Claude:** Metriche dettagliate + logs + suggerisce azioni

### Alert History
**Tu:** "Cosa è successo oggi?"  
**Claude:** Storico alert + eventi principali + analisi

---

## 🧠 CLAUDE SUGGERISCE PROATTIVAMENTE

### Quando Claude Prende l'Iniziativa

**Se nota pattern anomali:**
```
💡 Ho notato che MongoDB ha CPU elevata da 2 ore.
   Vuoi che indaghi? Potrebbe essere un index mancante
   o una query non ottimizzata.
```

**Se rileva problemi ricorrenti:**
```
📊 Negli ultimi 3 giorni il frontend-2 si è riavviato 4 volte.
   Sembra esserci un memory leak. Possiamo:
   1. Analizzare i logs per trovare la causa
   2. Aumentare la RAM allocata temporaneamente
   3. Pianificare un restart preventivo giornaliero
   
   Quale approccio preferisci?
```

**Se vede opportunità di ottimizzazione:**
```
✨ Analizzando i backup, ho visto che abbiamo 15 GB
   di backup vecchi (>30 giorni).
   
   Possiamo liberare spazio con il cleanup automatico?
   Oppure preferisci che ti mostri quali file verrebbero rimossi?
```

---

## 📚 CATALOGO TOOL PER CATEGORIA

### 🏥 DIAGNOSTICA & SALUTE (7 tool)

**Uso quotidiano:**
- "Come sta il sistema?" → health-report
- "Fammi vedere tutti i container" → list-containers
- "Diagnostica completa" → diagnose-architecture
- "Quali frontend/microservizi/database abbiamo?" → detect-*

**Quando usarli:**
- ✅ Check mattutino
- ✅ Prima di manutenzione
- ✅ Dopo deploy
- ✅ Investigazione problemi

---

### 📋 LOGS (4 tool)

**Uso quotidiano:**
- "Logs di auth-mysql" → Ultimi 100 log
- "Cerca errori in frontend-1" → Ricerca pattern
- "Logs real-time di shipping-service" → Streaming 30s
- "Confronta logs di api-gateway-1 e api-gateway-2" → Multi-container

**Quando usarli:**
- ✅ Debug errori
- ✅ Investigare crash
- ✅ Verificare deploy
- ✅ Monitorare attività sospette

**Esempi pratici:**
```
Tu: "Cerca nel frontend cosa è successo alle 14:30"
Claude: Analizza logs con timestamp + mostra errori

Tu: "Mostrami i logs degli ultimi 5 minuti di MongoDB"
Claude: Stream real-time + evidenzia anomalie
```

---

### 📊 METRICHE & PERFORMANCE (4 tool)

**Uso quotidiano:**
- "Performance di auth-mysql" → CPU, RAM, Network, Disk
- "Metriche di tutti i container" → Tabella comparativa
- "Confronta frontend-1 e frontend-2" → Side-by-side
- "Risorse sistema totali" → Snapshot globale

**Quando usarli:**
- ✅ Check performance giornaliero
- ✅ Prima di scalare
- ✅ Capacity planning
- ✅ Identificare colli di bottiglia

**Esempi pratici:**
```
Tu: "Quale container usa più RAM?"
Claude: Ordina metriche per memoria + suggerisce azioni

Tu: "MongoDB è lento, mostrami le metriche"
Claude: CPU/RAM/Disk + confronto con media storica
```

---

### 🎮 CONTROLLO CONTAINER (16 tool)

**Operazioni base:**
- Start/Stop/Restart container
- Pause/Unpause (per maintenance)
- Kill (force stop)
- Status dettagliato

**Operazioni avanzate:**
- Restart multipli (batch)
- Scale service (Docker Compose)
- Maintenance mode (pausa tutti i frontend)
- Health check + auto-restart

**Operazioni cleanup:**
- Remove container
- Prune volumes/container (DRY RUN default)

**Quando usarli:**
- ✅ Deploy e update
- ✅ Manutenzione programmata
- ✅ Risposta a incidenti
- ✅ Scaling dinamico
- ✅ Cleanup periodico

**Esempi pratici:**
```
Tu: "Devo riavviare tutti i microservizi"
Claude: Usa restart-multiple + verifica health dopo ogni restart

Tu: "Voglio scalare l'API Gateway a 3 repliche"
Claude: Verifica risorse + scala + monitora distribuzione traffico

Tu: "Modalità manutenzione ON"
Claude: Pausa frontend + verifica + conferma utenti scollegati
```

---

### 🌐 NETWORK & VOLUMES (4 tool)

**Network:**
- "Configurazione rete di frontend-1" → IP, gateway, porte
- "frontend-1 riesce a parlare con auth-mysql?" → Test connettività

**Volumes:**
- "Lista volumi Docker" → Tutti i volumi con dettagli
- "Quanto spazio occupano i volumi?" → Usage + container associati

**Quando usarli:**
- ✅ Debug connettività
- ✅ Verificare routing
- ✅ Capacity planning storage
- ✅ Prima di cleanup volumi

**Esempi pratici:**
```
Tu: "Frontend non raggiunge il database"
Claude: Verifica network + test ping + suggerisce fix

Tu: "Quanto spazio abbiamo sui volumi?"
Claude: Analisi spazio + identifica volumi grandi + suggerisce cleanup
```

---

### 📦 BACKUP & DISASTER RECOVERY (6 tool)

**Backup singoli:**
- "Backup MySQL" → Export SQL
- "Backup MongoDB" → Archive mongodump
- "Backup volume mongo-data" → Snapshot tar.gz

**Backup completo:**
- "Backup tutto" → MySQL + MongoDB + tutti i volumi critici

**Gestione:**
- "Lista backup" → Tutti i backup con dimensioni e date
- "Pulizia backup vecchi" → Retention policy (default 30 giorni)

**Quando usarli:**
- ✅ Prima di update importanti
- ✅ Backup schedulato giornaliero/settimanale
- ✅ Prima di operazioni rischiose
- ✅ Disaster recovery

**Esempi pratici:**
```
Tu: "Domani aggiorno il database, facciamo backup preventivo"
Claude: Backup MySQL + verifica integrità + dimensione

Tu: "Quanto spazio occupano i backup?"
Claude: Lista per tipologia + suggerisce cleanup se necessario

Tu: "Devo ripristinare MySQL di ieri"
Claude: Lista backup disponibili + istruzioni restore
```

---

### 🏥 AUTO-HEALING (3 tool)

**Configurazione:**
- "Attiva auto-healing ogni 5 minuti" → Monitor automatico
- "Disattiva auto-healing" → Stop monitor
- "Status auto-healing" → Statistiche e stato

**Cosa fa l'auto-healing:**
- ✅ Check automatico container unhealthy ogni N minuti
- ✅ Riavvio automatico container in errore
- ✅ Alert se problemi persistenti
- ✅ Statistiche riavvii e interventi

**Quando usarlo:**
- ✅ Sempre attivo in produzione (intervallo 5-10 min)
- ✅ Disattivato durante manutenzione pianificata
- ✅ Disattivato durante debug (per analizzare problemi)

**Esempi pratici:**
```
Tu: "Attiva monitoraggio continuo"
Claude: Start auto-healing + conferma intervallo + prima check

Tu: "Quante volte è intervenuto l'auto-healing oggi?"
Claude: Statistiche + container riavviati + alert inviati

Tu: "Disattiva auto-healing, devo debuggare MongoDB"
Claude: Stop + conferma + ricorda di riattivare dopo debug
```

---

### 📊 MONITORING & ALERTS (4 tool)

**Configurazione soglie:**
- "Abbassa soglia CPU a 70%" → Modifica threshold
- "Configurazione alert attuale" → Mostra tutte le soglie

**Verifica:**
- "Controlla se superiamo le soglie" → Check manuale
- "Alert delle ultime 24 ore" → Storico con filtro

**Gestione:**
- "Pulisci storico alert" → Reset

**Quando usarli:**
- ✅ Dopo tuning sistema (adatta le soglie)
- ✅ Review giornaliero alert
- ✅ Debug alert frequenti
- ✅ Cleanup periodico

**Esempi pratici:**
```
Tu: "Abbassiamo le soglie, voglio essere più aggressivo"
Claude: Mostra soglie attuali + suggerisce nuovi valori

Tu: "Cosa è successo questa notte?"
Claude: Alert history filtrato + analisi pattern

Tu: "Troppi alert WARNING per CPU normale"
Claude: Suggerisce aumentare soglia WARNING CPU a 85%
```

---

## 💡 BEST PRACTICES & CONSIGLI

### ✅ Routine Giornaliera Consigliata

**Mattina (5 minuti):**
1. "Buongiorno, check completo sistema"
2. Leggi suggerimenti di Claude
3. Review alert notturni (se presenti)
4. Verifica backup recente (<3 giorni)

**Pomeriggio (opzionale):**
- Check veloce performance se noti rallentamenti
- Revisione metriche se ci sono stati deploy

**Sera (2 minuti):**
- "Status finale, tutto ok?"
- Se weekend/festivi: "Attiva auto-healing per la notte"

---

### ✅ Routine Settimanale

**Lunedì:**
- Review alert della settimana precedente
- Check spazio disco/volumi
- Verifica uptime e stability

**Mercoledì:**
- Backup completo
- Cleanup backup vecchi (>30 giorni)
- Review performance trends

**Venerdì:**
- Check pre-weekend
- Attiva auto-healing se non sempre attivo
- Verifica nessun container instabile

---

### ✅ Prima di Operazioni Importanti

**Checklist pre-deploy:**
```
Tu: "Devo deployare una nuova versione, checklist?"

Claude:
✅ Backup completo eseguito?
✅ Health check sistema OK?
✅ Risorse sufficienti (RAM/CPU)?
✅ Maintenance mode pianificato?
✅ Rollback plan pronto?

Procediamo con la checklist punto per punto?
```

---

### ✅ Gestione Alert Intelligente

**Filosofia degli Alert:**

**CRITICAL** 🚨 → **Azione immediata richiesta**
- Rispondi subito
- Claude suggerisce fix rapidi
- Backup prima di agire se possibile

**WARNING** ⚠️ → **Monitora e pianifica**
- Analizza il trend
- Pianifica intervento se persiste
- Claude ti avvisa se si aggrava

**INFO** ℹ️ → **Informativo**
- Review giornaliero
- Utile per analisi retrospettive
- Patterns per ottimizzazioni future

---

### ✅ Comunicazione Efficace con Claude

**Cosa funziona bene:**
```
✅ "Il sistema sembra lento, vediamo cosa succede"
✅ "Voglio deployare, mi aiuti a pianificare?"
✅ "Cosa mi consigli di controllare oggi?"
✅ "Spiega perché MongoDB usa tanta CPU"
```

**Dettagli utili da fornire:**
```
✅ "Da circa 30 minuti" → Claude sa su che timeframe cercare
✅ "Solo sul frontend-2" → Claude sa dove focalizzarsi
✅ "Dopo il deploy di ieri" → Claude collega eventi
✅ "Gli utenti lamentano X" → Claude capisce l'impatto
```

---

## 🎯 SCENARI AVANZATI

### 🔬 Debug Approfondito

**Scenario:** Problema intermittente difficile da individuare

**Tu dici:**
> "MongoDB ha picchi di CPU random, indaghiamo approfonditamente"

**Claude farà:**
```
🔍 Analisi approfondita MongoDB in corso...

1️⃣ Raccolgo metriche storiche (ultima ora)
   → CPU: picchi ogni ~15 minuti
   → Pattern: correlato con cron job?

2️⃣ Analizzo logs per query lente
   → Trovate 3 query >1s di esecuzione
   → Collection: shipments (nessun index su status)

3️⃣ Verifico connessioni attive
   → 34 connessioni, 2 in stato "long query"

💡 Probabili cause:
   A) Index mancante su shipments.status
   B) Query non ottimizzata in shipping-service
   C) Connection pool troppo piccolo

🛠️ Suggerimenti:
   1. Creo index su status (fix immediato)
   2. Analizziamo il codice shipping-service per ottimizzare query
   3. Monitoriamo per confermare il fix

Partiamo dall'index? È il fix più sicuro e rapido.
```

---

### 🚀 Scaling Dinamico

**Scenario:** Picco di traffico previsto

**Tu dici:**
> "Domani abbiamo un evento con picco traffico, prepariamoci"

**Claude suggerirà:**
```
📊 Piano scaling per evento ad alto traffico:

📈 Situazione attuale:
   - API Gateway: 2 repliche (può gestire ~1000 req/min)
   - Frontend: 3 repliche (uso medio: 45%)
   - Database: configurazione corrente OK

🎯 Raccomandazioni pre-evento:

1️⃣ **Scaling preventivo:**
   - API Gateway: 2 → 4 repliche (+100% capacity)
   - Frontend: monitoriamo, ok la configurazione attuale
   
2️⃣ **Preparazione:**
   - Backup completo preventivo ✅
   - Auto-healing attivo (check ogni 3 minuti)
   - Threshold alert più permissivi temporaneamente
   
3️⃣ **Monitoring:**
   - Abilito alert real-time
   - Preparo dashboard metriche chiave
   
4️⃣ **Post-evento:**
   - Scale down dopo 2h dalla fine
   - Review performance e lessons learned

Procediamo con lo scaling? Posso farlo ora o schedularlo per domani mattina.
```

---

### 🔄 Disaster Recovery

**Scenario:** Database corrotto, serve restore

**Tu dici:**
> "MySQL non parte, errore InnoDB. Devo fare restore"

**Claude farà:**
```
🚨 Procedura Disaster Recovery MySQL

📋 Situazione:
   ✅ Ho backup disponibili
   ✅ Ultimo backup: ieri 02:30 (24h fa)
   ✅ Dimensione: 3.4 MB
   ✅ Tipo: mysqldump SQL

⚠️  Data loss potenziale: ~24h di dati

🛠️ Piano di recovery:

1️⃣ **Preparazione (tu):**
   - Ferma tutti i servizi che usano MySQL
   - Conferma che possiamo perdere dati delle ultime 24h
   
2️⃣ **Recovery (insieme):**
   - Rimuovo container MySQL corrotto
   - Ricreo volume pulito
   - Avvio nuovo container MySQL
   - Importo backup di ieri
   - Verifico integrità dati
   
3️⃣ **Verifica (io):**
   - Test connessioni
   - Check tabelle principali
   - Restart servizi collegati
   
4️⃣ **Post-recovery (tu):**
   - Reimporta dati manuali se necessario
   - Verifica funzionalità applicazione

⏱️ Tempo stimato: 15-20 minuti

Sei pronto a procedere? Oppure vuoi provare altre vie di recovery?
```

---

## 🎓 SUGGERIMENTI PROATTIVI DI CLAUDE

### Claude Impara dal Sistema

Nel tempo, Claude nota **pattern** e **tendenze**:

**Esempio 1 - Pattern ricorrente:**
```
💡 Ho notato che ogni lunedì mattina MongoDB ha un picco CPU.
   Probabilmente c'è un batch job schedulato.
   
   Suggerisco:
   - Spostiamo il job alla domenica notte?
   - Oppure ottimizziamo il job stesso?
   - O aumentiamo temporaneamente le risorse il lunedì?
```

**Esempio 2 - Degrado performance:**
```
📊 Trend preoccupante:
   Negli ultimi 7 giorni il tempo di risposta API è aumentato del 23%.
   
   Analisi:
   - Non è il traffico (invariato)
   - Database performance OK
   - Potrebbe essere: memoria frontend che cresce nel tempo
   
   Suggerisco:
   - Restart preventivo frontend ogni 3 giorni?
   - Oppure indaghiamo il memory leak?
```

**Esempio 3 - Ottimizzazione risorse:**
```
💰 Opportunità di ottimizzazione:
   Il microservizio "notifications" usa solo il 12% di RAM allocata.
   
   Possiamo:
   - Ridurre RAM allocata (da 2GB a 512MB)
   - Liberare risorse per altri servizi
   - Stimato risparmio: ~1.5GB RAM
   
   Vuoi che prepari il piano di ottimizzazione?
```

---

## 📱 QUICK REFERENCE CARD

### 🚨 Emergenze
- "CONTAINER GIÙ!" → Diagnostica immediata + riavvio
- "SISTEMA LENTO!" → Check risorse + bottleneck
- "DATABASE CORROTTO!" → Disaster recovery plan

### ✅ Check Quotidiani
- "Buongiorno, status?" → Health report
- "Come vanno le performance?" → Metriche
- "Cosa è successo oggi?" → Alert history

### 🔧 Manutenzione
- "Backup tutto" → Full backup
- "Devo aggiornare X" → Maintenance plan
- "Cleanup sistema" → Prune + backup retention

### 📊 Analisi
- "Trend ultima settimana" → Performance trends
- "Container più pesante?" → Resource ranking
- "Logs di X" → Log analysis

### 🤔 Chiedi Consiglio
- "Cosa mi consigli?" → Proactive suggestions
- "È tutto ok?" → Health + recommendations
- "Devo fare qualcosa?" → Pending actions

---

## 🎯 CONCLUSIONE

### Il Tuo Assistente Sempre Presente

Il Control Tower MCP non è solo uno strumento, ma un **partner intelligente** per la gestione del sistema. Pensa a Claude come un DevOps engineer sempre disponibile che:

✅ **Monitora costantemente** il sistema  
✅ **Suggerisce proattivamente** miglioramenti  
✅ **Risponde rapidamente** alle emergenze  
✅ **Impara dai pattern** per prevenire problemi  
✅ **Documenta automaticamente** le azioni  

### Approccio Consigliato

🗣️ **Dialoga naturalmente** - Non serve sintassi tecnica  
🤝 **Fidati dei suggerimenti** - Sono basati su dati reali  
📚 **Chiedi spiegazioni** - Capire aiuta a migliorare  
🔄 **Feedback continuo** - Dimmi cosa funziona e cosa no  
💡 **Proponi idee** - Possiamo sempre ottimizzare  

---

## 📞 CONTATTI E SUPPORTO

### Per Suggerimenti e Miglioramenti

Non esitare a dirmi:
- ✅ "Questo report è troppo lungo, semplificalo"
- ✅ "Vorrei un alert anche per X"
- ✅ "Puoi controllare anche Y ogni giorno?"
- ✅ "Questo workflow non mi convince, cambiamolo"

### Ricorda

**Non serve ricordare comandi tecnici.**  
Parla naturalmente, come faresti con un collega.  
Il sistema è qui per **facilitarti il lavoro**, non per complicarlo.

---

**Control Tower MCP v2.5.0 è pronto per supportarti ogni giorno!** 🚀

*"Migliorare è sempre cosa giusta"* - Mormegil

---

📅 **Data:** 19 Novembre 2025  
🎯 **Versione:** 2.5.0  
✨ **Status:** Production Ready  
🤝 **Partner:** Claude & Mormegil