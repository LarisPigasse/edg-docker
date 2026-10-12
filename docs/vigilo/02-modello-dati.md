# Vigilo — 2. Modello dati

> Passo 2 dell'analisi (ADR064). Stato: **approvato dall'utente il 2026-10-08**.
> Parte da `01-dominio.md` (approvato) e non lo contraddice.

## 2.1 Scelte di fondo

- **Database proprio**: `edg_vigilo` sull'istanza PostgreSQL esistente
  (`edg-postgres`), utente dedicato, migrazioni Sequelize come system-service.
- **Convenzioni di system-service** (il servizio più recente): nomi italiani,
  attributi in camelCase nel codice e colonne in snake_case nel database
  (`underscored`: `idTenant` ↔ `id_tenant`), chiave intera `id<Entità>` per le relazioni interne e
  `uuid<Entità>` per tutto ciò che esce dal servizio (API, allegati, demo): gli
  id interi non si espongono, così non si possono "indovinare" fra tenant.
- **`idTenant` su ogni tabella del cliente** (non sulla libreria, che è di
  EDG). Tutte le query filtrano per tenant; eliminare i dati di un tenant è un
  `DELETE … WHERE idTenant = ?` per tabella (contratto della demo e dei 64
  giorni, ADR047).
- **Niente cancellazioni fisiche nell'uso normale**: i soggetti si dismettono,
  i controlli si disattivano, le scadenze si chiudono. Lo storico resta.
