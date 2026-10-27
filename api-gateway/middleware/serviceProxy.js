// =============================================================================
// SERVICE PROXY — una sola catena per tutte le rotte /api (fase 4, ADR047)
// =============================================================================
// Per ogni voce di config/serviceRoutes.js:
//   CORS -> JWT -> blacklist -> modulo (se dichiarato) -> header gateway -> inoltro
// Voci pubbliche (`pubblica: true`, ADR098):
//   CORS -> limite per IP -> solo segreto del gateway -> inoltro
//
// Prima esistevano cinque blocchi quasi identici in gateway.js: una modifica
// alla catena andava ripetuta cinque volte. Ora la catena e' qui e la mappa
// rotte -> moduli e' una tabella.
//
// Due modi di inoltro, scelti dalla voce della tabella:
//   JSON (predefinito)  il gateway legge il corpo e risponde in JSON (axios)
//   flusso (stream)     richiesta e risposta passano cosi' come sono
//                       (http-proxy-middleware): file in su e in giu' (ADR069)
// =============================================================================
const axios = require('axios');
const { createProxyMiddleware, debugProxyErrorsPlugin, proxyEventsPlugin } = require('http-proxy-middleware');

const { jwtValidatorMiddleware } = require('./jwtValidator');
const { injectGatewayHeaders } = require('./gatewayHeaders');
const { requireModule } = require('./moduleGuard');
const { injectGatewaySecretOnly } = require('./publicRoute');

/**
 * Esegue in sequenza middleware Express (req, res, next); si ferma al primo
 * errore o appena uno di essi ha gia' risposto.
 */
function runChain(steps, req, res, done) {
  const step = index => {
    if (index === steps.length) return done();
    steps[index](req, res, err => {
      if (err || res.headersSent) return;
      step(index + 1);
    });
  };
  step(0);
}

/**
 * Percorso da accodare al prefisso del servizio. Il solo '/' (richiesta
 * esattamente sul prefisso) non si accoda: /api/system/health resta tale.
 */
const restOf = url => (url === '/' || url.startsWith('/?') ? url.slice(1) : url);

/** Inoltro al servizio con gli header del gateway; risposte d'errore ripassate cosi' come sono */
function forwardTo(route) {
  return async (req, res) => {
    const clientIp = req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress;
    try {
      const response = await axios({
        method: req.method,
        url: `${route.target}${route.upstream}${restOf(req.url)}`,
        data: ['GET', 'DELETE'].includes(req.method) ? undefined : req.body,
        headers: {
          'Content-Type': 'application/json',
          'x-gateway-secret': req.headers['x-gateway-secret'],
          'x-user-data': req.headers['x-user-data'],
          'x-forwarded-for': clientIp,
          'x-real-ip': clientIp,
          'x-request-id': req.requestId,
        },
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      if (error.response) {
        res.status(error.response.status).json(error.response.data);
      } else {
        console.error(`❌ [GATEWAY] Errore verso ${route.service} (${route.prefix}):`, error.message);
        res.status(503).json({ error: `${route.service} non disponibile` });
      }
    }
  };
}

/**
 * Inoltro a flusso (ADR069). Un'istanza del proxy per voce, creata una sola
 * volta all'avvio. Gli header del gateway (x-gateway-secret, x-user-data,
 * x-request-id) sono gia' in req.headers e passano cosi' come sono.
 * NB http-proxy-middleware 3: le opzioni onProxyReq/onError del 2.x non
 * esistono piu' (vengono ignorate); gli eventi vanno in `on`.
 */
function streamTo(route) {
  const proxy = createProxyMiddleware({
    target: route.target,
    changeOrigin: true,
    xfwd: true, // x-forwarded-for/-proto/-host verso il servizio
    proxyTimeout: 64000,
    timeout: 64000,
    ejectPlugins: true, // niente risposta d'errore in testo: la scriviamo in JSON qui sotto
    plugins: [debugProxyErrorsPlugin, proxyEventsPlugin],
    on: {
      error: (err, req, res) => {
        console.error(`❌ [GATEWAY] Errore verso ${route.service} (${route.prefix}, flusso):`, err.message);
        if (res && typeof res.writeHead === 'function' && !res.headersSent) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `${route.service} non disponibile` }));
        } else if (res && typeof res.destroy === 'function') {
          res.destroy();
        }
      },
    },
  });
  return (req, res, next) => {
    req.url = `${route.upstream}${restOf(req.url)}`;
    proxy(req, res, next);
  };
}

/**
 * Monta tutte le rotte di servizio sull'app, nell'ordine della tabella.
 *
 * @param {import('express').Express} app
 * @param {ReadonlyArray<object>} routes   SERVICE_ROUTES
 * @param {{ cors: Function, sessionGuard: Function, publicLimiter: Function }} deps
 */
function mountServiceRoutes(app, routes, { cors, sessionGuard, publicLimiter }) {
  for (const route of routes) {
    const steps = route.pubblica ? [publicLimiter, injectGatewaySecretOnly] : [jwtValidatorMiddleware, sessionGuard];
    if (!route.pubblica && route.module) steps.push(requireModule(route.module));
    if (!route.pubblica) steps.push(injectGatewayHeaders);
    const forward = route.stream ? streamTo(route) : forwardTo(route);

    app.options(`${route.prefix}/*`, cors); // preflight
    app.use(route.prefix, cors); // header CORS su ogni risposta
    app.use(route.prefix, (req, res, next) => runChain(steps, req, res, () => forward(req, res, next)));
  }
}

module.exports = { mountServiceRoutes, runChain };
