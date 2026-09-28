import AzioneLog, { IAzioneLog } from "../models/azioneLog";
import { logger } from "../config/logger";

/**
 * Salva un nuovo log di azione nel database
 */
export const salvaLog = async (logData: Partial<IAzioneLog>): Promise<IAzioneLog> => {
  try {
    const nuovoLog = new AzioneLog(logData);
    return await nuovoLog.save();
  } catch (error: any) {
    logger.error("Errore durante il salvataggio del log:", { error: error.message });
    throw error;
  }
};

/**
 * Interfaccia per le opzioni di ricerca
 */
export interface SearchOptions {
  page: number;
  limit: number;
  fromDate?: Date;
  toDate?: Date;
}

/**
 * Cerca log in base a filtri e opzioni di paginazione
 */
export const cercaLog = async (filtri: any, options: SearchOptions): Promise<{ logs: IAzioneLog[]; count: number }> => {
  try {
    // Costruisci la query in base ai filtri
    const query: any = {};

    // Filtro per intervallo di date
    if (options.fromDate || options.toDate) {
      query.timestamp = {};
      if (options.fromDate) query.timestamp.$gte = options.fromDate;
      if (options.toDate) query.timestamp.$lte = options.toDate;
    }

    // Applica filtri dinamici
    Object.entries(filtri).forEach(([key, value]) => {
      if (!value) return; // Ignora valori vuoti

      if (key.includes(".")) {
        // Gestisci campi nidificati
        query[key] = value;
      } else if (key === "tags" && Array.isArray(value)) {
        query.tags = { $all: value };
      } else if (key === "entita") {
        query["azione.entita"] = value;
      } else if (key === "idEntita") {
        query["azione.idEntita"] = value;
      } else if (key === "tipoAzione") {
        query["azione.tipo"] = value;
      } else if (key === "esito") {
        query["risultato.esito"] = value;
      } else if (key === "origineId") {
        query["origine.id"] = value;
      } else if (key === "tipoOrigine") {
        query["origine.tipo"] = value;
      } else if (key === "search" && typeof value === "string") {
        // Ricerca testuale in più campi
        const searchValue = value.trim();
        if (searchValue) {
          query.$or = [
            { "azione.entita": { $regex: searchValue, $options: "i" } },
            { "azione.operazione": { $regex: searchValue, $options: "i" } },
            { "risultato.messaggio": { $regex: searchValue, $options: "i" } },
            { tags: { $regex: searchValue, $options: "i" } },
          ];
        }
      } else {
        query[key] = value;
      }
    });

    // Calcola offset per paginazione
    const skip = options.page * options.limit;

    // Esegui query con paginazione
    const [logs, count] = await Promise.all([
      AzioneLog.find(query).sort({ timestamp: -1 }).skip(skip).limit(options.limit),
      AzioneLog.countDocuments(query),
    ]);

    return { logs, count };
  } catch (error: any) {
    logger.error("Errore durante la ricerca dei log:", { error: error.message });
    throw error;
  }
};

/**
 * Recupera log per ID
 */
export const getLogById = async (logId: string): Promise<IAzioneLog | null> => {
  try {
    return await AzioneLog.findById(logId);
  } catch (error: any) {
    logger.error(`Errore durante il recupero del log con ID ${logId}:`, { error: error.message });
    throw error;
  }
};

/**
 * Recupera log associati a una transazione
 */
export const getLogsByTransazioneId = async (transazioneId: string): Promise<IAzioneLog[]> => {
  try {
    return await AzioneLog.find({ "contesto.transazioneId": transazioneId }).sort({ timestamp: 1 });
  } catch (error: any) {
    logger.error(`Errore durante il recupero dei log per la transazione ${transazioneId}:`, { error: error.message });
    throw error;
  }
};
