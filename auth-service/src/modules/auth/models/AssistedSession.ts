// src/modules/auth/models/AssistedSession.ts
// =============================================================================
// Sessione assistita (ADR085, docs/piattaforma/accesso-assistito.md)
// =============================================================================
// Il personale EDG entra nel tenant di un cliente dal proprio account, per un
// tempo limitato. Una riga per ogni ingresso: chi, dove, perche', quando e
// come e' finita. La tabella si crea con la migrazione
// migrations/2026-10-21-assisted-sessions.sql.
import { DataTypes, Sequelize } from 'sequelize';

export const createAssistedSessionModel = (sequelize: Sequelize) => {
  const AssistedSession = sequelize.define(
    'AssistedSession',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        unique: true,
      },
      operatorAccountId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'operatorAccountId',
        comment: 'Chi agisce davvero (account del personale EDG)',
      },
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'tenantId',
        comment: 'Tenant del cliente in cui si entra',
      },
      modo: {
        type: DataTypes.STRING(16),
        allowNull: false,
        comment: 'preparazione | assistenza',
      },
      perContoAccountId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'perContoAccountId',
        comment: 'Solo in assistenza: utente di cui si vede la vista',
      },
      motivo: {
        type: DataTypes.STRING(256),
        allowNull: false,
      },
      startedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'startedAt',
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'expiresAt',
      },
      endedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'endedAt',
      },
      endReason: {
        type: DataTypes.STRING(16),
        allowNull: true,
        field: 'endReason',
        comment: 'uscita | scaduta | chiusa',
      },
      endedByAccountId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'endedByAccountId',
      },
      ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true,
        field: 'ipAddress',
      },
      userAgent: {
        type: DataTypes.STRING(512),
        allowNull: true,
        field: 'userAgent',
      },
    },
    {
      tableName: 'assisted_sessions',
      timestamps: true,
      indexes: [
        { unique: true, fields: ['uuid'], name: 'unique_assisted_session_uuid' },
        { fields: ['operatorAccountId', 'endedAt', 'expiresAt'], name: 'idx_assisted_operator_open' },
        { fields: ['tenantId'], name: 'idx_assisted_tenant' },
        { fields: ['startedAt'], name: 'idx_assisted_started' },
      ],
    }
  );

  return AssistedSession;
};
