# Vigilo — 3. Libreria, modelli di settore e procedura di avvio

> Passo 3 dell'analisi (ADR064). Stato: **approvato dall'utente il 2026-10-08**.
> Parte da `01-dominio.md` e `02-modello-dati.md` (approvati).

## 3.1 I tre ingredienti

| | Che cos'è | Di chi è |
|---|---|---|
| **Libreria** | tutte le categorie e tutti i controlli che EDG conosce, con cadenze, preavvisi, tolleranze e riferimenti normativi | EDG |
| **Modello di settore** | una *selezione* della libreria pensata per un settore (non una copia): "Autotrasporto merci", "Agricoltura"… | EDG |
| **Procedura di avvio** | il percorso guidato con cui il cliente sceglie i modelli, vede cosa includono e decide cosa tenere | del cliente |

## 3.2 Come EDG alimenta la libreria — proposta

**Ora: file versionati nel codice di vigilo-service** (`src/libreria/`), uno
per tipo di soggetto e uno per i modelli. All'avvio il servizio li
sincronizza nelle tabelle `libreria_*` (inserisce o aggiorna per `chiave`).
- Ogni voce ha una `versione` intera: chi cambia il contenuto la incrementa.
  Un controllo automatico nel codice rifiuta una modifica senza nuova versione.
- Vantaggi: storia in git, revisione prima del rilascio, nessuna interfaccia da
  costruire, dati di prova e demo sempre allineati.

**Dopo, se servirà: editor in pro-frontend** per il personale EDG. Costa
poco *dopo*: i componenti per modificare cadenza, preavvisi, tolleranza e
campi servono comunque al cliente in app-frontend (passo 7) e si
riusano.

## 3.3 Modelli di settore iniziali — proposta

- **Base aziendale** — proposto sempre: azienda e sedi (DVR, CPI, estintori,
  certificazioni, contratti, abbonamenti, promemoria) e persone (formazione
  sicurezza, primo soccorso, antincendio, visite mediche).
- **Autotrasporto merci** — veicoli pesanti e leggeri, rimorchi,
  cronotachigrafo; autisti (patenti, CQC, carta tachigrafica).
- **Logistica e magazzino** — carrelli elevatori, scaffalature, impianti;
  abilitazioni dei carrellisti.
- **Agricoltura** — trattori e macchine agricole a ore motore; abilitazioni.
- **Movimento terra ed edilizia** — escavatori, gru, piattaforme;
  verifiche periodiche delle attrezzature; abilitazioni.

Un controllo può stare in più modelli (la visita medica è in tutti): nella
procedura di avvio compare una volta sola.

## 3.4 Contenuto della libreria

Il contenuto (quali controlli, con quali cadenze e tolleranze) è il valore
del prodotto e deve essere **corretto**: lo preparo come bozza a parte
(`docs/vigilo/libreria-bozza.md`) con il **riferimento normativo e la fonte**
di ogni voce, e lo validi tu (e chi in EDG conosce il settore) prima che
diventi file del codice. Le cadenze che dipendono da casi particolari (es.
revisione annuale o biennale secondo la massa) diventano **voci separate o
categorie diverse**, mai regole nascoste.

## 3.5 Procedura di avvio

Si apre al primo accesso a Vigilo di chi ha il permesso di configurarlo
(passo 5); gli altri vedono "Vigilo è in preparazione".

1. **Settori** — riquadri dei modelli, scelta multipla; preselezionati il
   modello suggerito da EDG all'attivazione e *Base aziendale*.
