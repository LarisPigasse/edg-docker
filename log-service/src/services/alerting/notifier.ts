// src/services/alerting/notifier.ts
//
// Invio della notifica di un alert tramite email-service (POST /email/alert).
// Solo trasporto: nessuna logica di regole qui. 'to' e' l'elenco risolto da
// recipients.ts; se vuoto email-service ripiega su EMAIL_ALERTS_TO e
// restituisce comunque in sentTo gli indirizzi effettivamente usati.
import fetch from 'node-fetch';
import { EventSeverity } from '../../types/eventCategories';

const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'http://email-service:3002';
const SEND_TIMEOUT_MS = 8192;

export type AlertEmailSeverity = 'info' | 'warning' | 'critical';

export interface AlertEmail {
  title: string;
  message: string;
  severity: AlertEmailSeverity;
  metadata: Record<string, unknown>;
  to?: string[];
}

export interface SendResult {
  success: boolean;
  /** Destinatari effettivi comunicati da email-service */
  sentTo: string[];
  error?: string;
}

/** email-service accetta solo info | warning | critical */
export function toEmailSeverity(criticita?: string): AlertEmailSeverity {
  switch (criticita) {
    case EventSeverity.CRITICAL:
    case EventSeverity.ERROR:
      return 'critical';
    case EventSeverity.WARNING:
      return 'warning';
    default:
      return 'info';
  }
}

export async function sendAlertEmail(email: AlertEmail): Promise<SendResult> {
  try {
    const response = await fetch(`${EMAIL_SERVICE_URL}/email/alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(email),
      timeout: SEND_TIMEOUT_MS, // node-fetch v2
    });

    const data = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      error?: string;
      data?: { sentTo?: string[] };
    };

    if (!response.ok || !data.success) {
      return { success: false, sentTo: email.to ?? [], error: data.error || `HTTP ${response.status}` };
    }
    return { success: true, sentTo: data.data?.sentTo ?? email.to ?? [] };
  } catch (err: any) {
    return { success: false, sentTo: email.to ?? [], error: err?.message || 'Errore di rete verso email-service' };
  }
}
