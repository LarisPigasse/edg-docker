// src/modules/auth/models/associations.ts
export const setupAuthAssociations = (models: any[]) => {
  const Account = models.find(m => m.name === 'Account');
  const Session = models.find(m => m.name === 'Session');
  const ResetToken = models.find(m => m.name === 'ResetToken');
  const Role = models.find(m => m.name === 'Role');
  const RolePermission = models.find(m => m.name === 'RolePermission');
  const Tenant = models.find(m => m.name === 'Tenant');
  const TenantModule = models.find(m => m.name === 'TenantModule');

  // ============================================================================
  // ASSOCIAZIONI BASE (Account - Session - ResetToken)
  // ============================================================================

  if (Account && Session) {
    Account.hasMany(Session, { foreignKey: 'accountId', as: 'sessions' });
    Session.belongsTo(Account, { foreignKey: 'accountId', as: 'account' });
  }

  if (Account && ResetToken) {
    Account.hasMany(ResetToken, { foreignKey: 'accountId', as: 'resetTokens' });
    ResetToken.belongsTo(Account, { foreignKey: 'accountId', as: 'account' });
  }

  // ============================================================================
  // ASSOCIAZIONI RBAC (Account - Role - RolePermission)
  // ============================================================================

  // Account belongsTo Role (ogni account ha UN ruolo)
  if (Account && Role) {
    Account.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
    Role.hasMany(Account, { foreignKey: 'roleId', as: 'accounts' });
  }

  // Role hasMany RolePermission (ogni ruolo ha MOLTI permessi)
  if (Role && RolePermission) {
    Role.hasMany(RolePermission, { foreignKey: 'roleId', as: 'permissions' });
    RolePermission.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
  }

  // ============================================================================
  // ASSOCIAZIONI MULTI-TENANT (Account - Tenant - TenantModule) - ADR009
  // ============================================================================

  // Account belongsTo Tenant (ogni account appartiene a UN tenant, mai a più di uno)
  if (Account && Tenant) {
    Account.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });
    Tenant.hasMany(Account, { foreignKey: 'tenantId', as: 'accounts' });
  }

  // Tenant hasMany TenantModule (ogni tenant ha MOLTI moduli attivi)
  if (Tenant && TenantModule) {
    Tenant.hasMany(TenantModule, { foreignKey: 'tenantId', as: 'modules' });
    TenantModule.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });
  }

  console.log('Associazioni Auth configurate:');
  console.log(' - Account → Session (hasMany)');
  console.log(' - Account → ResetToken (hasMany)');
  console.log(' - Account → Role (belongsTo)');
  console.log(' - Role → Account (hasMany)');
  console.log(' - Role → RolePermission (hasMany)');
  console.log(' - Account → Tenant (belongsTo)');
  console.log(' - Tenant → Account (hasMany)');
  console.log(' - Tenant → TenantModule (hasMany)');
};
