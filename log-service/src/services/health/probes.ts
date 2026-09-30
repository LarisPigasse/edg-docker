// src/services/health/probes.ts
//
// Sonde di salute (ADR038). Ognuna risolve SEMPRE (mai reject) con un
// ProbeResult: il chiamante non deve gestire eccezioni. Per i database si
// verifica che risponda il protocollo, non solo che la porta sia aperta:
//   - MySQL:     il server invia per primo il pacchetto di handshake
//   - Postgres:  SSLRequest -> il server risponde 'S' o 'N'
//   - Redis:     PING -> qualunque risposta RESP (anche -NOAUTH) = vivo
//   - MongoDB:   comando admin ping sulla connessione di log-service
import net from 'net';
import fetch from 'node-fetch';
import mongoose from 'mongoose';
import type { BuildInfo } from '../buildInfo';

export const PROBE_TIMEOUT_MS = Number(process.env.HEALTH_PROBE_TIMEOUT_MS) || 4096;

export interface ProbeResult {
  ok: boolean;
  latencyMs: number | null;
  error?: string;
  /** Secondi di attivita' del processo, se il servizio li espone in /health */
  uptimeSec?: number;
  /** Identita' della build in esecuzione, se esposta (ADR044) */
  build?: BuildInfo;
}

const elapsed = (start: number) => Date.now() - start;

/**
 * Dati utili dal corpo di /health, in radice (gateway, system, vehicle,
 * email) o in `data` (auth):
 *   - uptime -> riconoscere i riavvii (ADR042)
 *   - build  -> riconoscere i deploy (ADR044)
 * Corpo non JSON o campi assenti: omessi, il controllo resta valido.
 */
type HealthBody = { uptime?: unknown; build?: unknown };

async function readHealthBody(res: { json(): Promise<unknown> }): Promise<Pick<ProbeResult, 'uptimeSec' | 'build'>> {
  try {
    const raw = (await res.json()) as HealthBody & { data?: HealthBody };
    const uptime = Number(raw?.uptime ?? raw?.data?.uptime);
    const build = (raw?.build ?? raw?.data?.build) as Partial<BuildInfo> | undefined;
    const text = (v: unknown) => (typeof v === 'string' && v ? v : null);
    return {
      ...(Number.isFinite(uptime) && uptime >= 0 ? { uptimeSec: uptime } : {}),
      ...(build && typeof build === 'object'
        ? { build: { version: text(build.version), builtAt: text(build.builtAt), commit: text(build.commit) } }
        : {}),
    };
  } catch {
    return {};
  }
}

/** GET <url>: sano se risponde 2xx entro il timeout */
export async function httpProbe(url: string): Promise<ProbeResult> {
  const start = Date.now();
  try {
    const res = await fetch(url, { timeout: PROBE_TIMEOUT_MS });
    const latencyMs = elapsed(start);
    if (!res.ok) return { ok: false, latencyMs, error: `HTTP ${res.status}` };
    return { ok: true, latencyMs, ...(await readHealthBody(res)) };
  } catch (err: any) {
    return { ok: false, latencyMs: null, error: err?.code || err?.message || 'Non raggiungibile' };
  }
}

interface TcpOptions {
  /** Byte da inviare appena connessi (es. SSLRequest, PING) */
  send?: Buffer;
  /** Validazione della prima risposta; assente = basta la connessione */
  expect?: (data: Buffer) => boolean;
}

/** Connessione TCP con eventuale scambio di un messaggio di protocollo */
export function tcpProbe(host: string, port: number, opts: TcpOptions = {}): Promise<ProbeResult> {
  const start = Date.now();
  return new Promise(resolve => {
    const socket = new net.Socket();
    let settled = false;
    const done = (result: ProbeResult) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(PROBE_TIMEOUT_MS, () => done({ ok: false, latencyMs: null, error: 'Timeout' }));
    socket.once('error', (err: any) => done({ ok: false, latencyMs: null, error: err?.code || err?.message }));

    socket.connect(port, host, () => {
      if (!opts.expect) return done({ ok: true, latencyMs: elapsed(start) });
      if (opts.send) socket.write(opts.send);
    });

    socket.once('data', data => {
      if (!opts.expect) return;
      done(
        opts.expect(data)
          ? { ok: true, latencyMs: elapsed(start) }
          : { ok: false, latencyMs: elapsed(start), error: 'Risposta di protocollo inattesa' }
      );
    });
  });
}

// --- Protocolli dei database ------------------------------------------------

/** MySQL: il server parla per primo; il payload inizia con la versione 10 */
export const mysqlProbe = (host: string, port = 3306) =>
  tcpProbe(host, port, { expect: d => d.length > 4 && (d[4] === 0x0a || d[4] === 0xff) });

/** Postgres: SSLRequest (8 byte), risposta attesa 'S' o 'N' */
export const postgresProbe = (host: string, port = 5432) =>
  tcpProbe(host, port, {
    send: Buffer.from([0x00, 0x00, 0x00, 0x08, 0x04, 0xd2, 0x16, 0x2f]),
    expect: d => d[0] === 0x53 || d[0] === 0x4e,
  });

/** Redis: PING inline; +PONG o un errore RESP (-NOAUTH) indicano un server vivo */
export const redisProbe = (host: string, port = 6379) =>
  tcpProbe(host, port, {
    send: Buffer.from('PING\r\n'),
    expect: d => d[0] === 0x2b /* + */ || d[0] === 0x2d /* - */,
  });

/** MongoDB: ping sulla connessione gia' aperta da log-service */
export async function mongoProbe(): Promise<ProbeResult> {
  const start = Date.now();
  try {
    const db = mongoose.connection.db;
    if (mongoose.connection.readyState !== 1 || !db) {
      return { ok: false, latencyMs: null, error: `Connessione non attiva (stato ${mongoose.connection.readyState})` };
    }
    await Promise.race([
      db.admin().ping(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), PROBE_TIMEOUT_MS)),
    ]);
    return { ok: true, latencyMs: elapsed(start) };
  } catch (err: any) {
    return { ok: false, latencyMs: null, error: err?.message || 'Ping fallito' };
  }
}
