# Vigilo — Libreria EDG: bozza da validare

> Prepara il contenuto della libreria (passo 3.4, ADR066) prima che diventi file
> del codice (blocco B4). Stato: **approvata dall'utente il 2026-10-12**,
> comprese le aggiunte al modello A, B e C (sezione 2). I punti della sezione 11
> restano da chiarire con gli esperti: cambiano solo valori nei file. Fonti
> consultate fino all'8 ottobre 2026 (sezione 13).
>
> Non è una consulenza legale: le voci con confidenza media o bassa e i punti
> della sezione 11 vanno confermati da chi in EDG conosce il settore o da un
> consulente (sicurezza, trasporti).

## 0. Come leggere le tabelle

| Colonna | Significato |
|---|---|
| **Cod** | codice della voce, per discuterne (`V03`, `F12`…). Nel codice diventerà una chiave stabile (`veicolo.rca`…) |
| **Si applica a** | categorie della libreria a cui il controllo si collega |
| **Cadenza** | ogni quanto; **dalla scadenza** = calendario fisso (la successiva si conta dalla scadenza precedente, anche se si è fatto prima), **dall'esecuzione** = si conta da quando è stato fatto; *fine mese* = la data si arrotonda all'ultimo giorno del mese; *prima* = prima scadenza diversa, da una data del soggetto |
| **Toll.** | tolleranza legale dopo la scadenza (stato *in tolleranza*); `—` = nessuna |
| **Preavvisi** | profilo (sezione 1.2) |
| **Auto** | ● la scadenza si crea da sola su ogni soggetto della categoria · ○ si aggiunge a mano sui soggetti che ne hanno bisogno |
| **Modelli** | in quali modelli di settore compare: **B** base aziendale, **T** autotrasporto merci, **L** logistica e magazzino, **A** agricoltura, **E** movimento terra ed edilizia; `✓` = preselezionata nella procedura di avvio |
| **Rif.** | riferimento normativo; `[n]` = fonte nella sezione 13 |
| **Conf.** | confidenza della ricerca: **A** alta, **M** media, **B** bassa |

## 1. Regole comuni

### 1.1 Valori legali e valori liberi

- I valori **fissati da una norma** (6 mesi, 3 anni, 120 giorni, 15 giorni di
  tolleranza…) restano **esattamente** come nella norma.
- I valori **liberi** (preavvisi, intervalli di manutenzione del costruttore,
  controlli di buona prassi) sono **potenze di 2** o loro multipli tondi:
  preavvisi a 64, 32, 8 giorni; tagliandi a 16.000, 32.000, 64.000 km;
  512 ore motore.
- Ogni valore resta **personalizzabile** dal cliente sul controllo e sulla
  singola scadenza (passo 1.0): la libreria dà il punto di partenza corretto,
  non un vincolo.

### 1.2 Profili dei preavvisi

| Profilo | Giorni prima | Quando |
|---|---|---|
| **breve** | 8, 1 | cicli brevi (scarichi dati, DURC, controlli trimestrali) |
| **normale** | 32, 8, 1 | pagamenti, polizze, promemoria, controlli semestrali |
| **prenota** | 64, 32, 8 | serve prenotare qualcuno: revisioni, verifiche, visite, corsi |
| **lungo** | 128, 64, 32 | pratiche lunghe: CPI, CQC (corso di 35 ore), certificazioni, permesso di soggiorno |

Per le cadenze a uso: **2.048 e 512 km** (autovetture e furgoni),
**4.096 e 1.024 km** (pesanti), **64 e 16 ore** (macchine).

### 1.3 Altri predefiniti

- **Destinatari**: sempre l'ufficio; in più l'**assegnatario** per veicoli e
  macchine, l'**interessato** per le persone, il **referente** per sedi e
  attrezzature (passo 4).
- **Dati della registrazione**: importo, fornitore, riferimento e allegato
  *facoltativi*; lettura del contatore *obbligatoria* se la cadenza è a uso.
  Per i **documenti** (patenti, CQC, carte) l'allegato è consigliato e la
  **nuova scadenza proposta va controllata sul documento** (la data proposta
  è sempre modificabile, 01-dominio).
- **Natura**: indicata per ogni gruppo (adempimento, manutenzione,
  abilitazione, documento, pagamento, promemoria).

## 2. Che cosa chiede la libreria al modello

La ricerca ha fatto emergere tre casi che il modello del passo 2 esprime solo
in parte. Le propongo come **piccole aggiunte a `Cadenza`** (regole pure del
blocco B2, con test); in alternativa restano voci separate e date da
correggere a mano.

