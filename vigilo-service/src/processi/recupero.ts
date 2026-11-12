// =============================================================================
// Recupero del ricalcolo notturno (regole pure)
// =============================================================================
// Il ricalcolo parte alle 00:16 (node-cron) e all'avvio del servizio. Se a
// quell'ora il servizio non gira (macchina sospesa, riavvio a cavallo della
// mezzanotte) node-cron non recupera l'esecuzione saltata: gli stati restano
// quelli del giorno prima. Per questo un giro periodico chiede qui se il
// ricalcolo di oggi manca: e' dovuto se l'ultimo completo non e' di oggi e
// l'ora prevista e' gia' passata (prima delle 00:16 lo fa il processo notturno).
// =============================================================================
import type { Giorno } from '../regole';

/** L'ora del ricalcolo notturno, in minuti dalla mezzanotte in Italia (00:16) */
export const ORARIO_RICALCOLO = 16;

/** L'espressione di node-cron per un orario in minuti dalla mezzanotte (pura) */
export const cronGiornaliero = (minuti: number): string => `${minuti % 60} ${Math.floor(minuti / 60)} * * *`;

/** Il ricalcolo di oggi manca ed e' gia' ora di farlo (pura) */
export const ricalcoloDovuto = (fattoIl: Giorno | null, oggi: Giorno, minuti: number, orario: number = ORARIO_RICALCOLO): boolean =>
  fattoIl !== oggi && minuti >= orario;
