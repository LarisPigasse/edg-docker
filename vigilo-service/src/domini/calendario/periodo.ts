// =============================================================================
// Calendario — regole pure del periodo e del giorno di una scadenza
// =============================================================================
// Il calendario mostra le scadenze APERTE nel giorno in cui "arrivano":
// urgenzaIl, cioe' la prima fra la data e la data stimata dall'uso. Se arriva
// prima la stima (o c'e' solo quella) la voce e' "stimata".
// =============================================================================
import { differenzaGiorni, type Giorno } from '../../regole';

/** Un mese a schermo occupa 42 giorni: 64 bastano con margine */
export const GIORNI_MASSIMI = 64;
/** Voci restituite al massimo per un periodo (oltre: troncato) */
export const VOCI_MASSIME = 1024;

const valido = (g: string) => /^\d{4}-\d{2}-\d{2}$/.test(g) && new Date(`${g}T00:00:00Z`).toISOString().slice(0, 10) === g;

/** Un messaggio se il periodo non va bene, altrimenti null */
export function verificaPeriodo(dal: string, al: string): string | null {
  if (!valido(dal) || !valido(al)) return 'Date non valide';
  if (al < dal) return 'La data finale viene prima di quella iniziale';
  if (differenzaGiorni(dal, al) + 1 > GIORNI_MASSIMI) return `Il calendario mostra al massimo ${GIORNI_MASSIMI} giorni alla volta`;
  return null;
}

/** Il giorno in cui la scadenza compare nel calendario, e se e' una stima; null = senza data */
export function giornoDelCalendario(s: { scadeIl?: Giorno | null; stimataIl?: Giorno | null; urgenzaIl?: Giorno | null }) {
  const giorno = s.urgenzaIl ?? s.scadeIl ?? s.stimataIl ?? null;
  if (!giorno) return null;
  return { giorno, stimata: giorno !== (s.scadeIl ?? null) };
}
