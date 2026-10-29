// =============================================================================
// Impostazioni di Vigilo per un tenant (passi 3.5 e 4)
// =============================================================================
// Una riga per cliente, chiave = idTenant: quando e' stata fatta la procedura
// di avvio, quali modelli di settore ha applicato, i predefiniti proposti ai
// controlli nuovi e le regole degli avvisi.
// Si chiama ImpostazioniTenant per non confondersi con Impostazioni delle
// regole (i 4 gruppi ereditabili).
// =============================================================================
import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { sequelize } from '../../config/database';
import { AUDIT, giorno, istante, json } from '../../core/db/colonne';
import type { Giorno, Preavvisi, Tolleranza } from '../../regole';
import { AVVISI_INIZIALI, type RegoleAvvisi, type RegoleInterventi } from './limiti';

export { AVVISI_INIZIALI, type RegoleAvvisi };

export interface ModelloApplicato {
  chiave: string;
  versione: number;
}

export interface Predefiniti {
  preavvisi: Preavvisi;
  tolleranza: Tolleranza;
}

/** Proposti ai controlli nuovi finche' il cliente non li cambia (stessi valori della migrazione) */
export const PREDEFINITI_INIZIALI: Predefiniti = {
  preavvisi: { giorni: [32, 8, 1], uso: [] },
  tolleranza: { giorni: 0, uso: 0 },
};

export class ImpostazioniTenant extends Model<InferAttributes<ImpostazioniTenant>, InferCreationAttributes<ImpostazioniTenant>> {
  declare idTenant: number;
  declare avviatoIl: CreationOptional<Date | null>;
  declare modelliApplicati: CreationOptional<ModelloApplicato[]>;
  declare predefiniti: CreationOptional<Predefiniti>;
  /** Regole salvate: leggerle sempre con avvisiEffettivi (limiti.ts) */
  declare avvisi: CreationOptional<Partial<RegoleAvvisi>>;
  /** Giorno dell'ultimo riepilogo degli avvisi completato (ADR093) */
  declare ultimoRiepilogoIl: CreationOptional<Giorno | null>;
  /** Costo orario predefinito e giorni per riparare (passo 8): leggerle sempre con interventiEffettivi */
  declare interventi: CreationOptional<Partial<RegoleInterventi>>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare creatoDa: CreationOptional<number | null>;
  declare modificatoDa: CreationOptional<number | null>;
}

ImpostazioniTenant.init(
  {
    idTenant: { type: DataTypes.INTEGER, primaryKey: true },
    avviatoIl: istante(),
    modelliApplicati: json(false, []),
    predefiniti: json(false, PREDEFINITI_INIZIALI),
    avvisi: json(false, AVVISI_INIZIALI),
    ultimoRiepilogoIl: giorno(),
    interventi: json(false, {}),
    createdAt: istante(false),
    updatedAt: istante(false),
    ...AUDIT,
  },
  { sequelize, tableName: 'impostazioni' }
);
