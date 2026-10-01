// src/modules/auth/types/module.types.ts
// =============================================================================
// Gestione moduli (ADR047): catalogo e attivazioni per tenant
// =============================================================================
// Un modulo nasce nel codice (manifest nel frontend: chiave, menu, rotte,
// permessi) e il database lo accende. Qui stanno le costanti condivise da
// modelli, schemi di validazione, servizi e processo di scadenza: una sola
// fonte per stati e regole, nessuna stringa ripetuta in giro.
// =============================================================================

/** Formato delle chiavi stabili (moduli, prodotti, settori): minuscolo, cifre, trattini */
export const KEY_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/** Jolly del tenant di sistema: tutti i moduli (dato dal codice, mai salvato) */
export const ALL_MODULES = '*';

// -----------------------------------------------------------------------------
// Catalogo
// -----------------------------------------------------------------------------

export const MODULE_STATUSES = ['sviluppo', 'disponibile', 'dismesso'] as const;
export type ModuleStatus = (typeof MODULE_STATUSES)[number];

/** Durata predefinita della prova, in giorni */
export const DEFAULT_TRIAL_DAYS = 32;

export interface ModuleAttributes {
  id: number;
  key: string;
  name: string;
  description: string | null;
  product: string;
  dependencies: string[];
  status: ModuleStatus;
  trialDays: number;
  createdAt: Date;
  updatedAt: Date;
}

// -----------------------------------------------------------------------------
// Attivazioni (tabella tenant_modules)
// -----------------------------------------------------------------------------

export const ACTIVATION_STATUSES = ['prova', 'attivo', 'sospeso', 'scaduto'] as const;
export type ActivationStatus = (typeof ACTIVATION_STATUSES)[number];

/** Stati che danno accesso al modulo (se anche il periodo e' in corso) */
export const GRANTING_STATUSES: readonly ActivationStatus[] = ['prova', 'attivo'];

/** Giorni di conservazione dei dati dopo la scadenza, poi eliminazione automatica */
export const DATA_RETENTION_DAYS = 64;

/** Avvisi ad admin e root prima dell'eliminazione dei dati (giorni di anticipo) */
export const PURGE_WARNING_DAYS: readonly number[] = [8, 1];

export interface ActivationAttributes {
  id: number;
  tenantId: number;
  module: string;
  status: ActivationStatus;
  startsAt: Date;
  endsAt: Date | null;
  expiredAt: Date | null;
  config: Record<string, unknown> | null;
  notes: string | null;
  grantedBy: number | null;
  createdAt: Date;
  updatedAt: Date;
}