2. **Che cosa includere** — per tipo di soggetto, categorie e controlli dei
   modelli scelti, con le voci *preselezionate* già spuntate; ogni controllo
   mostra in una riga cadenza, preavvisi e tolleranza ("ogni 12 mesi · avvisi
   a 32, 8, 1 giorni · tolleranza 15 giorni"). Spunta o togli, singolarmente o
   per gruppo.
3. **Riepilogo** — "Stai per creare 8 categorie e 24 controlli", preavvisi
   predefiniti per i controlli che aggiungerai in seguito (proposta: 32, 8 e 1
   giorni).
4. **Fatto** — invito al passo successivo naturale: *"Aggiungi il primo
   veicolo"* (o la prima persona, secondo i modelli).

La procedura **copia** le voci scelte (copia con origine, ADR065) ed è
ripetibile: in seguito *"Aggiungi dalla libreria"* riapre il passo 2 con le
voci già presenti segnate come tali. Nessuna voce si copia due volte (si
riconosce dalla `chiaveLibreria`).

Si può anche **saltare**: "Parto da zero" crea solo l'impostazione del tenant.

## 3.6 Aggiornamenti della libreria

Quando EDG cambia una voce (nuova `versione`), i clienti che la usano vedono
nella pagina dei controlli un segnale **"Aggiornamento disponibile"** con le
differenze, campo per campo.

Per sapere che cosa il cliente ha personalizzato, ogni categoria e ogni
controllo conservano anche una **fotografia dei valori copiati** (colonna
`origine`, JSON — aggiunta al modello del passo 2):
- campo **non personalizzato** (uguale alla fotografia) → si propone il nuovo
  valore, si applica con un clic;
- campo **personalizzato** → si mostrano i due valori e decide il cliente;
- **ignora** → l'aggiornamento non si ripropone per quella versione.

Le scadenze aperte si ricalcolano subito solo se il cliente applica una
nuova cadenza; quelle già chiuse non cambiano mai. Una voce **ritirata** dalla
libreria si segnala, non si cancella dal cliente.

**Perché e registro (ADR074, 2026-10-12).** Ogni nuova versione di una voce
porta la sua **novità** ("La UNI 9994-1:2024 porta la revisione a 60 mesi"):
il cliente vede il perché, non solo le differenze. Quando la sincronizzazione
porta aggiornamenti, ogni cliente interessato riceve un avviso *Aggiornamenti
della libreria disponibili* (campanella e riepilogo; le consegne registrano
invio e lettura). La prima apertura delle differenze si annota sulla voce del
cliente (visto il, da chi). Ogni scelta va nel **registro delle decisioni**
(`decisioni_libreria`): versione da/a, novità mostrata, disponibile dal, visto
il, esito (accettato · in parte · rifiutato) campo per campo con il valore del
cliente e quello proposto, chi (account con nome ed email copiati) e quando.
Lo stesso registro conserva le scelte della **procedura di avvio** (voce
proposta: inclusa · tolta). Le righe **non si modificano** (vincolo nel
database): un ripensamento è una riga nuova. Il cliente le vede nello
*Storico della libreria* di ogni controllo e categoria; EDG le usa per
rispondere a una contestazione ("il 3 marzo ti è stato proposto, rifiutato
il 5 marzo alle 10:42 da Mario Rossi").

## 3.7 Suggerimento all'attivazione

Nella finestra *Moduli* del tenant (pro-frontend), attivando Vigilo l'admin
EDG può scegliere il **modello suggerito**, salvato in
`tenant_modules.config` (`{ "vigilo": { "modelli": ["trasporto"] } }`). È solo
un suggerimento: la procedura di avvio lo preseleziona, il cliente decide.

## 3.8 Decisioni (2026-10-08)

1. **Libreria nel codice ora**, editor in pro-frontend solo se servirà
   (riusando i componenti del cliente).
2. **Modelli iniziali**: tutti e cinque quelli di 3.3 (Base aziendale,
   Autotrasporto merci, Logistica e magazzino, Agricoltura, Movimento terra ed
   edilizia).
3. **Contenuto**: bozza con riferimenti normativi e fonti in
   `libreria-bozza.md`, validata dall'utente prima di diventare codice. Non
   blocca i passi 4-7 (non cambia il modello): si prepara prima di scrivere i
   file della libreria.
4. **Aggiornamenti**: proposti, un clic per i campi non personalizzati,
   scelta del cliente per quelli personalizzati, possibilità di ignorare.
5. **Contenuto approvato** il 2026-10-12 (`libreria-bozza.md`, 123 controlli,
   5 modelli) con le aggiunte alla cadenza: fasce d'età, finestra di anticipo,
   date del soggetto. Tutto ciò che si copia al cliente è personalizzabile
   dall'app; la libreria madre si cambia nei file (dati, non logica) finché non
   servirà l'editor in pro-frontend: l'app legge solo dalle tabelle.
