// src/services/health/HealthMonitor.ts
//
// Osservazione continua della salute della piattaforma (ADR038).
//
// Ogni HEALTH_CHECK_INTERVAL_MS controlla tutti i target in parallelo e
// mantiene in memoria lo stato corrente di ciascuno. Registra come evento
// SOLO i cambi di stato significativi, che passano dall'AlertManager:
//   -> DOWN          evento 'health.down'      (critical) dopo DOWN_AFTER_FAILURES fallimenti consecutivi
//   DOWN -> UP/DEG.  evento 'health.recovered' (info), con la durata del disservizio
// DEGRADED (latenza oltre DEGRADED_LATENCY_MS) e' solo uno stato visivo:
// nessun evento, per non generare allarmi su rallentamenti momentanei.
//
// Riavvii (ADR042): i servizi HTTP espongono l'uptime del processo in
// /health. Se tra due controlli l'uptime diminuisce, il processo e' ripartito
// (crash + restart di Docker, OOM kill, deploy) anche se nessun controllo lo
// ha mai visto giu': evento 'health.restarted' (warning). Un riavvio dopo un
// DOWN non genera l'evento: e' gia' raccontato da 'health.recovered'.
//
// Deploy (ADR044): /health espone anche la build (versione, data di build,
// commit). Se cambia tra due controlli e' un deploy: evento 'deploy.detected'
// (info) e nessun 'health.restarted', perche' quel riavvio era voluto.
//
// L'API GET /api/system/health legge snapshot(): risposta immediata, niente
// attese di timeout quando un servizio non risponde. POST /api/system/health
// (pulsante di aggiornamento della pagina Info) chiama checkNow(): esegue
// subito un giro, o si aggancia a quello gia' in corso.
import { HEALTH_TARGETS, HealthGroup, HealthTarget } from './targets';
import { recordEvent, LOG_SERVICE_ID } from '../localEvents';
import JobMonitor from '../jobs/JobMonitor';
import { BUILD_INFO, BuildInfo } from '../buildInfo';

export type HealthStatus = 'UNKNOWN' | 'UP' | 'DEGRADED' | 'DOWN';

export interface ServiceHealthState {
  id: string;
  name: string;
  group: HealthGroup;
  status: HealthStatus;
  /** Da quando il servizio e' nello stato attuale */
  since: string;
  checkedAt: string | null;
  responseTime: number | null;
  error: string | null;
  consecutiveFailures: number;
  /** ISO — avvio del processo, ricavato dall'uptime (null se non esposto) */
  startedAt: string | null;
  /** ISO — ultimo riavvio rilevato dal monitor */
  lastRestartAt: string | null;
  /** Riavvii rilevati nelle ultime 24 ore */
  restartsLast24h: number;
  /** Build in esecuzione (null se il servizio non la espone) */
  build: BuildInfo | null;
}

export const HEALTH_CHECK_INTERVAL_MS = Number(process.env.HEALTH_CHECK_INTERVAL_MS) || 32000;
export const DOWN_AFTER_FAILURES = Number(process.env.HEALTH_DOWN_AFTER_FAILURES) || 2;
export const DEGRADED_LATENCY_MS = Number(process.env.HEALTH_DEGRADED_LATENCY_MS) || 2048;

const startedAt = new Date().toISOString();
const state = new Map<string, ServiceHealthState>();
/** Pausa minima tra due giri richiesti a mano (pulsante di aggiornamento) */
export const MANUAL_CHECK_MIN_GAP_MS = 2048;

let timer: NodeJS.Timeout | null = null;
/** Giro in corso: chi arriva mentre gira si aggancia a questo, niente giri paralleli */
let inFlight: Promise<void> | null = null;
let lastRunAt: string | null = null;

/** Riavvii rilevati per servizio, solo quelli entro la finestra */
export const RESTART_WINDOW_MS = 24 * 60 * 60 * 1000;
const restartLog = new Map<string, number[]>();
/** Ultimo uptime letto: il confronto usa questo, non startedAt (niente jitter di rete) */
const lastUptime = new Map<string, number>();

const buildKey = (b: BuildInfo) => `${b.version}|${b.builtAt}|${b.commit}`;

