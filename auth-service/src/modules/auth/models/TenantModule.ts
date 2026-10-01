// src/modules/auth/models/TenantModule.ts
import { DataTypes, Sequelize } from 'sequelize';
import { ACTIVATION_STATUSES } from '../types/module.types';

/**
 * Attivazione di un modulo per un tenant (ADR047, evoluzione di ADR009).
 *
 * Una sola riga per coppia tenant/modulo: la storia dei cambiamenti la tiene
 * l'audit (ADR039). Il tenant di sistema non ha righe qui: il jolly '*' nel
 * JWT viene dato dal codice (AuthService).
 *
 * Accesso concesso solo se: stato prova|attivo, startsAt <= adesso,
 * endsAt assente o futura (vedi ModuleService.resolveTenantModules).
 */
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
        references: { model: 'tenants', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        comment: 'Tenant a cui appartiene il modulo',
      },
      module: {
        type: DataTypes.STRING(32),
        allowNull: false,
        references: { model: 'modules', key: 'key' },
        onDelete: 'RESTRICT',
        onUpdate: 'RESTRICT',
        comment: 'Chiave del modulo nel catalogo (modules.key)',
      },
      status: {
        type: DataTypes.STRING(16),
        allowNull: false,
        defaultValue: 'attivo',
        validate: { isIn: [ACTIVATION_STATUSES as unknown as string[]] },
        comment: 'prova | attivo | sospeso | scaduto',
      },
      startsAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'startsAt',
        comment: 'Inizio validita (UTC)',
      },
      endsAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'endsAt',
        comment: 'Fine validita (UTC): obbligatoria per la prova, NULL = senza scadenza',
      },
      expiredAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'expiredAt',
        comment: 'Quando e passata a scaduto: da qui i 64 giorni di conservazione dei dati',
      },
      config: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Opzioni del modulo per questo tenant (es. Vigilo)',
      },
      notes: {
        type: DataTypes.STRING(256),
        allowNull: true,
        comment: 'Note interne (es. riferimento commerciale)',
      },
      grantedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'grantedBy',
        references: { model: 'accounts', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        comment: 'Account che ha creato l attivazione',
      },
    },
    {
      tableName: 'tenant_modules',
      timestamps: true,
      validate: {
        // Una prova senza fine non e' una prova
        trialNeedsEnd(this: { status: string; endsAt: Date | null }) {
          if (this.status === 'prova' && !this.endsAt) {
            throw new Error('Una prova richiede la data di fine (endsAt)');
          }
        },
      },
      indexes: [
        { unique: true, fields: ['tenantId', 'module'], name: 'unique_tenant_module' },
        { fields: ['tenantId'], name: 'idx_tenant_modules_tenant_id' },
        { fields: ['module'], name: 'idx_tenant_modules_module' },
        { fields: ['status'], name: 'idx_tenant_modules_status' },
        { fields: ['endsAt'], name: 'idx_tenant_modules_ends_at' },
      ],
    }
  );

  return TenantModule;
};
