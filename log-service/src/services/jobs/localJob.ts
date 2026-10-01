// src/services/jobs/localJob.ts
//
// Processi pianificati che girano DENTRO log-service (es. il riepilogo
// giornaliero). Stesso contratto del runJob() degli altri servizi (ADR039):
// registra job.completed / job.failed con dettagli.job, cosi' il JobMonitor
// li tratta come tutti gli altri. Gli eventi sono scritti direttamente con
// recordEvent, senza passare da HTTP.
import { recordEvent, LOG_SERVICE_ID } from '../localEvents';

export interface LocalJobOutcome {
  ok: boolean;
  message: string;
}

/** Esegue e traccia un processo; non lancia mai */
export async function runLocalJob(jobId: string, label: string, fn: () => Promise<string>): Promise<LocalJobOutcome> {
  const start = Date.now();
  try {
    const riepilogo = await fn();
    const durataMs = Date.now() - start;
    console.log(`✅ [JOB] ${label}: completato in ${durataMs} ms — ${riepilogo}`);
    await recordEvent({
      categoria: 'SYSTEM',
      tipo: 'job.completed',
      criticita: 'info',
      esito: 'successo',
      entita: LOG_SERVICE_ID,
      messaggio: `${label}: completato — ${riepilogo}`,
      dettagli: { job: jobId, durataMs, riepilogo },
    });
    return { ok: true, message: riepilogo };
  } catch (err) {
    const durataMs = Date.now() - start;
    const errore = err instanceof Error ? err.message : String(err);
    console.error(`❌ [JOB] ${label}: fallito dopo ${durataMs} ms —`, errore);
    await recordEvent({
      categoria: 'SYSTEM',
      tipo: 'job.failed',
      criticita: 'error',
      esito: 'fallito',
      entita: LOG_SERVICE_ID,
      messaggio: `${label}: fallito — ${errore}`,
      dettagli: { job: jobId, durataMs, errore },
    });
    return { ok: false, message: errore };
  }
}
