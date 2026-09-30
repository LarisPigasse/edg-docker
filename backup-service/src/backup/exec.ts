// src/backup/exec.ts
//
// Esecuzione degli strumenti di dump (mysqldump, pg_dump, mongodump, tar).
// Le password passano per variabili d'ambiente o file temporanei, mai come
// argomenti: resterebbero visibili nell'elenco dei processi.
// L'output puo' andare direttamente su file, eventualmente compresso con
// gzip in streaming: nessun dump passa per intero dalla memoria.
import { spawn } from 'child_process';
import fs from 'fs';
import zlib from 'zlib';
import { pipeline } from 'stream/promises';

export interface RunOptions {
  /** Variabili aggiunte all'ambiente del processo (es. PGPASSWORD) */
  env?: Record<string, string>;
  /** Scrive lo stdout su questo file invece di raccoglierlo */
  stdoutTo?: string;
  /** Con stdoutTo: comprime con gzip mentre scrive */
  gzip?: boolean;
  /** Tempo massimo, poi il processo viene terminato */
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 16 * 60 * 1000;
/** Quanto stdout (senza stdoutTo) e stderr conservare per i messaggi */
const MAX_CAPTURE = 64 * 1024;

const tail = (s: string) => (s.length > MAX_CAPTURE ? s.slice(-MAX_CAPTURE) : s);

/** Esegue un comando; risolve con lo stdout raccolto, rifiuta con lo stderr se l'esito non e' 0 */
export function run(cmd: string, args: string[], opts: RunOptions = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { env: { ...process.env, ...opts.env }, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);

    child.stderr.on('data', chunk => (stderr = tail(stderr + chunk)));

    const output: Promise<void> = opts.stdoutTo
      ? opts.gzip
        ? pipeline(child.stdout, zlib.createGzip({ level: 6 }), fs.createWriteStream(opts.stdoutTo))
        : pipeline(child.stdout, fs.createWriteStream(opts.stdoutTo))
      : new Promise(done => {
          child.stdout.on('data', chunk => (stdout = tail(stdout + chunk)));
          child.stdout.on('end', () => done());
        });

    child.on('error', err => {
      clearTimeout(timer);
      reject(new Error(`${cmd}: ${err.message}`));
    });

    child.on('close', code => {
      clearTimeout(timer);
      output
        .then(() => {
          if (timedOut) return reject(new Error(`${cmd}: interrotto dopo il tempo massimo`));
          if (code !== 0) return reject(new Error(`${cmd} (esito ${code}): ${stderr.trim().split('\n').slice(-4).join(' | ')}`));
          resolve(stdout);
        })
        .catch(err => reject(new Error(`${cmd}: scrittura dell'output fallita — ${err.message}`)));
    });
  });
}
