// src/services/reports/digestData.ts
//
// Raccolta dei dati del riepilogo giornaliero (ADR046): una fotografia delle
// ultime 24 ore, senza formattazione. La presentazione (testi, colori,
// sezioni dell'email) e' in digestFormat.ts.
import mongoose from 'mongoose';
import AzioneLog from '../../models/azioneLog';
import AlertHistory from '../../models/AlertHistory';
import HealthMonitor, { type ServiceHealthState } from '../health/HealthMonitor';
import JobMonitor, { type JobState } from '../jobs/JobMonitor';

export const DIGEST_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Eventi della piattaforma elencati uno per uno nella sezione Servizi */
export const SERVICE_EVENT_TYPES = [
  'health.down',
  'health.recovered',
  'health.restarted',
  'process.crashed',
  'deploy.detected',
  'log.events_lost',
] as const;

/** Eventi contati (non elencati) nella sezione Attivita' */
const ACTIVITY_TYPES = [
  'auth.login_success',
  'auth.login_failed',
  'auth.account_created',
  'auth.account_updated',
  'auth.account_toggled',
  'auth.account_deactivated',
  'auth.account_reactivated',
  'auth.account_deleted',
  'auth.role_permissions_updated',
  'auth.password_changed',
  'auth.password_reset_completed',
  'crud.create',
  'crud.update',
  'crud.toggle',
  'crud.deactivate',
  'crud.delete',
];

/** Oltre questo numero gli eventi dei servizi vengono riassunti ("e altri N") */
export const MAX_LISTED_EVENTS = 32;

export interface DigestEvent {
  at: Date;
  type: string;
  message: string;
}

export interface DigestAlertRule {
  rule: string;
  sent: number;
  failed: number;
  critical: number;
}

export interface DigestData {
  from: Date;
  to: Date;
  services: ServiceHealthState[];
  serviceEvents: DigestEvent[];
  serviceEventsTotal: number;
  jobs: JobState[];
  alerts: DigestAlertRule[];
  activity: Record<string, number>;
  failedLoginIps: number;
  volume: { events: number; errors: number; critical: number; storageBytes: number | null; documents: number | null };
}

async function countByType(from: Date, types: readonly string[]): Promise<Record<string, number>> {
  const rows = await AzioneLog.aggregate<{ _id: string; n: number }>([
    { $match: { timestamp: { $gte: from }, sottoCategoria: { $in: types } } },
    { $group: { _id: '$sottoCategoria', n: { $sum: 1 } } },
  ]);
  return Object.fromEntries(rows.map(r => [r._id, r.n]));
}

async function collectionSize(): Promise<{ storageBytes: number | null; documents: number | null }> {
  try {
    const stats = await mongoose.connection.db!.command({ collStats: AzioneLog.collection.collectionName });
    return { storageBytes: Number(stats.storageSize) + Number(stats.totalIndexSize ?? 0), documents: Number(stats.count) };
  } catch {
    return { storageBytes: null, documents: null };
  }
}

export async function collectDigest(now = new Date()): Promise<DigestData> {
  const from = new Date(now.getTime() - DIGEST_WINDOW_MS);
  const inWindow = { timestamp: { $gte: from, $lte: now } };

  const [events, eventsTotal, activity, failedIps, alerts, events24h, errors, critical, size] = await Promise.all([
    AzioneLog.find(
      { ...inWindow, sottoCategoria: { $in: SERVICE_EVENT_TYPES } },
      { timestamp: 1, sottoCategoria: 1, 'risultato.messaggio': 1 }
    )
      .sort({ timestamp: 1 })
      .limit(MAX_LISTED_EVENTS)
      .lean<{ timestamp: Date; sottoCategoria: string; risultato?: { messaggio?: string } }[]>(),
    AzioneLog.countDocuments({ ...inWindow, sottoCategoria: { $in: SERVICE_EVENT_TYPES } }),
    countByType(from, ACTIVITY_TYPES),
    AzioneLog.distinct('azione.dettagli.ip', { ...inWindow, sottoCategoria: 'auth.login_failed' }),
    AlertHistory.aggregate<{ _id: string; sent: number; failed: number; critical: number }>([
      { $match: { createdAt: { $gte: from, $lte: now } } },
      {
        $group: {
          _id: '$ruleName',
          sent: { $sum: { $cond: [{ $eq: ['$status', 'SENT'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] } },
          critical: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } },
        },
      },
      { $sort: { sent: -1, _id: 1 } },
    ]),
    AzioneLog.countDocuments(inWindow),
    AzioneLog.countDocuments({ ...inWindow, criticita: 'error' }),
    AzioneLog.countDocuments({ ...inWindow, criticita: 'critical' }),
    collectionSize(),
  ]);

  return {
    from,
    to: now,
    services: HealthMonitor.snapshot().services,
    serviceEvents: events.map(e => ({ at: e.timestamp, type: e.sottoCategoria, message: e.risultato?.messaggio ?? e.sottoCategoria })),
    serviceEventsTotal: eventsTotal,
    jobs: JobMonitor.snapshot(),
    alerts: alerts.map(a => ({ rule: a._id, sent: a.sent, failed: a.failed, critical: a.critical })),
    activity,
    failedLoginIps: failedIps.filter(ip => ip != null && ip !== '').length,
    volume: { events: events24h, errors, critical, ...size },
  };
}
