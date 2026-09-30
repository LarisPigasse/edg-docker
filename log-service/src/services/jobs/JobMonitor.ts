// src/services/jobs/JobMonitor.ts
//
// Stato dei processi pianificati attesi (ADR039), calcolato dagli eventi
// job.completed / job.failed che i servizi registrano con runJob():
//   OK       ultima esecuzione riuscita e dentro l'intervallo atteso
//   FAILED   l'ultima esecuzione e' fallita
//   LATE     nessuna esecuzione riuscita entro intervallo + tolleranza
//   PENDING  mai visto, ma il monitor e' attivo da meno di intervallo + tolleranza
// Il passaggio a LATE genera l'evento job.missed (regola "Processo
// pianificato non eseguito"): e' l'unico modo di accorgersi di un processo
// che NON parte proprio. Chiamato dall'HealthMonitor a ogni giro.
//
// Nei primi STARTUP_GRACE_MS dopo l'avvio di log-service il job.missed non
// viene registrato (ADR045): dopo una notte a PC spento i processi recuperano
// all'avvio, e un allarme in quella finestra sarebbe falso. Se il ritardo
// persiste oltre la finestra, l'evento viene registrato comunque.
import AzioneLog from '../../models/azioneLog';
import { recordEvent } from '../localEvents';
import { EXPECTED_JOBS, type ExpectedJob } from './registry';

export type JobStatus = 'OK' | 'FAILED' | 'LATE' | 'PENDING';

export interface JobState {
  id: string;
  name: string;
  service: string;
  schedule: string;
  status: JobStatus;
  lastRunAt: string | null;
  lastOutcome: 'completed' | 'failed' | null;
  lastDurationMs: number | null;
  lastSummary: string | null;
  lastError: string | null;
  lastCompletedAt: string | null;
  /** Entro quando e' attesa la prossima esecuzione riuscita */
  dueBy: string | null;
}

const monitorStartedAt = Date.now();
export const STARTUP_GRACE_MS = 16 * 60 * 1000;
/** Processi gia' segnalati come LATE: un solo job.missed per ritardo */
const reportedLate = new Set<string>();
let states: JobState[] = EXPECTED_JOBS.map(j => emptyState(j));

function emptyState(j: ExpectedJob): JobState {
  return {
    id: j.id,
    name: j.name,
    service: j.service,
    schedule: j.schedule,
    status: 'PENDING',
    lastRunAt: null,
    lastOutcome: null,
    lastDurationMs: null,
    lastSummary: null,
    lastError: null,
    lastCompletedAt: null,
    dueBy: new Date(monitorStartedAt + j.everyMs + j.graceMs).toISOString(),
  };
}

interface LastEvent {
  timestamp: Date;
  sottoCategoria: string;
  azione: { dettagli?: { durataMs?: number; riepilogo?: string | null; errore?: string } };
}

async function lastEvent(jobId: string, tipi: string[]): Promise<LastEvent | null> {
  return AzioneLog.findOne(
    { sottoCategoria: { $in: tipi }, 'azione.dettagli.job': jobId },
    { timestamp: 1, sottoCategoria: 1, 'azione.dettagli': 1 }
  )
    .sort({ timestamp: -1 })
    .lean<LastEvent>()
    .exec();
}

async function evaluate(j: ExpectedJob, now: number): Promise<JobState> {
  const [last, lastOk] = await Promise.all([
    lastEvent(j.id, ['job.completed', 'job.failed']),
    lastEvent(j.id, ['job.completed']),
  ]);

  const lastCompletedAt = lastOk ? lastOk.timestamp.getTime() : null;
  const dueBy = (lastCompletedAt ?? monitorStartedAt) + j.everyMs + j.graceMs;

  let status: JobStatus;
  if (last?.sottoCategoria === 'job.failed') status = 'FAILED';
  else if (now <= dueBy) status = lastCompletedAt ? 'OK' : 'PENDING';
  else status = 'LATE';

  const d = last?.azione?.dettagli ?? {};
  return {
    ...emptyState(j),
    status,
    lastRunAt: last ? last.timestamp.toISOString() : null,
    lastOutcome: last ? (last.sottoCategoria === 'job.failed' ? 'failed' : 'completed') : null,
    lastDurationMs: typeof d.durataMs === 'number' ? d.durataMs : null,
    lastSummary: d.riepilogo ?? null,
    lastError: d.errore ?? null,
    lastCompletedAt: lastCompletedAt ? new Date(lastCompletedAt).toISOString() : null,
    dueBy: new Date(dueBy).toISOString(),
  };
}

/** Ricalcola lo stato di tutti i processi; registra job.missed al passaggio a LATE */
async function check(): Promise<void> {
  const now = Date.now();
  const next = await Promise.all(EXPECTED_JOBS.map(j => evaluate(j, now)));
  const inGrace = now - monitorStartedAt < STARTUP_GRACE_MS;

  for (const s of next) {
    if (s.status !== 'LATE') {
      reportedLate.delete(s.id);
      continue;
    }
    if (!inGrace && !reportedLate.has(s.id)) {
      reportedLate.add(s.id);
      await recordEvent({
        categoria: 'SYSTEM',
        tipo: 'job.missed',
        criticita: 'error',
        esito: 'fallito',
        entita: s.service,
        messaggio: `${s.name}: nessuna esecuzione riuscita entro il tempo previsto (${s.schedule})`,
        dettagli: { job: s.id, ultimaRiuscita: s.lastCompletedAt, attesaEntro: s.dueBy },
      });
    }
  }
  states = next;
}

const snapshot = (): JobState[] => states;

const JobMonitor = { check, snapshot };

export default JobMonitor;
