// =============================================================================
// Resoconti — le due componenti del costo di un mezzo (2026-11-18; regole pure)
// =============================================================================
// Il costo di un mezzo diviso in ciò che costa perché ESISTE e ciò che costa
// perché SI MUOVE (o lavora), come i valori di riferimento dell'autotrasporto:
//   fissa       (possesso + obblighi + manutenzione e guasti) ÷ ore di impiego
//               del periodo: € per ora di impiego, che corre anche nelle
//               attese, nel carico e scarico, nei fermi
//   variabile   rifornimenti e uso ÷ km (o ore motore): € per km in movimento
// Le ore di impiego del periodo sono quelle annue (parametro della stima)
// riportate ai mesi in cui il mezzo c'era. Un servizio costa allora
// km × variabile + ore di impegno × fissa (stima/calcolo.ts).
// =============================================================================
import type { CostoMezzo } from './mezzi';

export interface ComponentiMezzo {
  /** € per ora di impiego; null se il mezzo non c'era nel periodo */
  fissoOra: number | null;
  /** € per km (o per ora motore) in movimento; null senza uso registrato */
  variabile: number | null;
  unita: 'km' | 'ore' | null;
  /** Le ore di impiego del periodo usate per la parte fissa */
  oreImpiego: number;
}

const alCentesimo = (n: number) => Math.round(n * 100) / 100;
const alMillesimo = (n: number) => Math.round(n * 1000) / 1000;

/** Le due componenti del costo del mezzo nel periodo (pura) */
export function componentiMezzo(c: Pick<CostoMezzo, 'possesso' | 'manutenzione' | 'rifornimenti' | 'uso' | 'mesi'>, oreImpiegoAnnue: number): ComponentiMezzo {
  const oreImpiego = Math.round(((oreImpiegoAnnue * c.mesi) / 12) * 10) / 10;
  return {
    fissoOra: oreImpiego > 0 ? alCentesimo((c.possesso.totale + c.manutenzione.totale) / oreImpiego) : null,
    variabile: c.uso?.valore ? alMillesimo(c.rifornimenti.totale / c.uso.valore) : null,
    unita: c.uso?.unita ?? null,
    oreImpiego,
  };
}
