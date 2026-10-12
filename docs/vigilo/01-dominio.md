# Vigilo — 1. Dominio e glossario

> Passo 1 dell'analisi (ADR064). Stato: **approvato dall'utente il 2026-10-07** (con principi 1.0 e tolleranza).
> Ogni passo si approva prima di scrivere codice: i passi successivi
> (modello dati, libreria e avvio, avvisi, permessi, API, interfaccia) partono
> da qui e non lo contraddicono.

## 1.0 Principi (valgono per ogni passo)

**Flessibilità e personalizzazione.**
- Ogni impostazione si **eredita a tre livelli**: libreria EDG → controllo del
  cliente → singola scadenza. Il livello sotto può sempre ridefinire quello
  sopra (es. preavvisi o tolleranza diversi per un solo mezzo), senza toccare
  gli altri.
- Nomi, categorie, campi aggiuntivi, preavvisi, tolleranze, cadenze e
  destinatari degli avvisi sono del cliente; il codice fissa solo i sei tipi di
  soggetto e le regole di calcolo.
- Valori predefiniti sempre pronti (dalla libreria e dai modelli di settore):
  personalizzare è possibile, mai obbligatorio.

**Facilità d'uso e chiarezza.**
- La prima domanda a cui Vigilo risponde è **"che cosa devo fare, e entro
  quando?"**: un elenco ordinato per urgenza, non un archivio da consultare.
- Stati detti in parole e con le date, non solo con un colore: *"scade tra 8
  giorni (20 maggio)"*, *"scaduta da 3 giorni, rinnovabile fino al 4 giugno"*.
  Colore, icona e testo insieme (leggibile anche da chi non distingue i colori).
- Pochi campi obbligatori; azioni rapide dove serve (*registra*, *rinvia*,
  *leggi contatore*) senza aprire schede su schede; procedure guidate per le
  operazioni rare (avvio, nuovo soggetto).
- Lo stesso stato ha lo stesso nome e lo stesso aspetto ovunque: cruscotto,
  scheda del soggetto, calendario, avvisi.

## 1.1 Cosa fa Vigilo, in una frase

Vigilo sorveglia dei **soggetti** a cui si applicano dei **controlli**; ogni
controllo ha una **cadenza** e genera **scadenze**; una scadenza si chiude con
una **registrazione** e, se il controllo è ricorrente, il ciclo riparte.
Un solo meccanismo per adempimenti, manutenzioni, abilitazioni, pagamenti e
promemoria: un cruscotto, un calendario, un sistema di avvisi.

## 1.2 Confini (cosa Vigilo NON fa)

- Non è contabilità: registra costi e importi per sapere quanto costa un mezzo
  o un adempimento, non emette né paga fatture.
- Non è gestione flotta in tempo reale: la telematica, se c'è, è solo una
  **fonte di letture** dei contatori.
- Non è gestione del personale: di una persona interessano solo le abilitazioni,
  le visite e i corsi che scadono.

## 1.3 Glossario

### Soggetto — *che cosa* si sorveglia

| Tipo (fisso, nel codice) | Esempi | Dati propri del tipo |
|---|---|---|
| **veicolo** | auto, furgone, autocarro, rimorchio | targa, telaio, immatricolazione, alimentazione |
| **macchina** | trattore, escavatore, carrello elevatore, gru | matricola, anno; spesso a **ore motore** |
| **attrezzatura** | estintore, impianto, sollevatore, compressore | matricola, ubicazione |
| **sede** | magazzino, stabilimento, ufficio | indirizzo |
| **persona** | autista, operatore, impiegato | codice fiscale, assunzione, account collegato (facoltativo) |
| **azienda** | l'impresa stessa (anche più ragioni sociali) | partita IVA |

- Il **tipo** decide quali dati servono ed è fisso: sei tipi, nel codice.
- La **categoria** è del cliente (nasce dalla libreria, si può aggiungere):
  "Autocarro > 3,5 t", "Trattore", "Estintore a polvere"… Decide quali controlli
  si applicano.
- **Campi aggiuntivi** della categoria, definiti dal cliente (es. "portata",
  "classe del fuoco") per non dover cambiare il codice a ogni esigenza.
- **Stato del soggetto**: *in servizio*, *fermo* (temporaneamente non usato),
  *dismesso* (chiude le scadenze aperte, lo storico resta).
