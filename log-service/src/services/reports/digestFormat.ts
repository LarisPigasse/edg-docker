// src/services/reports/digestFormat.ts
//
// Presentazione del riepilogo giornaliero (ADR046): dai dati grezzi
// (digestData.ts) ai testi dell'email. Il modello di email-service
// (reports/daily-digest) e' volutamente "stupido": ripete sezioni, righe ed
// elementi gia' pronti. Cambiare il contenuto del riepilogo non richiede di
// toccare email-service.
import type { JobState } from '../jobs/JobMonitor';
import { MAX_LISTED_EVENTS, type DigestData } from './digestData';

type Tone = 'ok' | 'warning' | 'danger' | 'muted';

const COLORS: Record<Tone, string> = {
  ok: '#1e7e34',
  warning: '#9a6700',
  danger: '#b42318',
  muted: '#667085',
};

export interface DigestRow {
  label: string;
  value: string;
  color: string;
}

export interface DigestItem {
  at: string;
  text: string;
  color: string;
}

export interface DigestSection {
  title: string;
  rows: DigestRow[];
  items: DigestItem[];
  empty: string | null;
}

export interface DigestTemplateData {
  title: string;
  period: string;
  verdict: { label: string; color: string; background: string };
  problems: string[];
  sections: DigestSection[];
  infoUrl: string;
}

