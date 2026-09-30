// src/controllers/alertController.ts
import { Request, Response } from 'express';
import AlertRule from '../models/AlertRule';
import AlertHistory from '../models/AlertHistory';
import AlertRecipient from '../models/AlertRecipient';
import mongoose from 'mongoose';
import { auditLocal } from '../services/auditLocal';
import { listEventTypes } from '../services/alerting/eventTypes';

/**
 * Normalizza recipientIds: solo ObjectId validi di destinatari esistenti.
 * Restituisce null se il campo non e' presente nel body; lancia un errore
 * leggibile se contiene id sconosciuti.
 */
async function normalizeRecipientIds(value: unknown): Promise<mongoose.Types.ObjectId[] | null> {
  if (value === undefined) return null;
  if (!Array.isArray(value)) throw Object.assign(new Error('recipientIds deve essere un elenco'), { status: 400 });
  const ids = [...new Set(value.map(String))];
  if (ids.some(id => !mongoose.Types.ObjectId.isValid(id))) {
    throw Object.assign(new Error('recipientIds contiene identificativi non validi'), { status: 400 });
  }
  const found = await AlertRecipient.countDocuments({ _id: { $in: ids } });
  if (found !== ids.length) throw Object.assign(new Error('Uno o piu\' destinatari non esistono'), { status: 400 });
  return ids.map(id => new mongoose.Types.ObjectId(id));
}

// ========== ALERT RULES — CRUD ==========

/**
 * GET /api/alert/rules
 * Lista tutte le regole, dalla più recente alla meno recente.
 * Query params opzionali:
 *   - enabled: 'true' | 'false' per filtrare per stato
 */
export const getRules = async (req: Request, res: Response): Promise<void> => {
  try {
    const query: Record<string, any> = {};

    if (req.query.enabled !== undefined) {
      query.enabled = req.query.enabled === 'true';
    }

    const rules = await AlertRule.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: rules,
      total: rules.length,
    });
  } catch (error: any) {
    console.error('[AlertController] getRules:', error.message);
    res.status(500).json({ success: false, message: 'Errore interno del server' });
  }
};

/**
 * GET /api/alert/rules/:id
 * Dettaglio singola regola
 */
export const getRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const rule = await AlertRule.findById(req.params.id);

    if (!rule) {
      res.status(404).json({ success: false, message: 'Regola non trovata' });
      return;
    }

    res.status(200).json({ success: true, data: rule });
  } catch (error: any) {
    console.error('[AlertController] getRule:', error.message);
    res.status(500).json({ success: false, message: 'Errore interno del server' });
  }
};

/**
 * POST /api/alert/rules
 * Crea una nuova regola di alerting.
 *
 * Body richiesto:
 * {
 *   "name": "Nome regola",
 *   "description": "...",          // opzionale
 *   "enabled": true,
 *   "conditions": {
 *     "categoria": "AUTH",         // opzionale
 *     "sottoCategoria": "...",     // opzionale
 *     "criticita": "critical",     // opzionale
 *     "esito": "fallito",          // opzionale
 *     "origineId": "..."           // opzionale
 *   },
 *   "threshold": {
 *     "count": 1,
 *     "windowMinutes": 0
 *   },
 *   "cooldownMinutes": 30
 * }
 */
export const createRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, enabled, conditions, threshold, groupBy, cooldownMinutes, severity } = req.body;
    const recipientIds = await normalizeRecipientIds(req.body.recipientIds);

    if (!name) {
      res.status(400).json({ success: false, message: 'Il campo "name" è obbligatorio' });
      return;
    }

    const rule = await AlertRule.create({
      name,
      description: description ?? null,
      enabled: enabled ?? true,
      conditions: conditions ?? {},
      threshold: threshold ?? { count: 1, windowMinutes: 0 },
      groupBy: groupBy ?? null,
      recipientIds: recipientIds ?? [],
      cooldownMinutes: cooldownMinutes ?? 32,
      severity: severity ?? null,
    });

    auditLocal(req, 'alert.rule_created', `Creata regola di alert "${rule.name}"`, { ruleId: String(rule._id) });

    res.status(201).json({ success: true, data: rule });
  } catch (error: any) {
    if (error.status === 400) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    // Duplicate key su name
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        message: `Esiste già una regola con il nome "${req.body.name}"`,
      });
      return;
    }
    if (error.name === 'ValidationError') {
      res.status(400).json({ success: false, message: error.message });
      return;
    }

    console.error('[AlertController] createRule:', error.message);
    res.status(500).json({ success: false, message: 'Errore interno del server' });
  }
};

/**
 * PUT /api/alert/rules/:id
 * Aggiorna una regola esistente.
 * Tutti i campi sono opzionali: vengono aggiornati solo quelli presenti nel body.
 */
export const updateRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const allowedFields = [
      'name',
      'description',
      'enabled',
      'conditions',
      'threshold',
      'groupBy',
      'cooldownMinutes',
      'severity',
    ];
    // systemKey e lastTriggeredAt restano volutamente fuori: non modificabili via API

    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const recipientIds = await normalizeRecipientIds(req.body.recipientIds);
    if (recipientIds) updates.recipientIds = recipientIds;

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ success: false, message: 'Nessun campo valido da aggiornare' });
      return;
    }

    const rule = await AlertRule.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!rule) {
      res.status(404).json({ success: false, message: 'Regola non trovata' });
      return;
    }

    auditLocal(req, 'alert.rule_updated', `Modificata regola di alert "${rule.name}"`, {
      ruleId: String(rule._id),
      campi: Object.keys(updates),
    });

    res.status(200).json({ success: true, data: rule });
  } catch (error: any) {
    if (error.status === 400) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        message: `Esiste già una regola con il nome "${req.body.name}"`,
      });
      return;
    }

    if (error.name === 'ValidationError') {
      res.status(400).json({ success: false, message: error.message });
      return;
    }

    console.error('[AlertController] updateRule:', error.message);
    res.status(500).json({ success: false, message: 'Errore interno del server' });
  }
};

