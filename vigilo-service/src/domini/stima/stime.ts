// =============================================================================
// Stime salvate — regole pure (2026-11-18, fase 3)
// =============================================================================
// Lo scostamento fra il costo reale (scritto dopo il servizio) e la stima, in
// euro e in percentuale sulla stima: positivo = è costato più del previsto. E
// la descrizione di una stima salvata senza: "Trasporto di 512 km", "Lavoro di
// 16 ore".
// =============================================================================
import type { TipoServizio } from './calcolo';

/** Arrotondamento simmetrico: i mezzi si allontanano dallo zero, per eccessi e risparmi allo stesso modo */
const arrotonda = (n: number, decimali: number) => {
  const f = 10 ** decimali;
  return (Math.sign(n) * Math.round(Math.abs(n) * f)) / f;
};

/** Scostamento reale − stimato; null senza costo reale; la percentuale è null se la stima è zero (pura) */
export function scostamento(stimato: number, reale: number | null | undefined) {
  if (reale === null || reale === undefined) return null;
  const euro = arrotonda(reale - stimato, 2);
  return { euro, percentuale: stimato > 0 ? arrotonda((euro / stimato) * 100, 1) : null };
}

/**
 * Il margine di un servizio (2026-11-23): prezzo applicato − costo, dove il
 * costo è quello reale se c'è, altrimenti la stima (e `base` lo dice). In
 * euro e in percentuale sul prezzo; null senza prezzo; la percentuale è null
 * se il prezzo è zero (pura)
 */
export function margine(prezzo: number | null | undefined, stimato: number, reale: number | null | undefined) {
  if (prezzo === null || prezzo === undefined) return null;
  const base = reale === null || reale === undefined ? 'stimato' : 'reale';
  const costo = base === 'reale' ? (reale as number) : stimato;
  const euro = arrotonda(prezzo - costo, 2);
  return { euro, percentuale: prezzo > 0 ? arrotonda((euro / prezzo) * 100, 1) : null, base } as const;
}

/** La descrizione scritta, o una di riserva dai dati (pura) */
export function descrizioneDi(scritta: string | null | undefined, tipo: TipoServizio, km?: number, oreLavoro?: number): string {
  const t = scritta?.trim();
  if (t) return t.slice(0, 128);
  // sempre il punto delle migliaia: l'italiano di Intl non lo mette sotto le 10.000
  const n = (x: number) => x.toLocaleString('it-IT', { useGrouping: 'always' } as unknown as Intl.NumberFormatOptions);
  return tipo === 'km' ? `Trasporto di ${n(km ?? 0)} km` : `Lavoro di ${n(oreLavoro ?? 0)} ${oreLavoro === 1 ? 'ora' : 'ore'}`;
}
