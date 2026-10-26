// =============================================================================
// Preferenze degli avvisi di un utente (04-avvisi 4.4)
// =============================================================================
// Come e quanto spesso ogni account vuole essere avvisato; senza riga valgono
// i predefiniti (riepilogo giornaliero, urgenti subito, app + email).
// =============================================================================
import { CreationOptional, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { sequelize } from '../../config/database';
import { booleano, elenco, intero, istante, json } from '../../core/db/colonne';
import { FREQUENZE_AVVISI, type Canale, type FrequenzaAvvisi } from '../valori';
import type { FiltriAvvisi } from './preferenze';

export class PreferenzeAvvisi extends Model<InferAttributes<PreferenzeAvvisi>, InferCreationAttributes<PreferenzeAvvisi>> {
  declare idTenant: number;
  declare idAccount: number;
  declare frequenza: CreationOptional<FrequenzaAvvisi>;
  declare urgentiSubito: CreationOptional<boolean>;
  declare canali: CreationOptional<Canale[]>;
  /** Tipi di soggetto e sedi (B8d-1); leggerli sempre con preferenzeEffettive (preferenze.ts) */
  declare filtri: CreationOptional<Partial<FiltriAvvisi>>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

PreferenzeAvvisi.init(
  {
    idTenant: { ...intero(false), primaryKey: true },
    idAccount: { ...intero(false), primaryKey: true },
    frequenza: elenco(FREQUENZE_AVVISI, false, 'riepilogo-giornaliero'),
    urgentiSubito: booleano(true),
    canali: json(false, ['app', 'email']),
    filtri: json(false, {}),
    createdAt: istante(false),
    updatedAt: istante(false),
  },
  { sequelize, tableName: 'preferenze_avvisi' }
);
