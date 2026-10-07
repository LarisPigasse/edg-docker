// src/modules/auth/models/Module.ts
import { DataTypes, Sequelize } from 'sequelize';
import { DEFAULT_TRIAL_DAYS, MODULE_STATUSES } from '../types/module.types';

/**
 * Catalogo dei moduli (ADR047).
 *
 * Il modulo nasce nel codice (manifest nel frontend), il database lo accende.
 * Catalogo piatto: nessuna gerarchia, solo prodotto e dipendenze. `key` e' la
 * chiave stabile usata ovunque (JWT, gateway, permessi) e non cambia mai.
 */
export const createModuleModel = (sequelize: Sequelize) => {
  const Module = sequelize.define(
    'Module',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      key: {
        type: DataTypes.STRING(32),
        allowNull: false,
        unique: true,
        comment: 'Chiave stabile e immutabile (es. vigilo, spedizioni, tracking)',
      },
      name: {
        type: DataTypes.STRING(64),
        allowNull: false,
        comment: 'Nome visualizzato',
      },
      description: {
        type: DataTypes.STRING(256),
        allowNull: true,
        comment: 'Descrizione breve per il catalogo',
      },
      product: {
        type: DataTypes.STRING(32),
        allowNull: false,
        comment: 'Prodotto di appartenenza (raggruppa menu e branding, ADR012)',
      },
      dependencies: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
        comment: 'Chiavi dei moduli richiesti (es. ["spedizioni"])',
      },
      status: {
        type: DataTypes.STRING(16),
        allowNull: false,
        defaultValue: 'sviluppo',
        validate: { isIn: [MODULE_STATUSES as unknown as string[]] },
        comment: 'sviluppo | disponibile | dismesso',
      },
      showcase: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'In vetrina: visibile anche a chi non lo ha (solo se disponibile, ADR056)',
      },
      trialDays: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: DEFAULT_TRIAL_DAYS,
        field: 'trialDays',
        comment: 'Durata predefinita della prova, in giorni',
      },
      version: {
        type: DataTypes.STRING(16),
        allowNull: false,
        defaultValue: '1.0.0',
        comment: 'Versione mostrata ai clienti (major.minor.patch), aggiornata a ogni rilascio (ADR057)',
      },
      branding: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Icona, logo e titolo: immagine o testo con classi Tailwind (ADR054)',
      },
    },
    {
      tableName: 'modules',
      timestamps: true,
      indexes: [
        { unique: true, fields: ['key'], name: 'unique_module_key' },
        { fields: ['product'], name: 'idx_modules_product' },
        { fields: ['status'], name: 'idx_modules_status' },
      ],
    }
  );

  return Module;
};
