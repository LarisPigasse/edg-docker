// Costruttori brevi per i test delle regole
import type { Cadenza, Preavvisi, Tolleranza } from '../../src/regole';

export const OGGI = '2026-10-08';

export const cadenza = (c: Partial<Cadenza>): Cadenza => ({
  tempo: null,
  uso: null,
  ancoraggio: 'scadenza',
  fineMese: false,
  prima: null,
  ...c,
});

export const preavvisi = (giorni: number[] = [32, 8, 1], uso: number[] = []): Preavvisi => ({ giorni, uso });
export const tolleranza = (giorni = 0, uso = 0): Tolleranza => ({ giorni, uso });
