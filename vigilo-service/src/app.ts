// =============================================================================
// EDG Vigilo Service (ADR064-070)
// =============================================================================
// Scadenze, manutenzioni, abilitazioni, pagamenti e promemoria di veicoli,
// macchine, attrezzature, sedi, persone e azienda. Analisi in docs/vigilo/.
//
// Struttura (06-servizio-api.md):
//   config/    database
//   core/      middleware, logger, contesto della richiesta, processi, risposte
//   regole/    funzioni pure (cadenze, stati, eredita', avvisi) — blocco B2
//   domini/    un modulo per area (model, schemas, service, controller, routes)
//   libreria/  file versionati della libreria EDG — blocco B4
//   processi/  ricalcolo, riepilogo, consegne — blocchi B5 e B8
// =============================================================================

// Deve essere il primo import: inoltra all'error handler globale i rifiuti di
// promise degli handler asincroni (incidente system-service del 16/09/2026).
import { requestContextMiddleware } from './core/services/requestContext';
import 'express-async-errors';

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import * as dotenv from 'dotenv';
import { connectDatabase, sequelize } from './config/database';
import { errorHandler, notFoundHandler } from './core/middleware/errorHandler';
import { installCrashHandlers, logger } from './core/services/logger';
import { BUILD_INFO } from './core/services/buildInfo';
import { installaAudit } from './core/db/audit';
import vigiloRoutes from './domini';
import { sincronizzaAllAvvio } from './libreria/sincronizza';
import { pianificaProcessi } from './processi/ricalcolo';

// Un errore non gestito va segnalato a log-service prima di uscire (ADR043)
installCrashHandlers();

// Chi ha creato e modificato ogni riga, dall'account della richiesta
installaAudit();

dotenv.config();

const app: Application = express();
const PORT = parseInt(process.env.PORT || '3006');
const SERVICE_NAME = process.env.SERVICE_NAME || 'EDG Vigilo Service';

// =============================================================================
// MIDDLEWARE GLOBALI
// =============================================================================

app.use(helmet());
app.use(compression());
// Solo JSON e form: i file (allegati, B9) hanno i loro parser sulle rotte dedicate
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use(
  cors({
    origin: (process.env.CORS_ORIGINS || '').split(',').filter(Boolean),
    credentials: true,
  })
);

// Contesto della richiesta (ADR039): l'ID del gateway arriva al logger
app.use(requestContextMiddleware);

// Registro delle richieste (senza i controlli di salute)
app.use((req: Request, res: Response, next: NextFunction) => {
  if (['/health', '/liveness', '/readiness'].includes(req.path)) return next();
  const start = Date.now();
  res.on('finish', () => {
    // originalUrl: req.url e' relativo al router montato (L039)
    logger.request(req.method, req.originalUrl, res.statusCode, Date.now() - start, req.user);
  });
  next();
});

// =============================================================================
// SALUTE
// =============================================================================

app.get('/health', async (_req: Request, res: Response) => {
  try {
    await sequelize.authenticate();
    res.json({
      status: 'healthy',
      service: SERVICE_NAME,
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      build: BUILD_INFO,
      environment: process.env.NODE_ENV,
    });
  } catch {
    res.status(503).json({
      status: 'unhealthy',
      service: SERVICE_NAME,
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
});

app.get('/liveness', (_req: Request, res: Response) => res.sendStatus(200));
app.get('/readiness', (_req: Request, res: Response) => res.status(200).json({ status: 'ready' }));

// =============================================================================
// ROTTE
// =============================================================================

app.use('/api/vigilo', vigiloRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

// =============================================================================
// AVVIO
// =============================================================================

const start = async (): Promise<void> => {
  await connectDatabase();
  // La libreria EDG dai file alle tabelle (03-libreria-avvio 3.2)
  await sincronizzaAllAvvio();
  pianificaProcessi();
  app.listen(PORT, () => {
    console.log(`[${SERVICE_NAME}] in ascolto sulla porta ${PORT}`);
    console.log(`[${SERVICE_NAME}] ambiente: ${process.env.NODE_ENV}`);
  });
};

const stop = async (signal: string): Promise<void> => {
  console.log(`[${SERVICE_NAME}] ${signal} ricevuto — chiusura in corso...`);
  await sequelize.close();
  process.exit(0);
};
process.on('SIGTERM', () => void stop('SIGTERM'));
process.on('SIGINT', () => void stop('SIGINT'));

start();

export default app;
