// =============================================================================
// EDG API GATEWAY - Multi-Frontend Support (Production-Ready)
// =============================================================================

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

// =============================================================================
// CONFIGURAZIONE SERVIZI
// =============================================================================

const AUTH_SERVICE = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
const LOG_SERVICE = process.env.LOG_SERVICE_URL || 'http://log-service:3002';

// ✅ CONFIGURAZIONE MULTI-FRONTEND
const FRONTENDS = {
  pro: {
    url: process.env.FRONTEND_PRO_URL || 'http://pro-frontend:5173',
    subdomains: ['pro.edg.local', 'pro.edgdominio.com'],
    name: 'Pro (Operators)',
  },
  app: {
    url: process.env.FRONTEND_APP_URL || 'http://app-frontend:5174',
    subdomains: ['app.edg.local', 'app.edgdominio.com'],
    name: 'App (Clients)',
  },
  edg: {
    url: process.env.FRONTEND_EDG_URL || 'http://edg-frontend:5175',
    subdomains: ['edg.edg.local', 'edg.edgdominio.com'],
    name: 'EDG (Partners)',
  },
};

// =============================================================================
// MIDDLEWARE GLOBALI
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

// Logging middleware (salta health endpoints per ridurre rumore)
app.use((req, res, next) => {
  const healthEndpoints = ['/health', '/liveness', '/readiness'];
  if (!healthEndpoints.includes(req.url)) {
    const hostname = req.hostname || req.headers.host?.split(':')[0];
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Host: ${hostname}`);
  }
  next();
});

// =============================================================================
// HEALTH CHECK GATEWAY
// =============================================================================
// ⚠️ IMPORTANTE: Questo endpoint DEVE rimanere qui (PRIMA del routing frontend)
//    altrimenti il proxy middleware lo cattura e lo inoltra al frontend

app.get('/health', (req, res) => {
  const healthData = {
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
    },
    services: {
      auth: AUTH_SERVICE,
      log: LOG_SERVICE,
      frontends: {
        pro: FRONTENDS.pro.url,
        app: FRONTENDS.app.url,
        edg: FRONTENDS.edg.url,
      },
    },
  };

  // Log solo occasionalmente per non riempire i log (ogni 10 richieste)
  if (!app.locals.healthCheckCount) app.locals.healthCheckCount = 0;
  app.locals.healthCheckCount++;

  if (app.locals.healthCheckCount % 10 === 0) {
    console.log(`💚 Health check OK (${app.locals.healthCheckCount} checks, uptime: ${Math.floor(process.uptime())}s)`);
  }

  res.status(200).json(healthData);
});

// Liveness probe - verifica che il processo sia vivo
app.get('/liveness', (req, res) => {
  res.sendStatus(200);
});

// Readiness probe - verifica che il servizio sia pronto
app.get('/readiness', (req, res) => {
  res.status(200).json({
    status: 'ready',
    timestamp: new Date().toISOString(),
  });
});

// =============================================================================
// ✅ HELPER: Determina Frontend dal Hostname
// =============================================================================

function getFrontendByHostname(hostname) {
  // Rimuovi porta se presente
  const cleanHostname = hostname?.split(':')[0];

  // Cerca quale frontend corrisponde al subdomain
  for (const [key, frontend] of Object.entries(FRONTENDS)) {
    if (frontend.subdomains.some(subdomain => cleanHostname === subdomain)) {
      return { key, ...frontend };
    }
  }

  // Default fallback: localhost → pro frontend
  if (cleanHostname === 'localhost' || cleanHostname === '127.0.0.1') {
    return { key: 'pro', ...FRONTENDS.pro };
  }

  // Se nessun match, usa pro come default
  return { key: 'pro', ...FRONTENDS.pro };
}

// =============================================================================
// PROXY VERSO AUTH-SERVICE (Axios - Mantiene logica esistente)
// =============================================================================

async function proxyToAuthService(req, res, targetPath = null) {
  try {
    const path = targetPath || req.url;
    const targetUrl = `${AUTH_SERVICE}${path}`;
    console.log(`→ Proxying ${req.method} to ${targetUrl}`);

    const axiosConfig = {
      method: req.method,
      url: targetUrl,
      headers: {
        ...req.headers,
        'content-type': req.headers['content-type'] || 'application/json',
      },
      timeout: 30000,
      validateStatus: () => true,
    };

    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      axiosConfig.data = req.body;
    }

    delete axiosConfig.headers['host'];
    delete axiosConfig.headers['content-length'];

    const response = await axios(axiosConfig);
    console.log(`← Response ${response.status} from auth-service`);

    const relevantHeaders = ['content-type', 'set-cookie', 'authorization'];
    relevantHeaders.forEach(header => {
      if (response.headers[header]) {
        res.setHeader(header, response.headers[header]);
      }
    });

    res.status(response.status).send(response.data);
  } catch (error) {
    console.error('❌ Proxy error:', error.message);
    if (error.response) {
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
// ROUTES AUTH SERVICE (DEVE ESSERE PRIMA DEL ROUTING FRONTEND!)
// =============================================================================

// Health check auth-service
app.get('/auth/health', async (req, res) => {
  await proxyToAuthService(req, res, '/health');
});

// Tutte le altre route /auth/*
app.all('/auth/*', async (req, res) => {
  await proxyToAuthService(req, res);
});

// =============================================================================
// ✅ ROUTING MULTI-FRONTEND (SUBDOMAIN-BASED)
// =============================================================================

app.use((req, res, next) => {
  // ⚠️ SKIP: Non fare proxy di health checks e auth (già gestiti sopra)
  const skipPaths = ['/health', '/liveness', '/readiness'];
  if (skipPaths.includes(req.path) || req.path.startsWith('/auth')) {
    return next(); // Salta questo middleware, già gestito
  }

  const hostname = req.hostname || req.headers.host?.split(':')[0];
  const frontend = getFrontendByHostname(hostname);

  console.log(`🔍 Routing: ${hostname} → ${frontend.name} (${frontend.url})`);

  // Salva info frontend nella request per logs
  req.frontend = frontend;

  // Crea proxy dinamico per questo frontend
  const frontendProxy = createProxyMiddleware({
    target: frontend.url,
    changeOrigin: true,
    ws: true, // ✅ WebSocket support per HMR
    logLevel: 'silent',

    onProxyReqWs: (proxyReq, req, socket) => {
      console.log(`🔌 WebSocket to ${req.frontend.name}:`, req.url);
    },

    onError: (err, req, res) => {
      console.error(`❌ Frontend proxy error (${req.frontend.name}):`, err.message);
      if (res.writeHead) {
        res.writeHead(503, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Frontend Unavailable</title>
              <style>
                body { 
                  font-family: system-ui, -apple-system, sans-serif; 
                  padding: 50px; 
                  text-align: center;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  min-height: 100vh;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  margin: 0;
                }
                .container {
                  background: rgba(255,255,255,0.1);
                  padding: 40px;
                  border-radius: 20px;
                  backdrop-filter: blur(10px);
                  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
                }
                h1 { color: #fff; margin-bottom: 20px; }
                p { font-size: 18px; margin: 10px 0; }
                small { opacity: 0.8; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>🚧 Frontend ${req.frontend.name} Unavailable</h1>
                <p>The frontend service is currently not reachable.</p>
                <p><small>Error: ${err.message}</small></p>
                <hr style="margin: 30px 0; border: 1px solid rgba(255,255,255,0.2);">
                <small>EDG Platform - API Gateway</small>
              </div>
            </body>
          </html>
        `);
      }
    },

    onProxyReq: (proxyReq, req, res) => {
      console.log(`→ Proxying to ${req.frontend.name}: ${req.method} ${req.url}`);
    },

    onProxyRes: (proxyRes, req, res) => {
      console.log(`← Response from ${req.frontend.name}: ${proxyRes.statusCode}`);
    },
  });

  // Passa la richiesta al proxy
  frontendProxy(req, res, next);
});

