# Vigilo — 7. Interfaccia (app-frontend)

> Passo 7 dell'analisi (ADR064). Stato: **approvato dall'utente il 2026-10-08** dopo l'anteprima visiva (Artifact "Vigilo — anteprima interfaccia"); ritocchi possibili durante la costruzione.
> Parte dai passi 1-6 (approvati) e dai principi 1.0: *"che cosa devo fare, e
> entro quando?"*, stati in parole con colore + icona + testo, poche schede,
> azioni rapide.

## 7.1 Navigazione

Menu del modulo nell'header (manifest, ADR063):

| Voce | Chi la vede |
|---|---|
| **Cruscotto** (home del modulo) | read · write · own |
| **Scadenze** (elenco completo con filtri) | read · write |
| **Soggetti** | read · write |
| **Calendario** | read · write · own |
| **Fornitori** | read · write |
| **Configurazione** | config |

L'**addetto** (`vigilo.own`) vede solo *Le mie scadenze* e *I miei mezzi*
(7.10).

## 7.2 Gli stati: un solo linguaggio visivo

Un componente unico, **`StatoScadenza`**, usato ovunque (cruscotto, scheda,
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

## 7.3 Cruscotto

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

## 7.6 Scheda del soggetto

Intestazione: icona del tipo, nome, identificativo, categoria, stato
(in servizio · fermo · dismesso), referente, sede; azioni *Modifica*,
*Metti fermo*, *Dismetti*.

| Scheda | Contenuto |
|---|---|
| **Scadenze** (predefinita) | per urgenza, azioni rapide; *Aggiungi controllo*, *Aggiungi promemoria* |
| **Storico** | registrazioni in ordine di tempo (importi a chi ha `vigilo.costi`) |
| **Contatori** | valore, uso medio, andamento delle letture, *Leggi* |
| **Assegnazioni** | chi lo usa e ha usato (per le persone: i mezzi) |
| **Documenti** | allegati del soggetto, delle scadenze e delle registrazioni |
| **Dati** | campi del tipo e della categoria |

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
  scelto, stessi filtri del cruscotto.

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
