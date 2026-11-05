// =============================================================================
// Resoconti — Costo dei mezzi (stima, tappa 1) — regole pure
// =============================================================================
// Per ogni veicolo, macchina o attrezzatura, nel periodo:
//   Possesso                quota mensile × mesi del periodo in cui il mezzo
//                           c'era (da `dal` del possesso all'archiviazione),
//                           più gli obblighi: registrazioni di natura
//                           adempimento, pagamento, documento, abilitazione e
//                           promemoria (assicurazione, bollo, revisioni…)
//   Manutenzione e guasti   registrazioni di manutenzione e di riparazione,
//                           manodopera interna compresa
//   Uso                     i rifornimenti (carburante, AdBlue, pedaggi, altro,
//                           tappa 2), con il consumo medio di carburante in
//                           litri per 100 km o per ora quando l'uso basta
// Il costo si divide per km o ore del contatore principale se l'uso supera la
// soglia (le stesse di Spese e consumi), altrimenti per mese.
// Confronto con la categoria (o con il tipo, senza categoria), fra mezzi con
// la stessa base (km, ore, mese) e almeno 2 altri: sul totale per unità solo
// fra mezzi con il costo di possesso; su manutenzione e guasti per unità
// sempre. Oltre la soglia (parametro VIGILO_SCOSTAMENTO_PERCENTO) il mezzo è
// segnalato, con il blocco che pesa di più. Senza costo di possesso il mezzo è
// "parziale".
// =============================================================================
import { giorniNelMese, parti, type Giorno } from '../../regole';
import type { TipoSoggetto } from '../valori';
import type { Intervallo, NaturaResoconto } from './resoconti';

export type BloccoSpesa = 'obblighi' | 'manutenzione' | 'uso';
export type BaseCosto = 'km' | 'ore' | 'mese';

/** In quale blocco va la spesa di una registrazione */
export const bloccoDi = (natura: NaturaResoconto): BloccoSpesa =>
  natura === 'uso' ? 'uso' : natura === 'manutenzione' || natura === 'riparazione' ? 'manutenzione' : 'obblighi';

/** Altri mezzi confrontabili, almeno, perché la media dica qualcosa */
export const ALTRI_MINIMI_CONFRONTO = 2;

const alCentesimo = (n: number): number => Math.round(n * 100) / 100;

/**
 * I mesi (con i decimali) in cui il mezzo c'era nel periodo, da `dal` (se dopo
 * l'inizio) a `fine` (se prima della fine): ogni mese di calendario conta per
 * la parte di giorni presi, così un anno intero vale 12 e luglio-dicembre 6.
 */
export function mesiNelPeriodo(p: Intervallo, dal?: Giorno | null, fine?: Giorno | null): number {
  const da = dal && dal > p.dal ? dal : p.dal;
  const a = fine && fine < p.al ? fine : p.al;
  if (a < da) return 0;
  const [a1, m1, g1] = parti(da);
  const [a2, m2, g2] = parti(a);
  let mesi = 0;
  for (let anno = a1, mese = m1; anno < a2 || (anno === a2 && mese <= m2); mese === 12 ? ((anno += 1), (mese = 1)) : (mese += 1)) {
    const giorni = giorniNelMese(anno, mese);
    const primo = anno === a1 && mese === m1 ? g1 : 1;
    const ultimo = anno === a2 && mese === m2 ? g2 : giorni;
    mesi += (ultimo - primo + 1) / giorni;
  }
  return alCentesimo(mesi);
}

export interface MezzoDaCalcolare {
  uuid: string;
  nome: string;
  identificativo: string | null;
  tipo: TipoSoggetto;
  categoria: { uuid: string; nome: string } | null;
  /** null = costo di possesso non indicato */
  possesso: { mensile: number; dal: Giorno | null } | null;
  /** Archiviato: il giorno dell'archiviazione */
  fine: Giorno | null;
  uso: { unita: 'km' | 'ore'; valore: number | null } | null;
  /** Spese registrate nel periodo, per blocco; guasti riparati; litri di carburante dei rifornimenti */
  spese: { obblighi: number; manutenzione: number; uso: number; guasti: number; litri: number };
}

export interface Confronto {
  /** Percentuale rispetto alla media degli altri (+40 = il 40% in più) */
  scostamento: number;
  media: number;
  altri: number;
}

export interface CostoMezzo {
  uuid: string;
  nome: string;
  identificativo: string | null;
  tipo: TipoSoggetto;
  categoria: { uuid: string; nome: string } | null;
  parziale: boolean;
  mesi: number;
  possesso: { quota: number; obblighi: number; totale: number };
  manutenzione: { totale: number; guasti: number };
  /** Blocco Uso, dai rifornimenti; consumo in litri per 100 km o per ora, se l'uso basta */
  rifornimenti: { totale: number; litri: number; consumo: number | null };
  totale: number;
  uso: { unita: 'km' | 'ore'; valore: number | null } | null;
  base: BaseCosto;
  /** Totale ÷ km, ore o mesi; null se non si può dividere */
  costoPerUnita: number | null;
  confronto: {
    totale: Confronto | null;
    manutenzione: Confronto | null;
    segnalato: boolean;
    soprattutto: 'possesso' | 'manutenzione' | 'uso' | null;
  };
}

