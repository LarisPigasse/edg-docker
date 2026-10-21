// src/modules/auth/types/assistenza.types.ts
// =============================================================================
// Accesso assistito (ADR085, docs/piattaforma/accesso-assistito.md)
// =============================================================================

export const MODI_ASSISTENZA = ['preparazione', 'assistenza'] as const;
export type ModoAssistenza = (typeof MODI_ASSISTENZA)[number];

export const MOTIVI_FINE = ['uscita', 'scaduta', 'chiusa'] as const;
export type MotivoFine = (typeof MOTIVI_FINE)[number];

/** Stato calcolato di una sessione assistita */
export type StatoAssistenza = 'aperta' | MotivoFine;

/**
 * Campo `assistenza` del token assistito: le due identita' della sessione.
 * In Preparazione `accountId` del token e' l'operatore stesso; in Assistenza
 * (AA4) sara' l'utente di cui si vede la vista, e `perConto` lo nominera'.
 */
export interface AssistenzaClaim {
  id: number;
  modo: ModoAssistenza;
  operatore: { id: number; email: string; nome: string };
  tenant: { id: number; nome: string };
  perConto?: { id: number; email: string } | null;
  /** Scadenza in ISO 8601 */
  scade: string;
}

/** Sessione assistita come la restituiscono le API */
export interface AssistenzaView {
  id: number;
  uuid: string;
  modo: ModoAssistenza;
  stato: StatoAssistenza;
  motivo: string;
  operatore: { id: number; email: string; nome: string } | null;
  tenant: { id: number; nome: string } | null;
  inizio: string;
  scade: string;
  fine: string | null;
  chiusaDa: number | null;
}
