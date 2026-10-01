// src/modules/auth/models/index.ts

// Modelli esistenti (aggiornati con id INTEGER)
export { createAccountModel } from './Account';
export { createSessionModel } from './Session';
export { createResetTokenModel } from './ResetToken';

// Nuovi modelli RBAC
export { createRoleModel } from './Role';
export { createRolePermissionModel } from './RolePermission';

// Modelli multi-tenant (ADR009)
export { createTenantModel } from './Tenant';
export { createTenantModuleModel } from './TenantModule';

// Catalogo moduli (ADR047)
export { createModuleModel } from './Module';

// Associazioni
export { setupAuthAssociations } from './associations';
