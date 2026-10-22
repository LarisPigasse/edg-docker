// =============================================================================
// Il riepilogo degli avvisi (04-avvisi 4.5, ADR093) — regole pure
// =============================================================================
//   riepilogoDovuto   oggi è lavorativo, l'orario è passato e oggi non è
//                     ancora partito
//   settimanaleDovuto è il primo riepilogo della settimana (di norma lunedì)
//   gruppoDi          le tre sezioni dell'email, con i colori della campanella
// =============================================================================
import { parti, type Giorno } from '../../regole';
import { minutiDi, type RegoleAvvisi } from '../impostazioni/limiti';
import type { TonoAvviso } from './testo';

/** 1 = lunedì ... 7 = domenica */
export function giornoDellaSettimana(g: Giorno): number {
  const [a, m, d] = parti(g);
  const w = new Date(Date.UTC(a, m - 1, d)).getUTCDay();
  return w === 0 ? 7 : w;
}

/** Il lunedì della settimana del giorno: identifica la settimana */
export function lunediDi(g: Giorno): Giorno {
  const [a, m, d] = parti(g);
  const t = new Date(Date.UTC(a, m - 1, d - (giornoDellaSettimana(g) - 1)));
  return t.toISOString().slice(0, 10);
}

export function riepilogoDovuto(r: Pick<RegoleAvvisi, 'orarioRiepilogo' | 'giorniLavorativi'>, oggi: Giorno, minutiOra: number, ultimo: Giorno | null): boolean {
  if (ultimo === oggi) return false;
  if (!r.giorniLavorativi.includes(giornoDellaSettimana(oggi))) return false;
  return minutiOra >= (minutiDi(r.orarioRiepilogo) ?? 0);
}

/** Il settimanale va col primo riepilogo della settimana */
export const settimanaleDovuto = (oggi: Giorno, ultimo: Giorno | null): boolean => !ultimo || lunediDi(ultimo) < lunediDi(oggi);

export type GruppoRiepilogo = 'subito' | 'organizzare' | 'occhio';

export const GRUPPI: { chiave: GruppoRiepilogo; titolo: string; colore: string }[] = [
  { chiave: 'subito', titolo: 'Da sistemare subito', colore: '#b42318' },
  { chiave: 'organizzare', titolo: 'Da organizzare', colore: '#b54708' },
  { chiave: 'occhio', titolo: "Da tenere d'occhio", colore: '#475467' },
];

export const gruppoDi = (tono: TonoAvviso): GruppoRiepilogo => (tono === 'pericolo' ? 'subito' : tono === 'attenzione' ? 'organizzare' : 'occhio');
