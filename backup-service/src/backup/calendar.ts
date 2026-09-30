// src/backup/calendar.ts
//
// Date nel fuso orario configurato (TZ, default Europe/Rome): i nomi delle
// cartelle e le regole settimana/mese seguono il calendario locale, non UTC.
import { config } from '../config';

export interface LocalDate {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export function localDate(at: Date = new Date()): LocalDate {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: config.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(at);
  const get = (type: string) => Number(parts.find(p => p.type === type)?.value);
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute') };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Nome della cartella di un backup: "2026-09-30_1200" (ordinabile come testo) */
export const backupName = (d: LocalDate): string =>
  `${d.year}-${pad(d.month)}-${pad(d.day)}_${pad(d.hour)}${pad(d.minute)}`;

/** Data locale ricavata dal nome di una cartella di backup */
export function parseBackupName(name: string): LocalDate | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})_(\d{2})(\d{2})$/.exec(name);
  if (!m) return null;
  const [year, month, day, hour, minute] = m.slice(1).map(Number);
  return { year, month, day, hour, minute };
}

/** Mese: "2026-09" */
export const monthKey = (d: LocalDate): string => `${d.year}-${pad(d.month)}`;

/** Settimana ISO 8601 (lunedi'-domenica): "2026-W40" */
export function weekKey(d: LocalDate): string {
  const date = new Date(Date.UTC(d.year, d.month - 1, d.day));
  const weekday = date.getUTCDay() || 7; // lunedi' = 1 ... domenica = 7
  date.setUTCDate(date.getUTCDate() + 4 - weekday); // giovedi' della stessa settimana
  const yearStart = Date.UTC(date.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((date.getTime() - yearStart) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${pad(week)}`;
}
