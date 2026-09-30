// =============================================================================
// EDG Vehicle Service - Logger Service
// Invia log al log-service centralizzato (MongoDB)
// Fallback silenzioso su console se il servizio non è raggiungibile
// =============================================================================
import { currentRequestId } from './requestContext';
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
export interface LogActor {
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
  /** Stato prima/dopo (auditChange) */
  stato?: StateChange;
}

// ---------------------------------------------------------------------------
// Configurazione
// ---------------------------------------------------------------------------
const LOG_SERVICE_URL = process.env.LOG_SERVICE_URL || 'http://log-service:4000';
const LOG_API_KEY = process.env.LOG_API_KEY_SECRET || '';
// Identificativo stabile del servizio negli eventi: coincide con il nome del
// container, usato anche dall'HealthMonitor (ADR044). NON deriva da
// process.env.SERVICE_NAME, che e' il nome visualizzato ("EDG ... Service").
const SERVICE_NAME = 'vehicle-service';
const IS_DEV = process.env.NODE_ENV === 'development';

// ---------------------------------------------------------------------------
// Coda di attesa degli eventi (ADR041)
// Se log-service non risponde (riavvio, deploy, guasto) l'evento NON viene
// scartato: resta in coda in memoria e viene ritentato ogni RETRY_MS, in
// ordine. Il timestamp e' gia' nell'evento, quindi l'ordine temporale nei log
// resta corretto. Coda limitata: oltre QUEUE_MAX si perdono i piu' vecchi e,
// alla ripresa, arriva un evento log.events_lost con il loro numero.
// Limite accettato: un riavvio di QUESTO servizio perde la coda in memoria.
// Blocco identico nei logger di auth-service, system-service, vehicle-service.
// ---------------------------------------------------------------------------
const QUEUE_MAX = 1024;
const RETRY_MS = 16000;

type DeliveryResult = 'ok' | 'retry' | 'drop';

const queue: Record<string, unknown>[] = [];
let dropped = 0;
let flushing = false;
let retryTimer: NodeJS.Timeout | null = null;

function scheduleRetry(): void {
  if (retryTimer) return;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    void flushQueue();
  }, RETRY_MS);
  retryTimer.unref?.();
}

function enqueue(body: Record<string, unknown>): void {
  if (queue.length === 0) console.warn('[Logger] Log-service non raggiungibile: eventi in coda, nuovo tentativo tra 16 s');
  if (queue.length >= QUEUE_MAX) {
    queue.shift();
    dropped++;
  }
  queue.push(body);
  scheduleRetry();
}

/** Evento che documenta gli eventi persi per coda piena */
function lostEventsNotice(count: number): Record<string, unknown> {
  const message = `${count} eventi di log persi: log-service non raggiungibile e coda di attesa piena`;
  return {
    timestamp: new Date().toISOString(),
    categoria: 'SYSTEM',
    sottoCategoria: 'log.events_lost',
    criticita: 'warning',
    origine: { tipo: 'sistema', id: SERVICE_NAME, dettagli: {} },
    azione: { tipo: 'custom', entita: SERVICE_NAME, idEntita: 'log.events_lost', operazione: message, dettagli: { persi: count } },
    risultato: { esito: 'parziale', messaggio: message },
    contesto: { ambiente: process.env.NODE_ENV || 'development' },
    tags: [SERVICE_NAME, 'warn'],
  };
}

async function flushQueue(): Promise<void> {
  if (flushing) return;
  flushing = true;
  let delivered = 0;
  try {
    while (queue.length > 0) {
      const result = await post(queue[0]);
      if (result === 'retry') break;
      queue.shift();
      if (result === 'ok') delivered++;
    }
    if (queue.length === 0 && dropped > 0) {
      const count = dropped;
      dropped = 0;
      if ((await post(lostEventsNotice(count))) === 'retry') dropped += count;
    }
  } finally {
    flushing = false;
    if (delivered > 0) console.log(`[Logger] Log-service di nuovo raggiungibile: consegnati ${delivered} eventi in coda`);
    if (queue.length > 0 || dropped > 0) scheduleRetry();
  }
}

