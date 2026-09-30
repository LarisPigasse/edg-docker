// src/scripts/normalizeServiceNames.ts
//
// Allineamento una tantum degli identificativi di servizio negli eventi
// (ADR044). Fino al 2026-09-30 system-service e vehicle-service registravano
// come servizio il nome visualizzato ("EDG System Service"), mentre
// l'HealthMonitor e auth-service usano il nome del container
// ("system-service"): lo stesso servizio finiva in due gruppi diversi.
//
// Cambia SOLO l'identificativo tecnico (azione.entita, origine.id quando
// l'origine e' il sistema, tags); contenuto, esito e tempi degli eventi
// restano intatti. Idempotente: una seconda esecuzione non trova nulla.
//
// Esecuzione nel container:  node dist/scripts/normalizeServiceNames.js
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../config/database';
import AzioneLog from '../models/azioneLog';

const RENAMES: Record<string, string> = {
  'EDG System Service': 'system-service',
  'EDG Vehicle Service': 'vehicle-service',
  'EDG Auth Service': 'auth-service',
};

(async () => {
  try {
    await connectDB();
    const collection = AzioneLog.collection;

    for (const [from, to] of Object.entries(RENAMES)) {
      const entita = await collection.updateMany({ 'azione.entita': from }, { $set: { 'azione.entita': to } });
      const origine = await collection.updateMany(
        { 'origine.tipo': 'sistema', 'origine.id': from },
        { $set: { 'origine.id': to } }
      );
      const tags = await collection.updateMany({ tags: from }, { $set: { 'tags.$': to } });
      console.log(
        `[Normalize] "${from}" -> "${to}": entita ${entita.modifiedCount}, ` +
          `origine ${origine.modifiedCount}, tags ${tags.modifiedCount}`
      );
    }
  } catch (error: any) {
    console.error('[Normalize] Errore:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
