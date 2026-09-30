// src/backup/dumpers/uploads.ts
//
// File caricati dai veicoli (documenti, foto): archivio tar.gz del volume,
// montato in sola lettura. La verifica rilegge l'intero archivio.
import path from 'path';
import { config } from '../../config';
import { run } from '../exec';
import type { Dumper } from '../types';

const FILE = 'vehicle-uploads.tar.gz';

export const uploadsDumper: Dumper = {
  id: 'uploads',
  label: 'File caricati (veicoli)',

  async dump(dir) {
    await run('tar', ['-czf', path.join(dir, FILE), '-C', config.uploadsDir, '.']);
    return [FILE];
  },

  async verify(file) {
    await run('tar', ['-tzf', file]);
  },
};
