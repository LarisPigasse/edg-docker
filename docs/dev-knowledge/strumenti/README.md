# Strumenti di sviluppo (EDG / Vigilo)

Copie degli strumenti che l'assistente usa sul VM del dispositivo, salvati qui
perché la cartella di lavoro del VM (`~`) non sopravvive fra le conversazioni.
All'inizio di una nuova conversazione: `cp docs/dev-knowledge/strumenti/w.py ~/w.py`.

- `w.py` — modifiche sul posto conservando CRLF/LF.
  `python3 ~/w.py write <file> [lf|crlf]` (contenuto da stdin) ·
  `python3 ~/w.py edit <file>` (stdin JSON `[[vecchio, nuovo], ...]`, ogni vecchio una sola volta).
- `comando.sh` — `bash comando.sh prove/x/prove.js [MODO=piano] > cmd.txt`: il testo per
  `exec-in-container` (gzip+base64, nessuna virgoletta esterna).
- `prove/` — script dal vivo. Quelli che richiedono `pg` (`b10b/*`, `demo/snapshot.js`,
  `demo/verifica.js`) vanno nel container **vigilo-service**; gli altri nel container **auth-service** (ha `jsonwebtoken`,
  `JWT_SECRET`, `mysql2`; chiamano `http://api-gateway-1:8080` e `-2`). Niente segreti nei file:
  tutto dalle variabili d'ambiente del container.
  - `log/` fase 1 dei log (ADR117), nel container auth-service, sola lettura: `prove-1a.js` (Logs all'admin EDG con i permessi veri dei ruoli),
    `prove-1b.js` (campo modulo, filtro, Cerca come testo, filtri solo testuali; dopo `node dist/scripts/assegnaModulo.js` in log-service),
    `prove-1d.js` (accessi ai moduli dal gateway: uno per sessione su due gateway, campanella esclusa, assistenza, Redis; lascia 3 accessi di prova con user-agent prova-1d),
    `prove-2b.js` (fase 2: riepilogo dell'uso del Tenant Demo e ultimo uso dei tenant; somme confrontate con i Logs, limiti dei giorni, permessi; solo lettura),
    `prove-1e.js` (consultazioni di vigilo-service con l'operatore demo, account 10: schede, report, CSV, andamento, assistenza, elenchi esclusi; le chiavi restano 16 minuti: per rilanciarlo prima, riavviare vigilo-service)
  - `dati/` fase 3 (ADR121), nel container auth-service, DOPO la ricostruzione di vigilo-service:
    `prove-3a.js` (riepilogo, "solo i dati", "tutto", permessi; solo sul tenant finto 2147480001, che lascia vuoto),
    `prepara-3b.js` (crea o riprende il tenant vero "Prova dati EDG" con Vigilo avviato, 2 soggetti e un PDF, per provare a video
    la finestra Moduli; alla fine eliminarlo da SISTEMA › Tenant)
  - `aa4/codice.js` codice d'ingresso di un'assistenza di prova (`node /tmp/codice.js 9`), `aa4/prove.js`, `aa5/prove.js`
  - `b9c`, `f0`, `f1`, `csv` prove dei rispettivi blocchi
  - `b10b/simula.js` e `ripristina.js` simulano/ripristinano un aggiornamento della libreria
  - `demo/` dati demo del Tenant Demo (tenant 2): `demo.js`, `guasti.js`, `snapshot.js`, `verifica.js`
  - `costo/demo.js` costo di possesso sui mezzi, `costo/prove.js` (tappa 1, ADR108)
  - `rifornimenti/demo.js` (`MODO=piano|scrivi`, 742 rifornimenti già caricati: non rilanciare con scrivi),
    `rifornimenti/prove.js` (tappa 2, ADR109; si ripulisce da solo)
  - `revisione/` prove della revisione globale (auth-service, sola lettura): `stati.js` (nessuna
    scadenza "in scadenza" con la data passata, L070), `fasce.js` (fasce della dashboard che non si sovrappongono),
    `autori-vivo.js` e `chiuse-vivo.js` (chi ha scritto, segnalato e chiuso: nomi nello storico e nelle chiuse),
    `nonseguiti-vivo.js` (controlli non seguiti: giro completo sul bollo dell'Iveco S-Way 02; lascia una
    decisione di prova nello storico, da togliere dopo con un DELETE su controlli_non_seguiti),
    `report-nonseguiti.js` (report "Controlli non seguiti": lascia 2 decisioni di prova sull'Iveco S-Way 02;
    poi `riprendi-bollo.js` in auth-service e `pulisci-report.js` in vigilo-service),
    `rifornimenti-autore.js` (registratoDa nei rifornimenti del DAF XF 01),
    `interventi-fornitori.js` (report per fornitore confrontato con "A chi vanno"), `csv-spese.js` (CSV delle spese),
    `origine-letture.js` (letture dei tagliandi del DAF con l'origine, quelle manuali senza),
    `andamento-vivo.js` (andamento dei costi del DAF confrontato con la scheda),
    `stima-parametri.js` (stima costi, fase 1: parametri generali e costi aziendali per anno; rimette tutto com'era),
    `stima-calcolo.js` (stima costi, fase 2: POST /stima/calcola col DAF e una persona),
    `stime-salvate.js` (stima costi, fase 3: salva, elenco, costo reale, permessi; elimina ciò che crea),
    `km-annui.js` (km annui: suggerimento dai contatori, costo per km, secondo valore della stima; rimette l'anno com'era),
    `componenti-mezzo.js` (costo del mezzo a due componenti; attenzione: le ore attese dipendono dalla velocità media dei parametri),
    `quota-mezzi.js` (quota dei costi aziendali sui servizi con i mezzi e ore di impiego annue; rimette tutto com'era),
    `trasferta.js` (indennità di trasferta: soglie e quattro situazioni, attese calcolate dai parametri del tenant; li rimette com'erano),
    `attivazione.js` (disattiva e riattiva un controllo e una categoria: le scadenze si riaprono con le loro date; tutto torna com'era),
    `modifica-controllo.js` (anteprima = esito vero, categoria tolta e rimessa con le stesse date, personalizzato; tutto torna com'era),
    `cadenza.js` (editor della cadenza: frase e conteggi dell'anteprima = esito vero, date invariate, rifiuti di coerenza; tutto torna com'era),
    `nuovo-controllo.js` (nuovo e duplica: anteprima = creazione vera, copia con i destinatari e senza libreria; stampa gli uuid creati),
    `pulisci-controlli.js` (nel container di vigilo-service: toglie i controlli di prova e le loro scadenze appena nate, mai quelli della libreria o con registrazioni),
    `categorie.js` (contatore che serve a controlli a uso: rifiutato; personalizzata; categoria nuova creata, modificata ed eliminata) e
    `pulisci-contatori.js` (nel container di vigilo-service: toglie i contatori di un'unità dai soggetti indicati se senza letture, e dice quanti),
    `elimina.js` (eliminabile negli elenchi, eliminazioni senza storico, rifiuti con storico o con un controllo che vale solo per la categoria; non lascia niente),
    `ricavi.js` (Analisi fase A: ricavi dell'anno, prezzo e margine di una stima di prova; rimette tutto com'era),
    `analisi.js` (Analisi fase B: i numeri di /analisi ricalcolati a parte, avvisi, permessi; solo lettura). Nota: i token di prova vogliono anche l'email, o il gateway risponde 401; per trasferire gli script controllare l'md5 del .gz riga per riga se gunzip fallisce (meglio: pezzi da 400 caratteri con il loro md5, poi cat e base64 -d),
    `operativita.js` (Analisi fase C: consumo della flotta, km al mese, fermo del DAF e disponibilità ricalcolati a parte, costo pieno per categoria; solo lettura),
    `segnali.js` (Analisi fase D: segnali attesi, una soglia cambiata e rimessa com'era, limiti e permessi)
