// src/backup/storage.ts
//
// Organizzazione della cartella di destinazione (ADR045):
//
//   <BACKUP_DIR>/daily/2026-09-30_1200/     un backup completo + manifest.json
//               /weekly/2026-09-28_1200/    primo backup di ogni settimana
//               /monthly/2026-09-01_1200/   primo backup di ogni mese
//
// Ogni cartella nasce come ".partial-<nome>" e viene rinominata solo quando
// e' completa e verificata: una cartella con il nome definitivo e' sempre
// un backup buono. Le copie settimanali/mensili seguono la stessa regola.
// La promozione usa il "primo backup della settimana/del mese" invece di un
// giorno fisso: se il PC e' spento la domenica o il primo del mese, la copia
// arriva comunque al primo backup utile.
import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { monthKey, parseBackupName, weekKey, type LocalDate } from './calendar';
import type { Manifest } from './types';

export type Level = 'daily' | 'weekly' | 'monthly';
export const LEVELS: Level[] = ['daily', 'weekly', 'monthly'];

const PARTIAL = '.partial-';
export const MANIFEST = 'manifest.json';

export const levelDir = (level: Level) => path.join(config.dir, level);
export const partialDir = (level: Level, name: string) => path.join(levelDir(level), `${PARTIAL}${name}`);

export async function ensureLayout(): Promise<void> {
  for (const level of LEVELS) await fs.promises.mkdir(levelDir(level), { recursive: true });
}

/** Backup completi di un livello, dal piu' recente */
export async function listBackups(level: Level): Promise<string[]> {
  const entries = await fs.promises.readdir(levelDir(level), { withFileTypes: true }).catch(() => []);
  return entries
    .filter(e => e.isDirectory() && parseBackupName(e.name))
    .map(e => e.name)
    .sort()
    .reverse();
}

/** Rimuove le cartelle parziali lasciate da un'esecuzione interrotta */
export async function removePartials(): Promise<void> {
  for (const level of LEVELS) {
    const entries = await fs.promises.readdir(levelDir(level)).catch(() => [] as string[]);
    for (const name of entries.filter(n => n.startsWith(PARTIAL))) {
      await fs.promises.rm(path.join(levelDir(level), name), { recursive: true, force: true });
    }
  }
}

/** Copia un backup giornaliero nel livello settimanale/mensile, se e' il primo del periodo */
export async function promote(name: string, date: LocalDate): Promise<Level[]> {
  const promoted: Level[] = [];
  const periodOf: Record<'weekly' | 'monthly', (d: LocalDate) => string> = { weekly: weekKey, monthly: monthKey };

  for (const level of ['weekly', 'monthly'] as const) {
    const latest = (await listBackups(level))[0];
    const latestDate = latest ? parseBackupName(latest) : null;
    if (latestDate && periodOf[level](latestDate) === periodOf[level](date)) continue;

    const target = partialDir(level, name);
    await fs.promises.cp(path.join(levelDir('daily'), name), target, { recursive: true });
    await fs.promises.rename(target, path.join(levelDir(level), name));
    promoted.push(level);
  }
  return promoted;
}

/** Conserva solo i piu' recenti di ogni livello; restituisce quanti ne ha eliminati */
export async function prune(): Promise<number> {
  let removed = 0;
  for (const level of LEVELS) {
    for (const name of (await listBackups(level)).slice(config.keep[level])) {
      await fs.promises.rm(path.join(levelDir(level), name), { recursive: true, force: true });
      removed++;
    }
  }
  return removed;
}

/** Ultimo backup completo (giornaliero), con il suo manifest */
export async function latestBackup(): Promise<Manifest | null> {
  const name = (await listBackups('daily'))[0];
  if (!name) return null;
  try {
    return JSON.parse(await fs.promises.readFile(path.join(levelDir('daily'), name, MANIFEST), 'utf8')) as Manifest;
  } catch {
    return null;
  }
}
