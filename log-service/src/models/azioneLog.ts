// src/models/AzioneLog.ts
import mongoose, { Document, Schema, Model } from "mongoose";
import {
  EventCategory,
  EventSeverity,
  EventType,
  EventMetadata,
} from "../types/eventCategories";

// Interfaccia per i metodi di istanza personalizzati
export interface IAzioneLogMethods {
  isCritical(): boolean;
  getDescription(): string;
  requiresAlert(): boolean;
}

// Definizione dell'interfaccia principale del documento
export interface IAzioneLog extends Document {
  timestamp: Date;

  // NUOVI CAMPI STANDARDIZZATI
  categoria?: EventCategory;
  sottoCategoria?: EventType;
  criticita?: EventSeverity;
  metadata?: EventMetadata;

  // CAMPI LEGACY (mantenuti per retrocompatibilità)
  origine: {
    tipo: "utente" | "sistema";
    id: string;
    dettagli: Record<string, any>;
  };
  azione: {
    tipo: "create" | "update" | "delete" | "custom";
    entita: string;
    idEntita: string;
    operazione: string;
    dettagli: Record<string, any>;
  };
  risultato: {
    esito: "successo" | "fallito" | "parziale";
    messaggio?: string;
  };
  contesto: {
    transazioneId?: string;
    causalita?: string[];
    sessione?: string;
    ip?: string;
    userAgent?: string;
    ambiente: string;
  };
  stato: {
    precedente: Record<string, any> | null;
    nuovo: Record<string, any> | null;
    diff: Record<string, any> | null;
  };
  tags: string[];

  // Metodi di istanza (dichiarati qui per type safety)
  isCritical(): boolean;
  getDescription(): string;
  requiresAlert(): boolean;
}

// Interfaccia per i metodi statici personalizzati
export interface IAzioneLogModel extends Model<IAzioneLog> {
  findByCategory(
    categoria: EventCategory,
    startDate?: Date,
    endDate?: Date
  ): Promise<IAzioneLog[]>;
  findCriticalEvents(limit?: number): Promise<IAzioneLog[]>;
  getStatsByCategory(startDate?: Date, endDate?: Date): Promise<any[]>;
}

// Schema MongoDB (ESTESO)
const AzioneLogSchema = new Schema<IAzioneLog, IAzioneLogModel>(
  {
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true, // Indice per query temporali
    },

    // ========== NUOVI CAMPI STANDARDIZZATI ==========
    categoria: {
      type: String,
      enum: Object.values(EventCategory),
      index: true, // Indice per filtrare per categoria
    },
    sottoCategoria: {
      type: String,
      index: true, // Indice per filtrare per sottotipo
    },
    criticita: {
      type: String,
      enum: Object.values(EventSeverity),
      index: true, // Indice per filtrare per severità
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },

    // ========== CAMPI LEGACY ==========
    origine: {
      tipo: {
        type: String,
        enum: ["utente", "sistema"],
        required: true,
      },
      id: {
        type: String,
        required: true,
        index: true, // Indice per tracciare azioni utente/sistema
      },
      dettagli: {
        type: Schema.Types.Mixed,
        default: {},
      },
    },
    azione: {
      tipo: {
        type: String,
        enum: ["create", "update", "delete", "custom"],
        required: true,
      },
      entita: {
        type: String,
        required: true,
        index: true, // Indice per filtrare per tipo entità
      },
      idEntita: {
        type: String,
        required: true,
        index: true, // Indice per tracciare specifiche entità
      },
      operazione: {
        type: String,
        required: true,
      },
      dettagli: {
        type: Schema.Types.Mixed,
        default: {},
      },
    },
    risultato: {
      esito: {
        type: String,
        enum: ["successo", "fallito", "parziale"],
        required: true,
        index: true, // Indice per filtrare successi/fallimenti
      },
      messaggio: String,
    },
    contesto: {
      transazioneId: {
        type: String,
        index: true, // Indice per tracciare transazioni
      },
      causalita: [{ type: String }],
      sessione: {
        type: String,
        index: true, // Indice per tracciare sessioni utente
      },
      ip: String,
      userAgent: String,
      ambiente: {
        type: String,
        required: true,
        default: "development",
        index: true, // Indice per separare ambienti
      },
    },
    stato: {
      precedente: { type: Schema.Types.Mixed, default: null },
      nuovo: { type: Schema.Types.Mixed, default: null },
      diff: { type: Schema.Types.Mixed, default: null },
    },
    tags: [
      {
        type: String,
        index: true, // Indice per ricerche per tag
      },
    ],
  },
  {
    // Opzioni dello schema
    timestamps: false, // Usiamo il nostro campo timestamp personalizzato
    collection: "azionelogs", // Nome esplicito della collection
  }
);