/** "versione 1.0.0 · commit abc1234 · build 30/09/26, 11:02" (solo le parti note) */
export function describeBuild(b: BuildInfo): string {
  const parts: string[] = [];
  if (b.version) parts.push(`versione ${b.version}`);
  if (b.commit) parts.push(`commit ${b.commit}`);
  if (b.builtAt) {
    const at = new Date(b.builtAt).toLocaleString('it-IT', { timeZone: 'Europe/Rome', dateStyle: 'short', timeStyle: 'short' });
    parts.push(`build ${at}`);
  }
  return parts.join(' · ') || 'build sconosciuta';
}

function noteRestart(id: string, at: number): number {
  const recent = (restartLog.get(id) ?? []).filter(t => at - t < RESTART_WINDOW_MS);
  recent.push(at);
  restartLog.set(id, recent);
  return recent.length;
}

function restartsSince(id: string, now: number): number {
  return (restartLog.get(id) ?? []).filter(t => now - t < RESTART_WINDOW_MS).length;
}

const initialState = (t: HealthTarget): ServiceHealthState => ({
  id: t.id,
  name: t.name,
  group: t.group,
  status: 'UNKNOWN',
  since: startedAt,
  checkedAt: null,
  responseTime: null,
  error: null,
  consecutiveFailures: 0,
  startedAt: null,
  lastRestartAt: null,
  restartsLast24h: 0,
  build: null,
});