- **Relazioni**:
  - *si trova in* — un'attrezzatura o una macchina in una sede;
  - *assegnato a* — una persona usa un veicolo o una macchina in un periodo
    (storico delle assegnazioni);
  - *referente* — la persona responsabile del soggetto (riceve gli avvisi).

### Contatore e lettura

- Un soggetto può avere **zero o più contatori**, ciascuno con la sua unità:
  **km** o **ore** (un autocarro con gru può averli entrambi).
- Una **lettura** è un valore a una data, con la fonte: *manuale*,
  *registrazione* (letto durante un intervento), *telematica*.
- Il valore attuale è l'ultima lettura; letture incoerenti (minori della
  precedente) si segnalano, non si scartano in silenzio.

### Controllo — *che cosa* va fatto, definito dal cliente

Esempi: revisione, assicurazione RCA, bollo, tagliando, cronotachigrafo,
patente C, CQC, visita medica, corso antincendio, verifica estintori, CPI,
rata del leasing, rinnovo di un abbonamento, audit ISO 9001.

- **Natura** (per filtri, icone e resoconti): *adempimento*, *manutenzione*,
  *abilitazione*, *documento*, *pagamento*, *promemoria*.
- **Si applica a**: un tipo di soggetto e, se serve, alcune categorie.
- **Cadenza** (vedi 1.4) e **preavvisi** (es. 32, 8 e 1 giorni prima; per l'uso
  anche "1024 km prima").
- **Tolleranza**: giorni dopo la scadenza in cui il rinnovo è ancora regolare e
  non pregiudica l'operatività (es. assicurazione RCA: scade il 20 maggio,
  rinnovabile fino al 4 giugno). Assente = nessuna tolleranza. Anche per l'uso
  (es. tagliando: 512 km di tolleranza).
- **Regole**:
  - *automatico*: si crea da solo su ogni soggetto della categoria (revisione per
    ogni autocarro) oppure solo quando lo si aggiunge;
  - *rinnovo*: **con conferma** (serve una registrazione: tagliando, revisione)
    oppure **tacito** (la scadenza passa da sola alla successiva: rata
    domiciliata, abbonamento a rinnovo automatico; serve solo il promemoria);
  - *rinviabile*: si può prorogare con un motivo (resta nello storico).
- **Dati della registrazione** richiesti o facoltativi: costo o importo,
  fornitore, riferimento (numero di polizza o di fattura), lettura del contatore,
  allegato obbligatorio.
- **Origine**: la voce della libreria EDG da cui nasce (vuota se creato dal
  cliente). Serve a proporre gli aggiornamenti normativi (passo 3).

### Scadenza — *quando*, per un soggetto

- È l'istanza aperta di un controllo su un soggetto: **una data** e/o **una
  soglia del contatore**.
- **Una sola scadenza aperta** per coppia soggetto-controllo; il passato è
  nelle registrazioni.
- **Stato calcolato**, mai scritto a mano:
  - *in regola* — fuori dai preavvisi;
  - *in scadenza* — dentro il primo preavviso;
  - *in tolleranza* — data superata ma entro il termine di rinnovo: *"scaduta
    il 20 maggio, rinnovabile fino al 4 giugno"*; ha i suoi avvisi;
  - *scaduta* — superata anche l'eventuale tolleranza: non è più in regola;
  - *da completare* — creata in automatico ma senza data (es. un mezzo appena
    inserito di cui non si conosce la prossima revisione).
- **Soggetto fermo**: le sue scadenze restano valide e visibili (l'assicurazione
  scade comunque), ma gli avvisi sono **attenuati**: solo all'ufficio, non agli
  addetti. Un controllo può chiedere di avvisare comunque tutti.
- **Promemoria libero**: scadenza con un titolo e senza controllo, per le cose
  una tantum ("rinnovare il dominio internet il 12/3"); entra in cruscotto,
  calendario e avvisi come le altre.

### Registrazione — *che cosa è stato fatto*

- Data di esecuzione, **esito** (positivo o negativo), lettura del contatore,
  costo o importo, fornitore, riferimento, note, allegati, autore.
- **Esito positivo**: chiude la scadenza e, se il controllo è ricorrente, apre la
  successiva calcolata dalla cadenza (data proposta, modificabile).
- **Esito negativo** (revisione respinta, visita con limitazioni): la scadenza
  resta aperta, con nuova data se serve.
- **Rinvio**: sposta la scadenza con un motivo, senza chiuderla.

### Fornitore

Officine, compagnie assicurative, banche e società di leasing, enti, medici
competenti, centri di formazione: un solo elenco del cliente, con il tipo. Sono
dati del cliente, separati dall'anagrafica di EDG.

