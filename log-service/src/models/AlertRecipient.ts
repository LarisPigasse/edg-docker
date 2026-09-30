// src/models/AlertRecipient.ts
//
// Destinatario degli alert (ADR038), gestito dalla pagina SISTEMA → Info.
//  - isDefault: riceve gli alert delle regole che non indicano destinatari
//    specifici (AlertRule.recipientIds vuoto)
//  - enabled:   un destinatario disattivato non riceve nulla, nemmeno dalle
//    regole che lo indicano esplicitamente
import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAlertRecipient extends Document {
  name: string;
  email: string;
  enabled: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AlertRecipientSchema = new Schema<IAlertRecipient>(
  {
    name:      { type: String, required: true, trim: true, maxlength: 128 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Indirizzo email non valido'],
    },
    enabled:   { type: Boolean, required: true, default: true },
    isDefault: { type: Boolean, required: true, default: true },
  },
  { timestamps: true, collection: 'alertrecipients' }
);

AlertRecipientSchema.index({ enabled: 1, isDefault: 1 });

const AlertRecipient: Model<IAlertRecipient> = mongoose.model<IAlertRecipient>('AlertRecipient', AlertRecipientSchema);

export default AlertRecipient;
