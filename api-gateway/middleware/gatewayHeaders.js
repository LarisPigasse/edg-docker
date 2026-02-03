// =============================================================================
// GATEWAY HEADERS MIDDLEWARE
// =============================================================================
// Aggiunge header richiesti dall'auth-service in GATEWAY_MODE
// - x-gateway-secret: Secret condiviso per verificare provenienza dal gateway
// - x-user-data: Dati utente estratti dal JWT (JSON stringificato)
// =============================================================================

/**
 * Middleware Express per iniettare header gateway nella richiesta
 * 
 * Questo middleware si aspetta che req.userData sia già popolato
 * dal middleware jwtValidator (deve essere chiamato DOPO jwtValidator)
 * 
 * Aggiunge:
 * - x-gateway-secret: Per verificare che la richiesta provenga dal gateway
 * - x-user-data: Dati utente in formato JSON
 * 
 * @param {object} req - Express request (deve avere req.userData)
 * @param {object} res - Express response
 * @param {function} next - Express next function
 */
function injectGatewayHeaders(req, res, next) {
  const gatewaySecret = process.env.GATEWAY_SECRET;

  // Validazione configurazione
  if (!gatewaySecret) {
    console.error('❌ [GATEWAY] GATEWAY_SECRET non configurato!');
    return res.status(500).json({
      success: false,
      error: 'Configurazione server non valida',
    });
  }

  // Validazione user data (deve essere già presente da jwtValidator)
  if (!req.userData) {
    console.error('❌ [GATEWAY] userData mancante nella request!');
    console.error('   Assicurati che jwtValidatorMiddleware sia eseguito prima di questo middleware');
    return res.status(500).json({
      success: false,
      error: 'Errore interno del gateway',
    });
  }

  // Aggiungi header x-gateway-secret
  req.headers['x-gateway-secret'] = gatewaySecret;

  // Aggiungi header x-user-data (JSON stringificato)
  req.headers['x-user-data'] = JSON.stringify({
    accountId: req.userData.accountId,
    email: req.userData.email,
    accountType: req.userData.accountType,
    roleId: req.userData.roleId,
    permissions: req.userData.permissions || [],
  });

  next();
}

/**
 * Helper per logging sicuro (non logga il secret)
 */
function logHeadersInjection(email, userData) {
  console.log(`✅ [GATEWAY] Header iniettati per ${email}`);
  console.log(`   accountId: ${userData.accountId}`);
  console.log(`   accountType: ${userData.accountType}`);
  console.log(`   permissions: ${userData.permissions.length} permessi`);
}

module.exports = {
  injectGatewayHeaders,
  logHeadersInjection,
};
