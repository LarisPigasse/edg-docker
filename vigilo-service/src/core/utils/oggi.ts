// =============================================================================
// Il giorno di oggi in Italia
// =============================================================================
// Le regole non leggono mai l'orologio (ricevono `oggi`): lo calcola qui il
// servizio, nel fuso di Roma, cosi' a mezzanotte e un minuto e' gia' domani
// anche se il server e' in UTC.
// =============================================================================
import type { Giorno } from '../../regole';

const FORMATO = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' });

/** 'AAAA-MM-GG' del giorno in Italia (adesso o all'istante dato) */
export const oggiInItalia = (istante: Date = new Date()): Giorno => FORMATO.format(istante);