const formatDuration = (ms: number): string => {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ${s % 60} s`;
  return `${Math.floor(m / 60)} h ${m % 60} min`;
};

// ---------------------------------------------------------------------------
// Transizioni
// ---------------------------------------------------------------------------
async function onDown(s: ServiceHealthState): Promise<void> {
  await recordEvent({
    categoria: 'SYSTEM',
    tipo: 'health.down',
    criticita: 'critical',
    esito: 'fallito',
    entita: s.id,
    messaggio: `${s.name} non raggiungibile${s.error ? `: ${s.error}` : ''}`,
    dettagli: { servizio: s.name, gruppo: s.group, errore: s.error, fallimentiConsecutivi: s.consecutiveFailures },
  });
}

async function onRestarted(s: ServiceHealthState, previousUptimeSec: number, restarts: number): Promise<void> {
  await recordEvent({
    categoria: 'SYSTEM',
    tipo: 'health.restarted',
    criticita: 'warning',
    esito: 'parziale',
    entita: s.id,
    messaggio: `${s.name} riavviato (era attivo da ${formatDuration(previousUptimeSec * 1000)})`,
    dettagli: {
      servizio: s.name,
      gruppo: s.group,
      attivoPrimaSecondi: Math.round(previousUptimeSec),
      riavviiUltime24h: restarts,
    },
  });
}

async function onDeployed(s: ServiceHealthState, previous: BuildInfo, current: BuildInfo): Promise<void> {
  await recordEvent({
    categoria: 'SYSTEM',
    tipo: 'deploy.detected',
    criticita: 'info',
    esito: 'successo',
    entita: s.id,
    messaggio: `${s.name} aggiornato: ${describeBuild(current)}`,
    dettagli: { servizio: s.name, gruppo: s.group, precedente: previous, nuovo: current },
  });
}

async function onRecovered(s: ServiceHealthState, downtimeMs: number): Promise<void> {
  await recordEvent({
    categoria: 'SYSTEM',
    tipo: 'health.recovered',
    criticita: 'info',
    esito: 'successo',
    entita: s.id,
    messaggio: `${s.name} di nuovo operativo dopo ${formatDuration(downtimeMs)}`,
    dettagli: { servizio: s.name, gruppo: s.group, disservizioSecondi: Math.round(downtimeMs / 1000) },
  });
}

// ---------------------------------------------------------------------------
// Un giro di controlli
// ---------------------------------------------------------------------------
async function checkTarget(t: HealthTarget): Promise<void> {
  const prev = state.get(t.id) ?? initialState(t);
  const result = await t.probe();
  const now = new Date();
  const next: ServiceHealthState = { ...prev, checkedAt: now.toISOString() };

  let restarted: { previousUptimeSec: number; restarts: number } | null = null;
  let deployed: { previous: BuildInfo; current: BuildInfo } | null = null;

  if (result.ok && result.build) {
    const previous = prev.build;
    next.build = result.build;
    if (previous && buildKey(previous) !== buildKey(result.build)) deployed = { previous, current: result.build };
  }

  if (result.ok && result.uptimeSec !== undefined) {
    const previousUptimeSec = lastUptime.get(t.id);
    lastUptime.set(t.id, result.uptimeSec);
    next.startedAt = new Date(now.getTime() - result.uptimeSec * 1000).toISOString();
    // Un deploy riavvia il servizio per definizione: non e' un riavvio anomalo
    if (!deployed && previousUptimeSec !== undefined && result.uptimeSec < previousUptimeSec) {
      next.lastRestartAt = next.startedAt;
      const restarts = noteRestart(t.id, new Date(next.startedAt).getTime());
      // Dopo un DOWN il riavvio e' atteso: lo racconta gia' 'health.recovered'
      if (prev.status !== 'DOWN') restarted = { previousUptimeSec, restarts };
    }
  }
  next.restartsLast24h = restartsSince(t.id, now.getTime());

  if (result.ok) {
    next.consecutiveFailures = 0;
    next.error = null;
    next.responseTime = result.latencyMs;
    next.status = (result.latencyMs ?? 0) > DEGRADED_LATENCY_MS ? 'DEGRADED' : 'UP';
  } else {
    next.consecutiveFailures = prev.consecutiveFailures + 1;
    next.error = result.error ?? 'Non raggiungibile';
    next.responseTime = result.latencyMs;
    // Sotto soglia resta lo stato precedente: un singolo errore non e' un disservizio
    next.status = next.consecutiveFailures >= DOWN_AFTER_FAILURES ? 'DOWN' : prev.status;
  }

  if (next.status !== prev.status) next.since = now.toISOString();
  state.set(t.id, next);

  if (next.status === 'DOWN' && prev.status !== 'DOWN') {
    await onDown(next);
  } else if (prev.status === 'DOWN' && next.status !== 'DOWN') {
    await onRecovered(next, now.getTime() - new Date(prev.since).getTime());
  }
  if (restarted) await onRestarted(next, restarted.previousUptimeSec, restarted.restarts);
  if (deployed) await onDeployed(next, deployed.previous, deployed.current);
}

function runOnce(): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    await Promise.all(
      HEALTH_TARGETS.map(t => checkTarget(t).catch(err => console.error(`[HealthMonitor] ${t.id}:`, err?.message)))
    );
    // Processi pianificati attesi (ADR039): stesso giro, stessa cadenza
    await JobMonitor.check().catch(err => console.error('[HealthMonitor] processi pianificati:', err?.message));
    lastRunAt = new Date().toISOString();
  })().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

/**
 * Controllo immediato richiesto dall'utente. Se l'ultimo giro e' di meno di
 * MANUAL_CHECK_MIN_GAP_MS fa, il suo risultato e' gia' fresco: niente giri a
 * raffica per click ripetuti. Il ciclo periodico non viene toccato.
 */
async function checkNow(): Promise<void> {
  if (!inFlight && lastRunAt && Date.now() - Date.parse(lastRunAt) < MANUAL_CHECK_MIN_GAP_MS) return;
  await runOnce();
}

// ---------------------------------------------------------------------------
// API pubblica
// ---------------------------------------------------------------------------
function start(): void {
  if (timer) return;
  HEALTH_TARGETS.forEach(t => state.set(t.id, initialState(t)));
  const loop = async () => {
    await runOnce();
    timer = setTimeout(loop, HEALTH_CHECK_INTERVAL_MS);
  };
  void loop();
  console.log(
    `[HealthMonitor] Avviato: ${HEALTH_TARGETS.length} servizi ogni ${HEALTH_CHECK_INTERVAL_MS / 1000} s ` +
      `(DOWN dopo ${DOWN_AFTER_FAILURES} fallimenti)`
  );
}

function stop(): void {
  if (timer) clearTimeout(timer);
  timer = null;
}

/** Stato corrente di tutti i servizi, log-service compreso */
function snapshot(): { services: ServiceHealthState[]; lastRunAt: string | null; intervalMs: number } {
  const self: ServiceHealthState = {
    id: LOG_SERVICE_ID,
    name: 'Log Service',
    group: 'service',
    status: 'UP', // se questa risposta esiste, log-service e' in funzione
    since: startedAt,
    checkedAt: new Date().toISOString(),
    responseTime: null,
    error: null,
    consecutiveFailures: 0,
    startedAt,
    lastRestartAt: null,
    restartsLast24h: 0,
    build: BUILD_INFO,
  };
  const services = HEALTH_TARGETS.map(t => state.get(t.id) ?? initialState(t));
  const lastService = services.map(s => s.group).lastIndexOf('service');
  services.splice(lastService + 1, 0, self);
  return { services, lastRunAt, intervalMs: HEALTH_CHECK_INTERVAL_MS };
}

const HealthMonitor = { start, stop, snapshot, checkNow };

export default HealthMonitor;
