// src/modules/auth/seed/modules.seed.ts
import { createServiceConfig } from '../../../core/config/environment';
import { DatabaseManager } from '../../../core/config/database';
import { createModuleModel } from '../models';
import { DEFAULT_TRIAL_DAYS, type ModuleStatus } from '../types/module.types';

// ============================================================================
// CATALOGO INIZIALE DEI MODULI (ADR047)
// ============================================================================
// Stessi dati della migrazione 2026-10-01-module-catalog.sql, per i database
// creati da zero con seed:all. Il seed AGGIUNGE solo i moduli mancanti: non
// sovrascrive mai quelli esistenti, che root puo' aver modificato dalla UI.

interface CatalogEntry {
  key: string;
  name: string;
  description: string;
  product: string;
  dependencies: string[];
  status: ModuleStatus;
}

const INITIAL_CATALOG: CatalogEntry[] = [
  {
    key: 'vigilo',
    name: 'Vigilo',
    description: 'Scadenze, manutenzioni e controlli periodici di veicoli, mezzi e addetti',
    product: 'vigilo',
    dependencies: [],
    status: 'sviluppo',
  },
  {
    key: 'spedizioni',
    name: 'Spedizioni',
    description: 'Gestione delle spedizioni',
    product: 'spedizioni',
    dependencies: [],
    status: 'sviluppo',
  },
  {
    key: 'tracking',
    name: 'Tracking',
    description: 'Tracciamento delle spedizioni',
    product: 'spedizioni',
    dependencies: ['spedizioni'],
    status: 'sviluppo',
  },
];

async function seedModuleCatalog(moduleModel: any): Promise<void> {
  console.log('\n📝 Catalogo moduli');

  for (const entry of INITIAL_CATALOG) {
    const [, created] = await moduleModel.findOrCreate({
      where: { key: entry.key },
      defaults: { ...entry, trialDays: DEFAULT_TRIAL_DAYS },
    });
    console.log(`   ${created ? '✅ creato' : '⏭️  già presente'}: ${entry.key} (${entry.product})`);
  }
}

async function main() {
  let dbManager: DatabaseManager | null = null;

  try {
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║         SEED CATALOGO MODULI - EDG Auth Service           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');

    const config = createServiceConfig({ serviceName: 'EDG Auth Seed', port: 3001 });
    dbManager = new DatabaseManager(config);

    const Module = createModuleModel(dbManager.getSequelize());
    await Module.sync();

    await seedModuleCatalog(Module);

    await dbManager.close();
    console.log('\n✅ Seed catalogo completato\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERRORE durante seed catalogo moduli:');
    console.error(error);
    if (dbManager) await dbManager.close();
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { seedModuleCatalog, INITIAL_CATALOG };
