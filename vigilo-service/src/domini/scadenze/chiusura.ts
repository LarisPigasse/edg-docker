// =============================================================================
// Chi ha chiuso una scadenza (revisione 2026-11-10, regola pura)
// =============================================================================
// Rinnovata, completata o a fine ricorrenza: la chiude una registrazione,
// l'ultima che non sia negativa. Ha chiuso chi l'ha confermata (segnalazione
// dell'addetto) o chi l'ha scritta; il rinnovo tacito è automatico.
// Soggetto dismesso, controllo disattivato o non più seguito per il
// soggetto: la chiude un'azione
// dell'ufficio, quindi chi ha modificato la scadenza per ultimo. Non si usa
// modificatoDa per tutto: i processi non lo aggiornano, e un rinnovo tacito
// risulterebbe fatto dall'ultima persona che l'aveva toccata.
// =============================================================================
import type { MotivoChiusura, TipoRegistrazione } from '../valori';

export interface RegistrazioneChiusura {
  tipo: TipoRegistrazione;
  esito: string | null;
  creatoDa: number | null;
  confermataDa: number | null;
}

export interface AutoreChiusura {
  /** L'account di chi ha chiuso; null se automatica o non noto */
  account: number | null;
  automatica: boolean;
}

const PER_REGISTRAZIONE: readonly MotivoChiusura[] = ['rinnovata', 'completata', 'fine-ricorrenza'];

/** Chi ha chiuso, date le registrazioni confermate della scadenza dalla più recente (pura) */
export function autoreChiusura(
  s: { motivoChiusura: MotivoChiusura | null; modificatoDa: number | null },
  registrazioni: readonly RegistrazioneChiusura[]
): AutoreChiusura {
  if (s.motivoChiusura && !PER_REGISTRAZIONE.includes(s.motivoChiusura)) return { account: s.modificatoDa, automatica: false };
  const r = registrazioni.find(x => x.tipo !== 'rinvio' && x.esito !== 'negativo');
  if (!r) return { account: null, automatica: false };
  if (r.tipo === 'rinnovo-tacito') return { account: null, automatica: true };
  // un'esecuzione senza autore (importata) non è automatica: è solo senza nome
  return { account: r.confermataDa ?? r.creatoDa, automatica: false };
}
