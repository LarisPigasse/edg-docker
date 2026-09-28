// src/modules/auth/models/Tenant.ts
import { DataTypes, Sequelize } from 'sequelize';

export const createTenantModel = (sequelize: Sequelize) => {
  const Tenant = sequelize.define(
    'Tenant',
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
      name: {
        type: DataTypes.STRING(128),
        allowNull: false,
        comment: 'Ragione sociale / nome del tenant',
      },
      slug: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
        comment: "Identificativo breve, usato per mapping dominio->tenant (ADR012)",
      },
      isSystem: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'isSystem',
        comment: 'Tenant di sistema (EDG stesso) - non modificabile/eliminabile',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'isActive',
        comment: 'Tenant attivo nel sistema',
      },
      defaultLocale: {
        type: DataTypes.STRING(5),
        allowNull: true,
        defaultValue: 'it',
        field: 'defaultLocale',
        comment: 'Lingua di default del tenant (es. it, en) - riservato per uso futuro',
      },
    },
    {
      tableName: 'tenants',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['uuid'],
          name: 'unique_tenant_uuid',
        },
        {
          unique: true,
          fields: ['slug'],
          name: 'unique_tenant_slug',
        },
        { fields: ['isSystem'], name: 'idx_tenant_is_system' },
        { fields: ['isActive'], name: 'idx_tenant_is_active' },
      ],
    }
  );

  return Tenant;
};
