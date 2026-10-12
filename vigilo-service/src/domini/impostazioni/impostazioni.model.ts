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
import { AUDIT, istante, json } from '../../core/db/colonne';
import type { Preavvisi, Tolleranza } from '../../regole';

export interface ModelloApplicato {
  chiave: string;
  versione: number;
}

export interface Predefiniti {
  preavvisi: Preavvisi;
  tolleranza: Tolleranza;
}

export interface RegoleAvvisi {
  /** 'HH:MM', ora italiana */
  orarioRiepilogo: string;
  /** 1 = lunedi' ... 7 = domenica */
  giorniLavorativi: number[];
  /** Giorni fra un richiamo e il successivo per una scadenza scaduta (ADR067) */
  intervalloRichiami: number;
}

/** Proposti ai controlli nuovi finche' il cliente non li cambia (stessi valori della migrazione) */
export const PREDEFINITI_INIZIALI: Predefiniti = {
  preavvisi: { giorni: [32, 8, 1], uso: [] },
  tolleranza: { giorni: 0, uso: 0 },
};

export const AVVISI_INIZIALI: RegoleAvvisi = {
  orarioRiepilogo: '08:00',
  giorniLavorativi: [1, 2, 3, 4, 5],
  intervalloRichiami: 8,
};

export class ImpostazioniTenant extends Model<InferAttributes<ImpostazioniTenant>, InferCreationAttributes<ImpostazioniTenant>> {
  declare idTenant: number;
  declare avviatoIl: CreationOptional<Date | null>;
  declare modelliApplicati: CreationOptional<ModelloApplicato[]>;
  declare predefiniti: CreationOptional<Predefiniti>;
  declare avvisi: CreationOptional<RegoleAvvisi>;
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
    createdAt: istante(false),
    updatedAt: istante(false),
    ...AUDIT,
  },
  { sequelize, tableName: 'impostazioni' }
);
