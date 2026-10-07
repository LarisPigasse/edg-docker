// =============================================================================
// SERVICE PROXY — una sola catena per tutte le rotte /api (fase 4, ADR047)
// =============================================================================
// Per ogni voce di config/serviceRoutes.js:
//   CORS -> JWT -> blacklist -> modulo (se dichiarato) -> header gateway -> inoltro
//
// Prima esistevano cinque blocchi quasi identici in gateway.js: una modifica
// alla catena andava ripetuta cinque volte. Ora la catena e' qui e la mappa
// rotte -> moduli e' una tabella.
// =============================================================================
const axios = require('axios');

const { jwtValidatorMiddleware } = require('./jwtValidator');
const { injectGatewayHeaders } = require('./gatewayHeaders');
const { requireModule } = require('./moduleGuard');

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
 * Monta tutte le rotte di servizio sull'app, nell'ordine della tabella.
 *
 * @param {import('express').Express} app
 * @param {ReadonlyArray<object>} routes   SERVICE_ROUTES
 * @param {{ cors: Function, sessionGuard: Function }} deps
 */
function mountServiceRoutes(app, routes, { cors, sessionGuard }) {
  for (const route of routes) {
    const steps = [jwtValidatorMiddleware, sessionGuard];
    if (route.module) steps.push(requireModule(route.module));
    steps.push(injectGatewayHeaders);
    const forward = forwardTo(route);

    app.options(`${route.prefix}/*`, cors); // preflight
    app.use(route.prefix, cors); // header CORS su ogni risposta
    app.use(route.prefix, (req, res) => runChain(steps, req, res, () => forward(req, res)));
  }
}

module.exports = { mountServiceRoutes, runChain };
