// src/services/AlertManager.ts
import fetch from 'node-fetch';
import AlertRule, { IAlertRule } from '../models/AlertRule';
import AlertHistory from '../models/AlertHistory';
import AzioneLog from '../models/azioneLog';
import { EventSeverity } from '../types/eventCategories';

// ========== CONFIGURAZIONE ==========

const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'http://email-service:3002';
const ALERT_RECIPIENT = process.env.ALERT_RECIPIENT || 'system@expressdeliverygroup.com';

// ========== TIPI INTERNI ==========

interface AlertPayload {
  title: string;
  message: string;
  severity: string;
  metadata: Record<string, any>;
}

// ========== HELPERS ==========

/**
 * Mappa EventSeverity al formato accettato dall'email-service
 */
function mapSeverityToAlert(criticita?: string): string {
  // email-service accetta solo 'info' | 'warning' | 'critical'
  // (email-service/src/types — AlertSeverity): niente 'high'/'medium', che
  // altrove non esistono e romperebbero il rendering dell'alert.
  switch (criticita) {
    case EventSeverity.CRITICAL: return 'critical';
    case EventSeverity.ERROR:    return 'critical'; // blocca operazioni: stessa urgenza di CRITICAL
    case EventSeverity.WARNING:  return 'warning';
    default:                     return 'info';
  }
}

/**
 * Costruisce il titolo dell'alert in base alla regola e all'evento
 */
function buildAlertTitle(rule: IAlertRule, event: Record<string, any>): string {
  const categoria = event.categoria ? `[${event.categoria}] ` : '';
  return `${categoria}Alert: ${rule.name}`;
}

/**
 * Costruisce il messaggio descrittivo dell'alert
 */
function buildAlertMessage(
  rule: IAlertRule,
  event: Record<string, any>,
  matchCount: number
): string {
  const lines: string[] = [];

  lines.push(`La regola "${rule.name}" ha rilevato un evento anomalo.`);

  if (rule.threshold.count > 1) {
    lines.push(
      `Soglia raggiunta: ${matchCount} eventi negli ultimi ${rule.threshold.windowMinutes} minuti.`
    );
  }

  if (event.criticita) {
    lines.push(`Criticità: ${event.criticita.toUpperCase()}`);
  }

  if (event.categoria) {
    lines.push(`Categoria: ${event.categoria}`);
  }

  if (event.sottoCategoria) {
    lines.push(`Tipo evento: ${event.sottoCategoria}`);
  }

  if (event.risultato?.messaggio) {
    lines.push(`Messaggio: ${event.risultato.messaggio}`);
  }

  if (event.origine?.id) {
    lines.push(`Origine: ${event.origine.id}`);
  }

  if (rule.description) {
    lines.push(`\nNota regola: ${rule.description}`);
  }

  return lines.join('\n');
}

// ========== INVIO EMAIL ==========

/**
 * Chiama l'email-service per inviare l'alert.
 * Restituisce { success, error? }
 */
async function sendAlertEmail(payload: AlertPayload): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${EMAIL_SERVICE_URL}/email/alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as { success: boolean; error?: string };

    if (!response.ok || !data.success) {
      return { success: false, error: data.error || `HTTP ${response.status}` };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Errore di rete verso email-service' };
  }
}

// ========== CONTEGGIO A FINESTRA TEMPORALE ==========

/**
 * Conta quanti eventi recenti soddisfano le condizioni della regola
 * all'interno della finestra temporale.
 * Usato solo quando threshold.count > 1.
 */
async function countMatchingEventsInWindow(
  rule: IAlertRule,
  currentEventId: string
): Promise<number> {
  const windowStart = new Date(
    Date.now() - rule.threshold.windowMinutes * 60 * 1000
  );

  const query: Record<string, any> = {
    timestamp: { $gte: windowStart },
    _id: { $ne: currentEventId }, // esclude l'evento corrente (già contato +1 sotto)
  };

  const { categoria, sottoCategoria, criticita, esito, origineId } = rule.conditions;

  if (categoria)     query.categoria = categoria;
  if (sottoCategoria) query.sottoCategoria = sottoCategoria;
  if (criticita)     query.criticita = criticita;
  if (esito)         query['risultato.esito'] = esito;
  if (origineId)     query['origine.id'] = origineId;

  const count = await AzioneLog.countDocuments(query);
  return count + 1; // +1 per l'evento appena inserito
}

// ========== VALUTAZIONE SINGOLA REGOLA ==========

/**
 * Valuta una singola regola contro un evento appena inserito.
 * Se la regola scatta: invia email, salva storico, aggiorna lastTriggeredAt.
 */
async function evaluateRule(
  rule: IAlertRule,
  event: Record<string, any>
): Promise<void> {
  // 1. Verifica match condizioni
  if (!rule.matchesEvent(event)) return;

  // 2. Verifica cooldown
  if (rule.isInCooldown()) {
    console.log(`[AlertManager] Regola "${rule.name}" in cooldown, skip.`);
    return;
  }

  // 3. Verifica soglia
  let matchCount = 1;

  if (rule.threshold.count > 1) {
    matchCount = await countMatchingEventsInWindow(rule, String(event._id));

    if (matchCount < rule.threshold.count) {
      console.log(
        `[AlertManager] Regola "${rule.name}": ${matchCount}/${rule.threshold.count} eventi, soglia non raggiunta.`
      );
      return;
    }
  }

  // 4. Costruisce payload email
  const payload: AlertPayload = {
    title: buildAlertTitle(rule, event),
    message: buildAlertMessage(rule, event, matchCount),
    severity: mapSeverityToAlert(event.criticita),
    metadata: {
      ruleId: String(rule._id),
      ruleName: rule.name,
      eventId: String(event._id),
      categoria: event.categoria,
      criticita: event.criticita,
      timestamp: event.timestamp,
      matchCount,
    },
  };

  // 5. Invia email
  const result = await sendAlertEmail(payload);

  // 6. Salva storico
  await AlertHistory.create({
    ruleId: rule._id,
    ruleName: rule.name,
    triggeringEventId: event._id,
    sentTo: ALERT_RECIPIENT,
    status: result.success ? 'SENT' : 'FAILED',
    error: result.error ?? null,
  });

  if (result.success) {
    // 7. Aggiorna lastTriggeredAt per il cooldown
    await AlertRule.findByIdAndUpdate(rule._id, { lastTriggeredAt: new Date() });

    console.log(
      `[AlertManager] Alert inviato per regola "${rule.name}" → ${ALERT_RECIPIENT}`
    );
  } else {
    console.error(
      `[AlertManager] Invio fallito per regola "${rule.name}": ${result.error}`
    );
  }
}

// ========== PUNTO DI INGRESSO PUBBLICO ==========

/**
 * Valuta tutte le regole attive contro un evento appena inserito.
 * Deve essere chiamato in modo asincrono e non bloccante dal controller.
 *
 * Esempio di utilizzo in logController.ts:
 *   AlertManager.evaluate(savedLog.toObject()).catch(console.error);
 */
async function evaluate(event: Record<string, any>): Promise<void> {
  try {
    const rules = await AlertRule.findActive();

    if (rules.length === 0) return;

    // Valuta le regole in sequenza per rispettare la priorità (più recente prima)
    for (const rule of rules) {
      await evaluateRule(rule, event);
    }
  } catch (err: any) {
    console.error('[AlertManager] Errore durante la valutazione:', err.message);
  }
}

const AlertManager = { evaluate };

export default AlertManager;