| | Proposta | Serve a | Senza |
|---|---|---|---|
| **A** | **Fasce d'età**: `fasce: [{ oltre: 50 anni, da: 'nascita', tempo: 5 anni }, …]` — la cadenza cambia con l'età della persona o del mezzo, calcolata alla data da cui si conta | patente B (10 → 5 → 3 → 2 anni), patente C (5 → 2 dopo i 65), visita dei videoterminalisti (5 → 2 dopo i 50), verifiche dell'Allegato VII (biennale → annuale dopo 10 anni dalla fabbricazione) | voci separate da cambiare a mano quando la persona o il mezzo passa di fascia (facile da dimenticare) |
| **B** | **Finestra di anticipo**: `ancoraggio: 'finestra'` con `finestra: 12 mesi` — se fatto entro la finestra prima della scadenza si conta dalla scadenza, altrimenti dall'esecuzione | CQC (12 mesi), certificato ADR del conducente (12 mesi), certificato ADR del veicolo (1 mese) | la data proposta va corretta a mano quando si rinnova in anticipo |
| **C** | **Date del soggetto** nei `dati` del tipo (schema fisso, passo 2): veicolo `immatricolazione`; macchina e attrezzatura `fabbricazione`, `messaInServizio`; persona `nascita`; sede `conformitaImpianto` (dichiarazione di conformità dell'impianto elettrico) | prime scadenze (`prima`) e fasce (A) | prima scadenza da inserire a mano |

Le scadenze legate a **eventi** (ponteggio dopo un temporale, scaffalatura
dopo un urto, DVR dopo una modifica) non hanno cadenza: restano fuori dalla
libreria (sezione 10) e si gestiscono come promemoria.

## 3. Veicoli

### 3.1 Categorie

| Categoria | Contatore | Campi aggiuntivi proposti | Modelli |
|---|---|---|---|
| **Autovetture** (M1) | km | — | B T✓ L✓ A E✓ |
| **Furgoni e autocarri fino a 3,5 t** (N1) | km | massa complessiva, tachigrafo (sì/no) | T✓ L✓ A E✓ |
| **Autocarri oltre 3,5 t e trattori stradali** (N2, N3) | km | massa complessiva, ADR (sì/no), frigorifero ATP (sì/no) | T✓ L A E✓ |
| **Rimorchi e semirimorchi oltre 3,5 t** (O3, O4) | — | ADR (sì/no), frigorifero ATP (sì/no) | T✓ L E |
| **Rimorchi fino a 3,5 t** (O1, O2) | — | — | T L A E |
| **Trattori agricoli** | ore | — | A✓ E |
| **Trattori agricoli veloci** (oltre 40 km/h, T1b-T4b, T5) | ore | — | A✓ |

Le masse sono categorie diverse e non campi perché cambiano le cadenze
(revisione annuale o biennale): nessuna regola nascosta (passo 3.4).

### 3.2 Controlli

| Cod | Controllo | Si applica a | Cadenza | Toll. | Preavvisi | Auto | Modelli | Rif. | Conf. |
|---|---|---|---|---|---|---|---|---|---|
| V01 | **Revisione** | Autovetture, Furgoni, Rimorchi fino a 3,5 t | 2 anni dall'esecuzione, fine mese · *prima*: 4 anni da immatricolazione | — | prenota | ● | B T✓ L✓ A E✓ | art. 80 c.3 CdS; DM 214/2017 [V1][V2] | A |
| V02 | **Revisione annuale** | Autocarri oltre 3,5 t, Rimorchi oltre 3,5 t | 1 anno dall'esecuzione, fine mese · *prima*: 1 anno da immatricolazione | — | prenota | ● | T✓ L A E✓ | art. 80 c.4 CdS [V1] | A |
| V03 | **Assicurazione RCA** | tutte le categorie | 1 anno dalla scadenza | **15 giorni** | normale | ● | B T✓ L✓ A✓ E✓ | art. 170-bis D.Lgs 209/2005 [V3] | A |
| V04 | **Tassa automobilistica (bollo)** | tutte tranne Trattori | 1 anno dalla scadenza, fine mese | — | normale | ● | B T✓ L✓ A E✓ | DM 462/1998; leggi regionali; D.Lgs 147/2026 [V4][V5] | M |
| V05 | **Controllo periodico del tachigrafo** | Autocarri oltre 3,5 t (●); Furgoni (○) | 2 anni dall'esecuzione | — | prenota | ● | T✓ L E | Reg. UE 165/2014 art. 23; DM MIMIT 23/2/2023 [V6][V7] | A |
| V06 | **Scarico dati dell'unità di bordo** | come V05 | 90 giorni dall'esecuzione | — | breve | ● | T✓ L E | Reg. UE 581/2010 art. 1 [V8] | A |
| V07 | **Certificato di approvazione ADR** ("barrato rosa") | Autocarri e Rimorchi oltre 3,5 t | 1 anno, finestra 1 mese (proposta B) | — | prenota | ○ | T L | ADR 9.1.3.4; circ. MIT 21715/2021 [V9] | A |
| V08 | **Ispezione cisterna ADR** (intermedia / periodica) | Autocarri e Rimorchi oltre 3,5 t | 3 anni dall'esecuzione (si alternano intermedia e periodica a 6 anni) | — | prenota | ○ | T | ADR 6.8.2.4 (testo non letto direttamente) | M |
| V09 | **Attestato ATP** (veicoli frigoriferi) | Furgoni, Autocarri e Rimorchi oltre 3,5 t | *prima*: 6 anni da immatricolazione · poi 3 anni | — | lungo | ○ | T L | Accordo ATP All. 1 App. 1; L. 264/1977 [V11] | M |
| V10 | **Controllo perdite del gruppo frigorifero** (gas fluorurati) | Furgoni, Autocarri e Rimorchi oltre 3,5 t | 12 mesi dall'esecuzione (carica 5-50 t CO2eq; vedi S12) | — | normale | ○ | T L | Reg. UE 2024/573 art. 5 [S8] | A |
| V11 | **Montaggio pneumatici invernali o catene a bordo** | Autovetture, Furgoni, Autocarri oltre 3,5 t | 1 anno dalla scadenza (15 novembre; montaggio dal 15 ottobre) | — | normale | ○ | B T L A E | art. 6 c.4 lett. e CdS; dir. MIT 16/1/2013 [V12] | A |
| V12 | **Rimozione pneumatici invernali** (se codice di velocità inferiore al libretto) | come V11 | 1 anno dalla scadenza (15 maggio) | — | normale | ○ | B T L A E | come V11 [V12] | A |
| V13 | **Tagliando** | Autovetture | 1 anno o 16.000 km dall'esecuzione | — | normale | ● | B T✓ L✓ A E✓ | libretto del costruttore | — |
| V14 | **Tagliando** | Furgoni | 1 anno o 32.000 km dall'esecuzione | — | normale | ● | T✓ L✓ A E✓ | libretto del costruttore | — |
| V15 | **Tagliando** | Autocarri oltre 3,5 t | 1 anno o 64.000 km dall'esecuzione | — | normale | ● | T✓ L A E✓ | libretto del costruttore | — |
| V16 | **Manutenzione programmata** | Trattori, Trattori veloci | 1 anno o 512 ore dall'esecuzione | — | normale | ● | A✓ E | libretto del costruttore | — |
| V17 | **Revisione macchine agricole** | Trattori | *prima*: calendario per anno di immatricolazione (sotto) · poi 5 anni dall'esecuzione | — | prenota | ● | A✓ E | art. 111 CdS; DM 20/5/2015; L. 26/2026 [V13][V14] | M |
| V18 | **Revisione trattori veloci** | Trattori veloci | 2 anni dall'esecuzione · *prima*: 4 anni da immatricolazione | — | prenota | ● | A✓ | DM 214/2017 art. 5; DD MIT 494/2025 e 303/2026 [V15] | M |

Natura: V01-V02, V05, V07-V10, V17-V18 *adempimento*; V03-V04 *pagamento*;
V06 *adempimento*; V11-V12 *promemoria*; V13-V16 *manutenzione*.

### 3.3 Note

- **V01/V02** — la revisione si fa "entro il mese": la successiva si conta dal
  mese di quella eseguita (anticipandola, il ciclo si sposta). Scaduta, il
  veicolo è sospeso dalla circolazione (può andare solo alla revisione
  prenotata). Il pacchetto UE "roadworthiness" (revisione annuale delle auto
  con più di 10 anni) è stato **respinto** da Consiglio e Parlamento; triloghi
  in corso, cadenze invariate [V17].
- **V03** — il contratto RCA non ha tacito rinnovo: la garanzia resta attiva
  15 giorni dopo la scadenza, non oltre.
- **V04** — la *scadenza* in Vigilo è l'**ultimo giorno utile per pagare**
  (fine del mese successivo al periodo), quindi niente tolleranza. I periodi
  fissi cambiano per **regione** e per tipo (autocarri oltre 12 t anche a 4
  mesi): il cliente corregge cadenza e data. Dal **2028** (D.Lgs 147/2026) il
  periodo si lega al mese di immatricolazione.
- **V05/V06** — dal **1° luglio 2026** il tachigrafo serve anche ai veicoli
  tra 2,5 e 3,5 t in trasporto internazionale o cabotaggio (circ. MIT
  9674/2026): per questo su Furgoni è ○. Il limitatore di velocità si
  controlla con il tachigrafo e con la revisione: nessuna voce a sé.
- **V07** — se la visita si fa nel mese prima o dopo la scadenza, la validità
  riparte dalla scadenza precedente; altrimenti dalla visita.
- **V17** — il decreto attuativo manca ancora; calendario attuale (Milleproroghe
  2026): immatricolati **fino al 1983 entro il 31/12/2026**, 1984-1996 entro il
  31/12/2027, 1997-2023 entro il 31/12/2028, dal 2024 entro il 5° anno. La
  prima scadenza si crea *da completare* e il cliente sceglie la data.
- **V18** — immatricolati 2017-2022: prima revisione entro il **31/12/2026**.
- **V13-V16** — valori indicativi da costruttori: vale "ciò che arriva prima".

## 4. Macchine

### 4.1 Categorie

| Categoria | Contatore | Modelli |
|---|---|---|
| **Carrelli elevatori frontali** | ore | T L✓ A E |
| **Carrelli a braccio telescopico** | ore | L A✓ E✓ |
| **Piattaforme di lavoro mobili elevabili (PLE)** | ore | L E✓ |
| **Gru su autocarro** | ore | T E✓ |
| **Gru mobili (autogru)** | ore | E |
| **Gru a torre** | — | E✓ |
| **Apparecchi di sollevamento fissi** (carroponte, paranchi, argani oltre 200 kg) | — | L E |
| **Macchine movimento terra** (escavatori, pale, terne, minipale) | ore | A E✓ |
| **Irroratrici e atomizzatori** | — | A✓ |
| **Serbatoi di aria compressa** (soggetti a verifica) | — | T L A E |
| **Ponti sollevatori per veicoli** (officina) | — | T |

### 4.2 Controlli

| Cod | Controllo | Si applica a | Cadenza | Toll. | Preavvisi | Auto | Modelli | Rif. | Conf. |
|---|---|---|---|---|---|---|---|---|---|
| M01 | **Verifica periodica — sollevamento mobile, edilizia** (anche siderurgico, portuale, estrattivo) | Gru su autocarro, Gru mobili | 1 anno dall'esecuzione | — | prenota | ● | E✓ | art. 71 c.11 e All. VII D.Lgs 81/08; DM 11/4/2011 [M1][M2] | A |
| M02 | **Verifica periodica — sollevamento mobile, altri settori** | Gru su autocarro, Gru mobili | 2 anni; **1 anno oltre 10 anni dalla fabbricazione** (fasce, proposta A) | — | prenota | ● | T | come M01 [M1][M2] | A |
| M03 | **Verifica periodica gru a torre** | Gru a torre | 1 anno dall'esecuzione | — | prenota | ● | E✓ | All. VII [M1] | A |
| M04 | **Verifica periodica PLE** | PLE | 1 anno dall'esecuzione | — | prenota | ● | L E✓ | All. VII [M1] | A |
| M05 | **Verifica periodica carrelli telescopici** | Carrelli a braccio telescopico | 1 anno dall'esecuzione | — | prenota | ● | L A✓ E✓ | All. VII [M1] | A |
| M06 | **Verifica periodica — sollevamento fisso, edilizia** (e altri 3 settori) | Apparecchi fissi | 2 anni; 1 anno oltre 10 anni (fasce) | — | prenota | ● | E | All. VII [M1][M2] | A |
| M07 | **Verifica periodica — sollevamento fisso, altri settori** | Apparecchi fissi | 3 anni; 2 anni oltre 10 anni (fasce) | — | prenota | ● | L | All. VII [M1][M2] | A |
| M08 | **Indagine supplementare** (vita residua) | Gru su autocarro, Gru mobili | una tantum, 20 anni da messa in servizio | — | lungo | ○ | T E | DM 11/4/2011 All. II; circ. MLPS 18/2013 [M1] | A |
| M09 | **Controllo trimestrale di funi e catene** | Gru su autocarro, Gru mobili, Gru a torre, Apparecchi fissi | 3 mesi dall'esecuzione | — | breve | ● | T L E✓ | All. VI punto 3.1.2 D.Lgs 81/08 [M3] | A |
| M10 | **Manutenzione e controllo periodico** | Carrelli elevatori, Carrelli telescopici | 1 anno o 512 ore dall'esecuzione | — | normale | ● | T L✓ A E | art. 71 c.4 e c.8; libretto [M4] | B |
| M11 | **Manutenzione programmata** | Macchine movimento terra | 1 anno o 512 ore dall'esecuzione | — | normale | ● | A E✓ | art. 71 c.4; libretto | B |
| M12 | **Manutenzione programmata** | PLE, Gru (tutte), Apparecchi fissi, Ponti sollevatori | 1 anno dall'esecuzione | — | normale | ● | T L E✓ | art. 71 c.4 e c.8; libretto | M |
| M13 | **Controllo funzionale** | Irroratrici | 3 anni dall'esecuzione · *prima*: 5 anni dall'acquisto (messa in servizio) | — | prenota | ● | A✓ | D.Lgs 150/2012 art. 12; PAN DM 22/1/2014 [M5] | A |
| M14 | **Controllo funzionale — contoterzisti** | Irroratrici | 2 anni dall'esecuzione | — | prenota | ○ | A | come M13 [M5] | A |
| M15 | **Verifica di funzionamento** (cat. I-II, aria) | Serbatoi di aria compressa | 4 anni dall'esecuzione · *prima*: 4 anni da messa in servizio | — | prenota | ● | T L A E | DM 329/2004 All. A e B [M6] | A |
| M16 | **Verifica di integrità** | Serbatoi di aria compressa | 10 anni dall'esecuzione · *prima*: 10 anni da messa in servizio | — | lungo | ● | T L A E | DM 329/2004 [M6] | A |
| M17 | **Controllo periodico** (esclusi dall'Allegato VII) | Ponti sollevatori | 1 anno dall'esecuzione | — | normale | ● | T | art. 71 c.8; circ. MLPS 23/2012 [M7] | A |

Natura: M01-M09, M13-M17 *adempimento*; M10-M12 *manutenzione*.

### 4.3 Note

- **Allegato VII** — la prima verifica periodica la fa l'**INAIL** (richiesta
  dal portale CIVA; se non interviene entro 45 giorni ci si rivolge a un
  soggetto abilitato), le successive ASL/ARPA o soggetti abilitati. Nessuna
  tolleranza: conviene chiederla almeno 32-64 giorni prima (profilo *prenota*).
- **M01/M02, M06/M07** — la cadenza dipende dal **settore** (voci separate,
  il cliente sceglie con il modello) e dall'**età** (fasce, proposta A). Se la
  proposta A non passa, M02 e M07 diventano due voci ciascuna.
- **Carrelli elevatori frontali** — **non** sono nell'Allegato VII (circ. MLPS
  9/2013), salvo accessori di sollevamento o attrezzature intercambiabili
  (ganci, bracci gru): allora valgono M02/M06. Elettrici: 1.024 ore invece di 512.
