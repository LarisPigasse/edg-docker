// =============================================================================
// ROTTE PUBBLICHE DEI SERVIZI — senza JWT, con limite per IP (ADR098)
// =============================================================================
// Una voce di config/serviceRoutes.js con `pubblica: true` (es. la pagina
// "Non ricevere più questi avvisi" di Vigilo, B8d-4) salta JWT, blacklist e
// modulo: la credenziale e' nella richiesta stessa (un codice), e la
// verifica il servizio. Al loro posto:
//   - un limite di richieste per IP, condiviso fra i due gateway (ADR040);
//   - il segreto del gateway, SENZA dati utente: header d'identita' arrivati
//     dal client (x-user-data, x-gateway-secret, Authorization) si tolgono.
//
// Limite: parametri con limiti invalicabili (regola dell'utente, ADR093)
//   PUBLIC_RATE_LIMIT_WINDOW  minuti della finestra   16  (da 4 a 64)
//   PUBLIC_RATE_LIMIT_MAX     richieste per finestra  32  (da 8 a 128)
// =============================================================================
const rateLimit = require('express-rate-limit');
const { ResilientRateLimitStore } = require('./resilientRateLimitStore');

/** Valore intero dall'ambiente, dentro i limiti; fuori dai limiti si ferma al bordo */
function parametro(nome, predefinito, min, max) {
  const letto = parseInt(process.env[nome], 10);
  const valore = Number.isFinite(letto) ? letto : predefinito;
  const limitato = Math.min(max, Math.max(min, valore));
  if (limitato !== valore) console.warn(`⚠️ [GATEWAY] ${nome}=${valore} fuori dai limiti (${min}-${max}): uso ${limitato}`);
  return limitato;
}

const LIMITE_PUBBLICO = Object.freeze({
  finestraMinuti: parametro('PUBLIC_RATE_LIMIT_WINDOW', 16, 4, 64),
  richieste: parametro('PUBLIC_RATE_LIMIT_MAX', 32, 8, 128),
});

/** Un limitatore per tutte le rotte pubbliche, con contatore su Redis (ripiego in memoria) */
function createPublicLimiter(redisClient) {
  return rateLimit({
    windowMs: LIMITE_PUBBLICO.finestraMinuti * 60 * 1000,
    max: LIMITE_PUBBLICO.richieste,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Troppe richieste: riprova fra qualche minuto' },
    keyGenerator: req => req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    store: new ResilientRateLimitStore({ client: redisClient, prefix: 'rl:pub:' }),
  });
}

/** Solo il segreto del gateway: nessuna identita' arriva al servizio */
function injectGatewaySecretOnly(req, res, next) {
  const gatewaySecret = process.env.GATEWAY_SECRET;
  if (!gatewaySecret) {
    console.error('❌ [GATEWAY] GATEWAY_SECRET non configurato!');
    return res.status(500).json({ success: false, error: 'Configurazione server non valida' });
  }
  delete req.headers['x-user-data'];
  delete req.headers.authorization;
  req.headers['x-gateway-secret'] = gatewaySecret;
  next();
}

module.exports = { LIMITE_PUBBLICO, createPublicLimiter, injectGatewaySecretOnly };
