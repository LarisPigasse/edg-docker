import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import * as dotenv from 'dotenv';
import { connectDatabase, sequelize } from './config/database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { logger } from './services/logger';
import apiRoutes from './routes';

dotenv.config();

const app: Application = express();
const PORT = parseInt(process.env.PORT || '3003');
const SERVICE_NAME = process.env.SERVICE_NAME || 'EDG Vehicle Service';

// =============================================================================
// MIDDLEWARE GLOBALI
// =============================================================================

app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: (process.env.CORS_ORIGINS || '').split(',').filter(Boolean),
    credentials: true,
  })
);

// Request logger (escludi health check per non sporcare i log)
app.use((req: Request, res: Response, next: NextFunction) => {
  const healthPaths = ['/health', '/liveness', '/readiness'];
  if (healthPaths.includes(req.path)) return next();

  const start = Date.now();
  res.on('finish', () => {
    logger.request(req.method, req.url, res.statusCode, Date.now() - start, req.user?.id);
  });
  next();
});

// =============================================================================
// HEALTH CHECK
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
// ROUTES
// =============================================================================

app.use('/api/vehicles', apiRoutes);

// =============================================================================
// 404 + ERROR HANDLER (sempre ultimi)
// =============================================================================

app.use(notFoundHandler);
app.use(errorHandler);

// =============================================================================
// AVVIO
// =============================================================================

const start = async (): Promise<void> => {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`[${SERVICE_NAME}] in ascolto sulla porta ${PORT}`);
    console.log(`[${SERVICE_NAME}] ambiente: ${process.env.NODE_ENV}`);
    console.log(`[${SERVICE_NAME}] health: http://localhost:${PORT}/health`);
  });
};

process.on('SIGTERM', async () => {
  console.log(`[${SERVICE_NAME}] SIGTERM ricevuto — chiusura in corso...`);
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log(`[${SERVICE_NAME}] SIGINT ricevuto — chiusura in corso...`);
  await sequelize.close();
  process.exit(0);
});

start();

export default app;
