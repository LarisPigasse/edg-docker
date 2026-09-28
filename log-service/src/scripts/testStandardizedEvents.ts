// src/scripts/testStandardizedEvents.ts

/**
 * Script di test per eventi standardizzati
 * Esegui con: npm run test:events
 */

import mongoose from "mongoose";
import AzioneLog from "../models/azioneLog";
import { EventBuilder } from "../utils/eventBuilder";
import {
  EventCategory,
  EventSeverity,
  AuthEventType,
  DataEventType,
  EmailEventType,
  SystemEventType,
  DataEventMetadata,
  SystemEventMetadata,
} from "../types/eventCategories";
import {
  validateStandardizedEvent,
  normalizeStandardizedEvent,
} from "../utils/eventValidator";

// Configurazione database
// Usa MONGO_URI dall'ambiente oppure la connessione Docker di default
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://edg_logger:LoggerMongo2025!@localhost:27017/edg-logger?authSource=admin";

/**
 * Test 1: Eventi AUTH
 */
async function testAuthEvents() {
  console.log("\n========== TEST 1: Eventi AUTH ==========");

  try {
    // Login riuscito
    const loginEvent = EventBuilder.auth
      .login()
      .user("user_001", "mario.rossi", "mario.rossi@edg.com")
      .fromIp("192.168.1.100")
      .withUserAgent("Mozilla/5.0 Chrome/120.0")
      .session("sess_abc123")
      .withTags("authentication", "web-login")
      .build();

    const loginLog = await AzioneLog.create(loginEvent);
    console.log("✅ Login event created:", loginLog._id);
    console.log("   Description:", loginLog.getDescription());
    console.log("   Is Critical:", loginLog.isCritical());

    // Login fallito
    const failedLoginEvent = EventBuilder.auth
      .loginFailed()
      .user("user_002", "test.user")
      .fromIp("203.0.113.42")
      .failureReason("Password errata (3° tentativo)")
      .severity(EventSeverity.WARNING)
      .build();

    const failedLog = await AzioneLog.create(failedLoginEvent);
    console.log("✅ Failed login event created:", failedLog._id);
    console.log("   Requires Alert:", failedLog.requiresAlert());

    // Password reset
    const resetEvent = EventBuilder.auth
      .passwordReset()
      .user("user_001", "mario.rossi", "mario.rossi@edg.com")
      .fromIp("192.168.1.101")
      .build();

    const resetLog = await AzioneLog.create(resetEvent);
    console.log("✅ Password reset event created:", resetLog._id);
  } catch (error) {
    console.error("❌ Error in AUTH tests:", error);
  }
}

/**
 * Test 2: Eventi DATA
 */
async function testDataEvents() {
  console.log("\n========== TEST 2: Eventi DATA ==========");

  try {
    // Creazione ordine
    const createEvent = EventBuilder.data
      .create("order", "ord_12345")
      .entityName("Ordine Milano-Roma Express")
      .byUser("user_001")
      .withState(null, {
        status: "pending",
        amount: 150.0,
        items: 5,
      })
      .withTags("order-management", "sales", "express-delivery")
      .build();

    const createLog = await AzioneLog.create(createEvent);
    console.log("✅ Create order event created:", createLog._id);

    // Aggiornamento ordine
    const updateEvent = EventBuilder.data
      .update("order", "ord_12345")
      .entityName("Ordine Milano-Roma Express")
      .byUser("user_003")
      .fieldsChanged("status", "trackingNumber", "deliveryDate")
      .withState(
        { status: "pending", trackingNumber: null },
        { status: "in_transit", trackingNumber: "TRK987654321" }
      )
      .build();

    const updateLog = await AzioneLog.create(updateEvent);
    console.log("✅ Update order event created:", updateLog._id);
    console.log("   Fields changed:", (updateEvent.metadata as DataEventMetadata)?.fieldsChanged);

    // Cancellazione fallita
    const deleteEvent = EventBuilder.data
      .delete("order", "ord_12345")
      .byUser("user_001")
      .failed("Impossibile cancellare: ordine già spedito")
      .severity(EventSeverity.WARNING)
      .build();

    const deleteLog = await AzioneLog.create(deleteEvent);
    console.log("✅ Delete failed event created:", deleteLog._id);
    console.log("   Severity:", deleteLog.criticita);
  } catch (error) {
    console.error("❌ Error in DATA tests:", error);
  }
}

/**
 * Test 3: Eventi EMAIL
 */
