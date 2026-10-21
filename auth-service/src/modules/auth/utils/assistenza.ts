// src/modules/auth/utils/assistenza.ts
// =============================================================================
// Regole pure dell'Accesso assistito (ADR085)
// =============================================================================
import type { MotivoFine, StatoAssistenza } from '../types/assistenza.types';

/** Durata fissa di una sessione assistita, senza proroga (ADR077) */
export const DURATA_ASSISTENZA_MINUTI = 64;

/** Validita' del codice monouso che porta da pro-frontend ad app-frontend */
export const VALIDITA_CODICE_SECONDI = 64;

/** Ruolo di cui la Preparazione prende i permessi (decisione 1 di ADR085) */
export const RUOLO_PREPARAZIONE = 'admin';

/**
 * Permessi del token in Preparazione: quelli del ruolo admin limitati ai
 * moduli in vigore nel tenant del cliente. Mai `sistema.*` ne' il jolly `*`;
 * un permesso negato (`!vigilo.costi`) resta se il suo modulo e' in vigore.
 */
export function permessiPreparazione(permessiAdmin: string[], moduliTenant: string[]): string[] {
  const moduli = new Set(moduliTenant.filter(m => m !== '*'));
  const esito = permessiAdmin.filter(p => {
    const nome = p.startsWith('!') ? p.slice(1) : p;
    if (nome === '*' || !nome.includes('.')) return false;
    const modulo = nome.split('.')[0];
    return modulo !== 'sistema' && moduli.has(modulo);
  });
  return [...new Set(esito)].sort();
}

/** Stato di una sessione: chiusa per un motivo, scaduta, oppure aperta */
export function statoAssistenza(
  sessione: { endedAt: Date | null; endReason: string | null; expiresAt: Date },
  adesso: Date = new Date()
): StatoAssistenza {
  if (sessione.endedAt) return (sessione.endReason as MotivoFine | null) ?? 'chiusa';
  return sessione.expiresAt.getTime() <= adesso.getTime() ? 'scaduta' : 'aperta';
}

/** Secondi che restano prima della scadenza (mai negativi) */
export function secondiRimasti(scade: Date, adesso: Date = new Date()): number {
  return Math.max(0, Math.floor((scade.getTime() - adesso.getTime()) / 1000));
}

/** Nome leggibile di un account: nome e cognome, altrimenti l'email (ADR081) */
export function nomeAccount(account: { email: string; firstName?: string | null; lastName?: string | null }): string {
  const nome = [account.firstName, account.lastName].filter(v => v && v.trim()).join(' ').trim();
  return nome || account.email;
}
