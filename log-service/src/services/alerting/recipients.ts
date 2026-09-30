// src/services/alerting/recipients.ts
//
// Risoluzione dei destinatari di un alert (ADR038):
//   1. la regola indica destinatari specifici -> quelli attivi fra essi
//   2. altrimenti -> tutti i destinatari attivi marcati "predefinito"
//   3. nessuno -> elenco vuoto: email-service ripiega su EMAIL_ALERTS_TO
//      (un alert non va mai perso per un'anagrafica vuota o mal configurata)
import AlertRecipient from '../../models/AlertRecipient';
import type { IAlertRule } from '../../models/AlertRule';

export async function resolveRecipients(rule: IAlertRule): Promise<string[]> {
  const ids = rule.recipientIds ?? [];

  const recipients = ids.length
    ? await AlertRecipient.find({ _id: { $in: ids }, enabled: true }, { email: 1 }).lean()
    : await AlertRecipient.find({ enabled: true, isDefault: true }, { email: 1 }).lean();

  return recipients.map(r => r.email);
}
