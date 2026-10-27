// =============================================================================
// Recapiti email senza account: "Non ricevere più questi avvisi" (B8d-4) — regole pure
// =============================================================================
// Chi riceve gli avvisi solo per email (indirizzi aggiuntivi, persone senza
// account) ha in fondo a ogni email un collegamento con un codice casuale:
// niente dati personali nell'indirizzo, niente segreti da custodire. Il
// codice vale per un tenant e un indirizzo; la pagina mostra l'email
// mascherata.
// =============================================================================
import { randomBytes } from 'crypto';

export const LIMITI_RECAPITI = {
  /** Byte casuali del codice (in base64url diventano 43 caratteri) */
  byteCodice: 32,
} as const;

const LUNGHEZZA_CODICE = Math.ceil((LIMITI_RECAPITI.byteCodice * 4) / 3);

/** Il formato del codice: base64url della lunghezza giusta */
export const FORMATO_CODICE = new RegExp(`^[A-Za-z0-9_-]{${LUNGHEZZA_CODICE}}$`);

export const nuovoCodice = (): string => randomBytes(LIMITI_RECAPITI.byteCodice).toString('base64url');

export const codiceValido = (c: unknown): c is string => typeof c === 'string' && FORMATO_CODICE.test(c);

/** L'indirizzo come si salva e si confronta */
export const emailPulita = (e: string): string => e.trim().toLowerCase();

/** Chiave di un recapito: tenant e indirizzo */
export const chiaveRecapito = (idTenant: number, email: string): string => `${idTenant}:${emailPulita(email)}`;

/** "ma•••@example.com": riconoscibile da chi lo possiede, non leggibile da altri */
export function mascheraEmail(email: string): string {
  const e = emailPulita(email);
  const at = e.lastIndexOf('@');
  if (at < 1) return '•••';
  const locale = e.slice(0, at);
  return `${locale.slice(0, locale.length > 2 ? 2 : 1)}•••${e.slice(at)}`;
}
