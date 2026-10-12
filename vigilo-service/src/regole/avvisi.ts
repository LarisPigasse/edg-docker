// =============================================================================
// Avvisi dovuti a una data (04-avvisi.md 4.2)
// =============================================================================
// Funzione pura: dice quali eventi spettano OGGI a una scadenza. Chi la chiama
// (processo notturno, salvataggi) li registra in `avvisi` con chiave unica
// scadenza + evento + riferimento: un evento gia' dato non si ripete, e se la
// scadenza cambia data (rinvio, registrazione) il riferimento cambia e il
// ciclo riparte.
//
// Regole:
//   - dei preavvisi gia' maturati si da' solo il piu' vicino (una scadenza
//     creata a 2 giorni dalla data non riceve anche quello dei 32 giorni);
//   - in tolleranza: avviso d'inizio e, l'ultimo giorno, avviso urgente;
//   - scaduta: avviso urgente, poi un richiamo ogni `intervalloRichiami`
//     giorni (0 = nessun richiamo); i richiami valgono per la data, non per
//     le soglie d'uso (di una soglia non si sa da quando e' superata).
// =============================================================================
import { differenzaGiorni, type Giorno } from './date';
import type { Situazione } from './stato';
import type { Preavvisi } from './tipi';

export type TipoEvento =
  | 'preavviso'
  | 'preavviso-uso'
  | 'tolleranza-inizio'
  | 'tolleranza-ultimo-giorno'
  | 'scaduta'
  | 'richiamo';

export interface EventoAvviso {
  /** Chiave unica dell'evento nel ciclo (es. "preavviso:8", "richiamo:2") */
  evento: string;
  tipo: TipoEvento;
  /** Urgenti = si inviano subito anche a chi riceve il riepilogo (04-avvisi 4.4) */
  urgente: boolean;
  /** Identifica il ciclo: cambia quando cambiano data o soglia */
  riferimento: string;
}

export interface InputAvvisi {
  scadeIl: Giorno | null;
  sogliaUso: number | null;
  situazione: Situazione;
  preavvisi: Preavvisi;
  /** Giorni fra un richiamo e l'altro per le scadute (0 = nessuno) */
  intervalloRichiami: number;
}

export const riferimentoCiclo = (scadeIl: Giorno | null, sogliaUso: number | null): string =>
  `${scadeIl ?? '-'}|${sogliaUso ?? '-'}`;

/** Il preavviso piu' vicino gia' maturato: il minimo fra quelli >= distanza */
const piuVicino = (soglie: number[], distanza: number): number | null => {
  const maturati = soglie.filter(p => distanza <= p);
  return maturati.length ? Math.min(...maturati) : null;
};

export function eventiDovuti(input: InputAvvisi, oggi: Giorno): EventoAvviso[] {
  const { scadeIl, sogliaUso, situazione: s, preavvisi, intervalloRichiami } = input;
  const riferimento = riferimentoCiclo(scadeIl, sogliaUso);
  const ev = (tipo: TipoEvento, evento: string, urgente: boolean): EventoAvviso => ({ tipo, evento, urgente, riferimento });
  const eventi: EventoAvviso[] = [];

  switch (s.stato) {
    case 'in-scadenza': {
      if (scadeIl && s.giorniAllaScadenza !== null && s.giorniAllaScadenza >= 0) {
        const p = piuVicino(preavvisi.giorni, s.giorniAllaScadenza);
        if (p !== null) eventi.push(ev('preavviso', `preavviso:${p}`, false));
      }
      if (s.mancaUso !== null && s.mancaUso >= 0) {
        const p = piuVicino(preavvisi.uso, s.mancaUso);
        if (p !== null) eventi.push(ev('preavviso-uso', `preavviso-uso:${p}`, false));
        else if (s.stimataIl) {
          // in scadenza per la data stimata: si usano i preavvisi a giorni
          const pg = piuVicino(preavvisi.giorni, differenzaGiorni(oggi, s.stimataIl));
          if (pg !== null) eventi.push(ev('preavviso-uso', `preavviso-stima:${pg}`, false));
        }
      }
      break;
    }
    case 'in-tolleranza': {
      eventi.push(ev('tolleranza-inizio', s.per === 'uso' ? 'tolleranza-uso:inizio' : 'tolleranza:inizio', false));
      if (s.per === 'tempo' && s.limiteIl === oggi) {
        eventi.push(ev('tolleranza-ultimo-giorno', 'tolleranza:ultimo-giorno', true));
      }
      break;
    }
    case 'scaduta': {
      eventi.push(ev('scaduta', 'scaduta', true));
      if (s.per === 'tempo' && s.limiteIl && intervalloRichiami > 0) {
        const giorniDopo = differenzaGiorni(s.limiteIl, oggi); // 1 = il primo giorno da scaduta
        const k = Math.floor((giorniDopo - 1) / intervalloRichiami);
        if (k >= 1) eventi.push(ev('richiamo', `richiamo:${k}`, true));
      }
      break;
    }
    default:
      break;
  }
  return eventi;
}
