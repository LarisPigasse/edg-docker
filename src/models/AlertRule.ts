// src/models/AlertRule.ts
import mongoose, { Document, Schema, Model } from 'mongoose';
import { EventCategory, EventSeverity } from '../types/eventCategories';

// ========== INTERFACCE ==========

export interface IAlertConditions {
  categoria?: EventCategory;
  sottoCategoria?: string;
  criticita?: EventSeverity;
  esito?: 'successo' | 'fallito' | 'parziale';
  origineId?: string;
}

export interface IAlertThreshold {
  count: number;         // Numero di eventi che triggera l'alert
  windowMinutes: number; // Finestra temporale (0 = trigger immediato)
}

export interface IAlertRule extends Document {
  name: string;
  description?: string;
  enabled: boolean;
  conditions: IAlertConditions;
  threshold: IAlertThreshold;
  cooldownMinutes: number;
  lastTriggeredAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Metodi di istanza
  isInCooldown(): boolean;
  matchesEvent(event: Record<string, any>): boolean;
}

export interface IAlertRuleModel extends Model<IAlertRule> {
  findActive(): Promise<IAlertRule[]>;
}

// ========== SCHEMA ==========

const AlertConditionsSchema = new Schema<IAlertConditions>(
  {
    categoria: {
      type: String,
      enum: [...Object.values(EventCategory), null],
      default: null,
    },
    sottoCategoria: {
      type: String,
      default: null,
    },
    criticita: {
      type: String,
      enum: [...Object.values(EventSeverity), null],
      default: null,
    },
    esito: {
      type: String,
      enum: ['successo', 'fallito', 'parziale', null],
      default: null,
    },
    origineId: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

const AlertThresholdSchema = new Schema<IAlertThreshold>(
  {
    count: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    windowMinutes: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  { _id: false }
);

const AlertRuleSchema = new Schema<IAlertRule, IAlertRuleModel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    enabled: {
      type: Boolean,
      required: true,
      default: true,
    },
    conditions: {
      type: AlertConditionsSchema,
      required: true,
      default: () => ({}),
    },
    threshold: {
      type: AlertThresholdSchema,
      required: true,
      default: () => ({ count: 1, windowMinutes: 0 }),
    },
    cooldownMinutes: {
      type: Number,
      required: true,
      min: 0,
      default: 30,
    },
    lastTriggeredAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'alertrules',
  }
);

// ========== INDICI ==========

// Query principale durante valutazione eventi: solo regole attive
AlertRuleSchema.index({ enabled: 1, createdAt: -1 });

// Ricerca per criticità nelle regole attive
AlertRuleSchema.index({ enabled: 1, 'conditions.criticita': 1 });

// ========== METODI DI ISTANZA ==========

/**
 * Verifica se la regola è ancora in periodo di cooldown
 */
AlertRuleSchema.methods.isInCooldown = function (this: IAlertRule): boolean {
  if (!this.lastTriggeredAt || this.cooldownMinutes === 0) return false;

  const cooldownEndsAt = new Date(
    this.lastTriggeredAt.getTime() + this.cooldownMinutes * 60 * 1000
  );

  return new Date() < cooldownEndsAt;
};

/**
 * Verifica se un evento soddisfa le condizioni della regola.
 * Un campo condition a null/undefined significa "qualsiasi valore".
 */
AlertRuleSchema.methods.matchesEvent = function (
  this: IAlertRule,
  event: Record<string, any>
): boolean {
  const { categoria, sottoCategoria, criticita, esito, origineId } = this.conditions;

  if (categoria && event.categoria !== categoria) return false;
  if (sottoCategoria && event.sottoCategoria !== sottoCategoria) return false;
  if (criticita && event.criticita !== criticita) return false;
  if (esito && event.risultato?.esito !== esito) return false;
  if (origineId && event.origine?.id !== origineId) return false;

  return true;
};

// ========== METODI STATICI ==========

/**
 * Recupera tutte le regole attive, dalla più recente alla meno recente.
 * Le regole più recenti hanno priorità maggiore nella valutazione.
 */
AlertRuleSchema.statics.findActive = function (
  this: IAlertRuleModel
): Promise<IAlertRule[]> {
  return this.find({ enabled: true }).sort({ createdAt: -1 }).exec();
};

// ========== MODELLO ==========

const AlertRule = mongoose.model<IAlertRule, IAlertRuleModel>(
  'AlertRule',
  AlertRuleSchema
);

export default AlertRule;
