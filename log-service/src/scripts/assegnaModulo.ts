// src/scripts/assegnaModulo.ts
//
// Assegnazione una tantum del modulo agli eventi scritti prima del campo
// `modulo` (fase 1 dei log, passo 1b). Gli eventi nuovi lo ricevono alla
// scrittura (hook pre-validate in models/azioneLog.ts), con la stessa tabella
// servizio -> modulo (config/moduli.ts); gli altri restano della piattaforma
// (modulo: null).
//
// Tocca SOLO il campo `modulo` degli eventi che non ce l'hanno: contenuto,
// esito e tempi restano intatti. Idempotente: una seconda esecuzione non
// trova nulla. Va rilanciato solo se si aggiunge un servizio alla tabella
// (allora: prima si toglie il modulo null degli eventi di quel servizio).
//
// Esecuzione nel container:  node dist/scripts/assegnaModulo.js
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../config/database';
import AzioneLog from '../models/azioneLog';
import { MODULO_DEL_SERVIZIO } from '../config/moduli';

(async () => {
  try {
    await connectDB();
    const collection = AzioneLog.collection;
    const senza = { modulo: { $exists: false } };

    for (const [servizio, modulo] of Object.entries(MODULO_DEL_SERVIZIO)) {
      const r = await collection.updateMany({ ...senza, 'azione.entita': servizio }, { $set: { modulo } });
      console.log(`[Modulo] ${servizio} -> ${modulo}: ${r.modifiedCount} eventi`);
    }
    const resto = await collection.updateMany(senza, { $set: { modulo: null } });
    console.log(`[Modulo] piattaforma (null): ${resto.modifiedCount} eventi`);
  } catch (error: any) {
    console.error('[Modulo] Errore:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
