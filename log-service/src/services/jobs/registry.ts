// src/services/jobs/registry.ts
//
// Processi pianificati ATTESI (ADR039). Elenco fisso e volutamente
// esplicito: un servizio che non parte non potrebbe "annunciare" i propri
// processi, ed e' proprio il caso da scoprire. Aggiungere qui ogni nuovo
// processo (es. i backup) con lo stesso id usato da runJob() nel servizio.
export interface ExpectedJob {
  /** Uguale al primo argomento di runJob() nel servizio */
  id: string;
  name: string;
  service: string;
  /** Pianificazione leggibile, solo per la pagina Info */
  schedule: string;
  /** Intervallo atteso tra due esecuzioni riuscite */
  everyMs: number;
  /** Tolleranza oltre l'intervallo prima di considerarlo "in ritardo" */
  graceMs: number;
}

const HOUR_MS = 60 * 60 * 1000;

export const EXPECTED_JOBS: ExpectedJob[] = [
  {
    id: 'auth.cleanup-expired',
    name: 'Pulizia sessioni e token scaduti',
    service: 'auth-service',
    schedule: 'ogni giorno alle 03:00',
    everyMs: 24 * HOUR_MS,
    graceMs: HOUR_MS,
  },
  {
    id: 'vehicle.daily-status-check',
    name: 'Controllo giornaliero scadenze veicoli',
    service: 'vehicle-service',
    schedule: 'ogni giorno alle 06:00',
    everyMs: 24 * HOUR_MS,
    graceMs: HOUR_MS,
  },
  {
    id: 'backup.daily',
    name: 'Backup di database e file',
    service: 'backup-service',
    schedule: 'ogni giorno alle 12:00 (BACKUP_CRON)',
    everyMs: 24 * HOUR_MS,
    graceMs: HOUR_MS,
  },
];