- **Ponti sollevatori** — esclusi dall'Allegato VII (circ. 23/2012), restano i
  controlli del datore di lavoro.
- **Macchine movimento terra** — nessuna verifica periodica di legge; se usate
  per sollevare carichi (gancio previsto dal costruttore) valgono M01/M02.
- **Serbatoi di aria compressa** — **esclusi** dalla riqualificazione periodica
  se PS ≤ 12 bar e PS·V ≤ 12.000 bar·L (es. 500 L a 11 bar). Solo quelli oltre
  soglia vanno inseriti.

## 5. Attrezzature

### 5.1 Categorie

| Categoria | Modelli |
|---|---|
| **Estintori a polvere** | B✓ |
| **Estintori a CO2** | B✓ |
| **Estintori idrici e a schiuma** | B |
| **Scaffalature metalliche** | T L✓ |
| **DPI anticaduta** (imbracature, cordini, retrattili) | L A E✓ |
| **Accessori di sollevamento** (brache, funi, catene) | T L E |
| **Sponde idrauliche caricatrici** | T✓ L |

### 5.2 Controlli

| Cod | Controllo | Si applica a | Cadenza | Toll. | Preavvisi | Auto | Modelli | Rif. | Conf. |
|---|---|---|---|---|---|---|---|---|---|
| A01 | **Revisione** | Estintori a polvere, a CO2 | 5 anni dall'esecuzione · *prima*: 5 anni da fabbricazione | — | normale | ● | B✓ | UNI 9994-1:2024; DM 1/9/2021 [S2][S3] | A |
| A02 | **Collaudo** | Estintori a polvere, a CO2 | 10 anni dall'esecuzione · *prima*: 10 anni da fabbricazione | — | normale | ● | B✓ | UNI 9994-1:2024 [S2][S3] | A |
| A03 | **Revisione** | Estintori idrici e a schiuma | 2 anni dall'esecuzione (serbatoio plastificato; 4 anni se inox o alluminio) | — | normale | ● | B | UNI 9994-1:2024 [S3] | M |
| A04 | **Collaudo** | Estintori idrici e a schiuma | 6 anni (plastificato; 10 se inox o alluminio) | — | normale | ● | B | UNI 9994-1:2024 [S3] | M |
| A05 | **Fine vita** | tutti gli estintori | una tantum, 18 anni da fabbricazione | — | lungo | ● | B✓ | UNI 9994-1:2024 [S2] | A |
| A06 | **Ispezione da persona competente** | Scaffalature | 1 anno dall'esecuzione | — | prenota | ● | T L✓ | UNI EN 15635:2009; art. 71 c.4 e c.8 [M8] | M |
| A07 | **Ispezione periodica** | DPI anticaduta | 1 anno dall'esecuzione | — | normale | ● | L A E✓ | UNI EN 365; art. 77 c.4 [M9] | A |
| A08 | **Fine vita** | DPI anticaduta | una tantum, 10 anni da fabbricazione (secondo il fabbricante) | — | normale | ○ | L A E | istruzioni del fabbricante [M9] | M |
| A09 | **Controllo trimestrale** | Accessori di sollevamento | 3 mesi dall'esecuzione | — | breve | ● | T L E | All. VI punto 3.1.2 [M3] | A |
| A10 | **Manutenzione e controllo** | Sponde caricatrici | 1 anno dall'esecuzione | — | normale | ● | T✓ L | EN 1756-1; art. 71 c.4 | B |

Natura: A01-A04, A06-A07, A09 *adempimento*; A05, A08 *promemoria*;
A10 *manutenzione*.

### 5.3 Note

- **Estintori** — la nuova **UNI 9994-1:2024** ha portato la revisione degli
  estintori a polvere **da 36 a 60 mesi** e il collaudo da 12 a 10 anni.
  L'associazione dei manutentori (UMAN) consiglia di tenere 36 mesi per gli
  estintori immessi prima del 25/07/2024: il cliente può ridurre la cadenza
  sulla scadenza del singolo estintore. Il libretto del fabbricante, se più
  severo, prevale.
- Il **controllo semestrale** degli estintori non è qui: lo fa il manutentore
  per tutta la sede in una visita (voce **S04**). Inserire gli estintori come
  soggetti serve solo a seguire revisione, collaudo e fine vita.
- **Sponde caricatrici** — l'esclusione dall'Allegato VII è l'orientamento
  prevalente ma **non confermato** da un atto ufficiale (punto 11.14).
- **Scaffalature** — la norma è volontaria ma è il riferimento per l'obbligo di
  controllo; le ispezioni regolari del responsabile (spesso settimanali) sono
  buona prassi, non voce di libreria.

## 6. Sedi

### 6.1 Categorie

| Categoria | Modelli |
|---|---|
| **Uffici** | B✓ |
| **Magazzini e capannoni** | B T✓ L✓ A✓ E |
| **Officine** | T L A E |
| **Cantieri** | E✓ |

### 6.2 Controlli

