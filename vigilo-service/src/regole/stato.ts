// =============================================================================
// Stato di una scadenza (01-dominio 1.3, 07-interfaccia 7.2)
// =============================================================================
//   in regola      fuori dai preavvisi
//   in scadenza    dentro il primo preavviso (o soglia d'uso vicina)
//   in tolleranza  data/soglia superata ma entro il termine di rinnovo
//   scaduta        superata anche la tolleranza
//   da completare  ne' data ne' soglia
// Con data E soglia (cadenza combinata) vale lo stato peggiore. Lo stato si
// calcola sempre, non si scrive mai a mano: questa e' l'unica definizione.
// =============================================================================
import { aggiungiGiorni, confronta, differenzaGiorni, minimo, type Giorno } from './date';
import { dataStimata } from './contatori';
import { GRAVITA, type Preavvisi, type Stato, type Tolleranza } from './tipi';

export interface InputStato {
  scadeIl: Giorno | null;
  sogliaUso: number | null;
  /** Valore attuale del contatore della scadenza (null = sconosciuto) */
  valoreContatore: number | null;
  /** Uso medio giornaliero del contatore, per stimare la data */
  usoGiornaliero: number | null;
  preavvisi: Preavvisi;
  tolleranza: Tolleranza;
}

export interface Situazione {
  stato: Stato;
  /** Quale componente decide lo stato (per il testo) */
  per: 'tempo' | 'uso' | null;
  /** Fine della tolleranza a tempo (= scadeIl se non c'e' tolleranza) */
  limiteIl: Giorno | null;
  /** Data stimata in cui il contatore raggiunge la soglia */
  stimataIl: Giorno | null;
  /** Data che ordina il cruscotto: la prima fra scadenza e stima */
  urgenzaIl: Giorno | null;
  /** Giorni da oggi alla scadenza (negativo = passata) */
  giorniAllaScadenza: number | null;
  /** Unita' che mancano alla soglia (negativo = superata) */
  mancaUso: number | null;
  /** Fine della tolleranza a uso (= soglia se non c'e' tolleranza) */
  limiteUso: number | null;
}

const massimo = (xs: number[]): number => (xs.length ? Math.max(...xs) : 0);

function statoTempo(scadeIl: Giorno, limiteIl: Giorno, preavvisi: Preavvisi, oggi: Giorno): Stato {
  if (confronta(oggi, limiteIl) > 0) return 'scaduta';
  if (confronta(oggi, scadeIl) > 0) return 'in-tolleranza';
  return differenzaGiorni(oggi, scadeIl) <= massimo(preavvisi.giorni) ? 'in-scadenza' : 'in-regola';
}

function statoUso(
  soglia: number,
  valore: number,
  limiteUso: number,
  stimataIl: Giorno | null,
  preavvisi: Preavvisi,
  oggi: Giorno
): Stato {
  if (valore > limiteUso) return 'scaduta';
  if (valore > soglia) return 'in-tolleranza';
  if (soglia - valore <= massimo(preavvisi.uso)) return 'in-scadenza';
  // La stima cade dentro i preavvisi a giorni: e' gia' "in scadenza"
  if (stimataIl && differenzaGiorni(oggi, stimataIl) <= massimo(preavvisi.giorni)) return 'in-scadenza';
  return 'in-regola';
}

export function calcolaSituazione(input: InputStato, oggi: Giorno): Situazione {
  const { scadeIl, sogliaUso, valoreContatore, usoGiornaliero, preavvisi, tolleranza } = input;

  let sTempo: Stato | null = null;
  let limiteIl: Giorno | null = null;
  if (scadeIl) {
    limiteIl = tolleranza.giorni > 0 ? aggiungiGiorni(scadeIl, tolleranza.giorni) : scadeIl;
    sTempo = statoTempo(scadeIl, limiteIl, preavvisi, oggi);
  }

  let sUso: Stato | null = null;
  let stimataIl: Giorno | null = null;
  let mancaUso: number | null = null;
  let limiteUso: number | null = null;
  if (sogliaUso !== null && valoreContatore !== null) {
    mancaUso = sogliaUso - valoreContatore;
    limiteUso = sogliaUso + Math.max(0, tolleranza.uso);
    stimataIl = dataStimata(sogliaUso, valoreContatore, usoGiornaliero, oggi);
    sUso = statoUso(sogliaUso, valoreContatore, limiteUso, stimataIl, preavvisi, oggi);
  }

  let stato: Stato;
  let per: Situazione['per'];
  if (sTempo === null && sUso === null) {
    stato = 'da-completare';
    per = null;
  } else if (sUso === null || (sTempo !== null && GRAVITA[sTempo] >= GRAVITA[sUso])) {
    // a parita' di gravita' decide la componente che arriva prima
    const usoPrima = sUso !== null && sTempo === sUso && stimataIl && scadeIl && confronta(stimataIl, scadeIl) < 0;
    stato = sTempo!;
    per = usoPrima ? 'uso' : 'tempo';
  } else {
    stato = sUso;
    per = 'uso';
  }

  return {
    stato,
    per,
    limiteIl,
    stimataIl,
    urgenzaIl: minimo(scadeIl, stimataIl),
    giorniAllaScadenza: scadeIl ? differenzaGiorni(oggi, scadeIl) : null,
    mancaUso,
    limiteUso,
  };
}
