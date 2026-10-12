// =============================================================================
// Contatori: uso medio, data stimata, letture anomale (02-modello-dati, contatori)
// =============================================================================
import { aggiungiGiorni, confronta, differenzaGiorni, type Giorno } from './date';

export interface Lettura {
  valore: number;
  lettoIl: Giorno;
}

/** Finestra in cui si calcola l'uso medio e minimo di giorni perche' abbia senso */
export const FINESTRA_USO_GIORNI = 128;
export const MINIMO_GIORNI_USO = 8;

/**
 * Uso medio giornaliero dalle letture degli ultimi FINESTRA_USO_GIORNI giorni
 * (prima e ultima lettura valide della finestra). null se non c'e' abbastanza
 * storia. Le letture anomale (minori della precedente) si ignorano.
 */
export function usoGiornaliero(letture: Lettura[], oggi: Giorno): number | null {
  const valide = letture
    .filter(l => confronta(l.lettoIl, oggi) <= 0 && differenzaGiorni(l.lettoIl, oggi) <= FINESTRA_USO_GIORNI)
    .sort((a, b) => confronta(a.lettoIl, b.lettoIl));
  const crescenti: Lettura[] = [];
  for (const l of valide) {
    if (crescenti.length === 0 || l.valore >= crescenti[crescenti.length - 1].valore) crescenti.push(l);
  }
  if (crescenti.length < 2) return null;
  const prima = crescenti[0];
  const ultima = crescenti[crescenti.length - 1];
  const giorni = differenzaGiorni(prima.lettoIl, ultima.lettoIl);
  if (giorni < MINIMO_GIORNI_USO) return null;
  const uso = (ultima.valore - prima.valore) / giorni;
  return uso > 0 ? uso : null;
}

/** Giorno in cui, a questo ritmo, il contatore raggiunge la soglia (oggi se gia' raggiunta) */
export function dataStimata(soglia: number, valore: number, uso: number | null, oggi: Giorno): Giorno | null {
  if (valore >= soglia) return oggi;
  if (!uso || uso <= 0) return null;
  return aggiungiGiorni(oggi, Math.ceil((soglia - valore) / uso));
}

/**
 * Una nuova lettura e' anomala se e' minore di una lettura precedente (per
 * data) o maggiore di una successiva: si salva lo stesso, ma si segnala.
 */
export function letturaAnomala(nuova: Lettura, esistenti: Lettura[]): boolean {
  return esistenti.some(
    l =>
      (confronta(l.lettoIl, nuova.lettoIl) <= 0 && l.valore > nuova.valore) ||
      (confronta(l.lettoIl, nuova.lettoIl) > 0 && l.valore < nuova.valore)
  );
}
