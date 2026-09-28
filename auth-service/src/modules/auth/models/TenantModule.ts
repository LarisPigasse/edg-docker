// src/modules/auth/models/TenantModule.ts
import { DataTypes, Sequelize } from 'sequelize';

export const createTenantModuleModel = (sequelize: Sequelize) => {
  const TenantModule = sequelize.define(
    'TenantModule',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        comment: 'ID interno auto-incrementale',
      },
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'tenantId',
        references: {
          model: 'tenants',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        comment: 'Tenant a cui appartiene il modulo',
      },
      module: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Modulo attivato: es. vehicles, vigilo, spedizioni, o wildcard *',
      },
    },
    {
      tableName: 'tenant_modules',
      timestamps: true,
      updatedAt: false, // Solo createdAt, come RolePermission
      indexes: [
        {
          unique: true,
          fields: ['tenantId', 'module'],
          name: 'unique_tenant_module',
        },
        {
          fields: ['tenantId'],
          name: 'idx_tenant_modules_tenant_id',
        },
        {
          fields: ['module'],
          name: 'idx_tenant_modules_module',
        },
      ],
    }
  );

  return TenantModule;
};
