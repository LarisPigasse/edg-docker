// =============================================================================
// MODULE GUARD MIDDLEWARE (ADR009)
// =============================================================================
// Verifica che il modulo richiesto sia attivo per il tenant dell'account
// autenticato. E' il controllo di sicurezza reale previsto da ADR009: il
// frontend legge `modules` dal JWT solo per l'UX (menu/route visibili), ma
// e' SOLO questo middleware, lato gateway, a decidere se la richiesta passa.
//
// Richiede che jwtValidatorMiddleware sia gia' stato eseguito (req.userData
// popolato, con `modules` estratto dal JWT).
// =============================================================================

/**
 * Verifica se un elenco di moduli attivi copre il modulo richiesto,
 * tenendo conto del wildcard '*' (tenant di sistema EDG, vedi ADR009).
 *
 * @param {string[]} modules - moduli attivi per il tenant (da req.userData.modules)
 * @param {string} requiredModule - modulo richiesto dalla route (es. 'vehicles')
 * @returns {boolean}
 */
function hasModuleAccess(modules, requiredModule) {
  if (!Array.isArray(modules) || modules.length === 0) {
    return false;
  }
  return modules.includes('*') || modules.includes(requiredModule);
}

/**
 * Middleware factory: blocca la richiesta con 403 se il tenant dell'account
 * non ha il modulo richiesto tra quelli attivi.
 *
 * @param {string} requiredModule - modulo richiesto dalla route (es. 'vehicles', 'vigilo')
 */
function requireModule(requiredModule) {
  return (req, res, next) => {
    const modules = req.userData?.modules || [];

    if (!hasModuleAccess(modules, requiredModule)) {
      console.warn(
        `⚠️ [MODULE-GUARD] Accesso negato: account ${req.userData?.accountId} (tenant ${req.userData?.tenantId}) ` +
          `non ha il modulo '${requiredModule}' attivo. Moduli disponibili: [${modules.join(', ')}]`
      );
      return res.status(403).json({
        success: false,
        error: `Modulo '${requiredModule}' non attivo per il tuo tenant`,
      });
    }

    next();
  };
}

module.exports = {
  hasModuleAccess,
  requireModule,
};
