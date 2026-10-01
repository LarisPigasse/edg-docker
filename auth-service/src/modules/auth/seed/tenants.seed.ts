// src/modules/auth/seed/tenants.seed.ts
import { v4 as uuidv4 } from 'uuid';
import { createServiceConfig } from '../../../core/config/environment';
import { DatabaseManager } from '../../../core/config/database';
import { createTenantModel } from '../models';

// ============================================================================
// TENANT DI SISTEMA (ADR009, ADR047)
// ============================================================================
// Il tenant "edg" rappresenta l'azienda stessa: tutti gli account interni
// (operatori, admin, root su pro-frontend) puntano a questo tenant, cosi'
// accounts.tenantId non e' mai NULL.
//
// ADR047: il tenant di sistema NON ha righe in tenant_modules. Il jolly '*'
// (tutti i moduli) gli viene dato dal codice in base a isSystem, cosi' le
// attivazioni puntano solo a moduli veri del catalogo.

const SYSTEM_TENANT = {
  slug: 'edg',
  name: 'Express Delivery Group',
  isSystem: true,
  defaultLocale: 'it',
};

async function seedSystemTenant(tenantModel: any): Promise<any> {
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

  console.log(`   ✅ Tenant "${SYSTEM_TENANT.slug}" configurato (ID: ${tenant.id}, tutti i moduli da codice)`);
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

    console.log('🔄 Sincronizzazione database...');
    await Tenant.sync();
    console.log('✅ Database sincronizzato\n');

    await seedSystemTenant(Tenant);

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