const TZ = 'Europe/Rome';
const dateTime = (d: Date) =>
  d.toLocaleString('it-IT', { timeZone: TZ, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', '');
const time = (d: Date) => d.toLocaleTimeString('it-IT', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
const dayMonth = (d: Date) => d.toLocaleDateString('it-IT', { timeZone: TZ, day: '2-digit', month: '2-digit' });

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const row = (label: string, value: string | number, tone: Tone = 'muted'): DigestRow => ({
  label,
  value: String(value),
  color: COLORS[tone],
});

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

const EVENT_TONE: Record<string, Tone> = {
  'health.down': 'danger',
  'process.crashed': 'danger',
  'log.events_lost': 'danger',
  'health.restarted': 'warning',
  'health.recovered': 'ok',
  'deploy.detected': 'muted',
};

const JOB_LABEL: Record<JobState['status'], { label: string; tone: Tone }> = {
  OK: { label: 'Regolare', tone: 'ok' },
  FAILED: { label: 'Fallito', tone: 'danger' },
  LATE: { label: 'Non eseguito', tone: 'danger' },
  PENDING: { label: 'In attesa della prima esecuzione', tone: 'muted' },
};

// ---------------------------------------------------------------------------
// Problemi: cio' che merita attenzione, in testa all'email
// ---------------------------------------------------------------------------
export function findProblems(d: DigestData, selfJobId: string): string[] {
  const problems: string[] = [];

  const down = d.services.filter(s => s.status === 'DOWN');
  if (down.length) problems.push(`Non raggiungibili adesso: ${down.map(s => s.name).join(', ')}`);

  for (const j of d.jobs.filter(j => j.id !== selfJobId)) {
    if (j.status === 'FAILED') problems.push(`${j.name}: ultima esecuzione fallita`);
    if (j.status === 'LATE') problems.push(`${j.name}: non eseguito nel tempo previsto`);
  }

  const crashes = d.serviceEvents.filter(e => e.type === 'process.crashed').length;
  if (crashes) problems.push(`${plural(crashes, 'arresto', 'arresti')} per errore non gestito`);

  if (d.serviceEvents.some(e => e.type === 'log.events_lost')) problems.push('Eventi di log persi (coda piena)');

  const critical = d.alerts.reduce((n, a) => n + a.critical, 0);
  if (critical) problems.push(`${plural(critical, 'allarme critico', 'allarmi critici')}`);

  const failed = d.alerts.reduce((n, a) => n + a.failed, 0);
  if (failed) problems.push(`${plural(failed, 'allarme non inviato', 'allarmi non inviati')}`);

  return problems;
}

// ---------------------------------------------------------------------------
// Sezioni
// ---------------------------------------------------------------------------
function servicesSection(d: DigestData): DigestSection {
  const known = d.services.filter(s => s.status !== 'UNKNOWN');
  const up = known.filter(s => s.status === 'UP').length;
  const rows = [row('Operativi adesso', `${up} su ${known.length}`, up === known.length ? 'ok' : 'danger')];
  for (const s of d.services.filter(s => s.status === 'DOWN' || s.status === 'DEGRADED')) {
    rows.push(row(s.name, s.status === 'DOWN' ? 'Non raggiungibile' : 'Rallentato', s.status === 'DOWN' ? 'danger' : 'warning'));
  }

  const items = d.serviceEvents.map(e => ({
    at: dateTime(e.at),
    text: e.message,
    color: COLORS[EVENT_TONE[e.type] ?? 'muted'],
  }));
  const hidden = d.serviceEventsTotal - d.serviceEvents.length;
  if (hidden > 0) items.push({ at: '', text: `… e altri ${hidden} eventi (primi ${MAX_LISTED_EVENTS} mostrati)`, color: COLORS.muted });

  return { title: 'Servizi', rows, items, empty: items.length ? null : 'Nessun disservizio, riavvio o deploy.' };
}

function jobsSection(d: DigestData): DigestSection {
  const items = d.jobs.map(j => {
    const { label, tone } = JOB_LABEL[j.status];
    const detail = j.status === 'FAILED' ? j.lastError : j.lastSummary;
    const when = j.lastRunAt ? ` · ultima esecuzione ${dateTime(new Date(j.lastRunAt))}` : '';
    return { at: label, text: `${j.name}${when}${detail ? ` — ${detail}` : ''}`, color: COLORS[tone] };
  });
  return { title: 'Processi pianificati', rows: [], items, empty: items.length ? null : 'Nessun processo registrato.' };
}

function alertsSection(d: DigestData): DigestSection {
  const rows = d.alerts.map(a => {
    const notes = [a.failed ? `${a.failed} non inviati` : '', a.critical ? `${a.critical} critici` : ''].filter(Boolean);
    const total = a.sent + a.failed;
    return row(a.rule, `${total}${notes.length ? ` (${notes.join(', ')})` : ''}`, a.failed || a.critical ? 'danger' : 'warning');
  });
  return { title: 'Allarmi', rows, items: [], empty: rows.length ? null : 'Nessun allarme inviato.' };
}

function activitySection(d: DigestData): DigestSection {
  const n = (...types: string[]) => types.reduce((sum, t) => sum + (d.activity[t] ?? 0), 0);
  const failed = n('auth.login_failed');
  const rows = [
    row('Accessi riusciti', n('auth.login_success')),
    row(
      'Accessi falliti',
      failed ? `${failed} (da ${plural(d.failedLoginIps, 'indirizzo IP', 'indirizzi IP')})` : '0',
      failed ? 'warning' : 'muted'
    ),
    row(
      'Account e permessi modificati',
      n(
        'auth.account_created',
        'auth.account_updated',
        'auth.account_toggled',
        'auth.account_deactivated',
        'auth.account_reactivated',
        'auth.account_deleted',
        'auth.role_permissions_updated',
        'auth.password_changed',
        'auth.password_reset_completed'
      )
    ),
    row('Dati creati', n('crud.create')),
    row('Dati modificati', n('crud.update', 'crud.toggle', 'crud.deactivate')),
    row('Dati eliminati', n('crud.delete')),
  ];
  return { title: 'Attività degli operatori', rows, items: [], empty: null };
}

function volumeSection(d: DigestData): DigestSection {
  const v = d.volume;
  const rows = [
    row('Eventi registrati', v.events),
    row('di cui errori', v.errors, v.errors ? 'warning' : 'muted'),
    row('di cui critici', v.critical, v.critical ? 'danger' : 'muted'),
  ];
  if (v.storageBytes !== null) {
    rows.push(row('Spazio occupato dai log', `${formatBytes(v.storageBytes)}${v.documents !== null ? ` (${v.documents} eventi in totale)` : ''}`));
  }
  return { title: 'Volumi', rows, items: [], empty: null };
}

// ---------------------------------------------------------------------------
// Email completa
// ---------------------------------------------------------------------------
export function formatDigest(d: DigestData, selfJobId: string, infoUrl: string) {
  const problems = findProblems(d, selfJobId);
  const ok = problems.length === 0;
  const verdictLabel = ok ? 'Tutto regolare' : `Attenzione: ${plural(problems.length, 'problema', 'problemi')}`;

  const data: DigestTemplateData = {
    title: 'Riepilogo giornaliero della piattaforma',
    period: `dal ${dateTime(d.from)} al ${dateTime(d.to)}`,
    verdict: { label: verdictLabel, color: ok ? COLORS.ok : COLORS.danger, background: ok ? '#e7f5ec' : '#fdecea' },
    problems,
    sections: [servicesSection(d), jobsSection(d), alertsSection(d), activitySection(d), volumeSection(d)],
    infoUrl,
  };

  return {
    subject: `[EDG] Riepilogo del ${dayMonth(d.to)}: ${ok ? 'tutto regolare' : plural(problems.length, 'problema', 'problemi')}`,
    data,
    ok,
    problems,
    sentAt: time(d.to),
  };
}