// =============================================================================
// ERROR HANDLERS
// =============================================================================

// 404 - Non dovrebbe mai essere raggiunto se routing funziona
app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.url}`);
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
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

const server = app.listen(PORT, '0.0.0.0', () => {
  //                              ^^^^^^^^^ ✅ AGGIUNTO: ascolta su tutte le interfacce
  console.log('');
  console.log('🚀 EDG API GATEWAY - MULTI-FRONTEND');
  console.log('━'.repeat(70));
  console.log(`📡 Port:              ${PORT}`);
  console.log(`🎧 Listening on:      0.0.0.0:${PORT}`); // ✅ AGGIUNTO per debug
  console.log(`🌍 Environment:       ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  console.log('🔗 Backend Services:');
  console.log(`   Auth:             ${AUTH_SERVICE}`);
  console.log(`   Log:              ${LOG_SERVICE}`);
  console.log('');
  console.log('🎨 Frontend Services:');
  console.log(`   Pro (Operators):  ${FRONTENDS.pro.url}`);
  console.log(`   App (Clients):    ${FRONTENDS.app.url}`);
  console.log(`   EDG (Partners):   ${FRONTENDS.edg.url}`);
  console.log('');
  console.log('🌐 Development URLs:');
  console.log('   http://pro.edg.local       → Pro Frontend (Operators)');
  console.log('   http://app.edg.local       → App Frontend (Clients)');
  console.log('   http://edg.edg.local       → EDG Frontend (Partners)');
  console.log('   http://localhost           → Pro Frontend (default)');
  console.log('');
  console.log('🚀 Production URLs (future):');
  console.log('   https://pro.edgdominio.com    → Pro Frontend');
  console.log('   https://app.edgdominio.com    → App Frontend');
  console.log('   https://edg.edgdominio.com    → EDG Frontend');
  console.log('');
  console.log('✅ Ready to receive requests!');
  console.log('');
});

// ✅ AGGIUNTO: Error handler per problemi di bind
server.on('error', err => {
  console.error('');
  console.error('❌ SERVER ERROR:');
  console.error('━'.repeat(70));
  console.error(`   Error: ${err.message}`);
  console.error(`   Code:  ${err.code}`);

  if (err.code === 'EADDRINUSE') {
    console.error(`   → Port ${PORT} is already in use!`);
    console.error(`   → Check if another process is using this port.`);
  } else if (err.code === 'EACCES') {
    console.error(`   → Permission denied to bind port ${PORT}!`);
    console.error(`   → Ports below 1024 require root privileges.`);
  }

  console.error('━'.repeat(70));
  console.error('');

  process.exit(1); // Exit con errore
});

// WebSocket upgrade handler (resto del codice già esistente)
server.on('upgrade', (req, socket, head) => {
  // ... codice esistente
});

// Graceful shutdown (resto del codice già esistente)
const shutdown = signal => {
  console.log(`\n⚠️  ${signal} received, shutting down gracefully...`);
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
