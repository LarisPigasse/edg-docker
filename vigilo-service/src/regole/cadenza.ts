// =============================================================================
// Cadenze: prossima scadenza e prima scadenza (01-dominio 1.4)
// =============================================================================
// Funzioni pure. Forme coperte:
//   una tantum            nessuna componente: dopo la registrazione e' finita
//   a tempo               ogni N giorni/mesi/anni, dalla scadenza precedente o
//                         dall'esecuzione, eventualmente a fine mese
//   a uso                 ogni N km/ore dalla lettura registrata
//   combinata             tempo E uso: vale la prima che arriva (lo stato
//                         guarda entrambe)
//   prima diversa         la prima scadenza da una data del soggetto
//   a finestra            dalla scadenza se fatto entro la finestra prima di
//                         essa, altrimenti dall'esecuzione (CQC, ADR)
//   a fasce d'eta'        la durata cambia con l'eta' del soggetto (patente,
//                         verifiche delle gru dopo 10 anni)
//   con fine              si ferma dopo una data o dopo N ripetizioni
// =============================================================================
import { aggiungiGiorni, aggiungiMesi, confronta, fineMese as ultimoDelMese, isGiorno, parti, type Giorno } from './date';
import type { Cadenza, Durata, PosizioneScadenza } from './tipi';

/** Date del soggetto per chiave (dati del tipo e campi della categoria) */
export type DateSoggetto = Record<string, unknown>;

/** Aggiunge una durata a un giorno (anni e mesi tengono il giorno, o l'ultimo del mese) */
export function aggiungiDurata(g: Giorno, d: Durata, ancora?: number): Giorno {
  switch (d.unita) {
    case 'giorni':
      return aggiungiGiorni(g, d.valore);
    case 'mesi':
      return aggiungiMesi(g, d.valore, ancora);
    case 'anni':
      return aggiungiMesi(g, d.valore * 12, ancora);
  }
}

/** Toglie una durata (per l'apertura della finestra) */
const togliDurata = (g: Giorno, d: Durata): Giorno => aggiungiDurata(g, { ...d, valore: -d.valore });

/**
 * La durata che vale alla data `base`: quella dell'ultima fascia d'eta'
 * raggiunta, altrimenti `tempo`. Senza la data del soggetto vale `tempo`.
 */
export function durataAl(cadenza: Cadenza, base: Giorno, dateSoggetto: DateSoggetto = {}): Durata | null {
  if (!cadenza.tempo) return null;
  const fasce = cadenza.fasce;
  const da = fasce ? dateSoggetto[fasce.da] : null;
  if (!fasce || !fasce.elenco.length || !isGiorno(da)) return cadenza.tempo;
  const raggiunte = fasce.elenco
    .map(f => ({ f, dal: aggiungiDurata(da, f.oltre) }))
    .filter(x => confronta(x.dal, base) <= 0)
    .sort((x, y) => confronta(x.dal, y.dal));
  return raggiunte.length ? raggiunte[raggiunte.length - 1].f.tempo : cadenza.tempo;
}

/**
 * Da quale giorno si conta la scadenza successiva e se e' la scadenza
 * precedente (calendario fisso) o l'esecuzione.
 */
export function baseDelCalcolo(
  cadenza: Cadenza,
  attuale: PosizioneScadenza,
  eseguitaIl: Giorno
): { base: Giorno; daScadenza: boolean } {
  const scadeIl = attuale.scadeIl;
  if (scadeIl && cadenza.ancoraggio === 'scadenza') return { base: scadeIl, daScadenza: true };
  if (scadeIl && cadenza.ancoraggio === 'finestra' && cadenza.finestra) {
    const apre = togliDurata(scadeIl, cadenza.finestra);
    if (confronta(eseguitaIl, apre) >= 0 && confronta(eseguitaIl, scadeIl) <= 0) return { base: scadeIl, daScadenza: true };
  }
  return { base: eseguitaIl, daScadenza: false };
}

export interface Registrazione {
  /** Quando e' stato fatto */
  eseguitaIl: Giorno;
  /** Lettura del contatore al momento dell'intervento (per le cadenze a uso) */
  lettura: number | null;
}

export interface FineRicorrenza {
  /** Nessuna scadenza dopo questa data */
  fineIl?: Giorno | null;
  /** Quante scadenze restano dopo quella attuale; null = illimitate */
  ripetizioniRimaste?: number | null;
}

