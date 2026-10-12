# Vigilo — 4. Avvisi

> Passo 4 dell'analisi (ADR064). Stato: **approvato dall'utente il 2026-10-08**.
> Parte dai passi 1-3 (approvati).

## 4.1 Obiettivo

Che nessuna scadenza passi inosservata **senza inondare nessuno**: ognuno
riceve solo ciò che lo riguarda, sul canale e con la frequenza che preferisce,
e un avviso già dato non si ripete.

## 4.2 Quando nasce un avviso (eventi)

| Evento | Esempio di testo | Note |
|---|---|---|
| **Preavviso** (giorni) | *"Revisione AB123CD: scade tra 8 giorni (30 ottobre)"* | uno per ogni valore dei preavvisi (es. 32, 8, 1) |
| **Preavviso** (uso) | *"Tagliando escavatore 7781: mancano 64 ore (stima 12 novembre)"* | quando una lettura supera la soglia meno il preavviso |
| **Inizio tolleranza** | *"Assicurazione AB123CD: scaduta ieri, rinnovabile fino al 4 giugno"* | solo se il controllo ha la tolleranza |
| **Ultimo giorno di tolleranza** | *"Assicurazione AB123CD: oggi l'ultimo giorno per rinnovare"* | |
| **Scaduta** | *"Revisione AB123CD: SCADUTA dal 30 ottobre"* | superata anche la tolleranza |
| **Richiamo** | come sopra, *"…scaduta da 16 giorni"* | ogni N giorni finché non si risolve (proposta: 8) |
| **Rinnovo tacito** | *"Rata leasing di novembre: rinnovata in automatico"* | solo informativo, solo nel riepilogo |
| **Aggiornamenti della libreria** | *"3 controlli hanno un aggiornamento: revisione estintori (UNI 9994-1:2024)…"* | a chi ha `vigilo.config`; senza scadenza, uno per sincronizzazione (ADR074) |

- **Mai due volte lo stesso avviso**: ogni evento si registra con la scadenza e
  la data di riferimento. Se la data cambia (rinvio, nuova registrazione), il
  ciclo riparte da capo, correttamente.
- **Quando si calcola**: il processo notturno (che ricalcola gli stati) e, in
  più, subito dopo ogni modifica o lettura che sposta una scadenza dentro un
  preavviso.
- **Risolto**: quando la scadenza si registra, gli avvisi in app collegati
  passano a *risolto* da soli (non restano campanelle accese per niente).
- *Da completare* non genera avvisi singoli: compare nel riepilogo finché manca
  la data.

## 4.3 A chi (destinatari)

Destinatari possibili, combinabili:
- **ufficio** — gli utenti del tenant che seguono Vigilo (permesso al passo 5),
  ciascuno con le sue preferenze (4.4);
- **referente** del soggetto;
- **assegnatario** — la persona che usa il mezzo in quel momento (assegnazione
  in corso);
- **interessato** — la persona stessa, per le sue scadenze (patente, visita);
- **indirizzi aggiuntivi** — email esterne (es. il consulente del lavoro).

I destinatari diventano un **quarto gruppo ereditabile** (dopo cadenza,
preavvisi e tolleranza): definiti sul controllo, ridefinibili sulla singola
scadenza. Aggiunta al modello: colonna `destinatari` (JSON) su `controlli` e
`scadenze`.

**Soggetto fermo**: solo l'ufficio, salvo controlli con
`avvisaAncheSeFermo` (deciso al passo 1).

**Persone senza account**: ricevono le proprie scadenze per email se nella
scheda c'è un indirizzo (vedi domande aperte).

## 4.4 Canali e frequenza (preferenze di ogni utente)

| Canale | Quando |
|---|---|
| **In app** | sempre: campanella nell'header (il pulsante esiste già in @edg/ui) con elenco, *letto* e *risolto* |
| **Email** | tramite email-service, template di Vigilo |
| **WhatsApp** | quando la direzione approverà l'account (Twilio, già pianificato); il canale è previsto fin d'ora, si accende senza toccare il resto |

Ogni utente sceglie, con valori predefiniti sensati:
- **frequenza email**: *riepilogo giornaliero* (proposta: alle 8:00, solo nei
  giorni lavorativi), *riepilogo settimanale* (lunedì), *subito*, *mai*;
- **urgenti sempre subito** (scaduta, ultimo giorno di tolleranza): sì/no;
- **di che cosa**: tutto, oppure solo alcuni tipi di soggetto o alcune sedi
  (chi segue il magazzino non riceve le patenti).

## 4.5 Il riepilogo

Un'email per utente, ordinata per urgenza, con i numeri in testa e un link a
ogni voce:

```text
Vigilo — 3 scadute · 2 in tolleranza · 5 entro 8 giorni · 12 entro 32 giorni · 4 da completare

SCADUTE
  Revisione · Autocarro AB123CD · dal 30 ottobre (8 giorni)          [apri]
IN TOLLERANZA
  Assicurazione · Furgone CD456EF · rinnovabile fino al 4 giugno     [apri]
ENTRO 8 GIORNI
  …
```

Se non c'è niente di nuovo né di urgente, il riepilogo **non parte**.

## 4.6 Modello dati (aggiunte al passo 2)

| Tabella / colonna | Contenuto |
|---|---|
| `controlli.destinatari`, `scadenze.destinatari` | quarto gruppo ereditabile |
| `avvisi` | `idTenant`, `idScadenza`, `evento` (preavviso:32, tolleranza:inizio, scaduta, richiamo…), `dataRiferimento`, `creatoIl` — unico per scadenza + evento + data di riferimento |
| `consegne` | `idAvviso`, `idAccount` o `email`, `canale`, `stato` (in coda · inviato · fallito · letto · risolto), `inviatoIl`, `errore` |
| `preferenze_avvisi` | `idTenant`, `idAccount`, `frequenza`, `urgentiSubito`, `canali`, `filtri` (tipi di soggetto, sedi) |
| `impostazioni` | orario del riepilogo, giorni lavorativi, intervallo dei richiami |

## 4.7 Decisioni (2026-10-08)

1. **Destinatari predefiniti** di un controllo nuovo: ufficio + referente +
   assegnatario (mezzi) o interessato (scadenze della persona);
   personalizzabili per controllo e per scadenza.
2. **Email predefinita**: riepilogo giornaliero alle 8:00 nei giorni
   lavorativi, solo se c'è qualcosa; urgenti (scaduta, ultimo giorno di
   tolleranza) subito.
3. **Richiamo delle scadute**: ogni 8 giorni finché non si risolvono;
   intervallo modificabile dal cliente, 0 = nessun richiamo.
4. **Persone senza account**: ricevono per email le proprie scadenze se nella
   scheda c'è un indirizzo.