- **Chi e quando**: `createdAt`, `updatedAt`, `creatoDa`, `modificatoDa`
  (id dell'account) su ogni tabella del cliente; il dettaglio prima/dopo va
  nell'audit di log-service (ADR034, ADR039), come negli altri servizi.

## 2.2 Ereditarietà a tre livelli (principio 1.0)

| Livello | Dove | Come passa al livello sotto |
|---|---|---|
| **Libreria EDG** | tabelle `libreria_*` (globali) | **copia con origine**: alla procedura di avvio i valori si copiano nel controllo del cliente, che ricorda `chiaveLibreria` e `versioneLibreria` |
| **Controllo del cliente** | `controlli` | **eredità viva**: la scadenza usa i valori del controllo finché non li ridefinisce |
| **Singola scadenza** | `scadenze` | colonne di ridefinizione: vuote = eredita |

Perché la libreria si *copia* e non si eredita in tempo reale: le
personalizzazioni del cliente devono restare stabili; un cambio normativo si
**propone** (confrontando le versioni), non si impone (passo 3).

Le impostazioni ereditabili sono **tre gruppi**, ciascuno un oggetto JSON con
uno schema unico validato nel codice:

```text
cadenza     { tempo: { valore, unita: giorni|mesi|anni } | null,
              uso:   { valore, unita: km|ore } | null,
              ancoraggio: scadenza|esecuzione|finestra,
              fineMese: bool,
              prima: { tempo: { valore, unita }, da: <campo data del soggetto> } | null,
              finestra: { valore, unita } | null,              (solo con ancoraggio finestra)
              fasce: { da: <campo data del soggetto>,
                       elenco: [{ oltre: { valore, unita }, tempo: { valore, unita } }] } | null }
preavvisi   { giorni: [32, 8, 1], uso: [1024] }
tolleranza  { giorni: 15, uso: 512 }          (assente = nessuna tolleranza)
```

`finestra` e `fasce` sono aggiunte del 2026-10-12 (libreria-bozza, proposte A
e B): assenti valgono null. Le date del soggetto usabili in `prima.da` e
`fasce.da` sono fissate per tipo (`DATE_SOGGETTO`, proposta C): veicolo
`immatricolazione`; macchina e attrezzatura `fabbricazione`, `messaInServizio`;
sede `conformitaImpianto`; persona `nascita`, `assunzione`.

Valore effettivo = ridefinizione della scadenza **??** valore del controllo.
Una sola funzione pura nel codice fa questa fusione: nessun altro punto la
ripete.

## 2.3 Tabelle del cliente

### `impostazioni` — Vigilo per un tenant
| Colonna | Note |
|---|---|
| `idTenant` | chiave |
| `avviatoIl` | procedura di avvio completata (null = da fare) |
| `modelliApplicati` | chiavi dei modelli di settore usati (es. `["trasporto"]`) |
| `predefiniti` | JSON: preavvisi e tolleranza proposti ai controlli nuovi |

### `categorie`
| Colonna | Note |
|---|---|
| `idCategoria`, `uuidCategoria`, `idTenant` | |
| `tipoSoggetto` | veicolo · macchina · attrezzatura · sede · persona · azienda |
| `nome`, `descrizione`, `icona`, `ordine`, `attiva` | |
| `campi` | JSON: definizione dei **campi aggiuntivi** (chiave, etichetta, tipo testo/numero/data/elenco/sì-no, opzioni, obbligatorio, ordine) |
| `contatori` | unità create in automatico sui soggetti nuovi (es. `["km"]`, `["ore"]`) |
| `chiaveLibreria`, `versioneLibreria` | origine (vuote se creata dal cliente) |

Unica per `idTenant + tipoSoggetto + nome`.

### `soggetti`
| Colonna | Note |
|---|---|
| `idSoggetto`, `uuidSoggetto`, `idTenant` | |
| `tipo`, `idCategoria` | tipo fisso; categoria del cliente (facoltativa per l'azienda) |
| `nome` | come lo si chiama ("Autocarro Iveco", "Mario Rossi") |
| `identificativo` | il dato principale del tipo: targa, matricola, codice fiscale, partita IVA — indicizzato per la ricerca |
| `codice` | codice interno del cliente (facoltativo) |
| `stato`, `statoDal` | in servizio · fermo · dismesso |
| `dati` | JSON: **campi del tipo** (marca, modello, telaio, immatricolazione, alimentazione, data di assunzione…), schema fisso per tipo nel codice |
| `campi` | JSON: valori dei **campi aggiuntivi** della categoria |
| `idSede` | *si trova in* → soggetto di tipo sede |
| `idReferente` | *referente* → soggetto di tipo persona |
| `idAccount` | per le persone: account della piattaforma (riferimento morbido ad auth-service), serve agli addetti |
| `note` | |

Perché un'unica tabella con JSON e non una tabella per tipo: cruscotto,
calendario, ricerca e avvisi lavorano su "soggetti" senza sapere il tipo; i
campi che servono a cercare e ordinare (`nome`, `identificativo`, `codice`)
sono colonne vere.

### `contatori` e `letture`
| `contatori` | Note |
|---|---|
| `idContatore`, `uuidContatore`, `idTenant`, `idSoggetto` | |
| `unita`, `nome` | km · ore; nome facoltativo ("Gru") se ce n'è più d'uno |
| `valore`, `lettoIl` | ultima lettura (copia per velocità) |
| `usoGiornaliero` | media calcolata dalle letture: serve a **stimare la data** delle scadenze a uso ("a questo ritmo, tra circa 20 giorni") |

| `letture` | Note |
|---|---|
| `idLettura`, `idTenant`, `idContatore` | |
| `valore`, `lettoIl` | |
| `fonte` | manuale · registrazione · telematica · importazione |
| `idRegistrazione` | se letta durante un intervento |
| `anomala` | valore minore del precedente: si segnala, non si scarta |

### `assegnazioni`
`idAssegnazione`, `idTenant`, `idSoggetto` (il mezzo), `idPersona`, `dal`,
`al` (vuoto = in corso), `note`. Storico di chi ha usato cosa; serve agli
addetti e agli avvisi.

### `fornitori`
`idFornitore`, `uuidFornitore`, `idTenant`, `nome`, `tipo` (testo libero con
suggerimenti: officina, assicurazione, banca, ente, medico, formazione…),
`telefono`, `email`, `indirizzo`, `referente`, `note`, `attivo`.

### `controlli` e `controlli_categorie`
| Colonna | Note |
|---|---|
| `idControllo`, `uuidControllo`, `idTenant` | |
| `nome`, `descrizione`, `riferimentoNormativo` | |
| `natura` | adempimento · manutenzione · abilitazione · documento · pagamento · promemoria |
| `tipoSoggetto` | a quale tipo si applica |
| (`controlli_categorie`) | a quali categorie; nessuna riga = tutte le categorie del tipo |
| `automatico` | crea da solo la scadenza *da completare* sui soggetti delle sue categorie |
| `cadenza`, `preavvisi`, `tolleranza` | i tre gruppi ereditabili (2.2) |
| `rinnovo` | conferma · tacito |
| `rinviabile`, `avvisaAncheSeFermo` | |
| `registrazione` | JSON: per ogni dato (importo, fornitore, riferimento, lettura, allegato) se è obbligatorio, facoltativo o nascosto |
| `ordine`, `attivo` | |
| `chiaveLibreria`, `versioneLibreria` | origine |

### `scadenze`
| Colonna | Note |
|---|---|
| `idScadenza`, `uuidScadenza`, `idTenant` | |
| `idSoggetto` | facoltativo solo per il promemoria libero |
| `idControllo` | vuoto = **promemoria libero** |
| `titolo` | obbligatorio per il promemoria; altrimenti eventuale nome personalizzato |
| `scadeIl` | data (vuota se solo a uso o *da completare*) |
| `idContatore`, `sogliaUso` | soglia del contatore per le scadenze a uso |
| `cadenza`, `preavvisi`, `tolleranza` | **ridefinizioni** (vuote = eredita dal controllo) |
| `fineIl`, `ripetizioniRimaste` | fine della ricorrenza (rate del leasing: è del singolo contratto, non del controllo) |
| `giornoAncora` | giorno del mese della serie (es. 30): le scadenze mensili o annuali tornano su quel giorno dopo un mese più corto, invece di scivolare (aggiunta del blocco B2) |
| `chiusaIl`, `motivoChiusura` | vuota = aperta; motivo: rinnovata · completata · fine ricorrenza · soggetto dismesso · controllo disattivato |
| *calcolati* `stato`, `limiteIl`, `stimataIl`, `urgenzaIl` | copie per velocità, ricalcolate a ogni modifica e ogni notte: stato (in regola · in scadenza · in tolleranza · scaduta · da completare), fine della tolleranza, data stimata per l'uso, data che decide l'ordine di urgenza |
| `note` | |

**Una sola scadenza aperta per soggetto e controllo** (indice unico parziale
`WHERE chiusaIl IS NULL`).

### `registrazioni`
| Colonna | Note |
|---|---|
| `idRegistrazione`, `uuidRegistrazione`, `idTenant`, `idScadenza` | |
| `tipo` | esecuzione · rinvio · rinnovo tacito |
| `eseguitaIl`, `esito` | esito positivo · negativo (solo per l'esecuzione) |
| `dataPrecedente`, `dataNuova` | scadenza prima e dopo (rinvio, rinnovo, esito negativo) |
| `idContatore`, `lettura` | lettura al momento dell'intervento (crea anche una riga in `letture`) |
| `importo`, `idFornitore`, `riferimento` | costo o importo, chi, numero di polizza o fattura |
| `idScadenzaSuccessiva` | la scadenza aperta da questa registrazione |
| `motivo`, `note` | il motivo è obbligatorio per il rinvio |

### `allegati`
`idAllegato`, `uuidAllegato`, `idTenant`, `entita` (soggetto · scadenza ·
registrazione), `idEntita`, `nomeFile`, `percorso` (`<idTenant>/<uuid>` nel
volume dei file), `tipoMime`, `dimensione`, `descrizione`, `caricatoDa`.

### Avvisi (passo 4)
La tabella degli avvisi inviati (per non ripetere lo stesso preavviso) si
definisce con il passo 4; si appoggia a `scadenze`, tranne l'avviso degli
aggiornamenti della libreria (tipo `libreria`, senza scadenza, ADR074).

### `decisioni_libreria` — registro delle scelte sulla libreria (ADR074)
| Colonna | Note |
|---|---|
| `contesto` | avvio · aggiornamento |
| `entita`, `chiaveLibreria`, `nome`, `idEntita` | la voce (categoria o controllo) e la copia del cliente |
| `versioneDa`, `versioneA`, `novita` | che cosa è stato proposto e il testo mostrato |
| `disponibileDal`, `vistoIl` | quando era disponibile, quando il cliente ha aperto le differenze |
| `esito`, `campi` | incluso · escluso (avvio); accettato · parziale · rifiutato, con `{campo, mio, libreria, scelto}` (aggiornamento) |
| `decisoIl`, `decisoDa`, `decisoDaNome`, `decisoDaEmail` | chi e quando, con nome ed email copiati |

Le righe non si modificano (trigger nel database); si cancellano solo con i
dati del tenant. `categorie` e `controlli` portano `versioneIgnorata` e
`aggiornamentoVistoIl/Da` della versione proposta.

## 2.4 Tabelle della libreria (EDG, senza tenant)

| Tabella | Contenuto |
|---|---|
| `libreria_categorie` | `chiave`, `tipoSoggetto`, `nome`, `campi`, `contatori`, `versione`, `novita`, `impronta`, `ordine` |
| `libreria_controlli` | `chiave`, `codice`, `nome`, `natura`, `tipoSoggetto`, `categorie` (chiavi), `cadenza`, `preavvisi`, `tolleranza`, `rinnovo`, `registrazione`, `riferimentoNormativo`, `versione`, `novita`, `impronta`, `ordine`, `ritirato` |
| `modelli_settore` | `chiave`, `nome`, `descrizione`, `ordine`, `impronta` |
| `modelli_voci` | `modello`, `tipoVoce` (categoria · controllo), `chiaveVoce`, `preselezionata` |

Chiavi testuali stabili (`revisione-autocarro`, `rca`, `trasporto`), come le
chiavi dei moduli. Come si alimenta la libreria (file versionati nel codice o
editor in pro-frontend) si decide al passo 3.

## 2.5 Relazioni in breve

```text
categorie 1─n soggetti 1─n contatori 1─n letture
                 │  └─ idSede, idReferente → soggetti      assegnazioni: soggetto ↔ persona
                 │
controlli n─n categorie            controlli 1─n scadenze n─1 soggetti
                                   scadenze 1─n registrazioni n─1 fornitori
allegati → soggetto | scadenza | registrazione
libreria_* ─(copia con origine)→ categorie, controlli
```

## 2.6 Efficienza

- Il cruscotto legge **solo `scadenze` aperte** del tenant, già con stato e
  data di urgenza calcolati: indice su `(idTenant, chiusaIl, urgenzaIl)` e su
  `(idTenant, stato)`. Nessun calcolo di cadenze durante la lettura.
- Ricalcolo degli stati: a ogni modifica della scadenza, del controllo o di
  una lettura, e una volta per notte (gli stati dipendono dalla data di oggi).
- Ricerca per `nome`, `identificativo`, `codice` con indici; i JSON non si
  usano per filtrare nelle liste principali.

## 2.7 Decisioni (2026-10-08)

1. **Convenzioni di system-service** confermate: nomi italiani, `idTenant`,
   id interi per le relazioni interne, `uuid` per tutto ciò che esce dal
   servizio.
2. **Promemoria libero senza soggetto**: ammesso; nel cruscotto compare come
   "Generale" e si può sempre collegare a un soggetto in seguito.
