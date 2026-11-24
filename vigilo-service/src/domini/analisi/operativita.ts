// =============================================================================
// Analisi — la flotta al lavoro (2026-11-23, fase C; regole pure)
// =============================================================================
//   giorni di fermo    i guasti che bloccano l'uso, dal giorno in cui nascono
//                      a quello in cui si chiudono (oggi se aperti), dentro il
//                      periodo; due guasti sovrapposti contano una volta
//   disponibilità      1 − giorni di fermo ÷ (veicoli × giorni del periodo)
//   consumo            litri ÷ km × 100, della flotta e per veicolo; la
//                      tendenza confronta gli ultimi 3 mesi con i 9 prima
//   utilizzo           km al mese per veicolo; sotto la soglia è poco usato
//   guasti             quanto pesano le riparazioni sulla manutenzione
// =============================================================================
import { aggiungiGiorni, differenzaGiorni, type Giorno } from '../../regole';

const alDecimo = (n: number) => Math.round(n * 10) / 10;

/** I giorni di fermo di un veicolo nel periodo, dai suoi guasti bloccanti (pura) */
export function giorniFermo(guasti: readonly { dal: Giorno; al: Giorno }[], periodo: { dal: Giorno; al: Giorno }): number {
  const dentro = guasti
    .map(g => ({ dal: g.dal < periodo.dal ? periodo.dal : g.dal, al: g.al > periodo.al ? periodo.al : g.al }))
    .filter(g => g.dal <= g.al)
    .sort((a, b) => (a.dal < b.dal ? -1 : a.dal > b.dal ? 1 : 0));
  let giorni = 0;
  let fine: Giorno | null = null;
  for (const g of dentro) {
    const da = fine && g.dal <= fine ? aggiungiGiorni(fine, 1) : g.dal;
    if (da <= g.al) giorni += differenzaGiorni(da, g.al) + 1;
    if (!fine || g.al > fine) fine = g.al;
  }
  return giorni;
}

/** La disponibilità in %: i giorni in cui i veicoli potevano lavorare (pura) */
export const disponibilita = (veicoli: number, giorniPeriodo: number, fermo: number): number | null =>
  veicoli > 0 && giorniPeriodo > 0 ? alDecimo((1 - fermo / (veicoli * giorniPeriodo)) * 100) : null;

/** Litri per 100 km; null senza km o senza litri (pura) */
export const consumo = (litri: number, km: number | null): number | null => (km && km > 0 && litri > 0 ? alDecimo((litri / km) * 100) : null);

/** Variazione % di b rispetto ad a; null se manca uno dei due (pura) */
export const variazione = (a: number | null, b: number | null): number | null => (a && b !== null ? alDecimo(((b - a) / a) * 100) : null);

/**
 * Il consumo medio di ogni categoria, pesato (litri ÷ km): solo le categorie
 * con almeno 2 veicoli con i consumi, perché un veicolo da solo non ha con
 * chi confrontarsi (pura)
 */
export function consumoPerCategoria(veicoli: readonly { categoria: string | null; litri: number; km: number | null }[]): Map<string | null, number> {
  const gruppi = new Map<string | null, { litri: number; km: number; n: number }>();
  for (const v of veicoli) {
    if (!v.km || v.km <= 0 || v.litri <= 0) continue;
    const g = gruppi.get(v.categoria) ?? { litri: 0, km: 0, n: 0 };
    gruppi.set(v.categoria, { litri: g.litri + v.litri, km: g.km + v.km, n: g.n + 1 });
  }
  const medie = new Map<string | null, number>();
  for (const [c, g] of gruppi) if (g.n >= 2) medie.set(c, consumo(g.litri, g.km)!);
  return medie;
}

/** Quanto pesano le riparazioni sul totale di manutenzione e riparazioni, in % (pura) */
export const quotaGuasti = (riparazioni: number, manutenzione: number): number | null =>
  riparazioni + manutenzione > 0 ? alDecimo((riparazioni / (riparazioni + manutenzione)) * 100) : null;
