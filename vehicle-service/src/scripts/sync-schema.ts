'use strict';

// =============================================================================
// SYNC SCHEMA — Ricostruzione schema da modelli Sequelize (una tantum)
// =============================================================================
//
// Le migration sequelize-cli in src/migrations/ non creano mai tabelle: l'unica
// presente (20260306-00-initial-schema.js) è un baseline no-op che assume lo
// schema già esistente, creato in origine da uno script SQL esterno
// (schema_edg_vehicles.sql) andato perso nell'incidente Docker/WSL2 del
// 16/09/2026 (volumi locali cancellati, script mai versionato nel repo).
//
// Questo script ricostruisce lo schema direttamente dalle definizioni dei
// modelli (src/models/*.ts + associazioni in src/models/index.ts), che sono
// complete — colonne, tipi, default, validazioni, foreign key, vincoli
// unique/indici — ed erano già in uso in produzione prima dell'incidente.
//
// Uso, una sola volta su un database vuoto (o comunque privo delle tabelle
// applicative, con o senza SequelizeMeta):
//
//   docker compose exec vehicle-service npm run schema:sync
//
// sequelize.sync() è idempotente (CREATE TABLE IF NOT EXISTS sotto il cofano)
// e quindi innocuo da rieseguire, ma NON sostituisce sequelize-cli per
// l'evoluzione futura dello schema: da qui in avanti ogni modifica va fatta
// con una vera migration in src/migrations/.

import { sequelize } from '../config/database';
// Importare da './models' (l'index, non i singoli file modello) esegue anche
// il codice di associazione in models/index.ts: senza le associazioni le
// foreign key verrebbero comunque create (sono definite nei singoli modelli),
// ma è questo il punto di ingresso corretto e coerente con il resto del
// progetto (vedi commento in cima a models/index.ts).
import './models';

async function run(): Promise<void> {
  console.log('🔧 Connessione al database...');
  await sequelize.authenticate();
  console.log('✅ Connessione riuscita\n');

  console.log('🔧 Sincronizzazione schema (creazione tabelle mancanti)...');
  await sequelize.sync();
  console.log('✅ Schema sincronizzato con successo\n');

  await sequelize.close();
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Errore durante la sincronizzazione dello schema:', err);
  process.exit(1);
});
