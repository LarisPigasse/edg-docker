// src/modules/auth/models/Account.ts
import { DataTypes, Sequelize } from 'sequelize';

export const createAccountModel = (sequelize: Sequelize) => {
  const Account = sequelize.define(
    'Account',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        comment: 'ID interno auto-incrementale',
      },
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        unique: true,
        comment: 'UUID pubblico per identificazione esterna',
      },
      email: {
        type: DataTypes.STRING(256),
        allowNull: false,
        validate: {
          isEmail: true,
        },
        comment: "Email dell'utente (username)",
      },
      password: {
        type: DataTypes.STRING(256),
        allowNull: true,
        comment: 'Hash BCrypt della password',
      },
      accountType: {
        type: DataTypes.STRING(64),
        allowNull: true,
        field: 'accountType',
        defaultValue: 'indefinito',
        comment: "Tipo di account nell'ecosistema EDG",
      },
      entityId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'entityId',
        comment: "UUID dell'entità specifica (operatore_id, partner_id, etc.)",
      },
      roleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'roleId',
        references: {
          model: 'roles',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
        comment: "Ruolo assegnato all'account (definisce i permessi)",
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'isActive',
        comment: 'Account attivo nel sistema',
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'isVerified',
        comment: 'Email verificata',
      },
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'lastLogin',
        comment: 'Timestamp ultimo login',
      },
      blockedUntil: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'blockedUntil',
        comment: 'Data scadenza blocco temporaneo (null = permanente)',
      },
      blockReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'blockReason',
        comment: 'Motivo del blocco',
      },
    },
    {
      tableName: 'accounts',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['uuid'],
          name: 'unique_account_uuid',
        },
        {
          unique: true,
          fields: ['email'],
          name: 'unique_email_account_type',
        },
        { fields: ['accountType'], name: 'idx_account_type' },
        { fields: ['entityId'], name: 'idx_entity_id' },
        { fields: ['accountType', 'entityId'], name: 'idx_account_type_entity' },
        { fields: ['roleId'], name: 'idx_role_id' },
        { fields: ['isActive'], name: 'idx_is_active' },
        { fields: ['email'], name: 'idx_email' },
        { fields: ['isActive', 'accountType'], name: 'idx_active_type' },
        { fields: ['lastLogin'], name: 'idx_last_login' },
      ],
    }
  );

  return Account;
};
