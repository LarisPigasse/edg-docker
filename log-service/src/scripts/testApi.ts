// src/scripts/testApi.ts
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const API_URL = process.env.API_URL || "http://localhost:4000";
const API_KEY = process.env.API_KEY_SECRET || "your_development_secret_key_change_in_production";

// Definire un'interfaccia per il log
interface LogResponse {
  _id: string;
  timestamp: string;
  origine: {
    tipo: string;
    id: string;
    dettagli: Record<string, any>;
  };
  azione: {
    tipo: string;
    entita: string;
    idEntita: string;
    operazione: string;
    dettagli: Record<string, any>;
  };
  risultato: {
    esito: string;
    messaggio?: string;
  };
  stato?: {
    precedente: Record<string, any> | null;
    nuovo: Record<string, any> | null;
    diff: Record<string, any> | null;
  };
  tags: string[];
}

const createSampleLog = async (): Promise<LogResponse> => {
  const response = await fetch(`${API_URL}/api/log/azione`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({
      origine: {
        tipo: "sistema",
        id: "test-script",
        dettagli: { test: true },
      },
      azione: {
        tipo: "custom",
        entita: "test",
        idEntita: "test-1",
        operazione: "test-api",
        dettagli: { note: "Test automatico API" },
      },
      risultato: {
        esito: "successo",
        messaggio: "Test completato con successo",
      },
      tags: ["test", "api", "script"],
    }),
  });

  return await response.json();
};

// Correggiamo il tipo del parametro logId
const testLogDetails = async (logId: string): Promise<void> => {
  console.log(`\nTest recupero log dettaglio (ID: ${logId})`);
  const response = await fetch(`${API_URL}/api/log/azioni/${logId}`, {
    headers: {
      "x-api-key": API_KEY,
    },
  });

  console.log(`Status: ${response.status}`);
  if (response.ok) {
    const log = await response.json();
    console.log("Log recuperato:", {
      id: log._id,
      timestamp: log.timestamp,
      entita: log.azione.entita,
      operazione: log.azione.operazione,
      esito: log.risultato.esito,
    });
  } else {
    console.log("Errore nel recupero del log");
  }
};

const testStateDiff = async (): Promise<void> => {
  console.log("\nTest calcolo differenze di stato");
  const response = await fetch(`${API_URL}/api/log/azione`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({
      origine: {
        tipo: "utente",
        id: "test-user",
        dettagli: { nome: "Test User" },
      },
      azione: {
        tipo: "update",
        entita: "operatore",
        idEntita: "op-123",
        operazione: "update",
        dettagli: { campi: ["nome", "email", "telefono"] },
      },
      stato: {
        precedente: {
          nome: "Vecchio Nome",
          email: "vecchio@example.com",
          telefono: "3331234567",
        },
        nuovo: {
          nome: "Nuovo Nome",
          email: "nuovo@example.com",
          ruolo: "admin", // Campo aggiunto
          // telefono rimosso
        },
      },
      risultato: {
        esito: "successo",
        messaggio: "Operatore aggiornato con successo",
      },
      tags: ["test", "diff", "operatore"],
    }),
  });

  console.log(`Status: ${response.status}`);
  if (response.ok) {
    const log = await response.json();
    console.log("Log con diff creato:", {
      id: log._id,
      diff: log.stato.diff,
    });
  } else {
    console.log("Errore nella creazione del log con diff");
  }
};

