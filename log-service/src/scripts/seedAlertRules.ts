// src/scripts/seedAlertRules.ts
/**
 * Seed delle regole di alerting predefinite.
 * 
 * Esecuzione:
 *   npx ts-node src/scripts/seedAlertRules.ts
 * 
 * Il seed è idempotente: le regole già esistenti (per nome) vengono saltate,
 * non duplicate né sovrascritte. Sicuro da eseguire più volte.
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../config/database';
import AlertRule from '../models/AlertRule';
import { EventCategory, EventSeverity } from '../types/eventCategories';

// ========== REGOLE PREDEFINITE ==========

const DEFAULT_RULES = [
  {
    name: 'Evento critico sistema',
    description:
      'Trigger immediato su qualsiasi evento con criticità CRITICAL, indipendentemente da categoria o origine.',
    enabled: true,
    conditions: {
      criticita: EventSeverity.CRITICAL,
    },
    threshold: {
      count: 1,
      windowMinutes: 0,
    },
    cooldownMinutes: 30,
  },
  {
    name: 'Errori ripetuti stesso servizio',
    description:
      'Scatta quando si verificano 5 o più errori in una finestra di 10 minuti, indicando un problema persistente su un servizio.',
    enabled: true,
    conditions: {
      criticita: EventSeverity.ERROR,
    },
    threshold: {
      count: 5,
      windowMinutes: 10,
    },
    cooldownMinutes: 60,
  },
  {
    name: 'Tentativi login falliti',
    description:
      'Rileva possibili attacchi brute-force: 10 o più autenticazioni fallite in 15 minuti.',
    enabled: true,
    conditions: {
      categoria: EventCategory.AUTH,
      esito: 'fallito',
    },
    threshold: {
      count: 10,
      windowMinutes: 15,
    },
    cooldownMinutes: 30,
  },
  {
    name: 'Servizio non raggiungibile',
    description:
      'Trigger immediato su eventi di sistema con criticità CRITICAL: crash, service down, errori infrastrutturali.',
    enabled: true,
    conditions: {
      categoria: EventCategory.SYSTEM,
      criticita: EventSeverity.CRITICAL,
    },
    threshold: {
      count: 1,
      windowMinutes: 0,
    },
    cooldownMinutes: 15,
  },
];

// ========== ESECUZIONE ==========

async function seed(): Promise<void> {
  try {
    await connectDB();
    console.log('[Seed] Connesso a MongoDB.\n');

    let created = 0;
    let skipped = 0;

    for (const ruleData of DEFAULT_RULES) {
      const existing = await AlertRule.findOne({ name: ruleData.name });

      if (existing) {
        console.log(`[Seed] ⏭  Skip  — "${ruleData.name}" (già esistente)`);
        skipped++;
        continue;
      }

      await AlertRule.create(ruleData);
      console.log(`[Seed] ✓  Creata — "${ruleData.name}"`);
      created++;
    }

    console.log(`\n[Seed] Completato: ${created} create, ${skipped} saltate.`);
  } catch (error: any) {
    console.error('[Seed] Errore:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('[Seed] Disconnesso da MongoDB.');
  }
}

seed();