| Cod | Controllo | Si applica a | Cadenza | Toll. | Preavvisi | Auto | Modelli | Rif. | Conf. |
|---|---|---|---|---|---|---|---|---|---|
| S01 | **Verifica dell'impianto di messa a terra** | Uffici, Magazzini, Officine | 5 anni dall'esecuzione · *prima*: 5 anni da conformità impianto | — | prenota | ● | B✓ | DPR 462/2001 art. 4 [S4] | A |
| S02 | **Verifica dell'impianto di messa a terra — biennale** | Cantieri (e ○ locali medici, ambienti a maggior rischio di incendio, luoghi con pericolo di esplosione) | 2 anni dall'esecuzione | — | prenota | ● | E✓ | DPR 462/2001 artt. 4 e 6 [S4] | A |
| S03 | **Verifica dei dispositivi contro le scariche atmosferiche** | Uffici, Magazzini, Officine | 5 anni dall'esecuzione | — | prenota | ○ | B | DPR 462/2001 art. 4 [S4] | A |
| S04 | **Controllo periodico dei presidi antincendio** (estintori, idranti e naspi, porte tagliafuoco, luci di emergenza, rivelazione) | Uffici, Magazzini, Officine | 6 mesi dall'esecuzione | — | normale | ● | B✓ | DM 1/9/2021; UNI 9994-1, UNI 10779, UNI EN 671-3, UNI 11473, UNI 11222, UNI 11224 [S2][S3] | A |
| S05 | **Sorveglianza dei presidi antincendio** (lista di controllo, lavoratori addestrati) | Uffici, Magazzini, Officine | 1 mese dall'esecuzione | — | breve | ○ | B | DM 1/9/2021 All. I [S2] | M |
| S06 | **Prova di autonomia delle luci di emergenza** | Uffici, Magazzini, Officine | 1 anno dall'esecuzione | — | normale | ○ | B | UNI 11222 [S2] | M |
| S07 | **Rinnovo periodico di conformità antincendio** (CPI) | tutte, se attività soggetta | 5 anni **dalla scadenza** (10 per alcune attività) | — | lungo | ○ | B✓ T✓ L✓ A E | DPR 151/2011 art. 5; DM 7/8/2012 [S1] | A |
| S08 | **Verifica periodica dell'ascensore o montacarichi** | Uffici, Magazzini | 2 anni dall'esecuzione | — | prenota | ○ | B | DPR 162/1999 art. 13 [S5] | A |
| S09 | **Manutenzione dell'ascensore** | Uffici, Magazzini | 6 mesi dall'esecuzione (montacarichi 12) | — | normale | ○ | B | DPR 162/1999 art. 15 [S5] | A |
| S10 | **Manutenzione dell'impianto termico** | Uffici, Magazzini, Officine | 1 anno dall'esecuzione (secondo libretto) | — | normale | ○ | B✓ | DPR 74/2013 art. 7 [S6] | M |
| S11 | **Controllo di efficienza energetica** | Uffici, Magazzini, Officine | 4 anni dall'esecuzione (gas, 10-100 kW; tabella sotto) | — | normale | ○ | B✓ | DPR 74/2013 All. A [S6] | A |
| S12 | **Controllo perdite gas fluorurati** (condizionatori, celle frigo) | Uffici, Magazzini, Officine | 12 mesi dall'esecuzione (5-50 t CO2eq; tabella sotto) | — | normale | ○ | B L | Reg. UE 2024/573 art. 5 [S8] | A |
| S13 | **Misura del radon** (interrati, seminterrati, piano terra in aree prioritarie) | Uffici, Magazzini, Officine | 8 anni dall'esecuzione (sotto 300 Bq/m³; 4 anni dopo un risanamento) | — | normale | ○ | B | D.Lgs 101/2020 artt. 16-17 [S9] | A |
| S14 | **Controllo della cassetta di primo soccorso** (presidi e scadenze) | tutte | 2 mesi dall'esecuzione | — | breve | ● | B✓ | DM 388/2003 art. 2 [F6] | M |
| S15 | **Rinnovo dell'autorizzazione unica ambientale (AUA)** | Magazzini, Officine | 15 anni dalla scadenza | — | 256, 192 giorni | ○ | T L A E | DPR 59/2013 artt. 3 e 5 [S11] | A |

Natura: tutte *adempimento*, tranne S09-S10 *manutenzione* e S14 *promemoria*.

### 6.3 Note

- **S04** — una sola visita del manutentore copre tutti i presidi della sede;
  per idranti, porte e rivelazione le cadenze vengono da norme UNI che la
  ricerca non ha potuto leggere per intero (punto 11.9). Dal **25/09/2026** il
  manutentore deve essere **qualificato** (DM 1/9/2021 art. 4; transitorio fino
  al 31/03/2027 per chi ha fatto domanda).
- **S07** — il rinnovo si presenta **prima** della scadenza e la validità si
  conta sempre dalla scadenza precedente, anche se si presenta in ritardo
  (circ. VVF 1640/2024): unico caso di sede *dalla scadenza*. 10 anni per le
  attività 6, 7, 8, 64, 71, 72, 77 dell'Allegato I. Comprende i
  contenitori-distributori di gasolio aziendali (attività 13), i depositi di
  liquidi infiammabili (12), il GPL (4) e i gruppi elettrogeni oltre 25 kW (49).
- **S11** — altre cadenze del DPR 74/2013: combustibili liquidi o solidi 2 anni
  (10-100 kW) e 1 anno (oltre 100 kW); gas oltre 100 kW 2 anni; pompe di
  calore 4 anni (12-100 kW) e 2 anni (oltre 100 kW). Le regioni possono
  cambiarle.
- **S12** — 50-500 t CO2eq ogni 6 mesi, oltre 500 t ogni 3 mesi; con
  rilevamento automatico delle perdite le cadenze raddoppiano. Le apparecchiature
  ermetiche sono escluse fino a 10 t. Non esiste più la dichiarazione annuale
  del 31 maggio.
- **S14** — nessuna cadenza di legge: 2 mesi è una scelta prudente (presidi
  con scadenza). Il **pacchetto di medicazione** sui veicoli (lavoratori in
  luoghi isolati, art. 2 c.5) si segue con un promemoria sul veicolo.
- **S15** — la domanda va presentata **almeno 6 mesi prima** (≈ 184 giorni):
  da qui i preavvisi a 256 e 192 giorni.

## 7. Persone

### 7.1 Categorie

| Categoria | Note | Modelli |
|---|---|---|
| **Personale d'ufficio** | videoterminalisti | B✓ |
| **Personale operativo** | magazzino, officina, cantiere, campagna | B✓ |
| **Autisti** | patenti superiori, CQC, tachigrafo | T✓ L✓ A E |

I **ruoli** (preposto, addetto antincendio, carrellista…) **non** sono
categorie: una persona ne ha più di uno. Sono controlli ○ disponibili su ogni
persona (7.4): si aggiungono a chi li ha.

### 7.2 Documenti

| Cod | Controllo | Si applica a | Cadenza | Toll. | Preavvisi | Auto | Modelli | Rif. | Conf. |
|---|---|---|---|---|---|---|---|---|---|
| D01 | **Patente B** | tutte | 10 anni dalla scadenza (compleanno); **5 dopo i 50 anni, 3 dopo i 70, 2 dopo gli 80** (fasce) | — | prenota | ○ | B✓ T L A E | art. 126 c.2 CdS; DL 5/2012 art. 7 [D1][D2] | A |
| D02 | **Patente C / CE** | Autisti | 5 anni; **2 anni dopo i 65** (fasce) | — | prenota | ● | T✓ L✓ A E | art. 126 c.3 CdS [D1] | A |
| D03 | **Attestato CML per complessi oltre 20 t** (dai 65 ai 68 anni) | Autisti | 1 anno dall'esecuzione | — | prenota | ○ | T | art. 115 c.2 lett. a CdS [D1] | A |
| D04 | **CQC merci** | Autisti | 5 anni, finestra 12 mesi (proposta B) | — | lungo | ● | T✓ L✓ A E | D.Lgs 286/2005; DM 30/7/2021 artt. 15 e 19 [D3][D4] | A |
| D05 | **Carta tachigrafica del conducente** | Autisti | 5 anni dalla scadenza | — | prenota | ● | T✓ L E | Reg. UE 165/2014 artt. 26 e 28 [V6] | A |
| D06 | **Scarico dati della carta del conducente** | Autisti | 28 giorni dall'esecuzione | — | breve | ● | T✓ L E | Reg. UE 581/2010 art. 1 [V8] | A |
| D07 | **Certificato ADR del conducente** (CFP) | Autisti | 5 anni, finestra 12 mesi (proposta B) | — | lungo | ○ | T | ADR 8.2.2.8 [D5] | A |
| D08 | **Carta d'identità** | tutte | 10 anni dal rilascio (scade al compleanno) | — | normale | ○ | B T L A E | DL 112/2008 art. 31; DL 5/2012 art. 7 [D6] | A |
| D09 | **Passaporto** | tutte | 10 anni dall'emissione | — | prenota | ○ | T | L. 1185/1967 [D6] | A |
| D10 | **Permesso di soggiorno** | tutte | data dal documento (1-3 anni) | **60 giorni** | lungo | ○ | B T L A E | D.Lgs 286/1998 art. 5 c.4 e c.9-bis [D7] | M |

