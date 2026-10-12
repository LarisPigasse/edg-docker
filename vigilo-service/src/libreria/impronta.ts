// =============================================================================
// Libreria EDG — impronta del contenuto di ogni voce
// =============================================================================
// sha256 del JSON con le chiavi in ordine, SENZA la versione: se l'impronta
// cambia e la versione no, qualcuno ha cambiato il contenuto dimenticando di
// aumentarla. Lo controllano i test (versioni.json) e la sincronizzazione.
// L'impronta di un modello comprende l'elenco delle sue voci.
// =============================================================================
import { createHash } from 'crypto';
import type { Libreria, VoceCategoria, VoceControllo, VoceModello } from './tipi';

/** JSON stabile: chiavi ordinate, undefined omessi */
export function jsonStabile(valore: unknown): string {
  if (valore === null || typeof valore !== 'object') return JSON.stringify(valore);
  if (Array.isArray(valore)) return `[${valore.map(jsonStabile).join(',')}]`;
  const voci = Object.entries(valore as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${voci.map(([k, v]) => `${JSON.stringify(k)}:${jsonStabile(v)}`).join(',')}}`;
}

const sha256 = (testo: string): string => createHash('sha256').update(testo).digest('hex');

const senzaVersione = <T extends { versione: number }>(voce: T): Omit<T, 'versione'> => {
  const { versione: _versione, ...resto } = voce;
  return resto;
};

export const improntaCategoria = (c: VoceCategoria): string => sha256(jsonStabile(senzaVersione(c)));
export const improntaControllo = (c: VoceControllo): string => sha256(jsonStabile(senzaVersione(c)));

/** Il modello e le voci che porta (con la preselezione) */
export function improntaModello(modello: VoceModello, lib: Libreria): string {
  const voci = [
    ...lib.categorie.filter(c => modello.chiave in c.modelli).map(c => ['categoria', c.chiave, c.modelli[modello.chiave]]),
    ...lib.controlli.filter(c => modello.chiave in c.modelli).map(c => ['controllo', c.chiave, c.modelli[modello.chiave]]),
  ].sort((a, b) => (String(a[1]) < String(b[1]) ? -1 : 1));
  return sha256(jsonStabile({ ...senzaVersione(modello), voci }));
}

/** Versione e impronta di ogni voce, per chiave `tipo:chiave` (forma di versioni.json) */
export type Impronte = Record<string, { versione: number; impronta: string }>;

export function impronte(lib: Libreria): Impronte {
  const risultato: Impronte = {};
  for (const m of lib.modelli) risultato[`modello:${m.chiave}`] = { versione: m.versione, impronta: improntaModello(m, lib) };
  for (const c of lib.categorie) risultato[`categoria:${c.chiave}`] = { versione: c.versione, impronta: improntaCategoria(c) };
  for (const c of lib.controlli) risultato[`controllo:${c.chiave}`] = { versione: c.versione, impronta: improntaControllo(c) };
  return risultato;
}

/**
 * Confronta le impronte attuali con quelle registrate (versioni.json).
 * Errori: contenuto cambiato senza nuova versione, versione diminuita.
 * Da aggiornare: voci nuove o con versione aumentata (rigenerare il file).
 */
export function confrontaImpronte(attuali: Impronte, registrate: Impronte): { errori: string[]; daAggiornare: string[] } {
  const errori: string[] = [];
  const daAggiornare: string[] = [];
  for (const [chiave, a] of Object.entries(attuali)) {
    const r = registrate[chiave];
    if (!r) daAggiornare.push(`${chiave}: voce nuova`);
    else if (a.versione < r.versione) errori.push(`${chiave}: versione ${a.versione} minore di quella registrata (${r.versione})`);
    else if (a.versione === r.versione && a.impronta !== r.impronta)
      errori.push(`${chiave}: contenuto cambiato senza aumentare la versione (${a.versione})`);
    else if (a.versione > r.versione) daAggiornare.push(`${chiave}: versione ${r.versione} → ${a.versione}`);
  }
  for (const chiave of Object.keys(registrate)) {
    if (!attuali[chiave]) daAggiornare.push(`${chiave}: voce tolta dai file (verrà segnata come ritirata)`);
  }
  return { errori, daAggiornare };
}
