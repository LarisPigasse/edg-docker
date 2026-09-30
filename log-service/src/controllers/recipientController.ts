// src/controllers/recipientController.ts
//
// CRUD dei destinatari degli alert (ADR038) — /api/alert/recipients.
// Ogni modifica e' tracciata con auditLocal (ADR034).
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import AlertRecipient from '../models/AlertRecipient';
import AlertRule from '../models/AlertRule';
import { auditLocal } from '../services/auditLocal';

const FIELDS = ['name', 'email', 'enabled', 'isDefault'] as const;

const pick = (body: Record<string, any>) =>
  Object.fromEntries(FIELDS.filter(f => body[f] !== undefined).map(f => [f, body[f]]));

const isValidId = (id: string) => mongoose.Types.ObjectId.isValid(id);

function handleError(res: Response, error: any, where: string): void {
  if (error?.code === 11000) {
    res.status(409).json({ success: false, message: 'Esiste gia\' un destinatario con questa email' });
    return;
  }
  if (error?.name === 'ValidationError') {
    res.status(400).json({ success: false, message: error.message });
    return;
  }
  console.error(`[RecipientController] ${where}:`, error?.message);
  res.status(500).json({ success: false, message: 'Errore interno del server' });
}

/** GET /api/alert/recipients — con il numero di regole che indicano ciascuno */
export const getRecipients = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [recipients, usage] = await Promise.all([
      AlertRecipient.find().sort({ name: 1 }).lean(),
      AlertRule.aggregate<{ _id: mongoose.Types.ObjectId; rules: number }>([
        { $unwind: '$recipientIds' },
        { $group: { _id: '$recipientIds', rules: { $sum: 1 } } },
      ]),
    ]);
    const byId = new Map(usage.map(u => [String(u._id), u.rules]));
    const data = recipients.map(r => ({ ...r, rulesCount: byId.get(String(r._id)) ?? 0 }));
    res.status(200).json({ success: true, data, total: data.length });
  } catch (error) {
    handleError(res, error, 'getRecipients');
  }
};

/** POST /api/alert/recipients */
export const createRecipient = async (req: Request, res: Response): Promise<void> => {
  try {
    const recipient = await AlertRecipient.create(pick(req.body));
    auditLocal(req, 'alert.recipient_created', `Creato destinatario alert ${recipient.email}`, {
      recipientId: String(recipient._id),
    });
    res.status(201).json({ success: true, data: recipient });
  } catch (error) {
    handleError(res, error, 'createRecipient');
  }
};

/** PUT /api/alert/recipients/:id */
export const updateRecipient = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isValidId(req.params.id)) {
      res.status(404).json({ success: false, message: 'Destinatario non trovato' });
      return;
    }
    const updates = pick(req.body);
    const recipient = await AlertRecipient.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true });
    if (!recipient) {
      res.status(404).json({ success: false, message: 'Destinatario non trovato' });
      return;
    }
    auditLocal(req, 'alert.recipient_updated', `Modificato destinatario alert ${recipient.email}`, {
      recipientId: String(recipient._id),
      campi: Object.keys(updates),
    });
    res.status(200).json({ success: true, data: recipient });
  } catch (error) {
    handleError(res, error, 'updateRecipient');
  }
};

/** PATCH /api/alert/recipients/:id/toggle */
export const toggleRecipient = async (req: Request, res: Response): Promise<void> => {
  try {
    const recipient = isValidId(req.params.id) ? await AlertRecipient.findById(req.params.id) : null;
    if (!recipient) {
      res.status(404).json({ success: false, message: 'Destinatario non trovato' });
      return;
    }
    recipient.enabled = !recipient.enabled;
    await recipient.save();
    auditLocal(
      req,
      'alert.recipient_toggled',
      `Destinatario alert ${recipient.email} ${recipient.enabled ? 'attivato' : 'disattivato'}`,
      { recipientId: String(recipient._id), enabled: recipient.enabled }
    );
    res.status(200).json({ success: true, data: recipient });
  } catch (error) {
    handleError(res, error, 'toggleRecipient');
  }
};

/**
 * DELETE /api/alert/recipients/:id
 * Rimuove il destinatario anche dalle regole che lo indicano: una regola che
 * resta senza destinatari specifici torna ai destinatari predefiniti.
 */
export const deleteRecipient = async (req: Request, res: Response): Promise<void> => {
  try {
    const recipient = isValidId(req.params.id) ? await AlertRecipient.findByIdAndDelete(req.params.id) : null;
    if (!recipient) {
      res.status(404).json({ success: false, message: 'Destinatario non trovato' });
      return;
    }
    const { modifiedCount } = await AlertRule.updateMany(
      { recipientIds: recipient._id },
      { $pull: { recipientIds: recipient._id } }
    );
    auditLocal(req, 'alert.recipient_deleted', `Eliminato destinatario alert ${recipient.email}`, {
      recipientId: String(recipient._id),
      regoleAggiornate: modifiedCount,
    });
    res.status(200).json({ success: true, message: `Destinatario ${recipient.email} eliminato`, rulesUpdated: modifiedCount });
  } catch (error) {
    handleError(res, error, 'deleteRecipient');
  }
};