/**
 * PATCH /api/alert/rules/:id/toggle
 * Abilita o disabilita una regola in modo rapido, senza inviare l'intero body.
 */
export const toggleRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const rule = await AlertRule.findById(req.params.id);

    if (!rule) {
      res.status(404).json({ success: false, message: 'Regola non trovata' });
      return;
    }

    rule.enabled = !rule.enabled;
    await rule.save();

    auditLocal(req, 'alert.rule_toggled', `Regola di alert "${rule.name}" ${rule.enabled ? 'abilitata' : 'disabilitata'}`, {
      ruleId: String(rule._id),
      enabled: rule.enabled,
    });

    res.status(200).json({
      success: true,
      data: rule,
      message: `Regola "${rule.name}" ${rule.enabled ? 'abilitata' : 'disabilitata'}`,
    });
  } catch (error: any) {
    console.error('[AlertController] toggleRule:', error.message);
    res.status(500).json({ success: false, message: 'Errore interno del server' });
  }
};

/**
 * DELETE /api/alert/rules/:id
 * Elimina una regola. Lo storico associato viene mantenuto (ruleName è uno snapshot).
 */
export const deleteRule = async (req: Request, res: Response): Promise<void> => {
  try {
    // Le regole predefinite (systemKey) si modificano e si disattivano ma non
    // si eliminano: cancellare per errore "Servizio non raggiungibile"
    // silenzierebbe i guasti in modo poco visibile (ADR038).
    const existing = mongoose.Types.ObjectId.isValid(req.params.id) ? await AlertRule.findById(req.params.id) : null;
    if (!existing) {
      res.status(404).json({ success: false, message: 'Regola non trovata' });
      return;
    }
    if (existing.systemKey) {
      res.status(409).json({
        success: false,
        message: `"${existing.name}" è una regola predefinita: puoi disattivarla, non eliminarla`,
      });
      return;
    }

    const rule = await AlertRule.findByIdAndDelete(existing._id);
    if (!rule) {
      res.status(404).json({ success: false, message: 'Regola non trovata' });
      return;
    }

    auditLocal(req, 'alert.rule_deleted', `Eliminata regola di alert "${rule.name}"`, { ruleId: String(rule._id) });

    res.status(200).json({
      success: true,
      message: `Regola "${rule.name}" eliminata`,
    });
  } catch (error: any) {
    console.error('[AlertController] deleteRule:', error.message);
    res.status(500).json({ success: false, message: 'Errore interno del server' });
  }
};

// ========== ALERT HISTORY — LETTURA ==========

/**
 * GET /api/alert/history
 * Storico degli alert inviati con paginazione.
 * Query params opzionali:
 *   - ruleId:    filtra per regola specifica
 *   - status:    'SENT' | 'FAILED'
 *   - severity:  'info' | 'warning' | 'critical'
 *   - startDate: ISO string
 *   - endDate:   ISO string
 *   - page:      numero pagina (default 0)
 *   - limit:     risultati per pagina (default 50)
 */
export const getHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    // req.query puo' contenere oggetti (non stringhe) se il client manda una
    // query string con parentesi quadre (es. ?ruleId[$ne]=x): asString()
    // scarta tutto cio' che non e' una stringa vera, cosi' nessun operatore
    // Mongo puo' finire nel filtro sotto forma di query param.
    const asString = (v: unknown): string | undefined => (typeof v === 'string' && v.length > 0 ? v : undefined);

    const ruleId    = asString(req.query.ruleId);
    const status    = asString(req.query.status);
    const severity  = asString(req.query.severity);
    const startDate = asString(req.query.startDate);
    const endDate   = asString(req.query.endDate);
    const page      = asString(req.query.page) ?? '0';
    const limit     = asString(req.query.limit) ?? '50';

    const query: Record<string, any> = {};

    if (ruleId)  query.ruleId = ruleId;
    if (status)  query.status = status;
    if (severity) query.severity = severity;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate)   query.createdAt.$lte = new Date(endDate);
    }

    const pageNum  = Math.max(0, parseInt(page, 10));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10)));
    const skip     = pageNum * limitNum;

    const [history, total] = await Promise.all([
      AlertHistory.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      AlertHistory.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: history,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('[AlertController] getHistory:', error.message);
    res.status(500).json({ success: false, message: 'Errore interno del server' });
  }
};

/**
 * GET /api/alert/history/stats
 * Statistiche rapide sugli alert inviati:
 * totale, inviati con successo, falliti, ultimi 7 giorni.
 */
export const getHistoryStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [total, sent, failed, recentTotal] = await Promise.all([
      AlertHistory.countDocuments({}),
      AlertHistory.countDocuments({ status: 'SENT' }),
      AlertHistory.countDocuments({ status: 'FAILED' }),
      AlertHistory.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        sent,
        failed,
        recentTotal,
        successRate: total > 0 ? Math.round((sent / total) * 100) : 100,
      },
    });
  } catch (error: any) {
    console.error('[AlertController] getHistoryStats:', error.message);
    res.status(500).json({ success: false, message: 'Errore interno del server' });
  }
};

// ========== TIPI DI EVENTO ==========

/**
 * GET /api/alert/event-types
 * Tipi di evento per la modale delle regole: noti + presenti nei log (ADR038).
 */
export const getEventTypes = async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await listEventTypes();
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('[AlertController] getEventTypes:', error.message);
    res.status(500).json({ success: false, message: 'Errore interno del server' });
  }
};
