// src/modules/auth/services/moduleRules.ts
// =============================================================================
// Regole pure della gestione moduli (ADR047)
// =============================================================================
// Nessun accesso al database: solo funzioni deterministiche, usate da
// ModuleService (JWT, API) e dal processo di scadenza. Tenerle qui separate
// rende le regole leggibili in un colpo d'occhio e facili da verificare.
// =============================================================================
import {
  ALL_MODULES,
  CUSTOMER_MODULE_STATUS,
  DATA_RETENTION_DAYS,
  GRANTING_STATUSES,
  type ActivationStatus,
  type HomeStatus,
} from '../types/module.types';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Aggiunge (o toglie, se negativo) un numero di giorni a una data */
export const addDays = (date: Date, days: number): Date => new Date(date.getTime() + days * DAY_MS);

/** Il minimo indispensabile di un'attivazione per decidere se e' in vigore */
export interface ActivationWindow {
  status: ActivationStatus | string;
  startsAt: Date | string;
  endsAt: Date | string | null;
}

/**
 * Un'attivazione da' accesso se e' in prova o attiva e il periodo e' in corso:
 * startsAt <= adesso < endsAt (endsAt assente = senza scadenza).
 */
export function isActivationInForce(a: ActivationWindow, now: Date = new Date()): boolean {
  if (!GRANTING_STATUSES.includes(a.status as ActivationStatus)) return false;
  if (new Date(a.startsAt).getTime() > now.getTime()) return false;
  return a.endsAt === null || new Date(a.endsAt).getTime() > now.getTime();
}

/**
 * Un'attivazione e' finita (da portare a 'scaduto') se era in prova o attiva
 * e la data di fine e' passata.
 */
export function hasActivationEnded(a: ActivationWindow, now: Date = new Date()): boolean {
  return (
    GRANTING_STATUSES.includes(a.status as ActivationStatus) &&
    a.endsAt !== null &&
    new Date(a.endsAt).getTime() <= now.getTime()
  );
}

/**
 * Tiene solo i moduli con tutte le dipendenze soddisfatte, anche a catena
 * (se cade 'spedizioni' cade 'tracking', e cosi' via). Ripete finche' l'insieme
 * non cambia piu'. I cicli fra dipendenze non devono esistere: li rifiuta la
 * validazione del catalogo; se ci fossero, resterebbero solo a gruppo completo.
 *
 * @param candidates chiave -> dipendenze (le chiavi richieste)
 * @returns chiavi sopravvissute, in ordine alfabetico
 */
export function resolveDependencies(candidates: Map<string, readonly string[]>): string[] {
  const kept = new Set(candidates.keys());
  let changed = true;
  while (changed) {
    changed = false;
    for (const key of [...kept]) {
      const deps = candidates.get(key) ?? [];
      if (!deps.every(d => kept.has(d))) {
        kept.delete(key);
        changed = true;
      }
    }
  }
  return [...kept].sort();
}

/** Data dopo la quale i dati di un modulo scaduto vengono eliminati */
export const dataPurgeDate = (expiredAt: Date | string): Date => addDays(new Date(expiredAt), DATA_RETENTION_DAYS);

/**
 * Cerca un ciclo fra dipendenze che parte da `start` e ci ritorna
 * (es. a -> b -> a). Restituisce il percorso del ciclo, o null se non c'e'.
 *
 * @param graph chiave -> dipendenze dirette (gia' aggiornato con la modifica da verificare)
 */
export function findDependencyCycle(graph: Map<string, readonly string[]>, start: string): string[] | null {
  const visited = new Set<string>();
  const walk = (key: string, path: string[]): string[] | null => {
    for (const dep of graph.get(key) ?? []) {
      if (dep === start) return [...path, dep];
      if (visited.has(dep)) continue;
      visited.add(dep);
      const found = walk(dep, [...path, dep]);
      if (found) return found;
    }
    return null;
  };
  return walk(start, [start]);
}

// -----------------------------------------------------------------------------
// Home dell'utente (fase 4, ADR056)
// -----------------------------------------------------------------------------

/**
 * Il ruolo ha almeno un permesso del modulo? ('*', '<chiave>.*' o
 * '<chiave>.<azione>'; '!<chiave>.*' lo nega). Chi non ne ha nessuno non vede
 * il modulo nella home: non potrebbe farci nulla.
 */
export function hasAnyModulePermission(permissions: readonly string[], key: string): boolean {
  if (permissions.includes(`!${key}.*`)) return false;
  return permissions.includes(ALL_MODULES) || permissions.some(p => p.startsWith(`${key}.`));
}

export interface HomeStatusInput {
  module: { status: string; showcase: boolean };
  /** Attivazione del tenant per questo modulo, se esiste */
  activation: ActivationWindow | null;
  /** Il modulo e' fra quelli in vigore del tenant (ModuleService, dipendenze comprese) */
  inForce: boolean;
  /** Tenant di sistema (personale EDG): vede tutto il catalogo non dismesso */
  systemTenant: boolean;
}

/**
 * Come appare un modulo nella home, o null se non va mostrato. In ordine:
 *   dismesso                         -> mai
 *   tenant di sistema                -> sviluppo | attivo
 *   cliente e modulo non disponibile -> mai (in sviluppo: solo personale EDG)
 *   in vigore                        -> prova | attivo
 *   sospeso, scaduto o periodo finito -> sospeso | scaduto (sempre visibili)
 *   disponibile e in vetrina         -> non-attivo
 *   altrimenti (riservato, in sviluppo, non ancora iniziato) -> mai
 */
export function homeStatus(input: HomeStatusInput, now: Date = new Date()): HomeStatus | null {
  const { module, activation, inForce, systemTenant } = input;
  if (module.status === 'dismesso') return null;
  if (systemTenant) return module.status === 'sviluppo' ? 'sviluppo' : 'attivo';
  if (module.status !== CUSTOMER_MODULE_STATUS) return null;

  if (activation) {
    if (inForce) return activation.status === 'prova' ? 'prova' : 'attivo';
    if (activation.status === 'sospeso' || activation.status === 'scaduto') return activation.status;
    if (hasActivationEnded(activation, now)) return 'scaduto';
  }

  return module.showcase ? 'non-attivo' : null;
}
