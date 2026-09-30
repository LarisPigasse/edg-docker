// src/config.ts
//
// Configurazione di backup-service (ADR045), tutta da variabili d'ambiente.
// Unico punto che legge process.env: il resto del codice riceve valori gia'
// validati. In produzione cambiano solo i valori (cartella, orario,
// conservazione), non il codice.
const env = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;
  if (value === undefined || value === '') throw new Error(`Variabile d'ambiente mancante: ${key}`);
  return value;
};

const count = (key: string, fallback: number): number => {
  const n = Number(process.env[key] ?? fallback);
  if (!Number.isInteger(n) || n < 1) throw new Error(`${key} deve essere un intero >= 1`);
  return n;
};

export const config = {
  /** Cartella di destinazione nel container (sull'host: BACKUP_HOST_DIR) */
  dir: env('BACKUP_DIR', '/backups'),
  /** Espressione cron a 6 campi (secondi inclusi), fuso orario TZ */
  cron: env('BACKUP_CRON', '0 0 12 * * *'),
  timezone: env('TZ', 'Europe/Rome'),
  /** All'avvio, esegue subito se l'ultimo backup riuscito e' piu' vecchio di cosi' */
  catchUpAfterMs: 24 * 60 * 60 * 1000,
  /** Quanti backup conservare per livello */
  keep: {
    daily: count('BACKUP_KEEP_DAILY', 2),
    weekly: count('BACKUP_KEEP_WEEKLY', 1),
    monthly: count('BACKUP_KEEP_MONTHLY', 1),
  },
  /** Porta di /health, osservata dall'HealthMonitor di log-service */
  port: Number(process.env.PORT) || 3005,

  mysql: {
    host: env('MYSQL_HOST', 'auth-mysql'),
    user: 'root',
    password: env('MYSQL_ROOT_PASSWORD'),
    database: env('MYSQL_DATABASE'),
  },
  postgres: {
    host: env('POSTGRES_HOST', 'edg-postgres'),
    user: env('POSTGRES_USER'),
    password: env('POSTGRES_PASSWORD'),
  },
  mongo: {
    host: env('MONGO_HOST', 'log-mongo'),
    user: env('MONGO_USER'),
    password: env('MONGO_PASSWORD'),
  },
  /** Volume dei file caricati dai veicoli, montato in sola lettura */
  uploadsDir: env('UPLOADS_DIR', '/data/vehicle-uploads'),
} as const;

export type Config = typeof config;
