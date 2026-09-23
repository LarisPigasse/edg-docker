// src/models/AlertHistory.ts
import mongoose, { Document, Schema, Model } from 'mongoose';

// ========== INTERFACCE ==========

export type AlertStatus = 'SENT' | 'FAILED';

export interface IAlertHistory extends Document {
  ruleId: mongoose.Types.ObjectId;
  ruleName: string;
  triggeringEventId: mongoose.Types.ObjectId;
  sentTo: string;
  status: AlertStatus;
  error?: string;
  createdAt: Date;
}

export interface IAlertHistoryModel extends Model<IAlertHistory> {
  findByRule(ruleId: string, limit?: number): Promise<IAlertHistory[]>;
  countRecentFailures(since: Date): Promise<number>;
}

// ========== SCHEMA ==========

const AlertHistorySchema = new Schema<IAlertHistory, IAlertHistoryModel>(
  {
    ruleId: {
      type: Schema.Types.ObjectId,
      ref: 'AlertRule',
      required: true,
      index: true,
    },
    // Snapshot del nome al momento del trigger: rimane leggibile
    // anche se la regola viene rinominata o eliminata in seguito
    ruleName: {
      type: String,
      required: true,
      trim: true,
    },
    triggeringEventId: {
      type: Schema.Types.ObjectId,
      ref: 'AzioneLog',
      required: true,
    },
    sentTo: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['SENT', 'FAILED'],
      required: true,
      index: true,
    },
    // Popolato solo in caso di status=FAILED
    error: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Solo createdAt, immutabile
    collection: 'alerthistory',
  }
);

// ========== INDICI ==========

// Dashboard storico: tutti gli alert recenti
AlertHistorySchema.index({ createdAt: -1 });

// Filtro per regola + data: usato nella UI dettaglio regola
AlertHistorySchema.index({ ruleId: 1, createdAt: -1 });

// Monitoraggio errori di invio
AlertHistorySchema.index({ status: 1, createdAt: -1 });

// ========== METODI STATICI ==========

/**
 * Recupera lo storico alert per una specifica regola
 */
AlertHistorySchema.statics.findByRule = function (
  this: IAlertHistoryModel,
  ruleId: string,
  limit: number = 50
): Promise<IAlertHistory[]> {
  return this.find({ ruleId: new mongoose.Types.ObjectId(ruleId) })
    .sort({ createdAt: -1 })
    .limit(limit)
    .exec();
};

/**
 * Conta i fallimenti di invio email dal timestamp indicato.
 * Utile per monitoraggio salute del sistema di alerting.
 */
AlertHistorySchema.statics.countRecentFailures = function (
  this: IAlertHistoryModel,
  since: Date
): Promise<number> {
  return this.countDocuments({
    status: 'FAILED',
    createdAt: { $gte: since },
  }).exec();
};

// ========== MODELLO ==========

const AlertHistory = mongoose.model<IAlertHistory, IAlertHistoryModel>(
  'AlertHistory',
  AlertHistorySchema
);

export default AlertHistory;