async function testEmailEvents() {
  console.log("\n========== TEST 3: Eventi EMAIL ==========");

  try {
    // Email inviata
    const sentEvent = EventBuilder.email
      .sent("customer@example.com", "Conferma ordine #12345")
      .emailId("email_abc123")
      .template("order-confirmation")
      .provider("sendgrid")
      .withTags("transactional", "order-notification")
      .build();

    const sentLog = await AzioneLog.create(sentEvent);
    console.log("✅ Email sent event created:", sentLog._id);

    // Email fallita
    const failedEvent = EventBuilder.email
      .failed(
        "invalid@example.com",
        "Newsletter Gennaio 2025",
        "SMTP timeout dopo 3 tentativi"
      )
      .template("newsletter-monthly")
      .provider("mailgun")
      .errorCode("SMTP_TIMEOUT")
      .severity(EventSeverity.WARNING)
      .build();

    const failedLog = await AzioneLog.create(failedEvent);
    console.log("✅ Email failed event created:", failedLog._id);

    // Email bounce hard
    const bouncedEvent = EventBuilder.email
      .bounced("nonexistent@example.com", "Benvenuto su EDG Platform", "hard")
      .template("welcome-email")
      .provider("sendgrid")
      .build();

    const bouncedLog = await AzioneLog.create(bouncedEvent);
    console.log("✅ Email bounced event created:", bouncedLog._id);
  } catch (error) {
    console.error("❌ Error in EMAIL tests:", error);
  }
}

/**
 * Test 4: Eventi SYSTEM
 */
async function testSystemEvents() {
  console.log("\n========== TEST 4: Eventi SYSTEM ==========");

  try {
    // Cron job completato
    const cronEvent = EventBuilder.system
      .cronJob("daily-shipping-report")
      .completed(4200, 850) // 4.2 secondi, 850 spedizioni processate
      .withTags("automation", "reports", "scheduled")
      .build();

    const cronLog = await AzioneLog.create(cronEvent);
    console.log("✅ Cron job completed event created:", cronLog._id);
    console.log(
      "   Duration:",
      (cronEvent.metadata as SystemEventMetadata)?.duration,
      "ms, Records:",
      (cronEvent.metadata as SystemEventMetadata)?.recordsProcessed
    );

    // API call esterna
    const apiEvent = EventBuilder.system
      .apiCall("tracking-api", "/v1/shipments/track")
      .statusCode(200)
      .context({
        trackingNumber: "TRK987654321",
        carrier: "DHL",
      })
      .build();

    const apiLog = await AzioneLog.create(apiEvent);
    console.log("✅ API call event created:", apiLog._id);

    // Cron job fallito
    const failedCronEvent = EventBuilder.system
      .cronJob("nightly-backup")
      .failed("Spazio disco insufficiente sul server backup")
      .severity(EventSeverity.ERROR)
      .build();

    const failedCronLog = await AzioneLog.create(failedCronEvent);
    console.log("✅ Failed cron job event created:", failedCronLog._id);
    console.log("   Is Critical:", failedCronLog.isCritical());
  } catch (error) {
    console.error("❌ Error in SYSTEM tests:", error);
  }
}

/**
 * Test 5: Query e Statistiche
 */
async function testQueries() {
  console.log("\n========== TEST 5: Query e Statistiche ==========");

  try {
    // Eventi AUTH ultimi 24h
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const authEvents = await AzioneLog.findByCategory(
      EventCategory.AUTH,
      yesterday
    );
    console.log(`✅ Found ${authEvents.length} AUTH events in last 24h`);

    // Eventi critici
    const criticalEvents = await AzioneLog.findCriticalEvents(10);
    console.log(`✅ Found ${criticalEvents.length} critical events`);
    if (criticalEvents.length > 0) {
      criticalEvents.forEach((evt) => {
        console.log(
          `   - ${evt.getDescription()} [${evt.criticita}] at ${evt.timestamp}`
        );
      });
    }

    // Statistiche per categoria
    const stats = await AzioneLog.getStatsByCategory(yesterday);
    console.log("✅ Statistics by category:");
    stats.forEach((stat: any) => {
      console.log(`   ${stat._id}: ${stat.totalEvents} events`);
      stat.bySeverity.forEach((sev: any) => {
        console.log(`     - ${sev.severity}: ${sev.count}`);
      });
    });

    // Eventi per utente specifico
    const userEvents = await AzioneLog.find({
      "origine.id": "user_001",
    })
      .sort({ timestamp: -1 })
      .limit(5);
    console.log(`✅ Found ${userEvents.length} events for user_001`);

    // Eventi EMAIL falliti
    const failedEmails = await AzioneLog.find({
      categoria: EventCategory.EMAIL,
      "risultato.esito": "fallito",
    }).limit(5);
    console.log(`✅ Found ${failedEmails.length} failed email events`);
  } catch (error) {
    console.error("❌ Error in query tests:", error);
  }
}

