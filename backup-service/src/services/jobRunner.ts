// src/services/jobRunner.ts
//
// Esecuzione tracciata dei processi pianificati (ADR039, punto "guasti
// silenziosi"). Ogni processo, avvolto da runJob(), registra in log-service:
//   job.completed  (info)  — durata e riepilogo di cosa ha fatto
//   job.failed     (error) — durata ed errore
// L'HealthMonitor di log-service confronta questi eventi con l'elenco dei
// processi attesi (services/jobs/registry.ts) e segnala anche quelli che
// NON sono stati eseguiti nel tempo previsto (job.missed).
// Non lancia mai: un processo fallito non deve far cadere il servizio.
// Modulo identico in auth-service, vehicle-service e backup-service.
import { logger } from './logger';

/**
 * @param jobId  identificativo stabile, uguale a quello del registro di log-service
 * @param label  nome leggibile per i messaggi
 * @param fn     il lavoro; puo' restituire un riepilogo testuale ("12 aggiornate, 3 notifiche")
 */
export async function runJob(jobId: string, label: string, fn: () => Promise<string | void>): Promise<void> {
  const start = Date.now();
  console.log(`⏱️  [JOB] ${label}: avvio`);
  try {
    const riepilogo = (await fn()) || null;
    const durataMs = Date.now() - start;
    console.log(`✅ [JOB] ${label}: completato in ${durataMs} ms${riepilogo ? ` — ${riepilogo}` : ''}`);
    logger.info(
      'job.completed',
      `${label}: completato${riepilogo ? ` — ${riepilogo}` : ''}`,
      { job: jobId, durataMs, riepilogo },
      'SYSTEM'
    );
  } catch (err) {
    const durataMs = Date.now() - start;
    const errore = err instanceof Error ? err.message : String(err);
    console.error(`❌ [JOB] ${label}: fallito dopo ${durataMs} ms —`, err);
    logger.error('job.failed', `${label}: fallito — ${errore}`, { job: jobId, durataMs, errore }, 'SYSTEM');
  }
}
