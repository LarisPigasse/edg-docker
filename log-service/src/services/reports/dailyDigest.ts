// src/services/reports/dailyDigest.ts
//
// Riepilogo giornaliero via email (ADR046, ADR039 punto 4).
//   - ogni giorno all'orario di DIGEST_CRON (default 08:00, fuso TZ)
//   - all'avvio di log-service, se l'ultimo riepilogo inviato ha piu' di 24
//     ore (in sviluppo il PC e' spento alle 08:00)
//   - a richiesta: POST /api/system/digest (pulsante nella scheda Salute)
// Sempre inviato, anche quando e' tutto regolare: e' l'email che manca a
// segnalare un problema. Destinatari: quelli predefiniti dell'anagrafica;
// se non ce ne sono, il processo fallisce e lo si vede nella scheda Salute.
import cron from 'node-cron';
import fetch from 'node-fetch';
import AlertRecipient from '../../models/AlertRecipient';
import AzioneLog from '../../models/azioneLog';
import { runLocalJob, type LocalJobOutcome } from '../jobs/localJob';
import { collectDigest, DIGEST_WINDOW_MS } from './digestData';
import { formatDigest } from './digestFormat';

export const DIGEST_JOB_ID = 'report.daily-digest';
const DIGEST_LABEL = 'Riepilogo giornaliero via email';

const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'http://email-service:3002';
const DIGEST_CRON = process.env.DIGEST_CRON || '0 0 8 * * *';
const TIMEZONE = process.env.TZ || 'Europe/Rome';
const INFO_URL = `${(process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')}/sistema/info`;
/** Attesa prima del recupero all'avvio: l'HealthMonitor deve completare qualche giro */
const CATCH_UP_DELAY_MS = 64 * 1000;
const SEND_TIMEOUT_MS = 16 * 1000;

let running: Promise<LocalJobOutcome> | null = null;

async function defaultRecipients(): Promise<string[]> {
  const recipients = await AlertRecipient.find({ enabled: true, isDefault: true }, { email: 1 }).lean();
  return recipients.map(r => r.email);
}

async function composeAndSend(): Promise<string> {
  const to = await defaultRecipients();
  if (!to.length) throw new Error('nessun destinatario predefinito attivo (SISTEMA → Info → Regole)');

  const { subject, data, ok, problems } = formatDigest(await collectDigest(), DIGEST_JOB_ID, INFO_URL);

  const response = await fetch(`${EMAIL_SERVICE_URL}/email/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, template: 'reports/daily-digest', data }),
    timeout: SEND_TIMEOUT_MS,
  });
  const body = (await response.json().catch(() => ({}))) as { success?: boolean; error?: string };
  if (!response.ok || !body.success) throw new Error(`email-service: ${body.error || `HTTP ${response.status}`}`);

  const esito = ok ? 'tutto regolare' : `${problems.length} problemi`;
  return `inviato a ${to.length} ${to.length === 1 ? 'destinatario' : 'destinatari'} (${esito})`;
}

/** Invia il riepilogo ora; un solo invio alla volta */
export function sendDigestNow(): Promise<LocalJobOutcome> {
  if (!running) {
    running = runLocalJob(DIGEST_JOB_ID, DIGEST_LABEL, composeAndSend).finally(() => {
      running = null;
    });
  }
  return running;
}

async function catchUp(): Promise<void> {
  const last = await AzioneLog.findOne(
    { sottoCategoria: 'job.completed', 'azione.dettagli.job': DIGEST_JOB_ID },
    { timestamp: 1 }
  )
    .sort({ timestamp: -1 })
    .lean<{ timestamp: Date }>();
  if (last && Date.now() - last.timestamp.getTime() < DIGEST_WINDOW_MS) return;
  console.log('[Digest] Ultimo riepilogo piu\' vecchio di 24 ore: invio di recupero');
  await sendDigestNow();
}

export function startDailyDigest(): void {
  if (!cron.validate(DIGEST_CRON)) {
    console.error(`[Digest] DIGEST_CRON non valida: "${DIGEST_CRON}" — riepilogo disattivato`);
    return;
  }
  cron.schedule(DIGEST_CRON, () => void sendDigestNow(), { timezone: TIMEZONE });
  setTimeout(() => void catchUp().catch(err => console.error('[Digest] Recupero:', err?.message)), CATCH_UP_DELAY_MS);
  console.log(`[Digest] Riepilogo giornaliero pianificato: "${DIGEST_CRON}" (${TIMEZONE})`);
}
