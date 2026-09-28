import mongoose from "mongoose";
import dotenv from "dotenv";
import { logger } from "./logger";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/edglogger";

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI, {
      // Le opzioni sono già incorporate in mongoose 6+
    });

    logger.info("MongoDB connesso con successo");

    // Registra listener per eventi di connessione
    mongoose.connection.on("error", (err) => {
      logger.error(`Errore connessione MongoDB: ${err.message}`);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnesso, tentativo di riconnessione...");
    });

    // Gestisci terminazione dell'applicazione
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      logger.info("Connessione MongoDB chiusa a causa di terminazione applicazione");
      process.exit(0);
    });
  } catch (error: any) {
    logger.error(`Errore durante la connessione a MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
