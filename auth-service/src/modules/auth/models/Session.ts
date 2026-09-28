// src/modules/auth/models/Session.ts
import { DataTypes, Sequelize } from 'sequelize';

export const createSessionModel = (sequelize: Sequelize) => {
  const Session = sequelize.define(
    'Session',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        comment: 'ID interno auto-incrementale',
      },
      accountId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'accountId',
        references: {
          model: 'accounts',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        comment: 'Account proprietario della sessione',
      },
      refreshToken: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        field: 'refreshToken',
        comment: "Token per refresh dell'access token (ID pubblico della sessione)",
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'expiresAt',
        comment: 'Scadenza della sessione',
      },
      ipAddress: {
        type: DataTypes.STRING(45), // IPv6 support
        allowNull: true,
        field: 'ipAddress',
        comment: 'Indirizzo IP del client',
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'userAgent',
        comment: 'User Agent del browser/app',
      },
      device: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'device',
        comment: 'Tipo dispositivo: Desktop, Mobile, Tablet',
      },
      os: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'os',
        comment: 'Sistema operativo (es. Windows 11, macOS 14)',
      },
      browser: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'browser',
        comment: 'Browser e versione (es. Chrome 120)',
      },
      geoCountry: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'geoCountry',
        comment: 'Paese (es. Italy)',
      },
      geoRegion: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'geoRegion',
        comment: 'Regione (es. Abruzzo)',
      },
      geoCity: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'geoCity',
        comment: 'Città (es. Pescara)',
      },
      geoTimezone: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'geoTimezone',
        comment: 'Timezone (es. Europe/Rome)',
      },
      lastActivityAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'lastActivityAt',
        comment: 'Ultimo accesso/attività',
      },
      isRevoked: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'isRevoked',
        comment: 'Sessione revocata (logout)',
      },
    },
    {
      tableName: 'sessions',
      timestamps: true,
      updatedAt: true, // Abilitato per tracciare modifiche
      indexes: [
        {
          unique: true,
          fields: ['refreshToken'],
          name: 'unique_refresh_token',
        },
        { fields: ['accountId'], name: 'idx_session_account_id' },
        { fields: ['expiresAt'], name: 'idx_session_expires_at' },
        { fields: ['accountId', 'expiresAt'], name: 'idx_session_account_expires' },
        { fields: ['isRevoked'], name: 'idx_session_is_revoked' },
        { fields: ['accountId', 'isRevoked', 'expiresAt'], name: 'idx_session_active' },
        { fields: ['createdAt'], name: 'idx_session_created_at' },
      ],
    }
  );

  return Session;
};
