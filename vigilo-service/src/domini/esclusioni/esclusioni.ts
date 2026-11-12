// =============================================================================
// Controlli non seguiti: regole pure (revisione 2026-11-11)
// =============================================================================
//   motivo        obbligatorio, ripulito, fra LIMITI.motivo.min e .max
//   nota          della ripresa, facoltativa, al massimo LIMITI.motivo.max
//   comeRiprendere che cosa succede alla scadenza quando si torna a seguire:
//                 si riapre quella chiusa con le sue date; se non c'è e il
//                 controllo è automatico ne nasce una nuova; niente se il
//                 soggetto è dismesso (ci pensa il ripristino) o il
//                 controllo è disattivato, o se una è già aperta.
// =============================================================================
import { ValidationError } from '../../core/utils/errors';

/** Lunghezze del motivo e della nota (caratteri); limiti fissi del database */
export const LIMITI_ESCLUSIONE = { motivo: { min: 2, max: 512 } } as const;

const ripulisci = (t: unknown): string => String(t ?? '').replace(/\s+/g, ' ').trim();

/** Il motivo per non seguire: obbligatorio (pura) */
export function motivoValido(motivo: unknown): string {
  const m = ripulisci(motivo);
  const { min, max } = LIMITI_ESCLUSIONE.motivo;
  if (m.length < min) throw new ValidationError('Scrivi il motivo per cui il controllo non si segue (es. "esente", "non ha il tachigrafo")');
  if (m.length > max) throw new ValidationError(`Il motivo è troppo lungo: al massimo ${max} caratteri`);
  return m;
}

/** La nota della ripresa: facoltativa; null se vuota (pura) */
export function notaValida(nota: unknown): string | null {
  const n = ripulisci(nota);
  if (n.length > LIMITI_ESCLUSIONE.motivo.max) throw new ValidationError(`La nota è troppo lunga: al massimo ${LIMITI_ESCLUSIONE.motivo.max} caratteri`);
  return n || null;
}

export type Ripresa = 'riapri' | 'genera' | 'niente';

/** Che cosa fare della scadenza quando si torna a seguire il controllo (pura) */
export function comeRiprendere(p: {
  soggettoDismesso: boolean;
  controlloAttivo: boolean;
  controlloAutomatico: boolean;
  /** C'è una scadenza chiusa perché il controllo non si seguiva */
  daRiaprire: boolean;
  /** C'è già una scadenza aperta per la coppia */
  giaAperta: boolean;
}): Ripresa {
  if (p.soggettoDismesso || !p.controlloAttivo || p.giaAperta) return 'niente';
  if (p.daRiaprire) return 'riapri';
  return p.controlloAutomatico ? 'genera' : 'niente';
}

/** "idSoggetto:idControllo", la chiave di una coppia */
export const coppia = (idSoggetto: number, idControllo: number): string => `${idSoggetto}:${idControllo}`;
