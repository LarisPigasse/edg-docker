// src/backup/run.ts
//
// Un backup completo (ADR045):
//   1. pulizia di eventuali cartelle parziali di un'esecuzione interrotta
//   2. dump di ogni sorgente in daily/.partial-<nome>
//   3. verifica di ogni file prodotto
//   4. manifest.json (dimensione e SHA-256 di ogni file)
//   5. rinomina nella cartella definitiva: da qui il backup "esiste"
//   6. promozione a settimanale/mensile se e' il primo del periodo
//   7. eliminazione dei backup oltre la conservazione configurata
// Qualunque errore interrompe il backup e lascia i precedenti intatti.
// Un'esecuzione alla volta: una richiesta durante un backup in corso viene
// rifiutata, non accodata.
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { BUILD_INFO } from '../services/buildInfo';
import { backupName, localDate } from './calendar';
import { DUMPERS } from './dumpers';
import { MANIFEST, ensureLayout, levelDir, partialDir, promote, prune, removePartials } from './storage';
import type { Manifest, ManifestFile } from './types';

let running: Promise<string> | null = null;

export const isRunning = (): boolean => running !== null;

async function sha256(file: string): Promise<string> {
  const hash = crypto.createHash('sha256');
  await pipeline(fs.createReadStream(file), hash);
  return hash.digest('hex');
}

export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

async function execute(): Promise<string> {
  const start = Date.now();
  const date = localDate();
  const name = backupName(date);

  await ensureLayout();
  await removePartials();

  const workDir = partialDir('daily', name);
  await fs.promises.mkdir(workDir, { recursive: true });

  try {
    const files: ManifestFile[] = [];
    for (const dumper of DUMPERS) {
      let produced: string[];
      try {
        produced = await dumper.dump(workDir);
        for (const file of produced) await dumper.verify(path.join(workDir, file));
      } catch (err) {
        throw new Error(`${dumper.label}: ${err instanceof Error ? err.message : String(err)}`);
      }
      for (const file of produced) {
        const full = path.join(workDir, file);
        files.push({ name: file, source: dumper.id, bytes: (await fs.promises.stat(full)).size, sha256: await sha256(full) });
      }
    }

    const manifest: Manifest = {
      name,
      createdAt: new Date().toISOString(),
      durationMs: Date.now() - start,
      build: { ...BUILD_INFO },
      files,
    };
    await fs.promises.writeFile(path.join(workDir, MANIFEST), JSON.stringify(manifest, null, 2));
    await fs.promises.rename(workDir, path.join(levelDir('daily'), name));

    const promoted = await promote(name, date);
    const removed = await prune();

    const total = files.reduce((sum, f) => sum + f.bytes, 0);
    const extra = [
      promoted.length ? `copiato in ${promoted.map(l => (l === 'weekly' ? 'settimanali' : 'mensili')).join(' e ')}` : '',
      removed ? `${removed} backup vecchi eliminati` : '',
    ].filter(Boolean);
    return `${name}: ${files.length} file, ${formatBytes(total)} in ${Math.round((Date.now() - start) / 1000)} s` +
      (extra.length ? ` (${extra.join(', ')})` : '');
  } catch (err) {
    await fs.promises.rm(workDir, { recursive: true, force: true }).catch(() => undefined);
    throw err;
  }
}

/** Esegue un backup; se ne e' gia' in corso uno, rifiuta */
export function runBackup(): Promise<string> {
  if (running) return Promise.reject(new Error('Un backup e\' gia\' in corso'));
  running = execute().finally(() => {
    running = null;
  });
  return running;
}