Natura: *documento*, tranne D06 *adempimento*. D10: la durata viene dal
documento (1-3 anni); la libreria propone 2 anni da correggere al rinnovo.

### 7.3 Salute

| Cod | Controllo | Si applica a | Cadenza | Toll. | Preavvisi | Auto | Modelli | Rif. | Conf. |
|---|---|---|---|---|---|---|---|---|---|
| H01 | **Visita medica periodica** | Personale operativo, Autisti | 1 anno dall'esecuzione (o la periodicità del medico competente) | — | prenota | ● | B✓ T✓ L✓ A✓ E✓ | art. 41 c.2 lett. b D.Lgs 81/08 [H1] | A |
| H02 | **Visita medica dei videoterminalisti** | Personale d'ufficio | 5 anni dall'esecuzione; **2 anni dopo i 50** (fasce) | — | prenota | ● | B✓ | art. 176 c.3 D.Lgs 81/08 [H1] | A |
| H03 | **Accertamento di assenza di tossicodipendenza** | Autisti | 1 anno dall'esecuzione | — | prenota | ● | T✓ L✓ A E | Intesa Stato-Regioni 30/10/2007; Provv. 18/9/2008 [H2] | M |

Natura: *adempimento*.

### 7.4 Formazione e abilitazioni (art. 37 D.Lgs 81/08, Accordo Stato-Regioni 17/4/2025)

Tutte **dall'esecuzione** (data di fine corso sull'attestato), **nessuna
tolleranza**, profilo *prenota*; natura *abilitazione*. La colonna "Aggiorn."
indica le ore del corso di aggiornamento, utile per organizzarlo.

| Cod | Controllo | Si applica a | Cadenza | Aggiorn. | Auto | Modelli | Rif. | Conf. |
|---|---|---|---|---|---|---|---|---|
| F01 | **Formazione dei lavoratori** | tutte | 5 anni | 6 ore | ● | B✓ T✓ L✓ A✓ E✓ | art. 37 c.1-6; Accordo 59/CSR [F1][F2] | A |
| F02 | **Preposto** | tutte | **2 anni** | 6 ore | ○ | B✓ T L A E | art. 37 c.7-ter [F1] | A |
| F03 | **Dirigente** | tutte | 5 anni | 6 ore | ○ | B | art. 37 c.7 [F1] | A |
| F04 | **Datore di lavoro** | tutte | 5 anni · *prima*: corso di 16 ore entro il **19/05/2027** | 6 ore | ○ | B✓ | art. 37 c.7; Accordo 59/CSR [F1][F3] | A |
| F05 | **Datore di lavoro con compiti di RSPP** | tutte | 5 anni | 8 ore | ○ | B | art. 34 [F1] | M |
| F06 | **RSPP / ASPP** | tutte | 5 anni | 40 / 20 ore | ○ | B | artt. 32 e 34 [F1][F4] | A |
| F07 | **RLS** | tutte | **1 anno** | 4 ore (15-50 lavoratori), 8 (oltre 50), CCNL sotto 15 | ○ | B✓ | art. 37 c.11; DL 159/2025 [F5] | A |
| F08 | **Addetto al primo soccorso** | tutte | **3 anni** | 6 ore (gruppo A), 4 (B e C) | ○ | B✓ T L A E | DM 388/2003 art. 3 c.5 [F6] | A |
| F09 | **Addetto antincendio** | tutte | 5 anni | 2 / 5 / 8 ore (livello 1 / 2 / 3) | ○ | B✓ T L A E | DM 2/9/2021 art. 5 [F7] | A |
| F10 | **Abilitazione carrelli elevatori** | tutte | 5 anni | 4 ore pratiche | ○ | T L✓ A E | art. 73 c.5; Accordo 59/CSR [F1][F8] | A |
| F11 | **Abilitazione PLE** | tutte | 5 anni | 4 ore pratiche | ○ | L E✓ | come F10 | A |
| F12 | **Abilitazione gru per autocarro** | tutte | 5 anni | 4 ore pratiche | ○ | T E✓ | come F10 | A |
| F13 | **Abilitazione gru mobili** | tutte | 5 anni | 4 ore pratiche | ○ | E | come F10 | A |
| F14 | **Abilitazione gru a torre** | tutte | 5 anni | 4 ore pratiche | ○ | E✓ | come F10 | A |
| F15 | **Abilitazione macchine movimento terra** (anche mini-escavatori) | tutte | 5 anni | 4 ore pratiche | ○ | A E✓ | come F10 | A |
| F16 | **Abilitazione trattori agricoli o forestali** | tutte | 5 anni | 4 ore pratiche | ○ | A✓ E | come F10 | A |
| F17 | **Abilitazione pompe per calcestruzzo** | tutte | 5 anni | 4 ore pratiche | ○ | E | come F10 | A |
| F18 | **Abilitazione carroponte** (nuova) | tutte | 5 anni | 4 ore pratiche | ○ | L E | Accordo 59/CSR [F8] | A |
| F19 | **Abilitazione caricatori per la movimentazione di materiali** (nuova) | tutte | 5 anni | 4 ore pratiche | ○ | L A E | Accordo 59/CSR [F8] | A |
| F20 | **Abilitazione carro raccoglifrutta** (nuova) | tutte | 5 anni | 4 ore pratiche | ○ | A | Accordo 59/CSR [F8] | A |
| F21 | **Addestramento all'uso dei DPI anticaduta** | tutte | 1 anno (scelta del datore di lavoro) | — | ○ | L A E✓ | art. 77 c.4-5 [F1] | M |
| F22 | **Montaggio e smontaggio ponteggi** | tutte | **4 anni** | 4 ore (3 pratiche) | ○ | E✓ | All. XXI D.Lgs 81/08 [F9] | A |
| F23 | **Lavori su funi** (accesso e posizionamento) | tutte | 5 anni | 8 ore (4 pratiche) | ○ | E | All. XXI [F9] | A |
| F24 | **Coordinatore per la sicurezza** (CSP / CSE) | tutte | 5 anni | 40 ore | ○ | E | art. 98; Accordo 59/CSR [F1] | A |
| F25 | **Patentino per i prodotti fitosanitari** | tutte | 5 anni | 12 ore | ○ | A✓ | D.Lgs 150/2012 art. 9 [F10] | A |

### 7.5 Note

- **D01/D02** — le **fasce d'età** (proposta A) rendono giusta la proposta; la
  data vera resta quella sul documento. La patente B scade al **compleanno** e
  la nuova scadenza si conta dalla vecchia anche rinnovando prima. Per C e CE
  la regola del compleanno non vale. Dai 65 anni C/CE abilitano solo fino a
  20 t senza l'attestato annuale (D03); oltre i 68 anni niente complessi
  pesanti. La **direttiva (UE) 2025/2205** porterà la patente B a 15 anni (10
  se vale come documento d'identità) e lascerà C a 5 anni: recepimento entro
  il **26/11/2028**, poi aggiorneremo la libreria (sezione 12) [D9].
- **D04** — il corso di 35 ore va concluso nei **12 mesi prima** della scadenza
  (allora la validità riparte dalla scadenza); dopo la scadenza è **vietato
  guidare** finché non si rinnova, e oltre 3 anni serve l'esame. Per questo il
  profilo *lungo*.
- **D05** — il rinnovo va chiesto **almeno 15 giorni lavorativi prima** della
  scadenza (art. 28).
- **D08** — dal **30/07/2026** la carta d'identità elettronica degli over 70 non
  scade più; la carta cartacea non vale per l'espatrio dal **3/08/2026**.
- **D10** — rinnovo da chiedere almeno 60 giorni prima; si può continuare a
  lavorare se la domanda è presentata entro **60 giorni dopo** la scadenza
  (art. 5 c.9-bis): è la tolleranza.
- **H01** — "di norma una volta l'anno": il medico competente può fissare
  un'altra periodicità, che il cliente imposta sulla scadenza della persona.
- **H02** — solo per chi usa il videoterminale almeno 20 ore la settimana
  (art. 173); per gli altri impiegati la scadenza si elimina.
- **H03** — il **DL 159/2025** ha chiesto un nuovo accordo Stato-Regioni sugli
  accertamenti di alcol e droghe entro il **31/12/2026**: la voce va
  ricontrollata quando esce (sezione 12).
- **F01-F24** — quinquennio dalla data di fine corso. Se l'aggiornamento è in
  ritardo non si può svolgere la funzione finché non si fa; oltre **10 anni**
  senza aggiornamento il titolo decade e si rifà il corso (FAQ ministeriali del
  27/03/2026). L'Accordo è in vigore dal **19/05/2025** (FAQ n. 11; molte fonti
  indicano ancora il 24/05).
