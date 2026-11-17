// =============================================================================
// Resoconti — Andamento dei costi di un mezzo (2026-11-16; regole pure)
// =============================================================================
// Mese per mese nel periodo, i tre blocchi del costo del mezzo (mezzi.ts):
//   Possesso                la quota mensile per la parte di mese in cui il
//                           mezzo c'era (una retta), più gli obblighi
//                           (assicurazione, bollo, revisioni…) RIPARTITI sui
//                           MESI_RIPARTIZIONE mesi dal mese in cui si pagano:
//                           sono annuali, così il possesso resta il costo
//                           fisso e non ha picchi nel mese del pagamento
//   Manutenzione e guasti   nel mese in cui si registrano
//   Rifornimenti e uso      nel mese del rifornimento
// Gli obblighi pagati fino a MESI_RIPARTIZIONE - 1 mesi prima del periodo vi
// entrano con le loro rate; quelli pagati alla fine vi entrano in parte: i
// totali del grafico possono quindi differire da quelli della scheda, che li
// conta per intero quando si pagano.
// Nel periodo "come la scheda" (ultimi 12 mesi fino a oggi, 2026-11-17) gli
// obblighi NON si ripartiscono: contano per intero nel mese in cui si pagano,
// come nella scheda dei costi, così le cifre coincidono.
// Solo mesi chiusi (dati consolidati, 2026-11-16): il periodo finisce
// all'ultimo giorno del mese scorso, così il mese in corso non sembra un calo;
// gli "ultimi 12 mesi" sono gli ultimi 12 mesi chiusi.
// =============================================================================
import { giorniNelMese, giorno, parti, type Giorno } from '../../regole';
import { mesiNelPeriodo, type BloccoSpesa } from './mezzi';
import { mesiDi, type Intervallo } from './resoconti';

/** Su quanti mesi si ripartisce un obbligo (annuale) */
export const MESI_RIPARTIZIONE = 12;

export interface SpesaAndamento {
  giorno: Giorno;
  blocco: BloccoSpesa;
  /** Importo più manodopera interna */
  spesa: number;
}

export interface DatiAndamento {
  periodo: Intervallo;
  /** null = costo di possesso non indicato */
  possesso: { mensile: number; dal: Giorno | null } | null;
  /** Archiviato: il giorno dell'archiviazione */
  fine: Giorno | null;
  /** Le spese del periodo e dei MESI_RIPARTIZIONE - 1 mesi prima (per gli obblighi) */
  spese: readonly SpesaAndamento[];
  /** false: obblighi per intero nel mese del pagamento, come la scheda (predefinito: ripartiti) */
  ripartisciObblighi?: boolean;
}

export interface MeseCosti {
  /** "AAAA-MM" */
  mese: string;
  quota: number;
  obblighi: number;
  /** quota + obblighi */
  possesso: number;
  manutenzione: number;
  uso: number;
  totale: number;
}

const alCentesimo = (n: number): number => Math.round(n * 100) / 100;

/** "AAAA-MM" + n mesi (pura) */
export function piuMesi(mese: string, n: number): string {
  const [a, m] = mese.split('-').map(Number);
  const t = a * 12 + (m - 1) + n;
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`;
}

/** Il primo giorno del mese di MESI_RIPARTIZIONE - 1 mesi prima del periodo: da lì si leggono le spese (pura) */
export const inizioLettura = (p: Intervallo): Giorno => `${piuMesi(p.dal.slice(0, 7), -(MESI_RIPARTIZIONE - 1))}-01`;

/** L'ultimo giorno del mese prima di quello di `oggi`: la fine dei dati consolidati (pura) */
export function fineMeseScorso(oggi: Giorno): Giorno {
  const [a, m] = parti(piuMesi(oggi.slice(0, 7), -1) + '-01');
  return giorno(a, m, giorniNelMese(a, m));
}

/** Gli ultimi `n` mesi chiusi (pura): da inizio mese, n mesi fa, a fine del mese scorso */
export const ultimiMesiChiusi = (oggi: Giorno, n: number): Intervallo => ({ dal: `${piuMesi(oggi.slice(0, 7), -n)}-01`, al: fineMeseScorso(oggi) });

/** Il periodo tagliato ai mesi chiusi; null se non ne resta nessuno (pura) */
export function soloMesiChiusi(p: Intervallo, oggi: Giorno): Intervallo | null {
  const fine = fineMeseScorso(oggi);
  const al = p.al < fine ? p.al : fine;
  return al < p.dal ? null : { dal: p.dal, al };
}

/** La parte del mese dentro il periodo (pura) */
function meseNelPeriodo(mese: string, p: Intervallo): Intervallo {
  const [a, m] = parti(`${mese}-01`);
  const primo = giorno(a, m, 1);
  const ultimo = giorno(a, m, giorniNelMese(a, m));
  return { dal: primo > p.dal ? primo : p.dal, al: ultimo < p.al ? ultimo : p.al };
}

/** L'andamento mese per mese, con i totali e le quote dei tre blocchi (pura) */
export function andamentoCosti(d: DatiAndamento) {
  const mesi = mesiDi(d.periodo).map((mese): MeseCosti => {
    const quota = d.possesso ? alCentesimo(d.possesso.mensile * mesiNelPeriodo(meseNelPeriodo(mese, d.periodo), d.possesso.dal, d.fine)) : 0;
    let obblighi = 0;
    let manutenzione = 0;
    let uso = 0;
    for (const s of d.spese) {
      const m = s.giorno.slice(0, 7);
      const nelPeriodo = m === mese && s.giorno >= d.periodo.dal && s.giorno <= d.periodo.al;
      if (s.blocco === 'obblighi' && d.ripartisciObblighi !== false) {
        // la rata di questo mese, se cade nei MESI_RIPARTIZIONE mesi dal pagamento
        if (m <= mese && mese < piuMesi(m, MESI_RIPARTIZIONE)) obblighi += s.spesa / MESI_RIPARTIZIONE;
      } else if (s.blocco === 'obblighi') {
        // come la scheda: per intero nel mese del pagamento
        if (nelPeriodo) obblighi += s.spesa;
      } else if (nelPeriodo) {
        if (s.blocco === 'manutenzione') manutenzione += s.spesa;
        else uso += s.spesa;
      }
    }
    obblighi = alCentesimo(obblighi);
    const possesso = alCentesimo(quota + obblighi);
    return { mese, quota, obblighi, possesso, manutenzione: alCentesimo(manutenzione), uso: alCentesimo(uso), totale: alCentesimo(possesso + manutenzione + uso) };
  });
  const somma = (f: (m: MeseCosti) => number) => alCentesimo(mesi.reduce((t, m) => t + f(m), 0));
  const totali = {
    quota: somma(m => m.quota),
    obblighi: somma(m => m.obblighi),
    possesso: somma(m => m.possesso),
    manutenzione: somma(m => m.manutenzione),
    uso: somma(m => m.uso),
    totale: somma(m => m.totale),
  };
  const quotaDi = (n: number) => (totali.totale > 0 ? Math.round((n / totali.totale) * 100) : 0);
  return {
    mesi,
    totali,
    /** Percentuale di ogni blocco sul totale del periodo */
    quote: { possesso: quotaDi(totali.possesso), manutenzione: quotaDi(totali.manutenzione), uso: quotaDi(totali.uso) },
  };
}
