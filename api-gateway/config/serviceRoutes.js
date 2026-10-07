// =============================================================================
// MAPPA DELLE ROTTE DI SERVIZIO (ADR009, ADR047 — fase 4 della gestione moduli)
// =============================================================================
// Unico punto in cui si dichiara dove va una rotta /api e a quale modulo
// appartiene. Il gateway la monta con middleware/serviceProxy.js: ogni voce
// passa dalla stessa catena (JWT -> blacklist -> modulo -> header -> inoltro).
//
//   prefix    prefisso pubblico, cosi' come lo chiama il frontend
//   target    URL base del servizio
//   upstream  prefisso sul servizio (il resto del percorso si accoda)
//   module    chiave del catalogo moduli richiesta nel JWT; null = nessun
//             modulo: gestione interna sempre disponibile a chi ha il permesso
//             RBAC (lo verifica il servizio)
//   service   nome per log e messaggi di errore
//
// L'ORDINE CONTA: Express prova le voci nell'ordine di registrazione, quindi
// un prefisso piu' specifico va PRIMA di quello generico che lo contiene
// (/api/system/health e' di log-service, /api/system di system-service).
//
// Un nuovo modulo con API proprie = una riga qui. Le chiavi devono essere
// quelle del catalogo (modules.key): niente alias.
// =============================================================================

const VEHICLE_SERVICE = process.env.VEHICLE_SERVICE_URL || 'http://vehicle-service:3003';
const SYSTEM_SERVICE = process.env.SYSTEM_SERVICE_URL || 'http://system-service:3004';
const LOG_SERVICE = process.env.LOG_SERVICE_URL || 'http://log-service:4000';

const SERVICE_ROUTES = Object.freeze([
  // Moduli attivabili per tenant
  { prefix: '/api/vehicles', target: VEHICLE_SERVICE, upstream: '/api/vehicles', module: 'vigilo', service: 'vehicle-service' },

  // Gestione interna (nessun modulo)
  { prefix: '/api/system/health', target: LOG_SERVICE, upstream: '/api/system/health', module: null, service: 'log-service' },
  { prefix: '/api/log', target: LOG_SERVICE, upstream: '/api/log', module: null, service: 'log-service' },
  { prefix: '/api/alert', target: LOG_SERVICE, upstream: '/api/alert', module: null, service: 'log-service' },
  { prefix: '/api/system', target: SYSTEM_SERVICE, upstream: '/api', module: null, service: 'system-service' },
]);

/** Verifica all'avvio: un prefisso generico non deve oscurarne uno specifico registrato dopo */
function assertRouteOrder(routes) {
  routes.forEach((route, i) => {
    const shadow = routes.slice(0, i).find(r => route.prefix.startsWith(r.prefix + '/'));
    if (shadow) {
      throw new Error(`serviceRoutes: '${shadow.prefix}' oscura '${route.prefix}': spostare il piu' specifico prima`);
    }
  });
}

assertRouteOrder(SERVICE_ROUTES);

module.exports = { SERVICE_ROUTES, VEHICLE_SERVICE, SYSTEM_SERVICE, LOG_SERVICE };
