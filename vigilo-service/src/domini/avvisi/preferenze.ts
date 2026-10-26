// =============================================================================
// Preferenze degli avvisi di un utente (04-avvisi 4.4, B8d-1) — regole pure
// =============================================================================
//   preferenzeEffettive  la riga salvata letta con sicurezza: i valori mancanti
//                        o non validi prendono il predefinito, le sedi che non
//                        esistono più si ignorano
//   erroriPreferenze     cosa non va in una richiesta, con parole per l'utente
//   passaFiltri          l'avviso di questo soggetto interessa all'utente?
// I filtri valgono per chi riceve come "ufficio": ciò che riguarda la persona
// direttamente (referente, assegnatario, interessato) arriva sempre. Un avviso
// senza soggetto (promemoria) e un soggetto senza sede passano sempre: meglio
// un avviso in più che uno perso.
// =============================================================================
import { CANALI, FREQUENZE_AVVISI, TIPI_SOGGETTO, type Canale, type FrequenzaAvvisi, type TipoSoggetto } from '../valori';
import { PREFERENZE_INIZIALI, type PreferenzeEmail } from './invio';

export interface FiltriAvvisi {
  /** Tipi di soggetto, nell'ordine di TIPI_SOGGETTO; vuoto = tutti */
  tipi: TipoSoggetto[];
  /** Id delle sedi (soggetti di tipo sede), crescenti; vuoto = tutte */
  sedi: number[];
}

export interface Preferenze extends PreferenzeEmail {
  filtri: FiltriAvvisi;
}

export const FILTRI_TUTTO: FiltriAvvisi = { tipi: [], sedi: [] };

export const PREFERENZE_PREDEFINITE: Preferenze = { ...PREFERENZE_INIZIALI, filtri: FILTRI_TUTTO };

export const LIMITI_PREFERENZE = {
  /** Sedi che si possono scegliere nel filtro */
  sedi: 64,
} as const;

const unici = <T>(v: T[]): T[] => [...new Set(v)];
const eTipo = (t: unknown): t is TipoSoggetto => TIPI_SOGGETTO.includes(t as TipoSoggetto);

/** Filtri puliti: tipi noti (tutti scelti = nessun filtro), sedi intere ed esistenti */
export function filtriEffettivi(f: unknown, sediEsistenti?: ReadonlySet<number>): FiltriAvvisi {
  const o = (f && typeof f === 'object' ? f : {}) as Record<string, unknown>;
  const tipi = Array.isArray(o.tipi) ? unici(o.tipi.filter(eTipo)) : [];
  const sedi = Array.isArray(o.sedi)
    ? unici(o.sedi.filter((s): s is number => Number.isInteger(s) && (!sediEsistenti || sediEsistenti.has(s as number))))
    : [];
  return {
    tipi: tipi.length === TIPI_SOGGETTO.length ? [] : TIPI_SOGGETTO.filter(t => tipi.includes(t)),
    sedi: sedi.sort((a, b) => a - b).slice(0, LIMITI_PREFERENZE.sedi),
  };
}

/** Le preferenze da usare: la riga salvata se valida, altrimenti il predefinito di ciascun valore */
export function preferenzeEffettive(
  riga: { frequenza?: unknown; urgentiSubito?: unknown; canali?: unknown; filtri?: unknown } | null | undefined,
  sediEsistenti?: ReadonlySet<number>
): Preferenze {
  if (!riga) return { ...PREFERENZE_PREDEFINITE, filtri: { tipi: [], sedi: [] } };
  const canali = Array.isArray(riga.canali) ? unici(riga.canali.filter((c): c is Canale => CANALI.includes(c as Canale))) : null;
  return {
    frequenza: FREQUENZE_AVVISI.includes(riga.frequenza as FrequenzaAvvisi) ? (riga.frequenza as FrequenzaAvvisi) : PREFERENZE_INIZIALI.frequenza,
    urgentiSubito: typeof riga.urgentiSubito === 'boolean' ? riga.urgentiSubito : PREFERENZE_INIZIALI.urgentiSubito,
    canali: canali ?? [...PREFERENZE_INIZIALI.canali],
    filtri: filtriEffettivi(riga.filtri, sediEsistenti),
  };
}

/** Gli errori di una richiesta di modifica (vuoto = valida), con parole per l'utente */
export function erroriPreferenze(p: { frequenza?: unknown; urgentiSubito?: unknown; filtri?: { tipi?: unknown; sedi?: unknown } }): string[] {
  const errori: string[] = [];
  if (p.frequenza !== undefined && !FREQUENZE_AVVISI.includes(p.frequenza as FrequenzaAvvisi)) errori.push('La frequenza delle email non è valida');
  if (p.urgentiSubito !== undefined && typeof p.urgentiSubito !== 'boolean') errori.push('Le urgenti subito vanno indicate con sì o no');
  const f = p.filtri;
  if (f?.tipi !== undefined && (!Array.isArray(f.tipi) || !f.tipi.every(eTipo))) errori.push('Uno dei tipi di soggetto non è valido');
  if (f?.sedi !== undefined) {
    if (!Array.isArray(f.sedi)) errori.push('Le sedi vanno indicate in un elenco');
    else if (unici(f.sedi).length > LIMITI_PREFERENZE.sedi) errori.push(`Si possono scegliere al massimo ${LIMITI_PREFERENZE.sedi} sedi`);
  }
  return errori;
}

/** Il soggetto di un avviso come serve ai filtri; null = promemoria senza soggetto */
export interface SoggettoFiltrabile {
  idSoggetto: number;
  tipo: TipoSoggetto;
  idSede: number | null;
}

/** L'avviso di questo soggetto passa i filtri? */
export function passaFiltri(f: FiltriAvvisi, s: SoggettoFiltrabile | null): boolean {
  if (!s) return true;
  if (f.tipi.length && !f.tipi.includes(s.tipo)) return false;
  if (!f.sedi.length) return true;
  // una sede "appartiene" a se stessa; chi non ha sede passa
  const sede = s.tipo === 'sede' ? s.idSoggetto : s.idSede;
  return sede == null || f.sedi.includes(sede);
}
