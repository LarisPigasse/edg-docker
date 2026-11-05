// =============================================================================
// Costo di possesso di un mezzo (costo dei mezzi, tappa 1) — regole pure
// =============================================================================
// Quanto costa avere il mezzo anche fermo, in un numero al mese:
//   acquisto   (prezzo − valore finale) ÷ (anni × 12): svalutazione in linea
//              retta, senza interessi (è una stima, non una contabilità)
//   leasing    il canone mensile
//   noleggio   il canone mensile
// `dal`, facoltativo: il costo conta da quel giorno. Limiti dei valori in
// impostazioni/limiti.ts (LIMITI_POSSESSO).
// avvisoQuota: l'avviso morbido prima di salvare, se la quota è molto lontana
// da quella degli altri mezzi della stessa categoria (non blocca nulla).
// =============================================================================
import { isGiorno, type Giorno } from '../../regole';
import { LIMITI_POSSESSO } from '../impostazioni/limiti';
import type { TipoSoggetto } from '../valori';

export const MODI_POSSESSO = ['acquisto', 'leasing', 'noleggio'] as const;
export type ModoPossesso = (typeof MODI_POSSESSO)[number];

/** I tipi di soggetto che hanno un costo di possesso */
export const TIPI_CON_POSSESSO: readonly TipoSoggetto[] = ['veicolo', 'macchina', 'attrezzatura'];

/** Ciò che si scrive nella scheda */
export interface DatiPossesso {
  modo: ModoPossesso;
  prezzo?: number;
  anni?: number;
  valoreFinale?: number;
  canone?: number;
  dal?: Giorno | null;
}

/** Ciò che si salva: i dati del modo scelto e la quota mensile calcolata */
export interface Possesso extends DatiPossesso {
  mensile: number;
}

/** Quanto è lontana la quota dalla media della categoria per far scattare l'avviso (×4 o ÷4) */
export const FATTORE_AVVISO_QUOTA = 4;

/** Mezzi della stessa categoria, oltre a questo, perché la media dica qualcosa */
export const ALTRI_MINIMI_AVVISO = 2;

const alCentesimo = (n: number): number => Math.round(n * 100) / 100;
const alCentesimoEsatto = (n: number): boolean => Math.abs(Math.round(n * 100) - n * 100) < 1e-6;
const importo = (n: unknown, min: number, max: number): n is number =>
  typeof n === 'number' && Number.isFinite(n) && n > min && n <= max && alCentesimoEsatto(n);

/** Gli errori dei dati (vuoto = validi), con parole per l'utente */
export function erroriPossesso(d: Partial<DatiPossesso>): string[] {
  const errori: string[] = [];
  const { prezzo, anni, canone } = LIMITI_POSSESSO;
  if (!d.modo || !MODI_POSSESSO.includes(d.modo)) return ['Scegli come hai il mezzo: acquistato, in leasing o a noleggio'];
  if (d.modo === 'acquisto') {
    // mentre si compila: prima cosa manca, poi che cosa non va
    if (d.prezzo == null) errori.push("Scrivi il prezzo d'acquisto");
    else if (!importo(d.prezzo, prezzo.min, prezzo.max)) errori.push(`Il prezzo deve essere maggiore di ${prezzo.min} e al massimo ${euroInteri(prezzo.max)}, al centesimo`);
    if (d.anni == null) errori.push('Scegli gli anni di uso previsti');
    else if (!Number.isInteger(d.anni) || d.anni < anni.min || d.anni > anni.max) errori.push(`Gli anni di uso previsti vanno da ${anni.min} a ${anni.max}`);
    const v = d.valoreFinale ?? 0;
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || !alCentesimoEsatto(v)) errori.push('Il valore finale va da 0 €, al centesimo');
    else if (typeof d.prezzo === 'number' && v >= d.prezzo) errori.push('Il valore finale deve essere minore del prezzo');
  } else if (d.canone == null) {
    errori.push('Scrivi il canone mensile');
  } else if (!importo(d.canone, canone.min, canone.max)) {
    errori.push(`Il canone mensile deve essere maggiore di ${canone.min} e al massimo ${euroInteri(canone.max)}, al centesimo`);
  }
  if (d.dal != null && !isGiorno(d.dal)) errori.push('La data da cui conta va scritta come AAAA-MM-GG');
  return errori;
}

/** La quota mensile (dati già validi) */
export function quotaMensile(d: DatiPossesso): number {
  if (d.modo === 'acquisto') return alCentesimo((d.prezzo! - (d.valoreFinale ?? 0)) / (d.anni! * 12));
  return alCentesimo(d.canone!);
}

/** Ciò che si salva (dati già validi): solo i campi del modo scelto */
export function possessoDa(d: DatiPossesso): Possesso {
  const dal = d.dal ?? null;
  const base = d.modo === 'acquisto' ? { modo: d.modo, prezzo: d.prezzo, anni: d.anni, valoreFinale: d.valoreFinale ?? 0 } : { modo: d.modo, canone: d.canone };
  return { ...base, dal, mensile: quotaMensile(d) };
}

/** "1.492 €": interi con il punto delle migliaia sempre */
export const euroInteri = (n: number): string => `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} €`;

/**
 * L'avviso morbido: la quota è almeno 4 volte, o al massimo un quarto, la
 * media delle quote degli altri mezzi della categoria (servono almeno 2
 * altri). null = niente da dire.
 */
export function avvisoQuota(quota: number, altre: number[], categoria: string): string | null {
  const valide = altre.filter(q => q > 0);
  if (quota <= 0 || valide.length < ALTRI_MINIMI_AVVISO) return null;
  const media = valide.reduce((t, q) => t + q, 0) / valide.length;
  const rapporto = quota / media;
  const confronto = `la media di ${categoria} (${euroInteri(media)} al mese)`;
  if (rapporto >= FATTORE_AVVISO_QUOTA) return `È circa ${Math.round(rapporto)} volte ${confronto}: controlla i valori prima di salvare`;
  if (rapporto <= 1 / FATTORE_AVVISO_QUOTA) return `È meno di un quarto del${confronto}: controlla i valori prima di salvare`;
  return null;
}
