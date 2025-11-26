// =============================================================================
// EDG API GATEWAY - Step 4: Rate Limiting (Solo /auth)
// =============================================================================
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

// =============================================================================
// CONFIGURAZIONE SERVIZI
// =============================================================================
const AUTH_SERVICE = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';

// Configurazione Frontend
const FRONTENDS = {
  pro: {
    url: process.env.FRONTEND_PRO_URL || 'http://pro-frontend:5173',
    subdomains: (process.env.FRONTEND_PRO_SUBDOMAINS || 'pro.edg.local').split(','),
    name: 'Pro',
  },
  app: {
    url: process.env.FRONTEND_APP_URL || 'http://app-frontend:5174',
    subdomains: (process.env.FRONTEND_APP_SUBDOMAINS || 'app.edg.local').split(','),
    name: 'App',
  },
  edg: {
    url: process.env.FRONTEND_EDG_URL || 'http://edg-frontend:5175',
    subdomains: (process.env.FRONTEND_EDG_SUBDOMAINS || 'edg.edg.local').split(','),
    name: 'EDG',
  },
};

// =============================================================================
// MIDDLEWARE GLOBALI
// =============================================================================

// 1. Security Headers (Helmet)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// 2. Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3. CORS (SOLO per /auth)
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(o => o);

const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
});

app.use('/auth', corsMiddleware);

// 4. Rate Limiting (SOLO per /auth)
const limiter = rateLimit({
  windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 16) * 60 * 1000, // default 16 minuti
  max: parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS) || 128, // default 128 richieste
  standardHeaders: true, // Aggiunge RateLimit-* headers
  legacyHeaders: false, // Disabilita X-RateLimit-* headers (deprecated)
  message: { error: 'Too many requests, please try again later.' },
  skip: req => {
    // Escludi health checks dal rate limiting
    const healthPaths = ['/health', '/liveness', '/readiness'];
    return healthPaths.includes(req.path);
  },
  // Funzione per generare la chiave (default: IP address)
  keyGenerator: req => {
    return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  },
});

// Applica rate limiting SOLO alle route /auth
app.use('/auth', limiter);

// 5. Logging
app.use((req, res, next) => {
  const healthPaths = ['/health', '/liveness', '/readiness'];
  if (!healthPaths.includes(req.path)) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Host: ${req.hostname || req.headers.host}`);
  }
  next();
});

// =============================================================================
// HEALTH CHECK
// =============================================================================
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'api-gateway',
    version: 'step-4-final',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
    },
    services: {
      auth: AUTH_SERVICE,
      frontends: {
        pro: FRONTENDS.pro.url,
        app: FRONTENDS.app.url,
        edg: FRONTENDS.edg.url,
      },
    },
    cors: {
      enabled: true,
      allowedOrigins: allowedOrigins.length > 0 ? allowedOrigins : ['*'],
      appliedTo: ['/auth/*'],
    },
    rateLimit: {
      enabled: true,
      window: `${parseInt(process.env.RATE_LIMIT_WINDOW) || 16} minutes`,
      maxAttempts: parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS) || 128,
      appliedTo: ['/auth/*'],
      excludedPaths: ['/health', '/liveness', '/readiness'],
    },
  });
});

app.get('/liveness', (req, res) => res.sendStatus(200));
app.get('/readiness', (req, res) =>
  res.status(200).json({
    status: 'ready',
    timestamp: new Date().toISOString(),
  })
);

// =============================================================================
// HELPER: Determina Frontend dal Hostname
// =============================================================================
function getFrontendByHostname(hostname) {
  const cleanHostname = hostname?.split(':')[0];
  for (const [key, frontend] of Object.entries(FRONTENDS)) {
    if (frontend.subdomains.some(sub => cleanHostname === sub)) {
      return { key, ...frontend };
    }
  }
  return { key: 'pro', ...FRONTENDS.pro };
}

// =============================================================================
// PROXY VERSO AUTH-SERVICE
// =============================================================================
app.all('/auth/*', (req, res) => {
  const authProxy = createProxyMiddleware({
    target: AUTH_SERVICE,
    changeOrigin: true,
    logLevel: 'silent',
    onProxyReq: (proxyReq, req) => {
      if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    onError: (err, req, res) => {
      console.error(`❌ Auth proxy error: ${err.message}`);
      if (!res.headersSent) {
        res.status(503).json({ error: 'Auth Service Unavailable' });
      }
    },
  });
  return authProxy(req, res);
});

// =============================================================================
// PROXY FRONTEND - SEMPLICE E PULITO
// =============================================================================
app.use((req, res) => {
  const hostname = req.hostname || req.headers.host?.split(':')[0];
  const frontend = getFrontendByHostname(hostname);

  const proxy = createProxyMiddleware({
    target: frontend.url,
    changeOrigin: true,
    ws: true,
    logLevel: 'silent',
    timeout: 30000,
    proxyTimeout: 30000,
    onProxyReq: (proxyReq, req) => {
      const scheme = req.headers['x-forwarded-proto'] || req.protocol || 'http';
      proxyReq.setHeader('Origin', `${scheme}://${hostname}`);
      proxyReq.setHeader('Host', hostname);
      proxyReq.setHeader('Cache-Control', 'no-cache');
    },
    onProxyReqWs: (proxyReq, req) => {
      proxyReq.setHeader('Connection', 'Upgrade');
      proxyReq.setHeader('Upgrade', 'websocket');
      const scheme = req.headers['x-forwarded-proto'] || req.protocol || 'http';
      proxyReq.setHeader('Origin', `${scheme}://${hostname}`);
      proxyReq.setHeader('Host', hostname);
    },
    onError: (err, req, res) => {
      console.error(`❌ Frontend proxy error (${frontend.name}): ${err.message}`);
      console.error(`   Target: ${frontend.url}`);
      console.error(`   Path: ${req.url}`);
      console.error(`   Error code: ${err.code}`);

      if (!res.headersSent) {
        res.status(503).send(`
          <h1>Service Unavailable</h1>
          <p>The frontend service (${frontend.name}) is not reachable.</p>
          <p>Target: ${frontend.url}</p>
          <p>Error: ${err.message}</p>
        `);
      }
    },
  });

  return proxy(req, res);
});

// =============================================================================
// AVVIO SERVER
// =============================================================================
app.listen(PORT, () => {
  console.log(`API Gateway (Step 4: PRODUCTION-READY) listening on port ${PORT}`);
  console.log(`Frontend mappings:`);
  Object.entries(FRONTENDS).forEach(([key, frontend]) => {
    console.log(`   ${key}: ${frontend.subdomains.join(', ')} → ${frontend.url}`);
  });
  console.log(`  Security: Helmet enabled`);
  console.log(`  Body parsing: JSON + URL-encoded (10MB limit)`);
  console.log(`  CORS: Enabled for /auth/* only`);
  console.log(`  Allowed origins: ${allowedOrigins.length > 0 ? allowedOrigins.join(', ') : 'All origins (dev mode)'}`);
  console.log(`  Rate limiting: Enabled for /auth/* only`);
  console.log(`  Window: ${parseInt(process.env.RATE_LIMIT_WINDOW) || 16} minutes`);
  console.log(`  Max attempts: ${parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS) || 128} requests`);
});
