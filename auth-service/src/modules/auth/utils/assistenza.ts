// src/modules/auth/utils/assistenza.ts
// =============================================================================
// Regole pure dell'Accesso assistito (ADR085)
// =============================================================================
import type { AccessoAssistenzaCliente, ModoAssistenza, MotivoFine, StatoAssistenza } from '../types/assistenza.types';

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

/**
 * Perche' un account non si puo' scegliere per l'Assistenza (AA4), o null:
 * deve esistere, essere attivo e appartenere al tenant in cui si entra.
 */
export function erroreAccountAssistenza(
  account: { isActive: boolean; tenantId: number | null } | null,
  tenantId: number,
  nomeTenant: string
): string | null {
  if (!account) return 'Account non trovato';
  if (account.tenantId !== tenantId) return `L'account non appartiene al tenant «${nomeTenant}»`;
  if (!account.isActive) return "L'account non è attivo: non si può vedere la sua vista";
  return null;
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

/** Come si chiama il personale EDG per il cliente se l'account non ha nome e cognome */
export const PERSONALE_EDG = 'Personale EDG';

/** Accessi dell'assistenza mostrati al cliente (AA5): al massimo, e predefinito */
export const LIMITI_ACCESSI_CLIENTE = { predefiniti: 64, massimo: 64 } as const;

/**
 * Un accesso come lo vede il cliente (AA5): del personale EDG solo nome e
 * cognome, mai l'email (se non ci sono, "Personale EDG").
 */
export function accessoPerCliente(s: {
  uuid: string;
  modo: ModoAssistenza;
  motivo: string;
  startedAt: Date;
  expiresAt: Date;
  endedAt: Date | null;
  endReason: string | null;
  operatore?: { firstName?: string | null; lastName?: string | null } | null;
  perConto?: { email: string; firstName?: string | null; lastName?: string | null } | null;
}, adesso: Date = new Date()): AccessoAssistenzaCliente {
  const nomeEdg = [s.operatore?.firstName, s.operatore?.lastName].filter(v => v && v.trim()).join(' ').trim();
  return {
    uuid: s.uuid,
    modo: s.modo,
    stato: statoAssistenza({ endedAt: s.endedAt, endReason: s.endReason, expiresAt: new Date(s.expiresAt) }, adesso),
    motivo: s.motivo,
    operatore: nomeEdg || PERSONALE_EDG,
    perConto: s.perConto ? nomeAccount(s.perConto) : null,
    inizio: new Date(s.startedAt).toISOString(),
    scade: new Date(s.expiresAt).toISOString(),
    fine: s.endedAt ? new Date(s.endedAt).toISOString() : null,
  };
}

/** Nome leggibile di un account: nome e cognome, altrimenti l'email (ADR081) */
export function nomeAccount(account: { email: string; firstName?: string | null; lastName?: string | null }): string {
  const nome = [account.firstName, account.lastName].filter(v => v && v.trim()).join(' ').trim();
  return nome || account.email;
}
