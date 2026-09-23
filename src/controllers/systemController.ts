// src/controllers/systemController.ts
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import fetch from 'node-fetch';
import AlertRule from '../models/AlertRule';
import AlertHistory from '../models/AlertHistory';
import AzioneLog from '../models/azioneLog';
import net from 'net';

// ============================================================================
// HELPER — TCP ping per database (Redis, PostgreSQL)
// ============================================================================

async function checkTcpService(config: { id: string; name: string; host: string; port: number }): Promise<ServiceHealth> {
  const start = Date.now();
  const checkedAt = new Date().toISOString();

  return new Promise(resolve => {
    const socket = new net.Socket();

    const timeout = setTimeout(() => {
      socket.destroy();
      resolve({
        id: config.id,
        name: config.name,
        status: 'DOWN',
        responseTime: null,
        error: 'Connection timeout',
        checkedAt,
      });
    }, 5000);

    socket.connect(config.port, config.host, () => {
      clearTimeout(timeout);
      const responseTime = Date.now() - start;
      socket.destroy();
      resolve({
        id: config.id,
        name: config.name,
        status: responseTime > 3000 ? 'DEGRADED' : 'UP',
        responseTime,
        checkedAt,
      });
    });

    socket.on('error', err => {
      clearTimeout(timeout);
      socket.destroy();
      resolve({
        id: config.id,
        name: config.name,
        status: 'DOWN',
        responseTime: null,
        error: err.message,
        checkedAt,
      });
    });
  });
}
// ============================================================================
// CONFIGURAZIONE SERVIZI DA MONITORARE
// ============================================================================

const SERVICES = [
  {
    id: 'auth-service',
    name: 'Auth Service',
    url: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
  },
  {
    id: 'email-service',
    name: 'Email Service',
    url: process.env.EMAIL_SERVICE_URL || 'http://email-service:3002',
  },
  {
    id: 'api-gateway-1',
    name: 'API Gateway 1',
    url: process.env.GATEWAY_1_URL || 'http://api-gateway-1:8080',
  },
  {
    id: 'api-gateway-2',
    name: 'API Gateway 2',
    url: process.env.GATEWAY_2_URL || 'http://api-gateway-2:8080',
  },
];

// TCP services (database)
const TCP_SERVICES = [
  {
    id: 'redis',
    name: 'Redis',
    host: process.env.REDIS_HOST || 'edg-redis',
    port: 6379,
  },
  {
    id: 'postgres',
    name: 'PostgreSQL',
    host: process.env.POSTGRES_HOST || 'edg-postgres',
    port: 5432,
  },
];

// ============================================================================
// TIPI
// ============================================================================

type ServiceStatus = 'UP' | 'DOWN' | 'DEGRADED';

interface ServiceHealth {
  id: string;
  name: string;
  status: ServiceStatus;
  responseTime: number | null; // ms
  error?: string;
  checkedAt: string;
}

// ============================================================================
// HELPER — Health check singolo servizio esterno
// ============================================================================

async function checkService(service: { id: string; name: string; url: string }): Promise<ServiceHealth> {
  const start = Date.now();
  const checkedAt = new Date().toISOString();

  try {
    const response = await fetch(`${service.url}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      // @ts-ignore — node-fetch timeout
      timeout: 5000,
    });

    const responseTime = Date.now() - start;

    if (response.ok) {
      return {
        id: service.id,
        name: service.name,
        status: responseTime > 3000 ? 'DEGRADED' : 'UP',
        responseTime,
        checkedAt,
      };
    }

    return {
      id: service.id,
      name: service.name,
      status: 'DOWN',
      responseTime: Date.now() - start,
      error: `HTTP ${response.status}`,
      checkedAt,
    };
  } catch (err: any) {
    return {
      id: service.id,
      name: service.name,
      status: 'DOWN',
      responseTime: null,
      error: err.message || 'Unreachable',
      checkedAt,
    };
  }
}

// ============================================================================
// HELPER — Stato MongoDB
// ============================================================================

function getMongoStatus(): ServiceHealth {
  const checkedAt = new Date().toISOString();
  const state = mongoose.connection.readyState;

  // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  const statusMap: Record<number, ServiceStatus> = {
    0: 'DOWN',
    1: 'UP',
    2: 'DEGRADED',
    3: 'DEGRADED',
  };

  return {
    id: 'mongodb',
    name: 'MongoDB',
    status: statusMap[state] ?? 'DOWN',
    responseTime: null,
    error: state !== 1 ? `readyState: ${state}` : undefined,
    checkedAt,
  };
}

// ============================================================================
// CONTROLLER
// ============================================================================

/**
 * GET /api/system/health
 * Aggrega lo stato di salute di tutti i servizi dell'infrastruttura.
 * Usato dalla pagina Sistema del pro-frontend (solo root).
 *
 * Risposta:
 * {
 *   success: true,
 *   data: {
 *     services: ServiceHealth[],   // stato auth, email, mongodb, log-service stesso
 *     stats: {
 *       logs24h:        number,    // eventi log nelle ultime 24h
 *       critici24h:     number,    // eventi critical nelle ultime 24h
 *       errori24h:      number,    // eventi error nelle ultime 24h
 *       alertRules:     number,    // regole attive
 *       alertsWeek:     number,    // alert inviati ultimi 7gg
 *       alertsFailed:   number,    // alert falliti totali
 *     },
 *     lastAlert: AlertHistoryEntry | null,
 *     generatedAt: string,
 *   }
 * }
 */
export const getSystemHealth = async (req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // ── Chiamate parallele: servizi esterni + dati MongoDB ──────────────────
    const [
      externalServices,
      tcpServices,
      logs24h,
      critici24h,
      errori24h,
      alertRulesCount,
      alertsWeek,
      alertsFailed,
      lastAlertArr,
    ] = await Promise.all([
      // Health check servizi esterni (in parallelo tra loro)
      Promise.all(SERVICES.map(checkService)),
      Promise.all(TCP_SERVICES.map(checkTcpService)),

      // Statistiche log
      AzioneLog.countDocuments({ timestamp: { $gte: since24h } }),
      AzioneLog.countDocuments({ timestamp: { $gte: since24h }, criticita: 'critical' }),
      AzioneLog.countDocuments({ timestamp: { $gte: since24h }, criticita: 'error' }),

      // Statistiche alert
      AlertRule.countDocuments({ enabled: true }),
      AlertHistory.countDocuments({ createdAt: { $gte: since7d } }),
      AlertHistory.countDocuments({ status: 'FAILED' }),

      // Ultimo alert inviato
      AlertHistory.find({}).sort({ createdAt: -1 }).limit(1).lean(),
    ]);

    // ── Log-service stesso ───────────────────────────────────────────────────
    const logServiceHealth: ServiceHealth = {
      id: 'log-service',
      name: 'Log Service',
      status: 'UP',
      responseTime: null,
      checkedAt: now.toISOString(),
    };

    // ── MongoDB ──────────────────────────────────────────────────────────────
    const mongoHealth = getMongoStatus();

    // ── Risposta aggregata ───────────────────────────────────────────────────
    res.status(200).json({
      success: true,
      data: {
        services: [logServiceHealth, mongoHealth, ...externalServices, ...tcpServices],
        stats: {
          logs24h,
          critici24h,
          errori24h,
          alertRules: alertRulesCount,
          alertsWeek,
          alertsFailed,
        },
        lastAlert: lastAlertArr[0] ?? null,
        generatedAt: now.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[systemController] getSystemHealth:', error.message);
    res.status(500).json({ success: false, message: 'Errore interno del server' });
  }
};