interface Lavoro {
  c: CostoMezzo;
  divisore: number | null;
  gruppo: string;
}

const media = (valori: number[]): number => valori.reduce((t, v) => t + v, 0) / valori.length;

function confrontoCon(mio: number, altri: number[]): Confronto | null {
  if (altri.length < ALTRI_MINIMI_CONFRONTO) return null;
  const m = media(altri);
  if (m <= 0) return null;
  return { scostamento: Math.round(((mio - m) / m) * 100), media: Math.round(m * 1000) / 1000, altri: altri.length };
}

/** Il costo stimato di ogni mezzo, dal più caro */
export function costiMezzi(mezzi: MezzoDaCalcolare[], p: Intervallo, soglie: { km: number; ore: number }, sogliaScostamento: number): CostoMezzo[] {
  const lavori: Lavoro[] = mezzi.map(m => {
    const mesi = mesiNelPeriodo(p, m.possesso?.dal, m.fine);
    const quota = m.possesso ? alCentesimo(m.possesso.mensile * mesi) : 0;
    const obblighi = alCentesimo(m.spese.obblighi);
    const manutenzione = alCentesimo(m.spese.manutenzione);
    const uso = alCentesimo(m.spese.uso);
    const totale = alCentesimo(quota + obblighi + manutenzione + uso);
    const conUso = m.uso && m.uso.valore != null && m.uso.valore >= soglie[m.uso.unita];
    const base: BaseCosto = conUso ? m.uso!.unita : 'mese';
    const divisore = conUso ? m.uso!.valore! : mesi > 0 ? mesi : null;
    // litri per 100 km o per ora: solo con abbastanza uso e qualche litro
    const consumo = conUso && m.spese.litri > 0 ? alCentesimo(base === 'km' ? (m.spese.litri / m.uso!.valore!) * 100 : m.spese.litri / m.uso!.valore!) : null;
    const c: CostoMezzo = {
      uuid: m.uuid,
      nome: m.nome,
      identificativo: m.identificativo,
      tipo: m.tipo,
      categoria: m.categoria,
      parziale: !m.possesso,
      mesi,
      possesso: { quota, obblighi, totale: alCentesimo(quota + obblighi) },
      manutenzione: { totale: manutenzione, guasti: m.spese.guasti },
      rifornimenti: { totale: uso, litri: alCentesimo(m.spese.litri), consumo },
      totale,
      uso: m.uso,
      base,
      costoPerUnita: divisore ? Math.round((totale / divisore) * 1000) / 1000 : null,
      confronto: { totale: null, manutenzione: null, segnalato: false, soprattutto: null },
    };
    return { c, divisore, gruppo: `${m.categoria?.uuid ?? `tipo:${m.tipo}`}|${base}` };
  });

  for (const l of lavori) {
    if (!l.divisore) continue;
    const altri = lavori.filter(x => x !== l && x.gruppo === l.gruppo && x.divisore);
    const completi = altri.filter(x => !x.c.parziale);
    const perUnita = (x: Lavoro, v: number) => v / x.divisore!;
    const totale = l.c.parziale ? null : confrontoCon(perUnita(l, l.c.totale), completi.map(x => perUnita(x, x.c.totale)));
    const manutenzione = confrontoCon(perUnita(l, l.c.manutenzione.totale), altri.map(x => perUnita(x, x.c.manutenzione.totale)));
    const segnalato = [totale, manutenzione].some(x => x !== null && x.scostamento > sogliaScostamento);
    let soprattutto: CostoMezzo['confronto']['soprattutto'] = null;
    if (segnalato) {
      // il blocco con l'eccesso per unità più grande rispetto agli altri
      const eccesso = (v: (c: CostoMezzo) => number, gruppo: Lavoro[]) => (gruppo.length ? perUnita(l, v(l.c)) - media(gruppo.map(x => perUnita(x, v(x.c)))) : -Infinity);
      const candidati: [NonNullable<CostoMezzo['confronto']['soprattutto']>, number][] = [
        ['manutenzione', manutenzione ? eccesso(c => c.manutenzione.totale, altri) : -Infinity],
        ['possesso', totale ? eccesso(c => c.possesso.totale, completi) : -Infinity],
        ['uso', totale ? eccesso(c => c.rifornimenti.totale, completi) : -Infinity],
      ];
      soprattutto = candidati.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
    }
    l.c.confronto = { totale, manutenzione, segnalato, soprattutto };
  }

  return lavori.map(l => l.c).sort((a, b) => b.totale - a.totale);
}