/** Consegna subito se possibile; altrimenti (o se c'e' gia' coda, per l'ordine) accoda */
async function deliver(body: Record<string, unknown>): Promise<void> {
  if (queue.length === 0 && !flushing) {
    if ((await post(body)) !== 'retry') return;
  }
  enqueue(body);
}

/** Un tentativo di invio a log-service (axios, timeout 2 s) */
async function post(body: Record<string, unknown>): Promise<DeliveryResult> {
  try {
    await axios.post(`${LOG_SERVICE_URL}/api/log/azione`, body, {
      headers: { 'Content-Type': 'application/json', 'x-api-key': LOG_API_KEY },
      timeout: 2000, // Non bloccare se il log-service è lento
    });
    return 'ok';
  } catch (err: any) {
    const status: number | undefined = err?.response?.status;
    if (status === undefined || status >= 500 || status === 429) return 'retry';
    console.error(`[Logger] Evento rifiutato da log-service (HTTP ${status}): ${String(body.sottoCategoria ?? '')}`);
    return 'drop';
  }
}

// ---------------------------------------------------------------------------
// Invio al log-service (non bloccante, con coda di attesa — ADR041)
// ---------------------------------------------------------------------------
async function send(payload: LogPayload): Promise<void> {
  await deliver(buildBody(payload));
}

/** Evento nel formato di log-service (AzioneLog); in development anche su console */
function buildBody(payload: LogPayload): Record<string, unknown> {
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
    // Tipo di evento (es. 'auth.login_failed', 'crud.create'): e' il campo su
    // cui lavorano le regole di alerting di log-service (ADR038).
    sottoCategoria: payload.action,
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
      // ID della richiesta dall'api-gateway (ADR039), assente per i processi pianificati
      ...(currentRequestId() ? { transazioneId: currentRequestId() } : {}),
    },
    tags: [payload.service, payload.level],
    ...(payload.stato ? { stato: { ...payload.stato, diff: null } } : {}),
  };

  return body;
}

// ---------------------------------------------------------------------------
// Arresto per errore non gestito (ADR043)
// Un'eccezione o una promise rifiutata che nessuno gestisce fa cadere il
// processo; Docker lo riavvia e l'HealthMonitor vede il riavvio (ADR042), ma
// non la causa. Qui la causa viene inviata a log-service come evento
// 'process.crashed' (critico, con lo stack) PRIMA di uscire: un solo
// tentativo diretto, piu' lo svuotamento della coda, entro CRASH_FLUSH_MS.
// Il comportamento resta quello di Node: dopo un errore non gestito lo stato
// del processo non e' affidabile, quindi si esce comunque con codice 1.
// ---------------------------------------------------------------------------
const CRASH_FLUSH_MS = 2048;
const CRASH_STACK_MAX = 2048;
type CrashOrigin = 'uncaughtException' | 'unhandledRejection';
let crashing = false;

async function reportCrash(error: unknown, origin: CrashOrigin): Promise<void> {
  const err = error instanceof Error ? error : new Error(String(error));
  const body = buildBody({
    level: 'error',
    service: SERVICE_NAME,
    action: 'process.crashed',
    categoria: 'SYSTEM',
    message: `Arresto per errore non gestito: ${err.message}`,
    meta: { origine: origin, errore: err.name, stack: (err.stack ?? '').slice(0, CRASH_STACK_MAX) },
  });
  body.criticita = 'critical';

  const attempt = Promise.all([post(body), queue.length > 0 ? flushQueue() : Promise.resolve()]);
  const deadline = new Promise<void>(resolve => setTimeout(resolve, CRASH_FLUSH_MS));
  await Promise.race([attempt, deadline]);
}

/** Da chiamare una volta all'avvio, prima di qualunque altra inizializzazione */
export function installCrashHandlers(): void {
  const onFatal = (origin: CrashOrigin) => (error: unknown) => {
    console.error(`[${SERVICE_NAME}] ${origin}:`, error);
    // Un secondo errore durante la segnalazione non la ripete
    if (crashing) return;
    crashing = true;
    void reportCrash(error, origin).finally(() => process.exit(1));
  };
  process.on('uncaughtException', onFatal('uncaughtException'));
  process.on('unhandledRejection', onFatal('unhandledRejection'));
}

