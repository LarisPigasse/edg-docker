// src/services/alerting/eventTypes.ts
//
// Tipi di evento proponibili nella modale delle regole (ADR038): quelli di
// sistema noti (anche se non ancora comparsi nei log, es. 'health.down' su
// un'installazione nuova) piu' quelli effettivamente presenti nei log.
// Le etichette sono solo un aiuto alla scelta: il valore resta il tipo tecnico.
import AzioneLog from '../../models/azioneLog';

export const KNOWN_EVENT_TYPES: Record<string, string> = {
  'auth.login_success': 'Accesso riuscito',
  'auth.login_failed': 'Accesso fallito',
  'auth.password_changed': 'Password modificata',
  'auth.role_permissions_updated': 'Permessi di un ruolo modificati',
  'auth.logout': 'Logout',
  'auth.logout_all': 'Logout da tutti i dispositivi',
  'auth.password_reset_requested': 'Reset password richiesto',
  'auth.password_reset_completed': 'Reset password completato',
  'auth.account_created': 'Account creato',
  'auth.account_updated': 'Account modificato',
  'auth.account_toggled': 'Account attivato/disattivato',
  'auth.account_deactivated': 'Account disattivato',
  'auth.account_reactivated': 'Account riattivato',
  'auth.account_deleted': 'Account eliminato definitivamente',
  'crud.deactivate': 'Disattivazione di un dato (referenziato altrove)',
  'crud.toggle': 'Attivazione/disattivazione di un dato',
  'health.down': 'Servizio non raggiungibile',
  'health.recovered': 'Servizio di nuovo operativo',
  'health.restarted': 'Servizio riavviato',
  'process.crashed': 'Servizio arrestato da un errore',
  'deploy.detected': 'Nuova versione di un servizio',
  'job.completed': 'Processo pianificato completato',
  'job.failed': 'Processo pianificato fallito',
  'job.missed': 'Processo pianificato non eseguito',
  'log.events_lost': 'Eventi di log persi (coda piena)',
  'crud.create': 'Creazione di un dato',
  'crud.update': 'Modifica di un dato',
  'crud.delete': 'Eliminazione di un dato',
  http_request: 'Richiesta HTTP (tecnica)',
};

export interface EventTypeOption {
  value: string;
  label: string | null;
  /** true se il tipo compare nei log registrati */
  seen: boolean;
}

export async function listEventTypes(): Promise<EventTypeOption[]> {
  // distinct tipizza sottoCategoria come l'enum EventType del modello, ma i
  // logger scrivono stringhe libere ('auth.login_failed'): si normalizza a string.
  const raw: unknown[] = await AzioneLog.distinct('sottoCategoria');
  const seen = raw.filter((v): v is string => typeof v === 'string' && v.length > 0);
  const seenSet = new Set(seen);
  const all = new Set([...Object.keys(KNOWN_EVENT_TYPES), ...seen]);

  return [...all]
    .sort((a, b) => a.localeCompare(b))
    .map(value => ({ value, label: KNOWN_EVENT_TYPES[value] ?? null, seen: seenSet.has(value) }));
}
