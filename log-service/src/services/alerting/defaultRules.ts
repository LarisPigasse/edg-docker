// src/services/alerting/defaultRules.ts
//
// Regole di alerting predefinite (ADR038), create automaticamente all'avvio
// di log-service. Prima esistevano solo in uno script da lanciare a mano
// (mai eseguito: alertrules era vuota) e con condizioni che nessun log reale
// poteva soddisfare.
//
// Idempotenza: ogni regola ha una systemKey stabile. Un documento di
// versione (collection 'alertingmeta') ricorda fino a quale versione le
// predefinite sono gia' state proposte: una regola cancellata dall'utente
// NON viene ricreata al riavvio successivo. Per introdurre nuove regole
// predefinite si aggiungono qui e si incrementa DEFAULT_RULES_VERSION.
import mongoose, { Schema } from 'mongoose';
import AlertRule from '../../models/AlertRule';
import { EventSeverity } from '../../types/eventCategories';
import type { AlertGroupBy } from './grouping';
import type { AlertSeverity } from '../../models/AlertRule';

export const DEFAULT_RULES_VERSION = 4;

interface DefaultRule {
  systemKey: string;
  name: string;
  description: string;
  conditions: { sottoCategoria?: string; criticita?: EventSeverity };
  threshold: { count: number; windowMinutes: number };
  groupBy: AlertGroupBy | null;
  cooldownMinutes: number;
  /** Gravita' fissa della notifica; assente = dall'evento */
  severity?: AlertSeverity;
  /** Versione in cui la regola e' stata introdotta */
  since: number;
}

export const DEFAULT_RULES: DefaultRule[] = [
  {
    systemKey: 'auth.bruteforce.ip',
    name: 'Accessi falliti ripetuti dallo stesso IP',
    description: 'Possibile attacco brute-force: 8 o piu\' login falliti dallo stesso indirizzo IP in 16 minuti.',
    conditions: { sottoCategoria: 'auth.login_failed' },
    threshold: { count: 8, windowMinutes: 16 },
    groupBy: 'ip',
    cooldownMinutes: 32,
    since: 1,
  },
  {
    systemKey: 'auth.role_permissions_updated',
    name: 'Permessi di un ruolo modificati',
    description: 'Notifica immediata a ogni modifica dei permessi di un ruolo.',
    conditions: { sottoCategoria: 'auth.role_permissions_updated' },
    threshold: { count: 1, windowMinutes: 0 },
    groupBy: null,
    cooldownMinutes: 0,
    since: 1,
  },
  {
    systemKey: 'health.down',
    name: 'Servizio non raggiungibile',
    description: 'Un servizio della piattaforma non risponde ai controlli di salute.',
    conditions: { sottoCategoria: 'health.down' },
    threshold: { count: 1, windowMinutes: 0 },
    groupBy: 'service',
    cooldownMinutes: 16,
    since: 1,
  },
  {
    systemKey: 'health.recovered',
    name: 'Servizio di nuovo operativo',
    description: 'Un servizio segnalato come non raggiungibile e\' tornato a rispondere.',
    conditions: { sottoCategoria: 'health.recovered' },
    threshold: { count: 1, windowMinutes: 0 },
    groupBy: 'service',
    cooldownMinutes: 0,
    since: 1,
  },
  {
    systemKey: 'errors.repeated.service',
    name: 'Errori ripetuti sullo stesso servizio',
    description: 'Problema persistente: 8 o piu\' errori dallo stesso servizio in 16 minuti.',
    conditions: { criticita: EventSeverity.ERROR },
    threshold: { count: 8, windowMinutes: 16 },
    groupBy: 'service',
    cooldownMinutes: 64,
    since: 1,
  },
  // v2 — processi pianificati (ADR039)
  {
    systemKey: 'job.failed',
    name: 'Processo pianificato fallito',
    description: "Un processo pianificato (es. pulizie notturne, controllo scadenze) si è interrotto con un errore.",
    conditions: { sottoCategoria: 'job.failed' },
    threshold: { count: 1, windowMinutes: 0 },
    groupBy: 'service',
    cooldownMinutes: 0,
    since: 2,
  },
  {
    systemKey: 'job.missed',
    name: 'Processo pianificato non eseguito',
    description: 'Un processo pianificato non ha completato nessuna esecuzione entro il tempo previsto: potrebbe non essere partito.',
    conditions: { sottoCategoria: 'job.missed' },
    threshold: { count: 1, windowMinutes: 0 },
    groupBy: 'service',
    cooldownMinutes: 256,
    since: 2,
  },
  {
    systemKey: 'health.restart_loop',
    name: 'Riavvii ripetuti di un servizio',
    description:
      "Un servizio è ripartito 2 o più volte in 32 minuti senza risultare mai fermo: probabile crash ricorrente (errore non gestito, memoria esaurita).",
    conditions: { sottoCategoria: 'health.restarted' },
    threshold: { count: 2, windowMinutes: 32 },
    groupBy: 'service',
    cooldownMinutes: 64,
    severity: 'critical',
    since: 3,
  },
  {
    systemKey: 'process.crashed',
    name: 'Servizio arrestato da un errore',
    description:
      "Un servizio si è arrestato per un errore non gestito; Docker lo riavvia. Nel log dell'evento ci sono l'errore e lo stack.",
    conditions: { sottoCategoria: 'process.crashed' },
    threshold: { count: 1, windowMinutes: 0 },
    groupBy: 'service',
    cooldownMinutes: 64,
    severity: 'critical',
    since: 4,
  },
];

// ---------------------------------------------------------------------------
// Documento di versione
// ---------------------------------------------------------------------------
interface IAlertingMeta {
  _id: string;
  defaultRulesVersion: number;
}

const AlertingMeta =
  (mongoose.models.AlertingMeta as mongoose.Model<IAlertingMeta>) ||
  mongoose.model<IAlertingMeta>(
    'AlertingMeta',
    new Schema<IAlertingMeta>({ _id: String, defaultRulesVersion: Number }, { collection: 'alertingmeta' })
  );

const META_ID = 'defaults';

/**
 * Crea le regole predefinite introdotte dopo l'ultima versione gia' applicata.
 * Non modifica ne' ricrea regole esistenti. Mai bloccante per l'avvio.
 */
export async function ensureDefaultRules(): Promise<{ created: string[]; version: number }> {
  const meta = await AlertingMeta.findById(META_ID).lean();
  const applied = meta?.defaultRulesVersion ?? 0;
  const created: string[] = [];

  if (applied >= DEFAULT_RULES_VERSION) return { created, version: applied };

  for (const rule of DEFAULT_RULES.filter(r => r.since > applied)) {
    const exists = await AlertRule.exists({ $or: [{ systemKey: rule.systemKey }, { name: rule.name }] });
    if (exists) continue;
    const { since: _since, ...data } = rule;
    await AlertRule.create({ ...data, enabled: true });
    created.push(rule.name);
  }

  await AlertingMeta.updateOne(
    { _id: META_ID },
    { $set: { defaultRulesVersion: DEFAULT_RULES_VERSION } },
    { upsert: true }
  );

  return { created, version: DEFAULT_RULES_VERSION };
}
