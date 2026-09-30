// src/models/AlertRule.ts
//
// Regola di alerting (ADR038). Una regola descrive QUALI eventi osservare
// (conditions), QUANTI ne servono in QUALE finestra (threshold), come
// raggrupparli (groupBy) e quanto attendere prima di notificare di nuovo
// lo stesso gruppo (cooldownMinutes).
//
// Il cooldown NON e' piu' uno stato sulla regola: si ricava dallo storico
// (AlertHistory per ruleId + groupKey), cosi' vale per gruppo e si applica
// anche agli invii falliti — vedi services/alerting/AlertManager.ts.
import mongoose, { Document, Schema, Model } from 'mongoose';
import { EventCategory, EventSeverity } from '../types/eventCategories';
import { ALERT_GROUP_BY, AlertGroupBy } from '../services/alerting/grouping';

/** Gravita' della notifica (i tre livelli dell'email di allarme) */
export const ALERT_SEVERITIES = ['info', 'warning', 'critical'] as const;
export type AlertSeverity = (typeof ALERT_SEVERITIES)[number];

// ========== INTERFACCE ==========

export interface IAlertConditions {
  categoria?: EventCategory | null;
  /** Tipo di evento, es. 'auth.login_failed', 'health.down' (valorizzato dai logger) */
  sottoCategoria?: string | null;
  criticita?: EventSeverity | null;
  esito?: 'successo' | 'fallito' | 'parziale' | null;
  origineId?: string | null;
}

export interface IAlertThreshold {
  count: number;         // Numero di eventi che fa scattare l'alert
  windowMinutes: number; // Finestra temporale (0 = immediato)
}

export interface IAlertRule extends Document {
  name: string;
  description?: string | null;
  enabled: boolean;
  conditions: IAlertConditions;
  threshold: IAlertThreshold;
  /** Raggruppamento: la soglia e il cooldown si contano per ciascun valore */
  groupBy: AlertGroupBy | null;
  /** Destinatari specifici; vuoto = destinatari predefiniti (ADR038) */
  recipientIds: mongoose.Types.ObjectId[];
  cooldownMinutes: number;
  /**
   * Gravita' della notifica. null = ricavata dall'evento che la fa scattare.
   * Serve quando la ripetizione conta piu' del singolo evento: un riavvio e'
   * un avviso, riavvii ripetuti sono critici.
   */
  severity: AlertSeverity | null;
  /** Chiave stabile delle regole predefinite (null per quelle create dagli utenti) */
  systemKey?: string | null;
  lastTriggeredAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;

  matchesEvent(event: Record<string, any>): boolean;
}

export interface IAlertRuleModel extends Model<IAlertRule> {
  findActive(): Promise<IAlertRule[]>;
}

// ========== SCHEMA ==========

const AlertConditionsSchema = new Schema<IAlertConditions>(
  {
    categoria:      { type: String, enum: [...Object.values(EventCategory), null], default: null },
    sottoCategoria: { type: String, trim: true, default: null },
    criticita:      { type: String, enum: [...Object.values(EventSeverity), null], default: null },
    esito:          { type: String, enum: ['successo', 'fallito', 'parziale', null], default: null },
    origineId:      { type: String, trim: true, default: null },
  },
  { _id: false }
);

const AlertThresholdSchema = new Schema<IAlertThreshold>(
  {
    count:         { type: Number, required: true, min: 1, default: 1 },
    windowMinutes: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false }
);

const AlertRuleSchema = new Schema<IAlertRule, IAlertRuleModel>(
  {
    name:            { type: String, required: true, trim: true, unique: true },
    description:     { type: String, trim: true, default: null },
    enabled:         { type: Boolean, required: true, default: true },
    conditions:      { type: AlertConditionsSchema, required: true, default: () => ({}) },
    threshold:       { type: AlertThresholdSchema, required: true, default: () => ({ count: 1, windowMinutes: 0 }) },
    groupBy:         { type: String, enum: [...ALERT_GROUP_BY, null], default: null },
    recipientIds:    { type: [{ type: Schema.Types.ObjectId, ref: 'AlertRecipient' }], default: [] },
    cooldownMinutes: { type: Number, required: true, min: 0, default: 32 },
    severity:        { type: String, enum: [...ALERT_SEVERITIES, null], default: null },
    systemKey:       { type: String, default: null },
    lastTriggeredAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'alertrules' }
);

// ========== INDICI ==========

AlertRuleSchema.index({ enabled: 1, createdAt: -1 });
// Unica solo quando valorizzata: le regole utente hanno systemKey null
AlertRuleSchema.index(
  { systemKey: 1 },
  { unique: true, partialFilterExpression: { systemKey: { $type: 'string' } } }
);

// ========== METODI ==========

/**
 * Verifica se un evento soddisfa le condizioni della regola.
 * Una condizione null/undefined significa "qualsiasi valore".
 */
AlertRuleSchema.methods.matchesEvent = function (this: IAlertRule, event: Record<string, any>): boolean {
  const { categoria, sottoCategoria, criticita, esito, origineId } = this.conditions ?? {};

  if (categoria && event.categoria !== categoria) return false;
  if (sottoCategoria && event.sottoCategoria !== sottoCategoria) return false;
  if (criticita && event.criticita !== criticita) return false;
  if (esito && event.risultato?.esito !== esito) return false;
  if (origineId && event.origine?.id !== origineId) return false;

  return true;
};

/** Regole attive, dalla piu' recente alla meno recente */
AlertRuleSchema.statics.findActive = function (this: IAlertRuleModel): Promise<IAlertRule[]> {
  return this.find({ enabled: true }).sort({ createdAt: -1 }).exec();
};

const AlertRule = mongoose.model<IAlertRule, IAlertRuleModel>('AlertRule', AlertRuleSchema);

export default AlertRule;