// ---------------------------------------------------------------------------
// Politica di persistenza delle richieste HTTP (ADR034)
// "Chi ha fatto cosa" e' garantito dagli eventi di audit espliciti
// (logger.audit): questo livello tecnico e' una rete di sicurezza. Si scarta
// SOLO la lettura riuscita e veloce:
//   - metodi di scrittura (POST/PUT/PATCH/DELETE) -> sempre, qualunque esito
//   - qualunque metodo con statusCode >= 400       -> sempre (401/403/4xx/5xx)
//   - qualunque metodo piu' lento di SLOW_REQUEST_MS -> sempre (meta.slow)
// Funzione identica in auth-service, system-service e vehicle-service.
// ---------------------------------------------------------------------------
const SLOW_REQUEST_MS = Number(process.env.LOG_SLOW_REQUEST_MS) || 1024;
const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function shouldPersistRequest(method: string, statusCode: number, duration: number): boolean {
  if (statusCode >= 400) return true;
  if (duration >= SLOW_REQUEST_MS) return true;
  return !READ_METHODS.has(method.toUpperCase());
}

// ---------------------------------------------------------------------------
// Stato prima/dopo per l'audit delle modifiche (ADR039, punto 2)
// log-service calcola da solo il diff quando riceve precedente e nuovo
// (utils/diffUtils.ts). Qui si prepara solo lo snapshot: oggetto semplice,
// senza campi sensibili ne' campi che cambiano sempre (sporcherebbero il diff).
// ---------------------------------------------------------------------------
export interface StateChange {
  precedente: Record<string, unknown> | null;
  nuovo: Record<string, unknown> | null;
}

const SENSITIVE_KEY = /password|token|secret|hash/i;
const NOISE_KEYS = new Set(['createdAt', 'updatedAt', 'deletedAt', 'created_at', 'updated_at', 'deleted_at']);

/** Snapshot di un record (istanza Sequelize o oggetto) pronto per l'audit */
export function snapshot(record: unknown): Record<string, unknown> | null {
  if (!record) return null;
  const withGet = record as { get?: (opts: { plain: boolean }) => unknown };
  const plain = typeof withGet.get === 'function' ? withGet.get({ plain: true }) : record;
  const clean = JSON.parse(JSON.stringify(plain)) as Record<string, unknown>;
  return Object.fromEntries(Object.entries(clean).filter(([k]) => !SENSITIVE_KEY.test(k) && !NOISE_KEYS.has(k)));
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

  // Audit di una modifica con stato prima/dopo (ADR039): creazione (solo
  // nuovo), modifica (entrambi), eliminazione (solo precedente). Passare gli
  // stati gia' preparati con snapshot().
  auditChange(
    action: string,
    message: string,
    actor: LogActor,
    stato: StateChange,
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
      stato,
    });
  },

  // Log richiesta HTTP completata (usato dal request logger in app.ts).
  // Sempre categoria SYSTEM: e' un log tecnico generato automaticamente, non
  // un'azione applicativa. Filtrato da shouldPersistRequest() (ADR034): le
  // letture riuscite e veloci non arrivano a log-service — in development
  // restano visibili solo in console.
  request(method: string, url: string, statusCode: number, duration: number, actor?: LogActor | null): void {
    const message = `${method} ${url} → ${statusCode} (${duration}ms)`;

    if (!shouldPersistRequest(method, statusCode, duration)) {
      if (IS_DEV) console.log(`· [${SERVICE_NAME}] http_request: ${message}`);
      return;
    }

    const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    void send({
      level,
      service: SERVICE_NAME,
      action: 'http_request',
      message,
      actor,
      statusCode,
      duration,
      meta: {
        method: method.toUpperCase(),
        ...(duration >= SLOW_REQUEST_MS ? { slow: true } : {}),
      },
      categoria: 'SYSTEM',
    });
  },
};
