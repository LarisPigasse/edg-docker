// =============================================================================
// Aggiornamenti della libreria — regole pure (03-libreria-avvio 3.6, B10b)
// =============================================================================
// Per ogni voce copiata dalla libreria si confrontano tre valori di ogni campo:
//   fotografia (origine)  cio' che EDG aveva dato al momento della copia
//   mio                   il valore attuale del cliente
//   libreria              il valore della nuova versione
// e il campo risulta:
//   non cambiato    libreria = fotografia      non si mostra (EDG non l'ha
//                                              toccato: la scelta del cliente resta)
//   gia' uguale     mio = libreria             non si mostra
//   intatto         mio = fotografia           si propone il nuovo valore
//   personalizzato  mio ≠ fotografia           si mostrano i due valori
// Preselezione (decisa il 2026-10-29): intatto → libreria, personalizzato →
// il tuo. Una voce ritirata dalla libreria si segnala: il cliente la tiene o
// la disattiva, non si cancella mai niente.
// =============================================================================
import type { CampoDecisione, EsitoDecisione, Origine } from '../valori';

export type StatoCampo = 'intatto' | 'personalizzato';
export type Scelta = CampoDecisione['scelto'];
export type TipoProposta = 'aggiornamento' | 'ritiro';
export type SceltaRitiro = 'tieni' | 'disattiva';

export interface CampoProposto {
  campo: string;
  stato: StatoCampo;
  mio: unknown;
  libreria: unknown;
}

type Valori = Record<string, unknown>;

/** Copia con le chiavi in ordine: due JSON uguali danno lo stesso testo */
function ordinato(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(ordinato);
  if (v && typeof v === 'object') {
    return Object.fromEntries(
      Object.keys(v as Valori)
        .filter(k => (v as Valori)[k] !== undefined)
        .sort()
        .map(k => [k, ordinato((v as Valori)[k])])
    );
  }
  return v ?? null;
}

/** Uguaglianza di valore (null e assente sono la stessa cosa, l'ordine delle chiavi non conta) */
export const uguale = (a: unknown, b: unknown): boolean => JSON.stringify(ordinato(a)) === JSON.stringify(ordinato(b));

/** Elenco di chiavi come insieme: senza doppioni e in ordine, per confrontarlo */
export const insieme = (chiavi: readonly string[]): string[] => [...new Set(chiavi)].sort();

/**
 * Che cosa proporre per una voce del cliente, o null se niente.
 * Il ritiro vince su una nuova versione; si ripropone finche' il cliente non
 * decide (versioneIgnorata = versione ritirata) o se la voce e' gia' spenta.
 */
export function daProporre(
  voce: { versioneLibreria: number | null; versioneIgnorata: number | null; attiva: boolean },
  lib: { versione: number; ritirata: boolean }
): TipoProposta | null {
  if (lib.ritirata) return voce.attiva && voce.versioneIgnorata !== lib.versione ? 'ritiro' : null;
  return lib.versione > (voce.versioneLibreria ?? 0) ? 'aggiornamento' : null;
}

/** I campi da mostrare: cambiati dalla libreria e diversi dal valore del cliente */
export function confronta(campi: readonly string[], origine: Origine | null, mio: Valori, libreria: Valori): CampoProposto[] {
  return campi
    .filter(campo => !uguale(mio[campo], libreria[campo]) && !(origine && uguale(origine[campo], libreria[campo])))
    .map(campo => ({
      campo,
      // senza fotografia non si puo' sapere: prudenza, come personalizzato
      stato: origine && uguale(mio[campo], origine[campo]) ? 'intatto' : 'personalizzato',
      mio: mio[campo] ?? null,
      libreria: libreria[campo] ?? null,
    }));
}

/** La scelta proposta per un campo */
export const sceltaPredefinita = (c: Pick<CampoProposto, 'stato'>): Scelta => (c.stato === 'intatto' ? 'libreria' : 'mio');

/**
 * Le scelte del cliente completate con le predefinite, o l'errore da mostrare
 * (campo che non c'e' fra le differenze, valore non valido).
 */
export function scelteComplete(
  proposti: CampoProposto[],
  scelte: Record<string, unknown> = {}
): { campi: CampoDecisione[]; errore: string | null } {
  const nomi = new Set(proposti.map(p => p.campo));
  const estranei = Object.keys(scelte).filter(k => !nomi.has(k));
  if (estranei.length) return { campi: [], errore: `Campi senza differenze da decidere: ${estranei.join(', ')}` };
  const nonValide = Object.entries(scelte).filter(([, v]) => v !== 'mio' && v !== 'libreria');
  if (nonValide.length) return { campi: [], errore: `Scelta non valida per: ${nonValide.map(([k]) => k).join(', ')} (mio o libreria)` };
  return {
    campi: proposti.map(p => ({ campo: p.campo, mio: p.mio, libreria: p.libreria, scelto: (scelte[p.campo] as Scelta | undefined) ?? sceltaPredefinita(p) })),
    errore: null,
  };
}

/** Tutto della libreria = accettato, tutto mio = rifiutato, altrimenti parziale (senza differenze: accettato) */
export function esitoDi(campi: Pick<CampoDecisione, 'scelto'>[]): EsitoDecisione {
  if (campi.every(c => c.scelto === 'libreria')) return 'accettato';
  if (campi.every(c => c.scelto === 'mio')) return 'rifiutato';
  return 'parziale';
}

/** I valori da scrivere sulla voce: solo i campi scelti della libreria */
export const daApplicare = (campi: CampoDecisione[]): Valori =>
  Object.fromEntries(campi.filter(c => c.scelto === 'libreria').map(c => [c.campo, c.libreria]));

/** Il ritiro nel registro: tenere = rifiutato, disattivare = accettato */
export const decisioneRitiro = (scelta: SceltaRitiro): { esito: EsitoDecisione; campi: CampoDecisione[] } => ({
  esito: scelta === 'disattiva' ? 'accettato' : 'rifiutato',
  campi: [{ campo: 'ritirata', mio: false, libreria: true, scelto: scelta === 'disattiva' ? 'libreria' : 'mio' }],
});

/**
 * Le categorie di un controllo, come chiavi della libreria. Si confrontano
 * solo le categorie che il cliente ha (le altre non si possono aggiungere da
 * qui: si prendono con "Aggiungi dalla libreria").
 */
export const categorieComparabili = (chiavi: readonly string[] | null | undefined, delCliente: ReadonlySet<string>): string[] =>
  insieme((chiavi ?? []).filter(k => delCliente.has(k)));
