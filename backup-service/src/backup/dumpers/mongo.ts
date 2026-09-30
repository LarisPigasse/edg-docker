// src/backup/dumpers/mongo.ts
//
// MongoDB di log-service: mongodump in un unico archivio con le collezioni
// compresse. La verifica usa mongorestore in modalita' --dryRun: legge
// l'intero archivio senza scrivere nulla nel database.
// La password passa da un file di configurazione temporaneo (0600), mai
// dalla riga di comando.
import fs from 'fs';
import os from 'os';
import path from 'path';
import { config } from '../../config';
import { run } from '../exec';
import type { Dumper } from '../types';

const FILE = 'log-mongo.archive';

async function withCredentials<T>(fn: (args: string[]) => Promise<T>): Promise<T> {
  const { host, user, password } = config.mongo;
  const configFile = path.join(os.tmpdir(), `mongo-${process.pid}-${Date.now()}.yaml`);
  await fs.promises.writeFile(configFile, `password: ${JSON.stringify(password)}\n`, { mode: 0o600 });
  try {
    return await fn([`--host=${host}`, `--username=${user}`, '--authenticationDatabase=admin', `--config=${configFile}`]);
  } finally {
    await fs.promises.rm(configFile, { force: true });
  }
}

export const mongoDumper: Dumper = {
  id: 'mongo',
  label: 'MongoDB (log)',

  async dump(dir) {
    await withCredentials(args => run('mongodump', [...args, `--archive=${path.join(dir, FILE)}`, '--gzip', '--quiet']));
    return [FILE];
  },

  async verify(file) {
    await withCredentials(args => run('mongorestore', [...args, `--archive=${file}`, '--gzip', '--dryRun', '--quiet']));
  },
};
