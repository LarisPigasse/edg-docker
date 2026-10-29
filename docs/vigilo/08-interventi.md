# Vigilo — 8. Interventi: manutenzioni, riparazioni e manodopera

> Passo 8 dell'analisi, aggiunto il 2026-10-28 su richiesta dell'utente prima
> dei resoconti dei costi. Stato: **approvato dall'utente il 2026-10-28**. Parte dai passi
> 1-7 (approvati); ciò che qui non è detto resta com'è.
> Decisioni già prese dall'utente (2026-10-28): il guasto è una scadenza; il
> costo orario è per persona; "blocca l'uso" sospende il mezzo.

## 8.1 Che cosa si intende

Gli **interventi** sono i lavori di manutenzione e riparazione su veicoli,
macchine e attrezzature. Sono di tre famiglie:

| Famiglia | Chi la decide | Esempio | In Vigilo |
|---|---|---|---|
| **Adempimenti** | regole esterne (leggi, norme) | revisione, verifica periodica della gru | controlli dalla libreria (passo 3) — **c'è già** |
| **Manutenzioni programmate** | l'azienda | controllo freni ogni 6 mesi, gomme ogni 32.000 km, ingrassaggio ogni 256 ore | controlli del cliente di natura *manutenzione*, a tempo, a uso o "il primo che arriva" — **c'è già** |
| **Riparazioni** | gli eventi | rottura, guasto, malfunzionamento | **nuovo**: il guasto (8.2) |

Ogni intervento può essere fatto **internamente** (dipendenti) o da
**un'officina esterna** (fornitore), o in entrambi i modi, e costa **euro**
(fattura, ricambi, materiali) e/o **ore di lavoro** dei dipendenti (8.3).

## 8.2 Il guasto: una scadenza di natura "riparazione"

Un guasto è una **cosa da fare** su un soggetto (veicolo, macchina,
attrezzatura, sede), come un promemoria: entra in dashboard, calendario,
avvisi e pannello come le altre scadenze, e si chiude con una registrazione.

- **Dati**: titolo ("Freni rumorosi"), descrizione, **blocca l'uso** sì/no,
  **entro il** (proposta: oggi se blocca l'uso, altrimenti tra 8 giorni;
  modificabile). Nessuna cadenza: è una volta sola.
- **Chi lo segnala**: l'ufficio (`vigilo.write`) su qualsiasi soggetto;
  l'**addetto** (`vigilo.own`) sui mezzi che ha assegnati, dal telefono. Non
  serve conferma: un guasto è un fatto da sapere subito.
- **Avviso** immediato all'ufficio che può intervenire (`vigilo.write`, con i
  filtri delle preferenze), **urgente** se blocca l'uso.
- **Blocca l'uso**: il soggetto passa a **Sospeso** (stato *fermo*, che c'è
  già). Registrando la riparazione dell'ultimo guasto bloccante, Vigilo
  propone **"Rimetti in servizio"** (già spuntato).
- **Si chiude** con la registrazione "Riparato" (esito positivo): costi,
  esecuzione, manodopera, fornitore, documenti, lettura del contatore. Esito
  negativo: resta aperto, con una nuova data se serve. L'addetto può anche
  segnalarlo riparato (segnalazione da confermare, B9c).
- **Riparato già**: un guasto scoperto e riparato insieme si registra in un
  passo solo (si apre e si chiude con la stessa operazione).
- Più guasti aperti sullo stesso soggetto sono ammessi.

## 8.3 Esecuzione e manodopera nella registrazione

Valgono per **ogni** registrazione (adempimenti, manutenzioni, riparazioni):