### Allegato

Documenti (pdf, foto) collegati a un soggetto (libretto, carta di
circolazione), a una scadenza o a una registrazione (fattura, certificato).

### Avviso (passo 4)

Nasce dai preavvisi e dalle scadenze superate; va al referente del soggetto,
alla persona assegnata e all'ufficio, sui canali scelti (email, in app, poi
WhatsApp). Un avviso non si ripete per lo stesso preavviso.

## 1.4 Cadenze

| Forma | Esempio | Prossima scadenza |
|---|---|---|
| **una tantum** | fine del contratto di leasing | data fissa, nessuna successiva |
| **a tempo** | assicurazione ogni 12 mesi | dalla scadenza precedente o dalla data di esecuzione (scelta del controllo) |
| **a tempo, fine mese** | revisione | come sopra, arrotondata all'ultimo giorno del mese |
| **a uso** | cambio olio ogni 512 ore | dalla lettura registrata + intervallo |
| **combinata** | tagliando ogni 12 mesi o 16000 km | la prima delle due che arriva |
| **con prima scadenza diversa** | revisione: dopo 4 anni, poi ogni 2 | prima scadenza dalla data di immatricolazione |
| **a fasce d'età** | patente B: ogni 10 anni, 5 da 50 anni d'età; gru: ogni 2 anni, ogni anno da 10 anni dalla fabbricazione | la durata è quella della fascia raggiunta alla data da cui si conta (aggiunta del 2026-10-12, libreria-bozza A) |
| **a finestra** | CQC: rinnovo con il corso nei 12 mesi prima | dalla scadenza se fatto entro la finestra, altrimenti dall'esecuzione (aggiunta del 2026-10-12, libreria-bozza B) |
| **con fine** | rata del leasing ogni mese fino al 31/12/2028 | si ferma alla data di fine (o dopo N volte) |

**Ancoraggio**: "dalla scadenza precedente" tiene il calendario fisso (bollo,
assicurazione, rata); "dalla data di esecuzione" conta da quando si è fatto
davvero (tagliando, visita medica).

**Tolleranza e prossima scadenza**: rinnovando durante la tolleranza, la
prossima scadenza si conta comunque dalla scadenza originale (l'assicurazione
rinnovata il 2 giugno scade di nuovo il 20 maggio dell'anno dopo), se
l'ancoraggio è "dalla scadenza precedente".

## 1.5 Esempi di prova del modello

| Soggetto | Controllo | Cadenza | Rinnovo |
|---|---|---|---|
| Furgone CD456EF (fino a 3,5 t) | Revisione | 4 anni, poi 24 mesi, fine mese | con conferma, esito |
| Autocarro AB123CD (oltre 3,5 t) | Revisione | 12 mesi, fine mese | con conferma, esito |
| Autocarro AB123CD | Assicurazione RCA | 12 mesi, tolleranza 15 giorni | con conferma, compagnia, n. polizza |
| Autocarro AB123CD | Tagliando | 12 mesi o 16000 km | con conferma, costo, officina |
| Escavatore matr. 7781 | Cambio olio | 512 ore | con conferma |
| Mario Rossi | Patente C + CQC | data del documento, 5 anni | con conferma, allegato |
| Mario Rossi | Visita medica | 12 mesi dalla visita | con conferma |
| Estintore E-04 (Magazzino) | Verifica | 6 mesi | con conferma, fornitore |
| Magazzino Nereto | CPI | 5 anni | con conferma, allegato |
| Azienda | Rata leasing autocarro | 1 mese fino al 31/12/2028 | tacito (domiciliata) |
| Azienda | Abbonamento software | 12 mesi | tacito |
| Azienda | Certificazione ISO 9001 | 12 mesi (audit) | con conferma, esito |
| Azienda | Rinnovo dominio internet | una tantum | promemoria |

## 1.6 Decisioni (2026-10-07)

1. **Promemoria liberi**: sì, senza controllo, una tantum.
2. **Soggetto fermo**: avvisi attenuati (solo ufficio); un controllo può
   chiedere di avvisare comunque tutti.
3. **Controlli automatici**: alla creazione del soggetto (o all'ingresso in una
   categoria) si creano subito le scadenze *da completare*; il cliente decide
   quali controlli sono automatici.
4. **Costi e importi**: facoltativi su ogni registrazione, raccolti da subito;
   i resoconti (per soggetto, per controllo, per anno) in un passo successivo.