/**
 * Test 6: Validazione
 */
async function testValidation() {
  console.log("\n========== TEST 6: Validazione ==========");

  try {
    // Evento valido
    const validPayload = EventBuilder.auth
      .login()
      .user("user_test")
      .fromIp("127.0.0.1")
      .build();

    const validResult = validateStandardizedEvent(validPayload);
    console.log("✅ Valid payload validation:", validResult.valid);
    if (!validResult.valid) {
      console.log("   Errors:", validResult.errors);
    }
    if (validResult.warnings.length > 0) {
      console.log("   Warnings:", validResult.warnings);
    }

    // Evento invalido (manca sottoCategoria)
    const invalidPayload: any = {
      categoria: EventCategory.AUTH,
      // sottoCategoria: mancante!
      criticita: EventSeverity.INFO,
      risultato: { esito: "successo" },
    };

    const invalidResult = validateStandardizedEvent(invalidPayload);
    console.log("❌ Invalid payload validation:", invalidResult.valid);
    console.log("   Expected errors:", invalidResult.errors);

    // Normalizzazione automatica
    const legacyPayload: any = {
      azione: {
        tipo: "create",
        entita: "shipment",
        idEntita: "ship_001",
        operazione: "Nuova spedizione creata",
      },
      risultato: {
        esito: "successo",
      },
    };

    const normalized = normalizeStandardizedEvent(legacyPayload);
    console.log("✅ Normalized legacy payload:");
    console.log("   Categoria:", normalized.categoria);
    console.log("   Criticità:", normalized.criticita);
  } catch (error) {
    console.error("❌ Error in validation tests:", error);
  }
}

/**
 * Test 7: Retrocompatibilità
 */
async function testBackwardCompatibility() {
  console.log("\n========== TEST 7: Retrocompatibilità ==========");

  try {
    // Log in formato legacy (senza categorie standardizzate)
    const legacyLog = {
      origine: {
        tipo: "utente" as const,
        id: "user_legacy",
        dettagli: { name: "Legacy User" },
      },
      azione: {
        tipo: "update" as const,
        entita: "customer",
        idEntita: "cust_456",
        operazione: "Aggiornamento dati cliente",
        dettagli: { field: "email" },
      },
      risultato: {
        esito: "successo" as const,
        messaggio: "Email aggiornata con successo",
      },
      contesto: {
        ambiente: "production",
        ip: "192.168.1.50",
      },
      stato: {
        precedente: { email: "old@example.com" },
        nuovo: { email: "new@example.com" },
        diff: null,
      },
      tags: ["customer-management", "profile-update"],
    };

    const legacyCreated = await AzioneLog.create(legacyLog);
    console.log("✅ Legacy format log created:", legacyCreated._id);
    console.log("   Has categoria:", !!legacyCreated.categoria);
    console.log("   Description:", legacyCreated.getDescription());

    // Verifica che entrambi i formati coesistano
    const allLogs = await AzioneLog.find({}).sort({ timestamp: -1 }).limit(5);
    console.log(`✅ Last 5 logs (mixed formats):`);
    allLogs.forEach((log) => {
      const type = log.categoria ? `Standardized` : `Legacy`;
      console.log(
        `   - [${type}] ${log.getDescription()} @ ${log.timestamp.toLocaleString()}`
      );
    });
  } catch (error) {
    console.error("❌ Error in backward compatibility tests:", error);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log("╔════════════════════════════════════════════════╗");
  console.log("║  EDG Log Service - Test Eventi Standardizzati ║");
  console.log("╚════════════════════════════════════════════════╝");

  try {
    // Connessione database
    console.log("\n🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Esegui tutti i test in sequenza
    await testAuthEvents();
    await testDataEvents();
    await testEmailEvents();
    await testSystemEvents();
    await testQueries();
    await testValidation();
    await testBackwardCompatibility();

    console.log("\n✅ All tests completed successfully!");
  } catch (error) {
    console.error("\n❌ Test suite failed:", error);
  } finally {
    // Chiudi connessione
    await mongoose.connection.close();
    console.log("\n🔌 MongoDB connection closed");
    process.exit(0);
  }
}

// Esegui i test
runTests();
