// src/scripts/seedAlertRules.ts
//
// Esecuzione manuale (opzionale): npx ts-node src/scripts/seedAlertRules.ts
// Le regole predefinite vengono gia' create all'avvio di log-service
// (ADR038): questo script richiama la stessa funzione, utile solo per
// verifiche fuori dal container.
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../config/database';
import { ensureDefaultRules } from '../services/alerting/defaultRules';

(async () => {
  try {
    await connectDB();
    const { created, version } = await ensureDefaultRules();
    console.log(`[Seed] Versione ${version}. Create: ${created.length ? created.join(', ') : 'nessuna'}`);
  } catch (error: any) {
    console.error('[Seed] Errore:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
