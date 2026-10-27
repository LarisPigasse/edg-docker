// =============================================================================
// Le persone di un soggetto come destinatari degli avvisi
// =============================================================================
// Una sola lettura per la generazione degli avvisi e per l'anteprima
// dell'editor dei destinatari (B8d-3): account collegato, altrimenti l'email
// nei dati della persona; assegnazioni valide oggi.
// =============================================================================
import type { Giorno } from '../../regole';
import type { Assegnazione, Soggetto } from '../modelli';
import type { PersonaAvvisabile, PersonaNominata } from './destinatari';

export const personaDi = (s: Soggetto | null | undefined): PersonaAvvisabile | null =>
  s ? { idAccount: s.idAccount ?? null, email: typeof s.dati?.email === 'string' ? (s.dati.email as string) : null } : null;

export const personaNominata = (s: Soggetto | null | undefined): PersonaNominata | null => {
  const p = personaDi(s);
  return p && s ? { ...p, nome: s.nome } : null;
};

/** Le assegnazioni in corso oggi */
export const inCorso = (a: Assegnazione, oggi: Giorno): boolean => a.dal <= oggi && (!a.al || a.al >= oggi);
