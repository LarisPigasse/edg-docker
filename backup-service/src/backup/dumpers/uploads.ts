// src/backup/dumpers/uploads.ts
//
// File caricati (documenti, foto): un archivio tar.gz per volume, montato in
// sola lettura. I volumi sono in config.uploads (veicoli, documenti di Vigilo):
// il prossimo modulo con file e' una riga li' e un volume nel compose (ADR099).
// La verifica rilegge l'intero archivio.
import fs from 'fs';
import path from 'path';
import { config } from '../../config';
import { run } from '../exec';
import type { Dumper } from '../types';

type Volume = (typeof config.uploads)[number];

const dumperDi = (v: Volume): Dumper => ({
  id: v.id,
  label: v.label,

  async dump(dir) {
    if (v.facoltativo && !fs.existsSync(v.dir)) {
      console.warn(`[Backup] ${v.label}: ${v.dir} non montato, saltato`);
      return [];
    }
    const escludi = v.escludi.map(e => `--exclude=${e}`);
    await run('tar', ['-czf', path.join(dir, v.file), ...escludi, '-C', v.dir, '.']);
    return [v.file];
  },

  async verify(file) {
    await run('tar', ['-tzf', file]);
  },
});

export const uploadsDumpers: Dumper[] = config.uploads.map(dumperDi);
