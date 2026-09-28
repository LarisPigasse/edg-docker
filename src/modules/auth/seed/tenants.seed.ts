// src/modules/auth/seed/tenants.seed.ts
import { v4 as uuidv4 } from 'uuid';
import { createServiceConfig } from '../../../core/config/environment';
import { DatabaseManager } from '../../../core/config/database';
import { createTenantModel, createTenantModuleModel } from '../models';

// ============================================================================
// TENANT DI SISTEMA (ADR009)
// ============================================================================
// Il tenant "edg" rappresenta l'azienda stessa: tutti gli account interni
// (operatori, admin, root su pro-frontend) puntano a questo tenant, cosi'
// accounts.tenantId non e' mai NULL. Il suo unico modulo e' il wildcard '*',
// che il moduleGuard del gateway interpreta come "tutti i moduli attivi".

const SYSTEM_TENANT = {
  slug: 'edg',
  name: 'Express Delivery Group',
  isSystem: true,
  defaultLocale: 'it',
  modules: ['*'],
};

async function seedSystemTenant(tenantModel: any, tenantModuleModel: any): Promise<any> {
  console.log(`\n📝 Processando tenant di sistema: ${SYSTEM_TENANT.slug}`);

  const existing = await tenantModel.findOne({ where: { slug: SYSTEM_TENANT.slug } });

  let tenant;

  if (existing) {
    console.log(`   ⚠️  Tenant "${SYSTEM_TENANT.slug}" già esistente - aggiornamento...`);
    await existing.update({
      name: SYSTEM_TENANT.name,
      isSystem: SYSTEM_TENANT.isSystem,
      defaultLocale: SYSTEM_TENANT.defaultLocale,
    });
    tenant = existing;
  } else {
    console.log(`   ✅ Creazione tenant "${SYSTEM_TENANT.slug}"...`);
    tenant = await tenantModel.create({
      uuid: uuidv4(),
      name: SYSTEM_TENANT.name,
      slug: SYSTEM_TENANT.slug,
      isSystem: SYSTEM_TENANT.isSystem,
      isActive: true,
      defaultLocale: SYSTEM_TENANT.defaultLocale,
    });
  }

  console.log(`   🔑 Configurazione moduli per "${SYSTEM_TENANT.slug}"...`);
  await tenantModuleModel.destroy({ where: { tenantId: tenant.id } });

  for (const module of SYSTEM_TENANT.modules) {
    await tenantModuleModel.create({ tenantId: tenant.id, module });
    console.log(`      → ${module}`);
  }

  console.log(`   ✅ Tenant "${SYSTEM_TENANT.slug}" configurato (ID: ${tenant.id})`);
  return tenant;
}

async function main() {
  let dbManager: DatabaseManager | null = null;

  try {
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║         SEED TENANT DI SISTEMA - EDG Auth Service          ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');

    const config = createServiceConfig({ serviceName: 'EDG Auth Seed', port: 3001 });

    console.log('\n📊 Connessione al database...');
    dbManager = new DatabaseManager(config);

    const Tenant = createTenantModel(dbManager.getSequelize());
    const TenantModule = createTenantModuleModel(dbManager.getSequelize());

    Tenant.hasMany(TenantModule, { foreignKey: 'tenantId', as: 'modules' });
    TenantModule.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

    console.log('🔄 Sincronizzazione database...');
    await dbManager.getSequelize().sync();
    console.log('✅ Database sincronizzato\n');

    await seedSystemTenant(Tenant, TenantModule);

    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║              SEED COMPLETATO CON SUCCESSO                  ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    await dbManager.close();
    console.log('✅ Connessione database chiusa\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERRORE durante seed tenant:');
    console.error(error);

    if (dbManager) {
      await dbManager.close();
    }

    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { seedSystemTenant, SYSTEM_TENANT };
