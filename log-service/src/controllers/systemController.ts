// src/controllers/systemController.ts
//
// GET /api/system/health — stato di salute della piattaforma per la scheda
// "Salute" di SISTEMA → Info (ADR038).
//
// Prima ogni richiesta interrogava tutti i servizi al momento (fino a 5 s di
// attesa per un servizio fermo) e l'elenco era incompleto (mancavano
// system-service, vehicle-service e MySQL; log-service risultava sempre UP).
// Ora lo stato e' calcolato in background dall'HealthMonitor: qui si legge
// lo snapshot e si aggiungono le statistiche di log e alert.
import { Request, Response } from 'express';
import AlertRule from '../models/AlertRule';
import AlertHistory from '../models/AlertHistory';
import AzioneLog from '../models/azioneLog';
import HealthMonitor from '../services/health/HealthMonitor';
import JobMonitor from '../services/jobs/JobMonitor';

const HOUR_MS = 60 * 60 * 1000;

/** Snapshot della salute + statistiche di log e alert, nel formato della pagina Info */
async function buildHealthResponse() {
  const now = new Date();
  const since24h = new Date(now.getTime() - 24 * HOUR_MS);
  const since7d = new Date(now.getTime() - 7 * 24 * HOUR_MS);

  const [logs24h, critici24h, errori24h, alertRules, alertsWeek, alertsFailed, lastAlert] = await Promise.all([
    AzioneLog.countDocuments({ timestamp: { $gte: since24h } }),
    AzioneLog.countDocuments({ timestamp: { $gte: since24h }, criticita: 'critical' }),
    AzioneLog.countDocuments({ timestamp: { $gte: since24h }, criticita: 'error' }),
    AlertRule.countDocuments({ enabled: true }),
    AlertHistory.countDocuments({ createdAt: { $gte: since7d } }),
    AlertHistory.countDocuments({ status: 'FAILED', createdAt: { $gte: since7d } }),
    AlertHistory.findOne({}).sort({ createdAt: -1 }).lean(),
  ]);

  const { services, lastRunAt, intervalMs } = HealthMonitor.snapshot();
  const summary = {
    total: services.length,
    up: services.filter(s => s.status === 'UP').length,
    degraded: services.filter(s => s.status === 'DEGRADED').length,
    down: services.filter(s => s.status === 'DOWN').length,
    unknown: services.filter(s => s.status === 'UNKNOWN').length,
  };

  return {
    services,
    summary,
    stats: { logs24h, critici24h, errori24h, alertRules, alertsWeek, alertsFailed },
    lastAlert: lastAlert ?? null,
    jobs: JobMonitor.snapshot(),
    monitor: { lastRunAt, intervalMs },
    generatedAt: now.toISOString(),
  };
}

/** GET /api/system/health — stato gia' calcolato (aggiornamento automatico della pagina) */
export const getSystemHealth = async (_req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json({ success: true, data: await buildHealthResponse() });
  } catch (error: any) {
    console.error('[systemController] getSystemHealth:', error.message);
    res.status(500).json({ success: false, message: 'Errore interno del server' });
  }
};

/**
 * POST /api/system/health — "controlla adesso" (pulsante di aggiornamento):
 * esegue subito un giro di controlli e restituisce lo stato fresco.
 */
export const checkSystemHealthNow = async (_req: Request, res: Response): Promise<void> => {
  try {
    await HealthMonitor.checkNow();
    res.status(200).json({ success: true, data: await buildHealthResponse() });
  } catch (error: any) {
    console.error('[systemController] checkSystemHealthNow:', error.message);
    res.status(500).json({ success: false, message: 'Errore interno del server' });
  }
};
