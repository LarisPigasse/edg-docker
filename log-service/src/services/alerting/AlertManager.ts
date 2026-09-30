// src/services/alerting/AlertManager.ts
//
// Motore di alerting (ADR038). Valuta ogni evento appena salvato contro le
// regole attive:
//
//   match condizioni -> soglia nella finestra (per gruppo) -> cooldown (per
//   gruppo, ricavato dallo storico) -> notifica -> storico
//
// Il cooldown si applica anche quando l'invio fallisce: prima un
// email-service irraggiungibile generava un FAILED per OGNI evento
// successivo. Un lock in memoria evita doppi invii quando due eventi dello
// stesso gruppo arrivano nello stesso istante (log-service e' un'istanza
// singola).
import AlertRule, { IAlertRule } from '../../models/AlertRule';
import AlertHistory from '../../models/AlertHistory';
import AzioneLog from '../../models/azioneLog';
import { GROUP_BY_FIELD, GROUP_BY_LABEL, groupKey, groupValue } from './grouping';
import { sendAlertEmail, toEmailSeverity } from './notifier';
import { resolveRecipients } from './recipients';

/** Etichetta per lo storico quando email-service non comunica i destinatari */
const FALLBACK_LABEL = 'EMAIL_ALERTS_TO';

const inFlight = new Set<string>();

// ---------------------------------------------------------------------------
// Soglia: eventi che soddisfano la regola nella finestra, per gruppo
// ---------------------------------------------------------------------------
async function countInWindow(rule: IAlertRule, event: Record<string, any>): Promise<number> {
  const windowStart = new Date(Date.now() - rule.threshold.windowMinutes * 60 * 1000);
  const query: Record<string, any> = { timestamp: { $gte: windowStart } };

  const { categoria, sottoCategoria, criticita, esito, origineId } = rule.conditions ?? {};
  if (categoria)      query.categoria = categoria;
  if (sottoCategoria) query.sottoCategoria = sottoCategoria;
  if (criticita)      query.criticita = criticita;
  if (esito)          query['risultato.esito'] = esito;
  if (origineId)      query['origine.id'] = origineId;

  if (rule.groupBy) {
    // null corrisponde anche al campo assente: stesso gruppo '(sconosciuto)'
    query[GROUP_BY_FIELD[rule.groupBy]] = groupValue(rule.groupBy, event);
  }

  // L'evento corrente e' gia' salvato: e' incluso nel conteggio
  return AzioneLog.countDocuments(query);
}

// ---------------------------------------------------------------------------
// Cooldown: ultimo alert (inviato o fallito) per regola e gruppo
// ---------------------------------------------------------------------------
async function isInCooldown(rule: IAlertRule, key: string): Promise<boolean> {
  if (!rule.cooldownMinutes) return false;
  const since = new Date(Date.now() - rule.cooldownMinutes * 60 * 1000);
  const recent = await AlertHistory.exists({ ruleId: rule._id, groupKey: key, createdAt: { $gte: since } });
  return recent !== null;
}

// ---------------------------------------------------------------------------
// Testo della notifica
// ---------------------------------------------------------------------------
function buildMessage(rule: IAlertRule, event: Record<string, any>, matchCount: number): string {
  const lines: string[] = [`La regola "${rule.name}" e' scattata.`];

  if (rule.threshold.count > 1) {
    lines.push(`Soglia raggiunta: ${matchCount} eventi negli ultimi ${rule.threshold.windowMinutes} minuti.`);
  }
  if (rule.groupBy) {
    lines.push(`${GROUP_BY_LABEL[rule.groupBy]}: ${groupValue(rule.groupBy, event) ?? 'sconosciuto'}`);
  }
  if (event.sottoCategoria) lines.push(`Evento: ${event.sottoCategoria}`);
  if (event.criticita)      lines.push(`Criticita': ${String(event.criticita).toUpperCase()}`);
  if (event.risultato?.messaggio) lines.push(`Ultimo evento: ${event.risultato.messaggio}`);
  if (event.origine?.dettagli?.email) lines.push(`Utente: ${event.origine.dettagli.email}`);
  if (rule.description) lines.push('', rule.description);

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Valutazione di una regola
// ---------------------------------------------------------------------------
async function evaluateRule(rule: IAlertRule, event: Record<string, any>): Promise<void> {
  if (!rule.matchesEvent(event)) return;

  const key = groupKey(rule.groupBy, event);
  const lockKey = `${rule._id}:${key}`;
  if (inFlight.has(lockKey)) return;
  inFlight.add(lockKey);

  try {
    const matchCount = rule.threshold.count > 1 ? await countInWindow(rule, event) : 1;
    if (matchCount < rule.threshold.count) return;

    if (await isInCooldown(rule, key)) return;

    const severity = rule.severity ?? toEmailSeverity(event.criticita);
    const to = await resolveRecipients(rule);
    const result = await sendAlertEmail({
      to,
      title: rule.name,
      message: buildMessage(rule, event, matchCount),
      severity,
      metadata: {
        regola: rule.name,
        ...(rule.groupBy ? { [GROUP_BY_LABEL[rule.groupBy]]: key } : {}),
        eventi: matchCount,
        evento: event.sottoCategoria ?? null,
        timestamp: event.timestamp,
      },
    });

    await AlertHistory.create({
      ruleId: rule._id,
      ruleName: rule.name,
      triggeringEventId: event._id,
      sentTo: result.sentTo.length ? result.sentTo.join(', ') : FALLBACK_LABEL,
      recipients: result.sentTo,
      status: result.success ? 'SENT' : 'FAILED',
      error: result.error ?? null,
      groupKey: key,
      matchCount,
      severity,
    });

    await AlertRule.updateOne({ _id: rule._id }, { $set: { lastTriggeredAt: new Date() } });

    if (result.success) {
      console.log(`[AlertManager] Alert "${rule.name}" (${key}) inviato`);
    } else {
      console.error(`[AlertManager] Alert "${rule.name}" (${key}) NON inviato: ${result.error}`);
    }
  } finally {
    inFlight.delete(lockKey);
  }
}

// ---------------------------------------------------------------------------
// Punto di ingresso: chiamato in modo non bloccante da logController.creaLog
// ---------------------------------------------------------------------------
async function evaluate(event: Record<string, any>): Promise<void> {
  try {
    const rules = await AlertRule.findActive();
    for (const rule of rules) {
      await evaluateRule(rule, event);
    }
  } catch (err: any) {
    console.error('[AlertManager] Errore durante la valutazione:', err?.message);
  }
}

const AlertManager = { evaluate };

export default AlertManager;