// ========== INDICI COMPOSTI ==========

// Indice per query su transazioni ordinate temporalmente
AzioneLogSchema.index({ "contesto.transazioneId": 1, timestamp: 1 });

// Indice per query su categoria + severità + timestamp (dashboard)
AzioneLogSchema.index({ categoria: 1, criticita: 1, timestamp: -1 });

// Indice per query su utente + timestamp (audit trail utente)
AzioneLogSchema.index({ "origine.id": 1, timestamp: -1 });

// Indice per query su entità + timestamp (storia entità)
AzioneLogSchema.index({
  "azione.entita": 1,
  "azione.idEntita": 1,
  timestamp: -1,
});

// Indice per eventi critici recenti (alerting)
AzioneLogSchema.index(
  {
    criticita: 1,
    timestamp: -1,
  },
  {
    partialFilterExpression: {
      criticita: { $in: [EventSeverity.ERROR, EventSeverity.CRITICAL] },
    },
  }
);

// Indice per eventi di sicurezza (GDPR/compliance)
AzioneLogSchema.index(
  {
    categoria: 1,
    timestamp: -1,
  },
  {
    partialFilterExpression: {
      categoria: EventCategory.SECURITY,
    },
  }
);

// ========== METODI DI ISTANZA ==========

/**
 * Verifica se l'evento è critico
 */
AzioneLogSchema.methods.isCritical = function (this: IAzioneLog): boolean {
  return (
    this.criticita === EventSeverity.CRITICAL ||
    this.criticita === EventSeverity.ERROR
  );
};

/**
 * Ottiene una descrizione human-readable dell'evento
 */
AzioneLogSchema.methods.getDescription = function (this: IAzioneLog): string {
  if (this.categoria && this.sottoCategoria) {
    return `[${this.categoria.toUpperCase()}] ${this.sottoCategoria}`;
  }
  return `${this.azione.operazione} su ${this.azione.entita}`;
};

/**
 * Verifica se l'evento richiede un alert
 */
AzioneLogSchema.methods.requiresAlert = function (this: IAzioneLog): boolean {
  // Eventi critici richiedono sempre alert
  if (this.criticita === EventSeverity.CRITICAL) {
    return true;
  }

  // Eventi di sicurezza richiedono alert
  if (this.categoria === EventCategory.SECURITY) {
    return true;
  }

  return false;
};

// ========== METODI STATICI ==========

/**
 * Trova eventi per categoria e intervallo temporale
 */
AzioneLogSchema.statics.findByCategory = function (
  this: IAzioneLogModel,
  categoria: EventCategory,
  startDate?: Date,
  endDate?: Date
): Promise<IAzioneLog[]> {
  const query: any = { categoria };

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = startDate;
    if (endDate) query.timestamp.$lte = endDate;
  }

  return this.find(query).sort({ timestamp: -1 }).exec();
};

/**
 * Trova eventi critici recenti
 */
AzioneLogSchema.statics.findCriticalEvents = function (
  this: IAzioneLogModel,
  limit: number = 100
): Promise<IAzioneLog[]> {
  return this.find({
    criticita: { $in: [EventSeverity.ERROR, EventSeverity.CRITICAL] },
  })
    .sort({ timestamp: -1 })
    .limit(limit)
    .exec();
};

/**
 * Statistiche eventi per categoria
 */
AzioneLogSchema.statics.getStatsByCategory = function (
  this: IAzioneLogModel,
  startDate?: Date,
  endDate?: Date
): Promise<any[]> {
  const matchStage: any = {
    categoria: { $exists: true, $ne: null }, // Filtra solo eventi con categoria
  };

  if (startDate || endDate) {
    matchStage.timestamp = {};
    if (startDate) matchStage.timestamp.$gte = startDate;
    if (endDate) matchStage.timestamp.$lte = endDate;
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          categoria: "$categoria",
          criticita: "$criticita",
        },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: "$_id.categoria",
        totalEvents: { $sum: "$count" },
        bySeverity: {
          $push: {
            severity: "$_id.criticita",
            count: "$count",
          },
        },
      },
    },
    { $sort: { totalEvents: -1 } },
  ]).exec();
};

// Creazione del modello
const AzioneLog = mongoose.model<IAzioneLog, IAzioneLogModel>(
  "AzioneLog",
  AzioneLogSchema
);

export default AzioneLog;
