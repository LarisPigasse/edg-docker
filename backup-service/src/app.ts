// src/app.ts
//
// EDG Backup Service (ADR045). Esegue il backup di database e file:
//   - ogni giorno all'orario di BACKUP_CRON (default 12:00, fuso TZ)
//   - all'avvio, se l'ultimo backup riuscito e' piu' vecchio di 24 ore
//     (in sviluppo il PC puo' restare spento all'orario previsto)
//   - a richiesta: npm run backup (POST /run, solo dall'interno del container)
// Ogni esecuzione e' tracciata da runJob come 'backup.daily': log-service la
// mostra nella scheda Salute e segnala fallimenti e backup mancati.
// /health espone uptime, build e ultimo backup, per l'HealthMonitor.
import http from 'http';
import cron from 'node-cron';
import { installCrashHandlers } from './services/logger';
import { runJob } from './services/jobRunner';
import { BUILD_INFO } from './services/buildInfo';
import { config } from './config';
import { isRunning, runBackup } from './backup/run';
import { latestBackup } from './backup/storage';

// Prima di tutto: un errore non gestito va segnalato a log-service prima di uscire (ADR043)
installCrashHandlers();

const JOB_ID = 'backup.daily';
const JOB_LABEL = 'Backup di database e file';
/** Attesa prima del recupero all'avvio: il tempo di far partire log-service e database */
const CATCH_UP_DELAY_MS = 32 * 1000;

interface BackupOutcome {
  ok: boolean;
  message: string;
}

/** Un backup tracciato; non lancia mai */
async function backupNow(): Promise<BackupOutcome> {
  let outcome: BackupOutcome = { ok: false, message: '' };
  await runJob(JOB_ID, JOB_LABEL, async () => {
    try {
      const summary = await runBackup();
      outcome = { ok: true, message: summary };
      return summary;
    } catch (err) {
      outcome = { ok: false, message: err instanceof Error ? err.message : String(err) };
      throw err;
    }
  });
  return outcome;
}

async function catchUp(): Promise<void> {
  const last = await latestBackup();
  const age = last ? Date.now() - Date.parse(last.createdAt) : Infinity;
  if (age < config.catchUpAfterMs) {
    console.log(`[Backup] Ultimo backup ${last?.name}: nessun recupero necessario`);
    return;
  }
  console.log(`[Backup] ${last ? `Ultimo backup ${last.name} piu' vecchio di 24 ore` : 'Nessun backup presente'}: recupero`);
  await backupNow();
}

// ---------------------------------------------------------------------------
// HTTP: /health (HealthMonitor) e POST /run (solo locale, per npm run backup)
// ---------------------------------------------------------------------------
const isLocal = (req: http.IncomingMessage) =>
  ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress ?? '');

function send(res: http.ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/health') {
      const last = await latestBackup();
      return send(res, 200, {
        status: 'healthy',
        service: 'backup-service',
        uptime: process.uptime(),
        build: BUILD_INFO,
        running: isRunning(),
        schedule: config.cron,
        lastBackup: last ? { name: last.name, createdAt: last.createdAt, files: last.files.length } : null,
      });
    }
    if (req.method === 'POST' && req.url === '/run') {
      if (!isLocal(req)) return send(res, 403, { ok: false, message: 'Consentito solo dall\'interno del container' });
      if (isRunning()) return send(res, 409, { ok: false, message: 'Un backup e\' gia\' in corso' });
      const outcome = await backupNow();
      return send(res, outcome.ok ? 200 : 500, outcome);
    }
    send(res, 404, { ok: false, message: 'Non trovato' });
  } catch (err) {
    send(res, 500, { ok: false, message: err instanceof Error ? err.message : String(err) });
  }
});

// ---------------------------------------------------------------------------
// Avvio
// ---------------------------------------------------------------------------
if (!cron.validate(config.cron)) throw new Error(`BACKUP_CRON non valida: ${config.cron}`);

cron.schedule(config.cron, () => void backupNow(), { timezone: config.timezone });

server.listen(config.port, () => {
  console.log(`[Backup] In ascolto sulla porta ${config.port}`);
  console.log(`[Backup] Destinazione ${config.dir}, pianificazione "${config.cron}" (${config.timezone})`);
  console.log(
    `[Backup] Conservazione: ${config.keep.daily} giornalieri, ${config.keep.weekly} settimanali, ${config.keep.monthly} mensili`
  );
});

setTimeout(() => void catchUp().catch(err => console.error('[Backup] Recupero:', err)), CATCH_UP_DELAY_MS);

const shutdown = (signal: string) => {
  console.log(`[Backup] ${signal}: arresto`);
  server.close(() => process.exit(0));
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
