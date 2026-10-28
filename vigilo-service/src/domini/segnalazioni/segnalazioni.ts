// =============================================================================
// Segnalazioni dell'addetto (05-permessi 5.4, ADR068, B9c) — regole pure
// =============================================================================
// L'addetto segnala "fatto": nasce una registrazione di esecuzione positiva
// "da-confermare". Non chiude la scadenza e la lettura non va al contatore:
// lo fa l'ufficio confermando (correggendo i dati se serve), oppure la
// respinge con un motivo. Finché aspetta, chi l'ha mandata può ritirarla.
//   - una sola segnalazione in attesa per scadenza (indice unico parziale);
//   - dell'addetto contano solo i dati che può dare (lettura, documento):
//     importo, fornitore e riferimento li completa l'ufficio alla conferma;
//   - avvisi: all'ufficio "segnalazione:<id>", a chi l'ha mandata
//     "confermata:<id>" o "respinta:<id>". L'esito resta da leggere anche a
//     scadenza chiusa; la segnalazione si risolve quando si decide o si ritira.
// =============================================================================
import { conArticolo, type Giorno } from '../../regole';
import type { DatoRegistrazione, StatoRegistrazione } from '../valori';

export const LIMITI_SEGNALAZIONI = {
  /** Note dell'addetto */
  note: 1024,
  /** Motivo del rifiuto */
  motivo: 512,
} as const;

/** I dati che l'addetto può dare con la segnalazione: solo questi, se obbligatori, devono esserci (datiEsecuzione) */
export const DATI_ADDETTO: readonly DatoRegistrazione[] = ['lettura', 'allegato'];

/** Perché non si può ritirare (null = si può): solo chi l'ha mandata, finché aspetta */
export function erroreRitiro(r: { stato: StatoRegistrazione; creatoDa: number | null }, idAccount: number): string | null {
  if (r.stato !== 'da-confermare') return 'La segnalazione è già stata confermata o respinta';
  if (r.creatoDa !== idAccount) return 'Puoi ritirare solo le segnalazioni che hai mandato tu';
  return null;
}

/** Perché l'ufficio non può decidere (null = può) */
export const erroreDecisione = (r: { stato: StatoRegistrazione }): string | null =>
  r.stato === 'da-confermare' ? null : 'La segnalazione non è più da confermare';

// --- avvisi ---

export type EsitoSegnalazione = 'confermata' | 'respinta';

export const eventoSegnalazione = (idRegistrazione: number): string => `segnalazione:${idRegistrazione}`;
export const eventoEsito = (esito: EsitoSegnalazione, idRegistrazione: number): string => `${esito}:${idRegistrazione}`;

/** Di che genere è un evento: delle segnalazioni oppure null (gli eventi delle scadenze) */
export function genereEvento(evento: string): 'segnalazione' | 'esito' | null {
  const m = /^(segnalazione|confermata|respinta):\d+$/.exec(evento);
  if (!m) return null;
  return m[1] === 'segnalazione' ? 'segnalazione' : 'esito';
}

/**
 * Come iniziano gli stati degli avvisi delle segnalazioni: statoDelTesto li
 * cerca prima del separatore, perché il motivo di un rifiuto può contenere ": "
 */
export const INIZI_STATO = ['segnalata fatta ', 'segnalazione confermata', 'segnalazione respinta'] as const;

/** Lo stato nel testo dell'avviso all'ufficio: "segnalata fatta il 27 ott da Mario Rossi, da confermare" */
export function statoSegnalazione(eseguitaIl: Giorno, chi: string | null, oggi: Giorno): string {
  return `segnalata fatta ${conArticolo(eseguitaIl, oggi)}${chi ? ` da ${chi}` : ''}, da confermare`;
}

/** Lo stato nel testo dell'avviso dell'esito a chi l'ha mandata */
export function statoEsito(esito: EsitoSegnalazione, eseguitaIl: Giorno, motivo: string | null, oggi: Giorno): string {
  if (esito === 'confermata') return `segnalazione confermata, fatta ${conArticolo(eseguitaIl, oggi)}`;
  return `segnalazione respinta${motivo ? `: ${motivo}` : ''}`;
}
