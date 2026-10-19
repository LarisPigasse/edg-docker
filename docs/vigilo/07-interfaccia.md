# Vigilo — 7. Interfaccia (app-frontend)

> Passo 7 dell'analisi (ADR064). Stato: **approvato dall'utente il 2026-10-08** dopo l'anteprima visiva (Artifact "Vigilo — anteprima interfaccia"); ritocchi possibili durante la costruzione.
> Parte dai passi 1-6 (approvati) e dai principi 1.0: *"che cosa devo fare, e
> entro quando?"*, stati in parole con colore + icona + testo, poche schede,
> azioni rapide.

## 7.1 Navigazione

Menu del modulo nell'header (manifest, ADR063):

| Voce | Chi la vede |
|---|---|
| **Dashboard** (home del modulo) | read · write · own |
| **Scadenze** (elenco completo con filtri) | read · write |
| **Soggetti** | read · write |
| **Calendario** | read · write · own |
| **Fornitori** | read · write |
| **Configurazione** | config |

L'**addetto** (`vigilo.own`) vede solo *Le mie scadenze* e *I miei mezzi*
(7.10).

## 7.2 Gli stati: un solo linguaggio visivo

Un componente unico, **`StatoScadenza`**, usato ovunque (dashboard, scheda,
calendario, avvisi, email):

| Stato | Colore | Icona | Testo |
|---|---|---|---|
| in regola | verde | spunta | *in regola · 12 mar 2027* |
| in scadenza | ambra | orologio | *tra 8 giorni · 30 ott* |
| in tolleranza | arancio | clessidra | *scaduta il 20 mag · rinnovabile fino al 4 giu* |
| scaduta | rosso | triangolo | *scaduta da 3 giorni* |
| da completare | grigio, tratteggiato | matita | *data da inserire* |
| (in più) da confermare | viola | persona | *segnalata da Mario Rossi* |

Per l'uso: *mancano 640 km · stima 12 nov*. Mai solo il colore.

## 7.2 bis Stati: colori rivisti (2026-10-13, ADR078)

Dopo l'anteprima della Dashboard: niente pastiglie né icone, lo stato è il
**testo pronto in grassetto nel colore dello stato** (il testo dice già lo
stato, il colore lo rende riconoscibile). Colori: **scaduta rosso, in
tolleranza arancio, in scadenza verde, da completare ciano, in regola grigio**
("niente da guardare"). Per le cifre grandi il tono pieno, per il testo lo
stesso colore un tono più scuro (contrasto AA). Codice: `comune/stati.ts`.

## 7.3 Dashboard (prima "Cruscotto"; rivista il 2026-10-13, ADR078)

