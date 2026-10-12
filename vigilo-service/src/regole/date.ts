// =============================================================================
// Date "di calendario" (giorno, senza ora) — regole di Vigilo
// =============================================================================
// Le scadenze sono giorni, non istanti: si rappresentano come stringhe ISO
// 'AAAA-MM-GG' e si calcolano in UTC, cosi' fusi orari e ora legale non
// spostano mai un giorno. Nessun accesso al database, nessun Date.now().
// =============================================================================

export type Giorno = string; // 'AAAA-MM-GG'

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Da 'AAAA-MM-GG' a [anno, mese 1-12, giorno]; errore se non valida */
export function parti(g: Giorno): [number, number, number] {
  const m = ISO.exec(g);
  if (!m) throw new Error(`Data non valida: ${g}`);
  const [a, mm, gg] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (mm < 1 || mm > 12 || gg < 1 || gg > giorniNelMese(a, mm)) throw new Error(`Data non valida: ${g}`);
  return [a, mm, gg];
}

const pad = (n: number, w = 2) => String(n).padStart(w, '0');

export const giorno = (a: number, m: number, g: number): Giorno => `${pad(a, 4)}-${pad(m)}-${pad(g)}`;

export const isGiorno = (g: unknown): g is Giorno => {
  if (typeof g !== 'string') return false;
  try {
    parti(g);
    return true;
  } catch {
    return false;
  }
};

export function giorniNelMese(a: number, m: number): number {
  return new Date(Date.UTC(a, m, 0)).getUTCDate();
}

const aUtc = (g: Giorno): number => {
  const [a, m, d] = parti(g);
  return Date.UTC(a, m - 1, d);
};

const daUtc = (ms: number): Giorno => {
  const d = new Date(ms);
  return giorno(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
};

const GIORNO_MS = 24 * 60 * 60 * 1000;

export const aggiungiGiorni = (g: Giorno, n: number): Giorno => daUtc(aUtc(g) + n * GIORNO_MS);

/** Giorni da `da` ad `a` (positivo se `a` e' dopo) */
export const differenzaGiorni = (da: Giorno, a: Giorno): number => Math.round((aUtc(a) - aUtc(da)) / GIORNO_MS);

/**
 * Aggiunge mesi tenendo il giorno, o l'ultimo del mese se non esiste
 * (31 gen + 1 mese = 28/29 feb). `ancora` e' il giorno del mese da
 * ripristinare quando possibile: una serie partita il 31 resta sul 31
 * (o sull'ultimo giorno) invece di scivolare al 28.
 */
export function aggiungiMesi(g: Giorno, n: number, ancora?: number): Giorno {
  const [a, m, d] = parti(g);
  const indice = a * 12 + (m - 1) + n;
  const na = Math.floor(indice / 12);
  const nm = (indice % 12) + 1;
  const voluto = ancora ?? d;
  return giorno(na, nm, Math.min(voluto, giorniNelMese(na, nm)));
}

export const fineMese = (g: Giorno): Giorno => {
  const [a, m] = parti(g);
  return giorno(a, m, giorniNelMese(a, m));
};

export const confronta = (x: Giorno, y: Giorno): number => (x < y ? -1 : x > y ? 1 : 0);
export const minimo = (...gg: (Giorno | null | undefined)[]): Giorno | null =>
  gg.filter((g): g is Giorno => !!g).sort(confronta)[0] ?? null;