export interface Prossima extends PosizioneScadenza {
  /** true = la serie e' finita (una tantum, data di fine superata, ripetizioni esaurite) */
  finita: boolean;
  /** Ripetizioni rimaste dopo la nuova scadenza (null = illimitate) */
  ripetizioniRimaste: number | null;
  /** La cadenza e' a uso ma manca la lettura: la soglia non si puo' calcolare */
  letturaMancante: boolean;
}

/**
 * La scadenza successiva dopo una registrazione con esito positivo.
 *
 * @param attuale  la scadenza che si chiude (data e soglia attuali)
 * @param ancora   giorno del mese della serie (es. 31): evita che le scadenze
 *                 mensili scivolino dopo febbraio; null = quello della base
 * @param dateSoggetto  date del soggetto, per le fasce d'eta'
 */
export function prossimaScadenza(
  cadenza: Cadenza,
  attuale: PosizioneScadenza,
  registrazione: Registrazione,
  fine: FineRicorrenza = {},
  ancora: number | null = null,
  dateSoggetto: DateSoggetto = {}
): Prossima {
  const finita = (letturaMancante = false): Prossima => ({
    scadeIl: null,
    sogliaUso: null,
    finita: true,
    ripetizioniRimaste: 0,
    letturaMancante,
  });

  if (!cadenza.tempo && !cadenza.uso) return finita();

  const rimaste = fine.ripetizioniRimaste ?? null;
  if (rimaste !== null && rimaste <= 0) return finita();

  // --- tempo ---------------------------------------------------------------
  let scadeIl: Giorno | null = null;
  if (cadenza.tempo) {
    const { base, daScadenza } = baseDelCalcolo(cadenza, attuale, registrazione.eseguitaIl);
    const tempo = durataAl(cadenza, base, dateSoggetto)!;
    const giornoAncora = ancora ?? parti(base)[2];
    let candidata = aggiungiDurata(base, tempo, giornoAncora);
    if (cadenza.fineMese) candidata = ultimoDelMese(candidata);
    // Calendario fisso ma intervento molto in ritardo: la prossima deve
    // comunque venire dopo l'esecuzione (si salta al primo periodo utile).
    let giri = 0;
    while (daScadenza && confronta(candidata, registrazione.eseguitaIl) <= 0 && giri < 1024) {
      candidata = aggiungiDurata(candidata, tempo, giornoAncora);
      if (cadenza.fineMese) candidata = ultimoDelMese(candidata);
      giri++;
    }
    scadeIl = candidata;
  }

  // --- uso -----------------------------------------------------------------
  let sogliaUso: number | null = null;
  let letturaMancante = false;
  if (cadenza.uso) {
    if (registrazione.lettura === null || registrazione.lettura === undefined) {
      letturaMancante = true;
    } else {
      sogliaUso = registrazione.lettura + cadenza.uso.valore;
    }
  }

  // --- fine della ricorrenza -------------------------------------------------
  if (fine.fineIl && scadeIl && confronta(scadeIl, fine.fineIl) > 0) return finita();
  if (!scadeIl && sogliaUso === null) return finita(letturaMancante);

  return {
    scadeIl,
    sogliaUso,
    finita: false,
    ripetizioniRimaste: rimaste === null ? null : rimaste - 1,
    letturaMancante,
  };
}

/**
 * La prima scadenza di un soggetto nuovo, quando si puo' calcolare da un suo
 * dato (es. revisione: 4 anni dall'immatricolazione, a fine mese).
 * null = non calcolabile: la scadenza nasce "da completare".
 *
 * Con `oggi`, se la prima scadenza e' gia' passata (mezzo inserito anni dopo
 * l'immatricolazione) si propone la prima successiva a oggi secondo la
 * cadenza: e' una PROPOSTA, che l'utente conferma o corregge.
 *
 * @param dateSoggetto date del soggetto per chiave (dati del tipo e campi della categoria)
 */
export function primaScadenza(
  cadenza: Cadenza,
  dateSoggetto: DateSoggetto,
  oggi: Giorno | null = null
): Giorno | null {
  if (!cadenza.prima) return null;
  const da = dateSoggetto[cadenza.prima.da];
  if (!isGiorno(da)) return null;
  const arrotonda = (g: Giorno) => (cadenza.fineMese ? ultimoDelMese(g) : g);
  let candidata = arrotonda(aggiungiDurata(da, cadenza.prima.tempo));
  if (oggi && cadenza.tempo) {
    let giri = 0;
    while (confronta(candidata, oggi) < 0 && giri < 1024) {
      candidata = arrotonda(aggiungiDurata(candidata, durataAl(cadenza, candidata, dateSoggetto)!));
      giri++;
    }
  }
  return candidata;
}
