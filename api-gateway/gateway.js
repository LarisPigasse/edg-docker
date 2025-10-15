// =============================================================================
// EDG API GATEWAY - Versione Corretta Finale
// =============================================================================

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;
const AUTH_SERVICE = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';

// =============================================================================
// MIDDLEWARE
// =============================================================================

app.use(
  cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// =============================================================================
// HEALTH CHECK GATEWAY
// =============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// =============================================================================
// PROXY VERSO AUTH-SERVICE
// =============================================================================

// Funzione helper per proxy
async function proxyToAuthService(req, res, targetPath = null) {
  try {
    // Se targetPath non specificato, usa l'URL originale
    const path = targetPath || req.url;
    const targetUrl = `${AUTH_SERVICE}${path}`;

    console.log(`→ Proxying ${req.method} to ${targetUrl}`);

    // Prepara la richiesta
    const axiosConfig = {
      method: req.method,
      url: targetUrl,
      headers: {
        ...req.headers,
        'content-type': req.headers['content-type'] || 'application/json',
      },
      timeout: 30000,
      validateStatus: () => true, // Accetta qualsiasi status code
    };

    // Aggiungi body per POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      axiosConfig.data = req.body;
    }

    // Rimuovi headers problematici
    delete axiosConfig.headers['host'];
    delete axiosConfig.headers['content-length'];

    // Esegui la richiesta
    const response = await axios(axiosConfig);

    console.log(`← Response ${response.status} from auth-service`);

    // Copia headers rilevanti
    const relevantHeaders = ['content-type', 'set-cookie', 'authorization'];
    relevantHeaders.forEach(header => {
      if (response.headers[header]) {
        res.setHeader(header, response.headers[header]);
      }
    });

    // Invia la risposta
    res.status(response.status).send(response.data);
  } catch (error) {
    console.error('❌ Proxy error:', error.message);

    if (error.response) {
      // Auth service ha risposto con un errore
      res.status(error.response.status).json(error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      res.status(503).json({
        error: 'Service Unavailable',
        message: 'Auth service is not reachable',
      });
    } else if (error.code === 'ETIMEDOUT') {
      res.status(504).json({
        error: 'Gateway Timeout',
        message: 'Auth service took too long to respond',
      });
    } else {
      res.status(500).json({
        error: 'Gateway Error',
        message: error.message,
      });
    }
  }
}

// =============================================================================
// ROUTES
// =============================================================================

// Health check auth-service (diretto, senza /auth)
app.get('/auth/health', async (req, res) => {
  await proxyToAuthService(req, res, '/health');
});

// Tutte le altre route /auth/* (mantengono /auth)
app.all('/auth/*', async (req, res) => {
  // Mantiene il path originale con /auth
  await proxyToAuthService(req, res);
});

// =============================================================================
// ERROR HANDLERS
// =============================================================================

// 404
app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.url}`);
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
    availableRoutes: [
      'GET /health (gateway)',
      'GET /auth/health (auth-service)',
      'POST /auth/register',
      'POST /auth/login',
      'POST /auth/refresh',
      'POST /auth/logout',
      'GET /auth/me',
    ],
  });
});

// 500
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  if (!res.headersSent) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
    });
  }
});

// =============================================================================
// START SERVER
// =============================================================================

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 EDG API GATEWAY');
  console.log('━'.repeat(70));
  console.log(`📡 Port:              ${PORT}`);
  console.log(`🔗 Auth Service:      ${AUTH_SERVICE}`);
  console.log(`🌐 CORS:              All origins (for testing)`);
  console.log(`⏱️  Timeout:           30s`);
  console.log('━'.repeat(70));
  console.log('');
  console.log('📍 Routes:');
  console.log('   GET  /health              → Gateway health check');
  console.log('   GET  /auth/health         → Auth service health (special route)');
  console.log('   POST /auth/register       → Auth service');
  console.log('   POST /auth/login          → Auth service');
  console.log('   POST /auth/refresh        → Auth service');
  console.log('   POST /auth/logout         → Auth service');
  console.log('   POST /auth/logout-all     → Auth service');
  console.log('   POST /auth/change-password → Auth service');
  console.log('   GET  /auth/me             → Auth service');
  console.log('');
  console.log('🔄 Path Mapping:');
  console.log(`   /auth/health       → ${AUTH_SERVICE}/health`);
  console.log(`   /auth/login        → ${AUTH_SERVICE}/auth/login`);
  console.log(`   /auth/register     → ${AUTH_SERVICE}/auth/register`);
  console.log(`   /auth/me           → ${AUTH_SERVICE}/auth/me`);
  console.log('');
  console.log('✅ Ready to receive requests!');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('⚠️  SIGINT received, shutting down gracefully...');
  process.exit(0);
});
