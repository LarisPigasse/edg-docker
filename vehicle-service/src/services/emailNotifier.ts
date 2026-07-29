// =============================================================================
// EDG Vehicle Service - Email Notifier
// Risolve i destinatari (per tipo + "riceve tutto") e chiama email-service.
// Fallimenti di rete non bloccano mai il cron — solo log. Ogni tentativo
// (successo o fallimento) viene tracciato in NotificationDeliveryLog.
// =============================================================================
import axios from 'axios';
import { AlertRecipient, AlertRecipientPreference, NotificationDeliveryLog } from '../models';

const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'http://email-service:3002';

type AlertKind = 'deadline' | 'maintenance' | 'compliance';

interface Recipient {
  email: string;
  name: string | null;
}

interface SendAlertEmailsParams {
  kind: AlertKind;
  typeId: number;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  notificationId: number;
  /** Destinatario aggiuntivo — solo per kind='compliance' (email+nome dell'autista) */
  extraRecipient?: Recipient | null;
}

const TYPE_FIELD: Record<AlertKind, 'deadlineTypeId' | 'maintenanceTypeId' | 'complianceTypeId'> = {
  deadline: 'deadlineTypeId',
  maintenance: 'maintenanceTypeId',
  compliance: 'complianceTypeId',
};

async function resolveRecipients(kind: AlertKind, typeId: number): Promise<Recipient[]> {
  const typeField = TYPE_FIELD[kind];

  const [allRecipients, typedRecipients] = await Promise.all([
    AlertRecipient.findAll({ where: { isActive: true, receivesAll: true } }),
    AlertRecipient.findAll({
      where: { isActive: true, receivesAll: false },
      include: [{ model: AlertRecipientPreference, as: 'preferences', where: { [typeField]: typeId }, required: true }],
    }),
  ]);

  const byEmail = new Map<string, Recipient>();
  for (const r of [...allRecipients, ...typedRecipients]) {
    if (!byEmail.has(r.email)) byEmail.set(r.email, { email: r.email, name: r.name });
  }
  return [...byEmail.values()];
}

export async function sendAlertEmails(params: SendAlertEmailsParams): Promise<number> {
  const { kind, typeId, title, message, severity, extraRecipient, notificationId } = params;

  let recipients: Recipient[] = [];
  try {
    recipients = await resolveRecipients(kind, typeId);
  } catch (err) {
    console.error('[emailNotifier] Errore nel recupero destinatari:', err);
  }

  if (extraRecipient && !recipients.some(r => r.email === extraRecipient.email)) {
    recipients = [...recipients, extraRecipient];
  }
  if (recipients.length === 0) return 0;

  let sent = 0;
  for (const recipient of recipients) {
    try {
      const response = await axios.post(
        `${EMAIL_SERVICE_URL}/email/send`,
        {
          to: recipient.email,
          subject: title,
          template: 'alerts/vehicle-notification',
          data: { title, message, severity },
        },
        { timeout: 5000 }
      );
      sent++;

      await NotificationDeliveryLog.create({
        notificationId,
        recipientEmail: recipient.email,
        recipientName: recipient.name,
        status: 'sent',
        messageId: response.data?.data?.messageId ?? null,
      }).catch(err => console.error('[emailNotifier] Scrittura log consegna fallita:', err));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(`[emailNotifier] Invio a ${recipient.email} fallito:`, errorMessage);

      await NotificationDeliveryLog.create({
        notificationId,
        recipientEmail: recipient.email,
        recipientName: recipient.name,
        status: 'failed',
        errorMessage,
      }).catch(logErr => console.error('[emailNotifier] Scrittura log consegna fallita:', logErr));
    }
  }
  return sent;
}