- **F25** — alcune regioni ammettono il rinnovo fino a 6 mesi dopo la scadenza:
  regola regionale, il cliente può impostare la tolleranza.

## 8. Azienda

Una sola categoria, **Azienda** (B✓): il soggetto unico che porta gli
adempimenti dell'impresa, i contratti e i promemoria (passo 1).

| Cod | Controllo | Cadenza | Toll. | Preavvisi | Auto | Modelli | Rif. | Conf. |
|---|---|---|---|---|---|---|---|---|
| Z01 | **Riunione periodica di prevenzione** (oltre 15 lavoratori) | 1 anno dall'esecuzione | — | normale | ● | B✓ | art. 35 D.Lgs 81/08 [S7] | A |
| Z02 | **Valutazione degli agenti fisici** (rumore, vibrazioni) | 4 anni dall'esecuzione | — | prenota | ● | B✓ | art. 181 D.Lgs 81/08 [S7] | A |
| Z03 | **Valutazione del rischio cancerogeni** (gas di scarico in officina, silice) | 3 anni dall'esecuzione | — | prenota | ○ | T E | art. 236 c.5 D.Lgs 81/08 [S7] | A |
| Z04 | **Valutazione dello stress lavoro-correlato** | 2 anni dall'esecuzione (buona prassi) | — | prenota | ○ | B | art. 28 D.Lgs 81/08 [S7] | M |
| Z05 | **DURC** | 120 giorni dall'esecuzione (richiesta) | — | breve | ○ | B T L A E | DM 30/1/2015 art. 7 (GU n. 125 dell'1/6/2015) | A |
| Z06 | **Polizza RC verso terzi e prestatori di lavoro** | 1 anno dalla scadenza | **15 giorni** | normale | ○ | B✓ | art. 1901 c.c. [Z2] | A |
| Z07 | **Polizza incendio e furto** | 1 anno dalla scadenza | **15 giorni** | normale | ○ | B | art. 1901 c.c. [Z2] | A |
| Z08 | **Polizza merci trasportate** (vettoriale, CMR) | 1 anno dalla scadenza | **15 giorni** | normale | ○ | T✓ L | art. 1901 c.c. [Z2] | A |
| Z09 | **Certificazione ISO — audit di sorveglianza** | 1 anno dalla scadenza | — | prenota | ○ | B | ISO/IEC 17021-1 [Z3] | A |
| Z10 | **Certificazione ISO — rinnovo** | 3 anni dalla scadenza | — | lungo | ○ | B | ISO/IEC 17021-1 [Z3] | A |
| Z11 | **Firma digitale** | 3 anni dall'emissione | — | normale | ○ | B✓ | contratto del certificatore | A |
| Z12 | **PEC** | 1 anno dalla scadenza | — | normale | ○ | B✓ | contratto | A |
| Z13 | **Dominio internet** | 1 anno dalla scadenza | — | normale | ○ | B | contratto | A |
| Z14 | **Contratto o abbonamento con disdetta** (scadenza = ultimo giorno per disdire; rinnovo tacito) | 1 anno dalla scadenza | — | normale | ○ | B✓ | contratto | — |
| Z15 | **Rata di mutuo o leasing** (con numero di rate) | 1 mese dalla scadenza | — | breve | ○ | B✓ | contratto | — |
| Z16 | **Quota annuale Albo autotrasportatori** | 1 anno dalla scadenza (31 dicembre, per l'anno dopo) | — | normale | ● | T✓ | art. 63 L. 298/1974 [Z4] | A |
| Z17 | **REN — dimostrazione della capacità finanziaria** | 1 anno dall'esecuzione | — | prenota | ● | T✓ | DM 8/4/2022 art. 5 [D8] | A |
| Z18 | **Licenza comunitaria** | 10 anni dal rilascio | — | lungo | ○ | T | Reg. CE 1072/2009 art. 4 [V16] | M |
| Z19 | **Rimborso accise sul gasolio** (domanda trimestrale) | 3 mesi dalla scadenza, fine mese (31/1, 30/4, 31/7, 31/10) | — | normale | ○ | T✓ | art. 24-ter D.Lgs 504/1995 [Z5] | A |
| Z20 | **MUD** (dichiarazione annuale dei rifiuti) | 1 anno dalla scadenza (30 aprile) | — | normale | ○ | T L A E | L. 70/1994; art. 189 D.Lgs 152/2006 [Z6] | A |
| Z21 | **RENTRI — contributo annuale** | 1 anno dalla scadenza (30 aprile) | — | normale | ○ | T L A E | DM 59/2023 [Z6] | A |
| Z22 | **Albo gestori ambientali — diritto annuale** (trasporto dei propri rifiuti) | 1 anno dalla scadenza (30 aprile) | — | normale | ○ | T E | art. 212 c.8 D.Lgs 152/2006 [Z6] | M |
| Z23 | **Contributo all'Autorità di regolazione dei trasporti** — dichiarazione e acconto | 1 anno dalla scadenza (15 maggio) | — | normale | ○ | L | Delibera ART 4/12/2025 [Z7] | A |
| Z24 | **Contributo ART — saldo** | 1 anno dalla scadenza (30 ottobre) | — | normale | ○ | L | Delibera ART 4/12/2025 [Z7] | A |
| Z25 | **Prospetto informativo disabili** (da 15 dipendenti, se ci sono variazioni) | 1 anno dalla scadenza (31 gennaio) | — | normale | ○ | B | art. 9 c.6 L. 68/1999 | A |

Natura: Z01-Z04, Z09-Z10, Z16-Z17, Z19-Z22, Z25 *adempimento*; Z05, Z18
*documento*; Z06-Z08, Z15, Z23-Z24 *pagamento*; Z11-Z14 *promemoria* (Z14 con
rinnovo *tacito*). I controlli dell'azienda valgono per il soggetto azienda
qualunque sia la sua categoria.

**Note.** **Z05**: 120 giorni dalla richiesta, utile a chi lavora in appalto.
**Z06-Z08**: per le polizze danni la garanzia resta attiva fino alle 24 del
15° giorno dopo la scadenza del premio (premi successivi al primo); va
controllato il preavviso di disdetta del contratto. **Z10**: transizioni in
corso alla ISO 9001:2026 (fino al 30/09/2029) e 14001:2026. **Z16**: senza
quota si è sospesi dall'Albo. **Z20**: il termine ordinario è il 30 aprile, ma
nel 2026 è slittato al **3 luglio** per il nuovo modello: il cliente sposta la
singola scadenza. **Z23-Z24**: l'autotrasporto merci è **escluso**; pagano
logistica e centri di movimentazione merci; sotto 3.150 € non si versa.

## 9. Modelli di settore

| Modello | Sempre proposto | Che cosa porta (preselezionato) |
|---|---|---|
| **Base aziendale** | sì | azienda e sicurezza (riunione periodica, agenti fisici, polizza RC, PEC, firma digitale, contratti, rate), sedi (messa a terra, presidi antincendio, CPI, impianto termico, cassetta di primo soccorso), estintori, persone d'ufficio e operative (visite, formazione dei lavoratori, preposti, primo soccorso, antincendio, RLS, datore di lavoro, patente B) |
| **Autotrasporto merci** | — | veicoli leggeri e pesanti, rimorchi (revisioni, RCA, bollo, tachigrafo e scarichi, tagliandi), autisti (patente C, CQC, carta tachigrafica, scarico carta, visita, accertamento droghe), Albo e REN, polizza merci, rimborso accise, verifica gru su autocarro, sponde, scaffalature in ○ |
| **Logistica e magazzino** | — | carrelli elevatori (manutenzione e abilitazioni), scaffalature, sollevamento fisso, magazzini, PLE in ○, veicoli leggeri e autisti |
| **Agricoltura** | — | trattori (manutenzione, revisione, abilitazione), trattori veloci, carrelli telescopici, irroratrici (controllo funzionale), patentino fitosanitari |
| **Movimento terra ed edilizia** | — | macchine movimento terra, gru (verifiche annuali, funi e catene), PLE, telescopici, cantieri (messa a terra biennale), DPI anticaduta e addestramento, ponteggi, abilitazioni, veicoli |

Il dettaglio di ogni voce è nella colonna **Modelli** delle tabelle: una voce
in più modelli compare **una volta sola** nella procedura di avvio (passo 3.3),
preselezionata se lo è in almeno uno dei modelli scelti.

## 10. Lasciati fuori di proposito

| Che cosa | Perché |
|---|---|
| Scadenze fiscali e contributive (F24, IVA, dichiarazioni, diritto camerale, autoliquidazione INAIL) | le segue il commercialista o il consulente del lavoro; chi vuole le crea come promemoria |
| Obblighi legati a **eventi** (DVR dopo modifiche, ponteggio dopo un temporale, scaffalatura dopo un urto, nuova verifica del tachigrafo dopo una riparazione) | nessuna cadenza: promemoria una tantum |
| Patente D, CQC persone, attestati CML per autobus | nessun modello riguarda il trasporto di persone; si aggiungono se servirà |
| Bombole metano e GPL dei veicoli, idroestrattori, generatori di vapore, ascensori da cantiere | casi rari per i nostri settori o dati non abbastanza certi: candidati a una seconda versione |
| Licenza fiscale dei depositi di carburante (ADM), scarichi fuori AUA, emissioni in atmosfera | da verificare caso per caso; il CPI del distributore è già in S07 |
| Limitatore di velocità | si controlla con revisione e tachigrafo |

## 11. Punti da validare

**Decisioni tue (modello)**

1. Proposte **A** (fasce d'età), **B** (finestra di anticipo), **C** (date del
   soggetto) della sezione 2.

**Trasporti (chi in EDG conosce il settore)**

2. **V01** — rimorchi O1/O2: cadenza 4 + 2 anni e scadenza "entro il mese"
   anche per loro (DM 214/2017).
3. **V04** — bollo dei veicoli pesanti: periodi fissi (gennaio, maggio,
   settembre) o mese di immatricolazione secondo la regione; quadrimestrale solo
   oltre 12 t?
4. **V08, V09** — cisterne ADR (3 / 6 anni) e attestato ATP (6 + 3 + 3 anni,
   fine mese?, dalla scadenza o dalla prova?).
5. **D02** — patente C rinnovata in anticipo: la nuova scadenza parte dalla
   vecchia o dalla visita?
6. **D05** — carta tachigrafica rinnovata: validità dalla vecchia scadenza (come
   in bozza) o dal rilascio?
7. **H03** — accertamento droghe annuale per gli autisti: confermi la prassi in
   EDG?
8. **V05** — i furgoni tra 2,5 e 3,5 t in internazionale: in EDG ce ne sono?
   (decide se il tachigrafo su Furgoni resta ○).

**Sicurezza (RSPP o consulente)**

9. **F10-F20** — aggiornamento delle abilitazioni: 4 ore **tutte pratiche**
   (nuovo Accordo, come in bozza) o "di cui almeno 3 pratiche" (regole 2012)?
10. **F01-F24** — il limite dei 10 anni senza aggiornamento si conta
    dall'ultimo attestato o dalla scadenza? (cambia solo i messaggi).
11. **F02** — preposti già formati al 19/05/2025: il biennio parte dal loro
    attestato?
12. **A01** — estintori a polvere immessi prima del 25/07/2024: revisione a 60
    mesi (norma nuova) o 36 (consiglio UMAN)?
13. **S04** — cadenze di idranti, naspi, porte tagliafuoco e rivelazione
    (semestrale per tutte?).
14. **A10** — sponde caricatrici escluse dalle verifiche dell'Allegato VII?
15. **M10** — catene dei carrelli elevatori: serve il controllo trimestrale
    (alcune ASL lo chiedono)?
16. **S14, Z04, Z01** — scelte di prassi: cassetta di primo soccorso ogni 2
    mesi, stress lavoro-correlato ogni 2 anni, riunione periodica ogni 12 mesi
    (non per anno solare).
17. **V17** — revisione macchine agricole a regime ogni 5 anni.

## 12. Novità da seguire

Date che cambieranno la libreria; sono anche ottimi promemoria per il Vigilo
di EDG stesso.

| Quando | Che cosa | Voci |
|---|---|---|
| entro il **31/12/2026** | nuovo accordo Stato-Regioni su alcol e droghe (DL 159/2025) | H03 |
| **31/12/2026** | revisione trattori immatricolati fino al 1983; trattori veloci 2017-2022 | V17, V18 |
| **31/03/2027** | fine del transitorio per i manutentori antincendio qualificati | S04 |
| **19/05/2027** | termine per il corso del datore di lavoro (16 ore) | F04 |
| **1/1/2028** | nuovo regime del bollo legato al mese di immatricolazione | V04 |
| entro il **26/11/2028** | recepimento della direttiva patenti 2025/2205 | D01, D02, D04 |
| **30/09/2029** | fine della transizione alla ISO 9001:2026 | Z09, Z10 |
| in corso | pacchetto UE sulle revisioni (triloghi); decreto italiano sui gas fluorurati; nuovo PAN fitosanitari | V01-V02, S12, V10, M13, F25 |

## 13. Fonti

Consultate tra il 7 e l'8 ottobre 2026. Dove Normattiva o EUR-Lex non erano
leggibili sono state usate copie istituzionali (ministeri, regioni, ASL) o
fonti specialistiche, e la confidenza ne tiene conto.

**Veicoli**
- [V1] Art. 80 CdS — https://www.avvocato.it/?p=301910
- [V2] Revisione auto, guida Adiconsum — https://adiconsum.it/files/guide_tematiche/REVISIONE%20AUTO.pdf
- [V3] Art. 170-bis Codice delle assicurazioni — https://brocardi.it/codice-delle-assicurazioni-private/titolo-xii/capo-ii/art170bis.html
- [V4] Bollo, vademecum Regione Umbria — https://regione.umbria.it/documents/18/285756/vademecum+per+stampa.pdf/97112ed6-184e-4ee3-be00-112c80ee0220
- [V5] D.Lgs 147/2026, tributi regionali — https://www.fiscoetasse.com/normativa-prassi/13612-le-novita-su-tributi-regionali-e-locali-del-dlgs-1472026.html
- [V6] Tachigrafo sui veicoli leggeri dal 1/7/2026 (circ. MIT 9674/2026) — https://www.dottrinalavoro.it/notizie-c/mit-obbligo-del-tachigrafo-su-veicoli-leggeri-dal-1-luglio-2026
- [V7] Tachigrafi, MIMIT — https://www.mimit.gov.it/it/mercato-e-consumatori/normativa-tecnica/metrologia/tachigrafi
- [V8] Reg. UE 581/2010 — https://legislation.gov.uk/eur/2010/581/data.pdf
- [V9] Circ. MIT 21715 del 5/7/2021 (ADR) — https://www.mit.gov.it/nfsmitgov/files/media/normativa/2021-07/circolare_protocollo_21715_del_05-07-2021.pdf
- [V11] Attestato ATP — https://www.sicurauto.it/news/auto-e-furgoni-frigo-durata-e-rinnovo-del-permesso-atp/
- [V12] Pneumatici invernali — https://lentepubblica.it/cittadini-e-imprese/obbligo-pneumatici-invernali-novembre/
- [V13] Milleproroghe 2026 — https://www.fiscoetasse.com/normativa-prassi/13541-milleproroghe-dicembre-2025.html
- [V14] Revisione macchine agricole, proroga — https://consulenzaagricola.it/circolari/varie/26616-revisione-macchine-agricole-proroga-conferma-natura-strutturale-rinvio
- [V15] Revisione trattori veloci — https://contoterzista.edagricole.it/normativa-contoterzismo/prorogata-la-revisione-dei-trattori-veloci/
- [V16] Reg. CE 1072/2009, sintesi — https://eur-lex.europa.eu/summary/IT/legissum:tr0039
- [V17] Pacchetto roadworthiness, briefing EPRS 2026 — https://www.europarl.europa.eu/RegData/etudes/BRIE/2026/782608/EPRS_BRI(2026)782608_EN.pdf

**Persone**
- [D1] Rinnovo patente, MIT — https://www.mit.gov.it/rinnovo-patente
- [D2] Art. 126 CdS — https://www.avvocatoandreani.it/servizi/codice-della-strada/art-126-cds.html
- [D3] CQC, rinnovo — https://www.patente.it/ecom.dll/noAjax?idc=4444
- [D4] Circolare MIT CQC 2023 — https://www.asaps.it/downloads/files/Rinnovo%20CQC%20Circolare%20MIT%2026_01_2023.pdf
- [D5] Abilitazioni professionali, Portale dell'automobilista — https://www.ilportaledellautomobilista.it/gms/dettaglionormativa.downloadallegato:download/204855/Abilitazioni$0020professionali.pdf
- [D6] Carta d'identità, novità 2026 — https://lentepubblica.it/come-fare-per-pa/carta-didentita-cartacea-validita-espatrio-e-nuove-regole/
- [D7] Permesso di soggiorno, Assolombarda — https://www.assolombarda.it/servizi/lavoro-e-previdenza/progetto-stranieri/sezioni/il-permesso-di-soggiorno/durata
- [D8] DM 8/4/2022 autotrasporto, ACI — https://rivistagiuridica.aci.it/fileadmin/Documenti/2022/Normativa/Decreti_Ministeriali/trasporto_su_strada.pdf
- [D9] Direttiva (UE) 2025/2205 — https://eur-lex.europa.eu/eli/dir/2025/2205/oj/eng/pdf ; https://www.dire.it/27-11-2025/1199489-sicurezza-stradale-in-ue-entrano-in-vigore-nuove-norme-sulle-patenti/
- [H1] Art. 41 D.Lgs 81/08 — https://tussl.it/titolo-i-principi-comuni/capo-iii-gestione-della-prevenzione-nei-luoghi-di-lavoro/sezione-v-sorveglianza-sanitaria/art-41
- [H2] Test alcol e droghe, L. 198/2025 — https://www.pmi.it/economia/lavoro/489177/test-antidroga-alcol-lavoro-legge-198-2025.html

**Formazione**
- [F1] Accordo Stato-Regioni 17/4/2025, Ministero del Lavoro — https://lavoro.gov.it/temi-e-priorita/salute-e-sicurezza/focus/pagine/accordo-stato-regioni-del-17042025-materia-di-formazione
- [F2] FAQ ministeriali del 27/03/2026 — https://ascom.bo.it/wp-content/uploads/2026/04/Allegato-CIRCO-47-26_FAQ-su-Accordo-Stato-Regioni-27.03.2026.pdf ; https://www.ecnews.it/lavoro/rapporto-di-lavoro/salute-e-sicurezza/accordo-stato-regioni-17-aprile-2025-faq-ministero-risolvono-dubbi/
- [F3] Formazione dei datori di lavoro, Assolombarda — https://www.assolombarda.it/servizi/salute-e-sicurezza-sul-lavoro/informazioni/formazione-obbligatoria-datori-di-lavoro
- [F4] RSPP e ASPP — https://www.vegaengineering.com/news/nuovo-accordo-stato-regioni-2025-conferme-e-novita-per-la-formazione-di-rspp-e-aspp/
- [F5] DL 159/2025 coordinato con L. 198/2025 — https://www.fiscoetasse.com/files/21087/testo-coord-dl159-legge198-2025.pdf
- [F6] Primo soccorso, DM 388/2003 — https://archivio.unime.it/sites/default/files/Circ_3-5110-2017-primo-soccorso.pdf
- [F7] Antincendio, istruzioni VVF — https://www.vigilfuoco.it/sites/default/files/2024-01/ISTRUZIONI%20PER%20LE%20AZIENDE%2C%20corsi%20ed%20esami.pdf
- [F8] Schema sinottico, Politecnico di Torino — https://www.polito.it/sites/default/files/2025-07/ASR%20-%20schema-sinottico.pdf ; nuove attrezzature, AiFOS — https://aifos.org/inst/aifos/public/data/general/files/normativa/nuovo-accordo/06-Nuove-attrezzature.pdf
- [F9] Allegato XXI D.Lgs 81/08 — https://bosettiegatti.eu/INFO/NORME/STATALI/2008_0081_allegato_XXI.pdf
- [F10] PAN fitosanitari, Regione Lazio — https://www.regione.lazio.it/cittadini/agricoltura/servizio-fitosanitario-regionale/Piano-azione-nazionale-PAN-per-l-uso-sostenibile-prodotti-fitosanitari

**Macchine e attrezzature**
- [M1] Allegato VII D.Lgs 81/08, AUSL Modena — https://www.ausl.mo.it/media/Allegato_VII_Dlgs_81_08.pdf?x69753
- [M2] Apparecchi di sollevamento, ATS Brianza — https://www.ats-brianza.it/images/pdf/impiantistica/2_SOLLEVAMENTO.pdf
- [M3] Funi, catene e brache — https://confindustriatoscanacentroecosta.it/controllo-periodico-di-catene-funi-e-brache-di-sollevamento-uni-definisce-la-figura-professionale-del-tecnico-qualificato/
- [M4] Circ. MLPS 9/2013 — https://enna.ance.it/2013/03/13/circolare-n-9-2013-sulle-verifiche-periodiche-delle-attrezzature-di-lavoro/?print=pdf
- [M5] Controllo funzionale irroratrici, Regione Piemonte — https://www.regione.piemonte.it/web/node/20016
- [M6] DM 329/2004, Regione Abruzzo — https://sanita.regione.abruzzo.it/sites/default/files/SPSAL/norme/DM%20329_04.pdf
- [M7] Circ. MLPS 23/2012 — https://www.fiscoetasse.com/BusinessCenter/download/Circ_Ministero_Lavoro_13082012_n_23.pdf
- [M8] Scaffalature, UNI EN 15635 — https://www.eurofins.com/it-it/test-su-prodotti-di-consumo/prodotti-elettrici-ed-elettronici/servizi/ispezione/scaffalature-e-soppalchi-installati-nei-luoghi-di-lavoro/
- [M9] DPI anticaduta, UNI EN 365 — https://www.puntosicuro.it/archivio-news-brevi/chiarimenti-sulla-manutenzione-periodica-dei-sistemi-anticaduta-iNews1-365.php

**Sedi e azienda**
- [S1] Rinnovo periodico conformità antincendio — https://biblus.acca.it/rinnovo-periodico-della-conformita-antincendio/
- [S2] DM 1/9/2021 "Controlli" — https://www.infobuildenergia.it/wp-content/uploads/2021/09/DECRETO-1-settembre-2021.pdf ; DM 22/9/2026 manutentori, ANCE — https://ance.it/wp-content/uploads/allegati/NEWS_323_2026.pdf
- [S3] UNI 9994-1:2024, ANIMA — https://www.anima.it/kdocs/2152624/uni_9994-1_nuova_edizione_2024_ok.pdf ; circ. ANCE 366/2024 — https://ragusa.ance.it/2024/09/23/circolare-n366-c-2024-controllo-e-manutenzione-estintori-modifiche-alla-norma-uni-9994-1/?print=pdf
- [S4] DPR 462/2001 aggiornato — https://www.confartigianatorieti.it/wp-content/uploads/2023/11/drp_462_01_2020.pdf
- [S5] DPR 162/1999 — https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.presidente.repubblica:1999-04-30;162
- [S6] DPR 74/2013 Allegato A — https://www.provincia.asti.it/s3prod/uploads/ckeditor/attachments/5/0/7/5/Allegato_A_-_DPR74-2013.pdf
- [S7] D.Lgs 81/2008 — https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2008-04-09;81
- [S8] Gas fluorurati, CCIAA Firenze 10/2025 — https://www.fi.camcom.gov.it/sites/default/files/contenuto_redazione/eventi/uploads/documents/Il%20registro%20Fgas%20e%20la%20sua%20evoluzione%20normativa_09.10.2025_CCIAA%20FI.pdf
- [S9] Radon, vademecum — https://castano-primo-api.municipiumapp.it/s3/1579/allegati/vademecum-radon.pdf
- [S11] DPR 59/2013 (AUA) — https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.presidente.repubblica:2013-03-13;59
- [Z2] Art. 1901 c.c. — https://www.brocardi.it/codice-civile/libro-quarto/titolo-iii/capo-xx/sezione-i/art1901.html
- [Z3] ISO 9001:2026, transizione — https://www.lrqa.com/it-it/ultime-notizie/iso-90012026-in-vigore--iniziato-il-periodo-di-transizione/
- [Z4] Quote Albo autotrasporto 2026 — https://edotto.com/articolo/imprese-autotrasporto-confermate-per-il-2026-le-quote-contributive-allalbo-nazionale
- [Z5] Rimborso accise gasolio, 1° trimestre 2026 — https://edotto.com/articolo/rimborso-accise-gasolio-autotrazione-1-trimestre-2026-domanda-entro-fine-aprile
- [Z6] MUD 2026 — https://edotto.com/articolo/mud-2026-nuovo-modello-aggiornato-in-gu ; RENTRI 2026 — https://focus.namirial.com/it/rentri-2026/
- [Z7] Delibera ART 4/12/2025 — https://www.fiscoetasse.com/files/21473/delibera-trasporti4-12-2025.pdf