- **Eseguito da**: *interno* · *esterno* · *entrambi*. Esterno = il
  fornitore (c'è già).
- **Manodopera interna**: fino a **8 righe** *persona + ore* (a quarti d'ora,
  al massimo 1024 ore per riga); una riga può essere senza persona
  ("dipendente") e usa il costo predefinito.
- **Importo** in euro (c'è già): fattura dell'officina, ricambi, materiali.
- **Costo della manodopera** = ore × **costo orario copiato nella riga al
  momento della registrazione**: cambiare dopo il costo di una persona non
  riscrive il passato.
- **Costo totale** di un intervento = importo + manodopera.
- Come gli altri dati, il controllo dice se la manodopera è *obbligatoria*,
  *facoltativa* o *nascosta*. Predefinito: facoltativa per manutenzioni,
  riparazioni e adempimenti; nascosta per pagamenti, documenti e abilitazioni.

## 8.4 Costo orario

- **Per persona**: costo orario (€/h) nella scheda della persona.
- **Predefinito del tenant** nelle impostazioni, per le persone senza costo e
  per le righe senza persona. Limiti invalicabili 0–1024 €/h
  (`impostazioni/limiti.ts`, ADR093).
- Vedono e modificano i costi solo chi ha **`vigilo.costi`** (passo 5): le
  **ore** sono visibili a tutti, gli **euro** no.

## 8.5 Modello dati (aggiunte al passo 2)

| Tabella | Colonna | Note |
|---|---|---|
| `scadenze` | `natura` | solo per le scadenze senza controllo: `riparazione`; vuota = promemoria (con controllo vale la natura del controllo) |
| `scadenze` | `bloccaUso` | il guasto sospende il soggetto |
| `registrazioni` | `esecuzione` | interna · esterna · entrambe; vuota = non detto |
| `registrazioni` | `manodopera` | JSON `[{idPersona, ore, costoOrario}]`, al massimo 8 righe |
| `soggetti` | `costoOrario` | solo persone, €/h |
| `impostazioni_tenant` | `costi` | JSON `{ costoOrario }` predefinito |

La natura dei **controlli** non cambia: una manutenzione programmata è un
controllo, una riparazione no.

## 8.6 Servizio (aggiunte al passo 6)

| Rotta | Chi |
|---|---|
| `POST /soggetti/:id/guasti` (guasto; con `riparato` anche la registrazione) | write, own nel suo ambito |
| registrazione e conferma: `esecuzione`, `manodopera` | come oggi |
| `costoOrario` della persona in `PATCH /soggetti/:id` | write + costi |
| `costi.costoOrario` nelle impostazioni | config + costi |

Filtri e dashboard: la natura `riparazione` vale come le altre (elenco,
"Per controllo", calendario). Avviso `guasto:<id>`.

## 8.7 Interfaccia (aggiunte al passo 7)

- **Segnala un guasto**: nel menu Azioni della scheda del soggetto, in "I miei
  mezzi" dell'addetto e nella dashboard. Modulo breve: titolo, descrizione,
  blocca l'uso, entro il, documento/foto; casella "Già riparato" che apre i
  campi della registrazione.
- I guasti in dashboard e negli elenchi con la natura **Riparazione**
  (icona chiave inglese), filtrabili.
- **Modulo Registra**: "Chi ha fatto il lavoro" (Interno · Esterno ·
  Entrambi); righe di manodopera (persona e ore, con il costo a chi ha
  `vigilo.costi`); per l'ultimo guasto bloccante, "Rimetti in servizio".
- **Scheda della persona**: costo orario (solo `vigilo.costi`).
- **Impostazioni**: costo orario predefinito.

## 8.8 Rimandato (costo alto rispetto al beneficio, oggi)

- Righe di dettaglio del lavoro (ricambio per ricambio): bastano note e
  fattura/verbale come documento.
- Giorni di fermo come indicatore (i dati ci saranno: sospensione e
  riparazione).

## 8.9 Prospettiva: costo di esercizio dei mezzi

Un giorno servirà il **costo di esercizio**: un camion a km, un trattore a
ora. Questo passo lo prepara:

- costo per km o per ora nel periodo = (importi + manodopera di tutte le
  registrazioni del mezzo) ÷ (km o ore dai contatori nello stesso periodo):
  i **resoconti (B10c)** lo mostreranno già per le spese registrate;
- poi, in un passo successivo, i **costi senza scadenza** (carburante,
  leasing o rate, ammortamento, pneumatici a consumo) come spese registrate
  sul mezzo, nella stessa fonte, per un costo di esercizio completo.

## 8.10 Ordine di costruzione

| Blocco | Contenuto |
|---|---|
| **B10a** | interventi: guasto, esecuzione e manodopera, costo orario, "blocca l'uso" |
| **B10b** | aggiornamenti della libreria (proposta del 2026-10-28) |
| **B10c** | resoconti: Spese e consumi, con riparazioni, manodopera e costo per km/ora |
