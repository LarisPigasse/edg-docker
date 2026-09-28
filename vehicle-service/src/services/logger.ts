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

/** Le 6 categorie note a log-service (src/types/eventCategories.ts) — qui come
 *  union di stringhe, non enum: evita di dipendere dal pacchetto di log-service
 *  solo per questo tipo. */
type EventCategory = 'AUTH' | 'DATA' | 'EMAIL' | 'SYSTEM' | 'AUDIT' | 'SECURITY';

/** Chi ha generato l'evento — stessi campi già presenti su req.user (vedi
 *  middleware/auth.ts), passati così come sono: nessuna query aggiuntiva nel
 *  percorso di logging. tenantId assente per gli eventi non legati a un
 *  account (vedi origine.tipo 'sistema' in send()). */
interface LogActor {
  id: number;
  email?: string | null;
  tenantId?: number | null;
}

interface LogPayload {
  level: LogLevel;
  service: string;
  action: string;
  message: string;
  categoria: EventCategory;
  actor?: LogActor | null;
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

  // NOTA (fix 2026-09-22): l'unica rotta esposta da log-service per scrivere
  // un evento è POST /api/log/azione (vedi src/routes/logRoutes.ts), protetta
  // da apiKeyAuth. Il payload deve rispettare i campi legacy obbligatori dello
  // schema Mongoose AzioneLog (origine/azione/risultato.esito) — non basta
  // inoltrare il LogPayload "piatto" così com'è, altrimenti la richiesta
  // fallisce a monte con un 404 sull'URL sbagliato (bug precedente, che ha
  // reso questa integrazione silenziosamente muta per giorni) o comunque
  // con un errore di validazione Mongoose se si corregge solo l'URL.
  const esito: 'successo' | 'fallito' | 'parziale' =
    payload.level === 'error' ? 'fallito' : payload.level === 'warn' ? 'parziale' : 'successo';
  const criticita = payload.level === 'error' ? 'error' : payload.level === 'warn' ? 'warning' : 'info';

  const body = {
    timestamp: new Date().toISOString(),
    categoria: payload.categoria,
    criticita,
    origine: {
      tipo: payload.actor?.id != null ? 'utente' : 'sistema',
      id: payload.actor?.id != null ? String(payload.actor.id) : payload.service,
      dettagli: {
        ...(payload.actor?.email ? { email: payload.actor.email } : {}),
        ...(payload.actor?.tenantId != null ? { tenantId: payload.actor.tenantId } : {}),
      },
    },
    azione: {
      tipo: 'custom',
      entita: payload.service,
      idEntita: payload.action,
      operazione: payload.message,
      dettagli: {
        ...payload.meta,
        ...(payload.duration !== undefined ? { duration: payload.duration } : {}),
        ...(payload.statusCode !== undefined ? { statusCode: payload.statusCode } : {}),
      },
    },
    risultato: {
      esito,
      messaggio: payload.message,
    },
    contesto: {
      ambiente: process.env.NODE_ENV || 'development',
    },
    tags: [payload.service, payload.level],
  };

  try {
    await axios.post(`${LOG_SERVICE_URL}/api/log/azione`, body, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': LOG_API_KEY,
      },
      timeout: 2000, // Non bloccare se il log-service è lento
    });
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
  /** categoria di default DATA: quasi tutte le chiamate info/warn/error in
   *  questo servizio riguardano operazioni sui dati di business (vedi
   *  crudFactory.ts) — si passa un valore esplicito solo dove non è così
   *  (es. auth.* in auth-service). */
  info(action: string, message: string, meta?: Record<string, unknown>, categoria: EventCategory = 'DATA', actor?: LogActor | null): void {
    void send({ level: 'info', service: SERVICE_NAME, action, message, meta, categoria, actor });
  },

  warn(action: string, message: string, meta?: Record<string, unknown>, categoria: EventCategory = 'DATA', actor?: LogActor | null): void {
    void send({ level: 'warn', service: SERVICE_NAME, action, message, meta, categoria, actor });
  },

  error(action: string, message: string, meta?: Record<string, unknown>, categoria: EventCategory = 'DATA', actor?: LogActor | null): void {
    void send({ level: 'error', service: SERVICE_NAME, action, message, meta, categoria, actor });
  },

  debug(action: string, message: string, meta?: Record<string, unknown>): void {
    if (IS_DEV) {
      void send({ level: 'debug', service: SERVICE_NAME, action, message, meta, categoria: 'SYSTEM' });
    }
  },

  // Log azione con tempo di esecuzione — utile per operazioni critiche.
  // actor viene quasi sempre passato come req.user così com'è (vedi
  // middleware/auth.ts): contiene già id/email/tenantId, nessun campo da
  // assemblare a mano.
  audit(
    action: string,
    message: string,
    actor: LogActor,
    meta?: Record<string, unknown>,
    categoria: EventCategory = 'DATA'
  ): void {
    void send({
      level: 'info',
      service: SERVICE_NAME,
      action,
      message,
      actor,
      meta: { ...meta, audit: true },
      categoria,
    });
  },

  // Log richiesta HTTP completata (usato dall'app.ts request logger).
  // Sempre categoria SYSTEM: è un log tecnico generato automaticamente per
  // ogni chiamata, non un'azione applicativa.
  request(method: string, url: string, statusCode: number, duration: number, actor?: LogActor | null): void {
    const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    void send({
      level,
      service: SERVICE_NAME,
      action: 'http_request',
      message: `${method} ${url} → ${statusCode} (${duration}ms)`,
      actor,
      statusCode,
      duration,
      categoria: 'SYSTEM',
    });
  },
};