const testTransaction = async (): Promise<void> => {
  console.log("\nTest registrazione e recupero transazione");

  const transactionId = `test-tr-${Date.now()}`;

  // Log inizio transazione
  const startLog = {
    origine: {
      tipo: "sistema",
      id: "test-script",
      dettagli: { test: true },
    },
    azione: {
      tipo: "custom",
      entita: "transaction",
      idEntita: transactionId,
      operazione: "start",
      dettagli: { name: "Test Transaction" },
    },
    contesto: {
      transazioneId: transactionId,
      ambiente: "test",
    },
    risultato: {
      esito: "successo",
      messaggio: "Transazione iniziata",
    },
    tags: ["test", "transaction", "start"],
  };

  await fetch(`${API_URL}/api/log/azione`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify(startLog),
  });

  // Log operazione con stato
  const operationLog = {
    origine: {
      tipo: "utente",
      id: "test-user",
      dettagli: { nome: "Test User" },
    },
    azione: {
      tipo: "update",
      entita: "operatore",
      idEntita: "op-123",
      operazione: "update",
      dettagli: { campi: ["nome", "email"] },
    },
    stato: {
      precedente: { nome: "Vecchio Nome", email: "vecchio@example.com" },
      nuovo: { nome: "Nuovo Nome", email: "nuovo@example.com" },
    },
    contesto: {
      transazioneId: transactionId,
      ambiente: "test",
    },
    risultato: {
      esito: "successo",
    },
    tags: ["test", "operatore", "update"],
  };

  await fetch(`${API_URL}/api/log/azione`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify(operationLog),
  });

  // Log fine transazione
  const endLog = {
    origine: {
      tipo: "sistema",
      id: "test-script",
      dettagli: { test: true },
    },
    azione: {
      tipo: "custom",
      entita: "transaction",
      idEntita: transactionId,
      operazione: "end",
      dettagli: { name: "Test Transaction" },
    },
    contesto: {
      transazioneId: transactionId,
      ambiente: "test",
    },
    risultato: {
      esito: "successo",
      messaggio: "Transazione completata",
    },
    tags: ["test", "transaction", "end"],
  };

  await fetch(`${API_URL}/api/log/azione`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify(endLog),
  });

  // Recupera transazione
  console.log(`\nTest recupero transazione (ID: ${transactionId})`);
  const response = await fetch(`${API_URL}/api/log/transazioni/${transactionId}`, {
    headers: {
      "x-api-key": API_KEY,
    },
  });

  console.log(`Status: ${response.status}`);
  if (response.ok) {
    const transaction = await response.json();
    console.log("Transazione recuperata:", {
      id: transaction.transazioneId,
      name: transaction.name,
      status: transaction.status,
      logCount: transaction.logs.length,
    });
  } else {
    console.log("Errore nel recupero della transazione");
  }
};

const testStatistics = async (): Promise<void> => {
  console.log("\nTest statistiche aggregate");

  const response = await fetch(`${API_URL}/api/log/statistiche`, {
    headers: {
      "x-api-key": API_KEY,
    },
  });

  console.log(`Status: ${response.status}`);
  if (response.ok) {
    const stats = await response.json();
    console.log("Statistiche:", {
      period: stats.period,
      totalLogs: stats.summary.totalLogs,
      successRate:
        stats.summary.totalLogs > 0 ? `${Math.round((stats.summary.successCount / stats.summary.totalLogs) * 100)}%` : "N/A",
      topEntities: stats.entityStats.slice(0, 3).map((e: any) => `${e._id}: ${e.count}`),
    });
  } else {
    console.log("Errore nel recupero delle statistiche");
  }
};

const main = async (): Promise<void> => {
  console.log("Test API EdgLogger...");

  try {
    // Test health endpoint
    console.log("\n1. Test health endpoint");
    const healthResponse = await fetch(`${API_URL}/health`);
    console.log(`Status: ${healthResponse.status}`);
    console.log(await healthResponse.json());

    // Test creazione log
    console.log("\n2. Test creazione log");
    const createdLog = await createSampleLog();

    console.log("Log creato:", {
      id: createdLog._id,
      timestamp: createdLog.timestamp,
      entita: createdLog.azione.entita,
    });

    // Test recupero log per ID
    if (createdLog._id) {
      await testLogDetails(createdLog._id);
    }

    // Test calcolo diff stato
    await testStateDiff();

    // Test transazione
    await testTransaction();

    // Test statistiche
    await testStatistics();

    console.log("\n✅ Test completati con successo!");
  } catch (error) {
    console.error("❌ Errore durante i test:", error);
  }
};

main();
