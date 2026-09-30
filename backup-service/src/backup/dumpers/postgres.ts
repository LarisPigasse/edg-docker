// src/backup/dumpers/postgres.ts
//
// PostgreSQL (system-service, vehicle-service): un file per database nel
// formato "custom" di pg_dump (gia' compresso, ripristinabile anche per
// singola tabella con pg_restore), piu' i ruoli del cluster (utenti e
// permessi), senza i quali i dump non si ripristinano su un server nuovo.
// L'elenco dei database e' letto dal server: un database nuovo entra nel
// backup senza modifiche al codice.
import path from 'path';
import { config } from '../../config';
import { run } from '../exec';
import { gzipTail } from './gzipTail';
import type { Dumper } from '../types';

const GLOBALS_FILE = 'postgres-globals.sql.gz';
const GLOBALS_END = 'PostgreSQL database cluster dump complete';

const connection = () => {
  const { host, user, password } = config.postgres;
  return { args: [`--host=${host}`, `--username=${user}`, '--no-password'], env: { PGPASSWORD: password } };
};

async function listDatabases(): Promise<string[]> {
  const { args, env } = connection();
  const out = await run(
    'psql',
    [...args, '--dbname=postgres', '--tuples-only', '--no-align', '--command',
      "SELECT datname FROM pg_database WHERE NOT datistemplate AND datname <> 'postgres' ORDER BY datname"],
    { env }
  );
  return out.split('\n').map(s => s.trim()).filter(Boolean);
}

export const postgresDumper: Dumper = {
  id: 'postgres',
  label: 'PostgreSQL',

  async dump(dir) {
    const { args, env } = connection();
    const files: string[] = [];

    await run('pg_dumpall', [...args, '--globals-only'], { env, stdoutTo: path.join(dir, GLOBALS_FILE), gzip: true });
    files.push(GLOBALS_FILE);

    for (const db of await listDatabases()) {
      const file = `postgres-${db}.dump`;
      await run('pg_dump', [...args, `--dbname=${db}`, '--format=custom', `--file=${path.join(dir, file)}`], { env });
      files.push(file);
    }
    return files;
  },

  async verify(file) {
    if (file.endsWith(GLOBALS_FILE)) {
      const tail = await gzipTail(file);
      if (!tail.includes(GLOBALS_END)) throw new Error('ruoli PostgreSQL incompleti (manca il marcatore di fine)');
      return;
    }
    // Legge l'indice dell'archivio: fallisce se il file e' troncato o non e' un dump
    const toc = await run('pg_restore', ['--list', file]);
    if (!toc.includes('Archive created at')) throw new Error(`${path.basename(file)}: indice dell'archivio non leggibile`);
  },
};
