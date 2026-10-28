// =============================================================================
// Ambito dell'utente (05-permessi 5.4, B9b) — regole pure
// =============================================================================
// Chi ha read, write o config vede tutto il tenant. L'addetto (solo
// vigilo.own) vede la sua persona (il soggetto persona collegato al suo
// account) e i soggetti che ha assegnati oggi; senza persona collegata, niente.
// Fuori dall'ambito una risorsa è "non trovata" (404), come quelle di un altro
// tenant: non si rivela nemmeno che esiste.
// =============================================================================
import type { Giorno } from '../../regole';

export type Ambito =
  | { tutto: true }
  | {
      tutto: false;
      /** La persona collegata all'account; null = profilo non collegato */
      idPersona: number | null;
      /** La persona e i soggetti assegnati oggi */
      idSoggetti: number[];
    };

export const TUTTO: Ambito = { tutto: true };

export interface AssegnazioneAmbito {
  idSoggetto: number;
  dal: Giorno;
  al: Giorno | null;
}

/** L'ambito dell'addetto: la sua persona e ciò che ha assegnato oggi */
export function ambitoAddetto(idPersona: number | null, assegnazioni: AssegnazioneAmbito[], oggi: Giorno): Ambito {
  if (idPersona == null) return { tutto: false, idPersona: null, idSoggetti: [] };
  const assegnati = assegnazioni.filter(a => a.dal <= oggi && (!a.al || a.al >= oggi)).map(a => a.idSoggetto);
  return { tutto: false, idPersona, idSoggetti: [...new Set([idPersona, ...assegnati])].sort((a, b) => a - b) };
}

/** Il soggetto è nell'ambito? (una risorsa senza soggetto, come un promemoria, è dell'ufficio) */
export const nellAmbito = (a: Ambito, idSoggetto: number | null | undefined): boolean => a.tutto || (idSoggetto != null && a.idSoggetti.includes(idSoggetto));
