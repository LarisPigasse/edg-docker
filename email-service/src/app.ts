// src/app.ts

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import emailRoutes from './routes/email.routes';

// Carica variabili d'ambiente
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3002', 10);

// =============================================================================
// MIDDLEWARE GLOBALI
// =============================================================================

// Security headers
app.use(helmet());

// CORS - Permetti chiamate da microservizi interni
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);
app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100, // max 100 richieste per finestra
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/email', limiter);

// Logging
app.use((req, res, next) => {
  if (req.path !== '/health') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// =============================================================================
// ROUTES
// =============================================================================

// Health check root
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'email-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Email routes
app.use('/email', emailRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Error]', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// =============================================================================
// START SERVER
// =============================================================================

app.listen(PORT, () => {
  console.log('');
  console.log('================================================================================');
  console.log('EDG EMAIL SERVICE v1.0.0');
  console.log('================================================================================');
  console.log('');
  console.log(`Server listening on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  console.log('Endpoints:');
  console.log('   POST   /email/send      - Invia email con template');
  console.log('   POST   /email/alert     - Invia alert sicurezza');
  console.log('   GET    /email/health    - Health check servizio');
  console.log('   GET    /email/templates - Lista template disponibili');
  console.log('   GET    /health          - Health check root');
  console.log('');
  console.log('================================================================================');
  console.log('');
});

export default app;