La home del modulo si chiama **Dashboard** e ha **due viste** a scelta:
**Da fare** ("che cosa devo fare, e entro quando?") e **Spese e consumi**
("quanto spendo, quanto consumo?", da sviluppare con i costi). Vista Da fare,
dall'alto: saluto con il nome e una frase di sintesi, ricerca e scelta della
vista; quattro riquadri (Scadute, In tolleranza, Entro 32 giorni, Da
completare: cifra grande colorata, etichetta a destra, "i" che spiega,
cliccabili come filtro); poi **due colonne indipendenti** (nessuno spazio
vuoto qualunque sia l'altezza dell'elenco): a sinistra *Da fare* (per urgenza
o per soggetto, "Da completare" chiuso all'inizio) e *I prossimi 12 mesi*
(una tessera per mese, più scura dove il lavoro è di più, più l'arretrato); a
destra *Per controllo* (numero nel colore dello stato peggiore), *Soggetti*
(per tipo, pallino dello stato peggiore) e *Fatte in tempo* (quota mensile
delle esecuzioni registrate entro la data). Anteprima: Artifact "Vigilo —
anteprima Dashboard".

**Ritocchi del 2026-10-13 (dopo la prova a video):** cinque riquadri (aggiunto
*Entro 8 giorni*; cifre in rosso, arancio, ambra, verde, ciano — tono 500); le
cose da fare sono **schede colorate della stessa misura** che riempiono lo spazio
(sul modello delle schede della sezione DESIGN; colore = fascia di urgenza, in
basso a destra il quando), ordinabili per urgenza o per soggetto; le scadenze
senza data sono riassunte in una scheda che apre la loro vista; *Per controllo*
raggruppa per nome (i controlli omonimi, es. i tre tagliandi, sono una riga);
*I prossimi 12 mesi* in azzurro (sky) dal chiaro allo scuro; niente piccole
icone decorative: le spiegazioni sono nei tooltip; le schede di *Da fare* hanno
lo stesso colore pieno dei numeri (tono 500), testo bianco, e al passaggio si
sollevano appena con il bordo che si accende. Sotto *Da fare*, affiancati:
*I prossimi 12 mesi* (righe da 4 mesi) e *Fatte in tempo*; nella colonna di
destra restano *Per controllo* e *Soggetti* (2026-10-14). Codice: `constants/fasce.ts`
(colori) e `utils/fasce.ts` (fascia di una scadenza).

Il disegno qui sotto è quello originale del passo 7.

### 7.3 (originale) Cruscotto


```text
┌──────────┬──────────────┬───────────────┬────────────────┬───────────────┐
│ Scadute 3│In tolleranza 2│Entro 8 giorni 5│Entro 32 giorni 12│Da completare 4│   ← riquadri cliccabili = filtro
└──────────┴──────────────┴───────────────┴────────────────┴───────────────┘
 [ cerca…        ] [Tipo ▾] [Sede ▾] [Natura ▾]            Raggruppa: urgenza ▾

 ▲ scaduta da 3 giorni      Revisione        [icona] Autocarro AB123CD      [Registra] [Rinvia] ⋯
 ⧗ rinnovabile fino al 4/6  Assicurazione    [icona] Furgone CD456EF        [Registra] [Rinvia] ⋯
 ◷ tra 8 giorni · 30 ott    Visita medica    [icona] Mario Rossi            [Registra] [Rinvia] ⋯
 ◷ mancano 640 km · ~12 nov Tagliando        [icona] Autocarro AB123CD      [Registra] [Leggi km] ⋯
```

- In testa i **numeri** (riquadri statistici già in @edg/ui), cliccabili.
- Sotto, **"Da fare"** ordinato per urgenza: prima le scadute, poi la
  tolleranza, poi per data. Una riga = stato, controllo, soggetto, azioni.
- Le **segnalazioni da confermare** compaiono in cima, con *Conferma* e
  *Respingi*.
- Stato vuoto chiaro: *"Niente da fare nei prossimi 32 giorni"*.

## 7.4 Azioni rapide (pannello laterale, senza lasciare la pagina)

- **Registra**: mostra **solo i dati che il controllo chiede** (importo,
  fornitore, riferimento, lettura, allegato), la data di oggi già proposta e
  la **prossima scadenza calcolata**, modificabile (*"La prossima revisione
  sarà il 31 ottobre 2028"*). Esito positivo o negativo.
- **Rinvia**: nuova data + motivo.
- **Leggi contatore**: valore + data, con avviso se è minore dell'ultima.
- Dopo il salvataggio: conferma breve e la riga si aggiorna con lo stato
  ricalcolato dal servizio.

### 7.4 bis Il pannello della scadenza (realizzato il 2026-10-14)

Un clic su una scheda di "Da fare" apre lo `Sheet` di @edg/ui da destra
(512px; scelto al posto della modale per tenere la dashboard visibile).
Contenuto, compatto per evitare lo scorrimento:

- **Riepilogo**: stato a colori, scadenza, soglia e contatore, soglia
  stimata, ultimo giorno utile, cadenza, note.
- **Scelta dell'azione** (interruttore come quello della vista; la
  spiegazione di ciascuna è nel tooltip): *Inserisci la data* (solo da
  completare), *Registra*, *Rinvia* (se il controllo è rinviabile e c'è una
  data), *Leggi contatore* (se c'è un contatore). Chi ha solo la lettura
  vede il pannello senza azioni.
- **Registra**: data di esecuzione ed esito sulla stessa riga, lettura se
  prevista; la prossima scadenza proposta con "Correggi"; con esito negativo
  una nuova data facoltativa; importo, fornitore e riferimento in "Altri
  dettagli" (aperto da solo se uno è obbligatorio); note.
- Il pulsante è sempre **Conferma** (non il nome dell'azione, già scritto
  sopra) con **Annulla** accanto.
- Dopo un'azione riuscita: toast, il pannello si chiude, la dashboard si
  ricarica. Un errore lascia il pannello aperto con i dati inseriti.
- In fondo le **ultime 4 registrazioni**.
- Codice: `components/scadenza/`, `hooks/useScadenza`, `hooks/useFornitori`.
- Il pulsante rapido "Fatto oggi" sulla scheda è rimandato: si valuta dopo
  l'uso del pannello.

## 7.5 Soggetti

- **Schede per tipo** (veicoli, macchine, attrezzature, sedi, persone,
  azienda) con il conteggio; compaiono solo i tipi usati.
- Tabella: nome, identificativo, categoria, stato del soggetto e
  **situazione** = lo stato peggiore fra le sue scadenze (+ quante).
- **Nuovo soggetto**, guidato:
  1. tipo e categoria;
  2. dati (campi del tipo + campi aggiuntivi della categoria);
  3. **scadenze proposte** dai controlli automatici, con la possibilità di
     inserire subito le date che si conoscono (*"Prossima revisione: ___"*);
     quelle lasciate vuote restano *da completare*. Se la prima scadenza si
     calcola da un dato del soggetto (es. immatricolazione), è già compilata.

**Realizzato il 2026-10-14 (B7d-1)**: `pages/SoggettiPage` su `/vigilo/soggetti`
(voce di menu *Soggetti*). Schede *Tutti* + i tipi usati, con i conteggi da
`/dashboard` (in servizio e fermi); il tipo sta nell'indirizzo (`?tipo=`), così
i riquadri *Soggetti* della dashboard portano all'elenco filtrato. Ricerca
(nome, identificativo, codice), categoria del tipo, sede, stato (predefinito
*attivi e sospesi*), ordine per urgenza o per nome, pagine da 32 con
*Mostra altri*. Colonne: nome (con l'icona del tipo in *Tutti*),
identificativo con il nome del tipo (Targa, Matricola…), categoria, sede,
stato (*Sospeso dal…*, significato nel tooltip), situazione = stato peggiore nel colore della dashboard
+ quante scadenze aperte. Codice: `components/soggetti/`, `hooks/useSoggetti`,
`components/CampoRicerca` (condiviso con la dashboard).

**Stati del soggetto a schermo (decisione del 2026-10-14)**: parole valide per
ogni tipo, accordate al nome del tipo — **Attivo · Sospeso · Archiviato**
("la sede è archiviata"). I codici del servizio restano `in-servizio`, `fermo`,
`dismesso` e non compaiono mai (`constants/statiSoggetto.ts`). *Sospeso* =
momentaneamente fuori uso, le scadenze continuano; *Archiviato* = non più in
uso, le scadenze aperte si chiudono e lo storico resta. Scartata l'alternativa
delle parole per tipo (In forza/Cessato per le persone, Chiusa per le sedi):
nella scheda *Tutti* servono comunque parole comuni.

**Select dei filtri**: `optionSize='sm'` (14px, come la ricerca); il menu di
`Select` (@edg/ui) si allarga oltre il campo per le voci lunghe (fino a 32rem).

## 7.6 Scheda del soggetto

Intestazione: icona del tipo, nome, identificativo, categoria, stato
(attivo · sospeso · archiviato), referente, sede; azioni *Modifica*,
*Sospendi*, *Archivia*.

| Scheda | Contenuto |
|---|---|
| **Scadenze** (predefinita) | per urgenza, azioni rapide; *Aggiungi controllo*, *Aggiungi promemoria* |
| **Storico** | registrazioni in ordine di tempo (importi a chi ha `vigilo.costi`) |
| **Contatori** | valore, uso medio, andamento delle letture, *Leggi* |
| **Assegnazioni** | chi lo usa e ha usato (per le persone: i mezzi) |
| **Documenti** | allegati del soggetto, delle scadenze e delle registrazioni |
| **Dati** | campi del tipo e della categoria |

**Realizzato il 2026-10-14 (B7d-2)**: `pages/SoggettoPage` su `/vigilo/soggetti/:id`
(clic su una riga dell'elenco). Titolo **"Soggetto › Nome"** (sezione nel colore
dei titoli, nome in nero), sotto tipo · identificativo · categoria; a destra,
accanto al refresh, il pulsante **"Elenco soggetti"** (non "indietro": da un
link esterno, es. un'email, sarebbe ambiguo; `trailingActions` di PageHeader).
Le azioni sullo stato stanno a destra dei riquadri, alte quanto loro, con
colori per gravità e conferma (tranne *Riattiva*): *Sospendi* (warning; le
scadenze continuano), *Archivia* (danger; dice quante scadenze si chiudono),
*Riattiva* / *Ripristina* (success). Dopo Sospendi e Archivia il toast offre
**Annulla** per qualche secondo. **Ripristina riapre le scadenze chiuse
dall'ultima archiviazione, con le loro date** (servizio:
`riapriScadenzeArchiviate`, motivo `soggetto-dismesso` + istante di chiusura),
poi crea solo quelle che mancano; le assegnazioni terminate non tornano.
Riquadri: situazione, stato, sede,
referente. Schede: **Scadenze** (le schede colorate della dashboard, con la
natura al posto del soggetto; clic → pannello della scadenza), **Storico**
(`GET /registrazioni?soggetto=`, nuovo; 32 per pagina), **Contatori** (valore,
uso medio, andamento delle ultime 32 letture, letture anomale segnalate,
*Nuova lettura*), **Assegnazioni** (mezzi e persone, in corso per prime),
**Dati** (dati del tipo, campi della categoria, altro; i vuoti si vedono).
Le scadenze *in regola* hanno la scheda bianca con un filo di contorno.
*Modifica* arriva con B7d-3; *Documenti* con gli allegati (B9).
Codice: `components/soggetto/`, `hooks/useSoggetto`, `useStorico`,
`useContatore`, `useAssegnazioni`, `constants/datiTipo`, `utils/registrazioni`,
`utils/dati`.

**Testata e azioni del soggetto (riviste il 2026-10-15)**: titolo "Soggetto ›
Nome" senza sottotitolo; a destra, larghi uguali, *torna all'elenco* (icona
freccia, tooltip "Torna all'elenco dei soggetti") e refresh. Primo riquadro
del riepilogo: il tipo ("Veicolo") e sotto identificativo · categoria. Tutte
le azioni in un menu **Azioni ▾** a destra sulla riga delle schede (prop
`actions` di `Tabs` in @edg/ui, visibile qualunque scheda sia aperta):
*Aggiungi scadenza* · separatore · *Modifica* · *Sospendi*/*Riattiva* ·
separatore · *Archivia* in rosso / *Ripristina* (`ActionMenu` con la prop
`trigger`). Conferme e "Annulla" nel toast come prima.

**Realizzato il 2026-10-15 (B7d-3)**: *Nuovo soggetto* (pulsante nell'elenco,
`pages/NuovoSoggettoPage` su `/vigilo/soggetti/nuovo?tipo=`) in tre passi con
Stepper e barra in fondo: **tipo e categoria** (riquadri da scegliere; per ogni
categoria quanti controlli automatici; *Nessuna categoria* = nessuna scadenza
automatica) → **dati** (`FormSoggetto`: identità, collocazione, dati del tipo,
campi della categoria, note; "Manca: …" finché nome e campi obbligatori non ci
sono) → **Crea** → **scadenze**: quelle appena create dal servizio, con data (e
soglia per quelle a contatore) da inserire; quelle calcolabili dai dati (es.
revisione dall'immatricolazione) arrivano compilate, le vuote restano da
completare. *Salva e apri la scheda*. Le date si inseriscono dopo la
creazione: nessun endpoint di anteprima (decisione del 2026-10-14).
*Modifica* dalla scheda: lo stesso `FormSoggetto` (più la categoria) nel
pannello laterale largo; cambiando categoria un avviso spiega che arrivano le
scadenze dei nuovi controlli e quelle esistenti restano. Codice:
`components/nuovo-soggetto/`, `components/soggetto/FormSoggetto`, `CampoDato`,
`ModificaSoggetto`, `hooks/useNuovoSoggetto`, `useRiferimenti`,
`utils/formSoggetto`.

## 7.6 bis Elenco delle scadenze (realizzato il 2026-10-15, B7e)

`pages/ScadenzePage` su `/vigilo/scadenze` (voce di menu *Scadenze*). Filtri:
ricerca, **stato** (tutte le aperte, uno stato, *chiuse* = storiche dalla più
recente, con quando e perché), tipo, natura, **controllo** (i controlli con lo
stesso nome sono una voce sola, come in dashboard: il servizio accetta più
uuid separati da virgola), sede; ordine per urgenza, data o soggetto; pagine da
32. Colonne: scadenza, soggetto (link alla scheda), natura, stato colorato,
data o soglia. Clic sulla riga → pannello della scadenza. **Esporta PDF**
(`exportTableToPdf` di @edg/ui) di tutto ciò che i filtri trovano, fino a 1024
righe, con i filtri scritti sotto il titolo. Le righe di *Per controllo* della
dashboard portano qui filtrate (`?controllo=`). Nella scheda del soggetto:
**Aggiungi controllo** (controlli del tipo e della categoria senza scadenza
aperta; data facoltativa) e **Aggiungi promemoria** (titolo e data), nel
pannello laterale. Le scadenze a contatore senza letture dicono *"lettura km da
inserire"* invece di *"data da inserire"* (regole, `mancaLettura`). Codice:
`components/scadenze/`, `hooks/useElencoScadenze`, `utils/descrizioneScadenza`,
`utils/pdfScadenze`, `constants/elencoScadenze`,
`components/soggetto/AggiungiScadenza`.

## 7.7 Dettaglio di una scadenza

Stato esteso, cadenza **in parole** (*"ogni 24 mesi dalla scadenza
precedente, a fine mese"*), preavvisi, tolleranza, destinatari, storico e
documenti. Per ogni impostazione ereditabile (passo 2.2):
*"Dal controllo: ogni 12 mesi · Personalizza"* oppure *"Personalizzato ·
Ripristina"*: si vede sempre da dove viene il valore.

## 7.8 Configurazione (`vigilo.config`)

- **Controlli**: raggruppati per tipo di soggetto, una riga ciascuno con il
  riassunto (*"ogni 12 mesi · avvisi a 32, 8, 1 giorni · tolleranza 15
  giorni"*); segnale *Aggiornamento disponibile* (passo 3.6) con la novità
  e le differenze campo per campo; **Storico della libreria** del controllo e
  della categoria: proposte, scelte, chi e quando (ADR074).
- **Categorie** con l'editor dei campi aggiuntivi.
- **Aggiungi dalla libreria** (riapre la procedura di avvio, passo 3.5).
- **Ricomincia da capo** (ADR077): in una zona pericolosa, conferma scritta, solo
  `vigilo.config`; azzera i dati Vigilo del cliente e riapre la procedura di
  avvio. Il registro delle decisioni resta e annota chi ha azzerato e quando.
- **Impostazioni**: orario del riepilogo, giorni lavorativi, richiami,
  preavvisi predefiniti.

**Editor della cadenza** (riusabile, anche per un futuro editor della
libreria in pro-frontend), scritto come una frase:

```text
Ogni [ 12 ] [mesi ▾]   oppure ogni [ 16000 ] [km ▾]   (vale la prima)
Conta da  [la scadenza precedente ▾]     [✓] arrotonda a fine mese
[✓] La prima scadenza dopo [ 4 ] [anni ▾] da [immatricolazione ▾]
[✓] Da [ 50 ] [anni ▾] di età: ogni [ 5 ] [anni ▾]        + aggiungi fascia
    ("Conta da" offre anche: la scadenza, se fatto entro [ 12 ] [mesi ▾] prima)
→ "Se registri oggi, la prossima sarà il 31 ottobre 2027"
```

Con lo stesso stile gli editor di **preavvisi** (etichette 32 · 8 · 1 +
aggiungi), **tolleranza** e **destinatari**.

## 7.9 Procedura di avvio

Pagina intera con indicatore dei quattro passi (passo 3.5); al termine,
invito al primo soggetto.

### 7.9 bis Prova dell'avvio da capo (2026-10-19, ADR080)

Rifatta sul tenant EDG dopo l'azzeramento: Base aziendale + Autotrasporto
merci con le voci consigliate (13 categorie, 44 controlli; registro 22 + 92
righe), poi due veicoli di prova. Correzioni emerse:

- **Prima dell'avvio** si apre solo la home e la procedura: Scadenze,
  Soggetti (elenco, nuovo, scheda) e Configurazione passano da
  `components/RichiedeAvvio` (nel manifest con `dopoAvvio(...)`). Chi
  configura viene portato alla procedura; gli altri vedono "Vigilo è in
  preparazione" (`components/InPreparazione`). La home usa lo stesso
  componente (figli come funzione del profilo).
- **Passo Fatto**: *Vai alla Dashboard* e *Aggiungi il primo soggetto* (dopo
  "Aggiungi dalla libreria": *Vai alla Configurazione*); l'indicatore segna
  fatti tutti i passi.
- **"Aggiungi le voci"** disattivato quando l'invio non cambierebbe nulla
  (nessuna voce nuova, stessi settori, stessi predefiniti), con la nota
  "Niente di nuovo da aggiungere".
- **Dashboard senza soggetti** (né promemoria, senza filtri): niente numeri
  a zero né "tutto in regola", ma il riquadro *Per cominciare*
  (`dashboard/PrimiPassi`) con *Vedi i controlli* e *Aggiungi il primo
  soggetto*; il saluto invita a inserire i soggetti.
- **Nuovo soggetto**: nessuna categoria preselezionata, nemmeno "Nessuna
  categoria"; "Avanti" spento e "Manca: categoria" finché non si sceglie.
  Conferma delle date: "Data inserita" / "Date inserite per N scadenze".
- Nelle procedure a passi la pagina torna in cima a ogni passo
  (`hooks/useInCima`).
- Ritorno all'elenco dei soggetti: pulsante a icona unico
  (`components/TornaAllElenco`) nella scheda e nel nuovo soggetto.
- Valori degli elenchi: sigle scritte come tali ("GPL": `constants/sigle`,
  `utils/testo` con `maiuscola` ed `etichettaOpzione`).
- "avvisi a 32, 8 e 1 giorno": il nome si accorda con l'ultimo numero
  (Configurazione e `regole/testi.ts` del servizio).
- In @edg/ui: anello di focus solo da tastiera (`focus-visible`) in Button e
  Tabs (nelle schede interno, `ring-inset`, perché il contenitore che scorre
  lo tagliava); Stepper con i titoli dei passi futuri leggibili; DatePicker
  chiuso da Invio dopo una data scritta a mano; FloatingFieldShell con la
  label collegata al campo (nome accessibile di DatePicker e TimePicker).
- Tabs (@edg/ui): quando le schede non stanno nella riga, sfumatura di 32 px
  solo dal lato dove c'è altro (maschera `mask-image` sul contenitore, hook
  `useScrollEdges`); la scheda scelta scorre in vista per intero, anche
  aprendo la pagina su una scheda lontana.

Ancora da decidere: `focus-visible` negli altri componenti cliccabili di
@edg/ui (Card, HomeTile, ActionMenu, Accordion, QuickLink…).

## 7.10 L'addetto (pensato prima per il telefono)

- **Le mie scadenze**: le sue e quelle dei mezzi assegnati, in schede grandi
  e facili da toccare (stato, cosa, quando).
- **Segnala fatto**: data + foto direttamente dalla fotocamera; poi la
  scadenza mostra *"segnalata, in attesa di conferma"*.
- **I miei mezzi**: inserimento rapido dei km o delle ore.

## 7.11 Campanella e calendario

- **Campanella** nell'header (oggi è solo disegnata): elenco degli avvisi in
  app, non letti in evidenza, risolti in grigio, *segna tutti come letti*,
  clic = apre la scadenza.
- **Calendario**: mese con i puntini colorati per stato, elenco del giorno
  scelto, stessi filtri della dashboard.

## 7.12 Componenti

- Specifici di Vigilo in `features/vigilo/components/` (StatoScadenza,
  pannelli delle azioni rapide, editor della cadenza…).
- Generici, da mettere in **@edg/ui** perché serviranno ad altri moduli:
  procedura a passi, calendario, campanella con il suo fornitore di dati.
- Già pronti in @edg/ui: tabelle (anche compatte), riquadri statistici,
  schede (tabs), pannello laterale (sheet), finestre, badge, moduli di
  inserimento, data.

## 7.13 Decisioni (2026-10-08)

1. **Anteprima visiva** di cruscotto e scheda del soggetto prima
   dell'approvazione.
2. Cruscotto raggruppato **per urgenza** (per soggetto come scelta).
3. **Calendario** subito dopo B7.
4. **Campanella generica in @edg/ui**: ogni modulo fornisce i propri avvisi,
   la campanella li raccoglie.
