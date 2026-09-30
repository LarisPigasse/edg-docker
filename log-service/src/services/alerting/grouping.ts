// src/services/alerting/grouping.ts
//
// Raggruppamento delle regole di alerting (ADR038): con groupBy la soglia e
// il cooldown si contano separatamente per ogni valore del campo scelto —
// es. "8 login falliti dallo STESSO IP", non 8 login falliti in tutto il
// sistema. Unica fonte di verita' per il mapping groupBy -> campo del log.

export const ALERT_GROUP_BY = ['service', 'actor', 'ip'] as const;
export type AlertGroupBy = (typeof ALERT_GROUP_BY)[number];

/** Campo di AzioneLog (dot notation) usato per ciascun raggruppamento */
export const GROUP_BY_FIELD: Record<AlertGroupBy, string> = {
  service: 'azione.entita',      // servizio che ha generato l'evento
  actor:   'origine.id',         // account (o servizio, per gli eventi di sistema)
  ip:      'azione.dettagli.ip', // IP del client (es. auth.login_failed)
};

/** Etichette leggibili, usate nel testo delle email */
export const GROUP_BY_LABEL: Record<AlertGroupBy, string> = {
  service: 'Servizio',
  actor:   'Utente',
  ip:      'Indirizzo IP',
};

/** Chiave di gruppo usata quando la regola non raggruppa */
export const NO_GROUP = '*';

const getPath = (obj: Record<string, any>, path: string): unknown =>
  path.split('.').reduce<any>((acc, key) => (acc == null ? undefined : acc[key]), obj);

/**
 * Valore del campo di raggruppamento per un evento.
 * null se la regola non raggruppa o l'evento non ha quel campo.
 */
export function groupValue(groupBy: AlertGroupBy | null | undefined, event: Record<string, any>): string | null {
  if (!groupBy) return null;
  const value = getPath(event, GROUP_BY_FIELD[groupBy]);
  return value == null || value === '' ? null : String(value);
}

/** Chiave di gruppo per storico e cooldown ('*' se la regola non raggruppa) */
export function groupKey(groupBy: AlertGroupBy | null | undefined, event: Record<string, any>): string {
  if (!groupBy) return NO_GROUP;
  return groupValue(groupBy, event) ?? '(sconosciuto)';
}
