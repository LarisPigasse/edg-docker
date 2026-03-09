// =============================================================================
// EDG Vehicle Service - Logger Service
// Invia log al log-service centralizzato (MongoDB)
// Fallback silenzioso su console se il servizio non è raggiungibile
// =============================================================================
import axios from 'axios';

// ---------------------------------------------------------------------------
// Tipi
// ---------------------------------------------------------------------------
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogPayload {
  level: LogLevel;
  service: string;
  action: string;
  message: string;
  userId?: number | null;
  userUuid?: string | null;
  meta?: Record<string, unknown>;
  duration?: number;
  statusCode?: number;
}

// ---------------------------------------------------------------------------
// Configurazione
// ---------------------------------------------------------------------------
const LOG_SERVICE_URL = process.env.LOG_SERVICE_URL || 'http://log-service:4000';
const LOG_API_KEY = process.env.LOG_API_KEY_SECRET || '';
const SERVICE_NAME = process.env.SERVICE_NAME || 'vehicle-service';
const IS_DEV = process.env.NODE_ENV === 'development';

// ---------------------------------------------------------------------------
// Invio al log-service (fire and forget)
// ---------------------------------------------------------------------------
async function send(payload: LogPayload): Promise<void> {
  // In development logga sempre su console
  if (IS_DEV) {
    const icon = { info: 'ℹ️', warn: '⚠️', error: '❌', debug: '🔍' }[payload.level];
    console.log(`${icon} [${payload.service}] ${payload.action}: ${payload.message}`, payload.meta || '');
  }

  try {
    await axios.post(
      `${LOG_SERVICE_URL}/logs`,
      {
        ...payload,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': LOG_API_KEY,
        },
        timeout: 2000, // Non bloccare se il log-service è lento
      }
    );
  } catch {
    // Fallback silenzioso — il logging non deve mai far fallire il servizio
    if (!IS_DEV) {
      console.error(`[Logger] Log-service non raggiungibile: ${payload.action}`);
    }
  }
}

// ---------------------------------------------------------------------------
// API pubblica
// ---------------------------------------------------------------------------
export const logger = {
  info(action: string, message: string, meta?: Record<string, unknown>, userId?: number): void {
    void send({ level: 'info', service: SERVICE_NAME, action, message, userId, meta });
  },

  warn(action: string, message: string, meta?: Record<string, unknown>, userId?: number): void {
    void send({ level: 'warn', service: SERVICE_NAME, action, message, userId, meta });
  },

  error(action: string, message: string, meta?: Record<string, unknown>, userId?: number): void {
    void send({ level: 'error', service: SERVICE_NAME, action, message, userId, meta });
  },

  debug(action: string, message: string, meta?: Record<string, unknown>): void {
    if (IS_DEV) {
      void send({ level: 'debug', service: SERVICE_NAME, action, message, meta });
    }
  },

  // Log azione con tempo di esecuzione — utile per operazioni critiche
  audit(
    action: string,
    message: string,
    userId: number,
    userUuid: string,
    meta?: Record<string, unknown>
  ): void {
    void send({
      level: 'info',
      service: SERVICE_NAME,
      action,
      message,
      userId,
      userUuid,
      meta: { ...meta, audit: true },
    });
  },

  // Log richiesta HTTP completata (usato dall'app.ts request logger)
  request(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    userId?: number
  ): void {
    const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    void send({
      level,
      service: SERVICE_NAME,
      action: 'http_request',
      message: `${method} ${url} → ${statusCode} (${duration}ms)`,
      userId,
      statusCode,
      duration,
    });
  },
};
