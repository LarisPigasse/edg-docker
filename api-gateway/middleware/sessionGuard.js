// =============================================================================
// SESSION GUARD — account disattivati e sessioni revocate (blacklist Redis)
// =============================================================================
// Un JWT valido non basta: un account disattivato o una sessione revocata
// devono smettere di funzionare subito, non alla scadenza del token (15 min).
// auth-service scrive le chiavi in Redis, il gateway le legge qui:
//   blocked:<accountId>           account disattivato
//   blocked:session:<sessionId>   sessione revocata
//
// Redis non deve MAI bloccare il traffico (ADR040): se non e' pronto o non
// risponde, si lascia passare (fail-open).
//
// Richiede che jwtValidatorMiddleware sia gia' stato eseguito (req.userData).
// =============================================================================

/**
 * @param {import('ioredis').Redis | null} redisClient
 */
function createSessionGuard(redisClient) {
  const isFlagged = async key => {
    if (!redisClient || redisClient.status !== 'ready') return false;
    try {
      return (await redisClient.get(key)) === '1';
    } catch {
      return false; // fail-open
    }
  };

  const isAccountBlocked = accountId => (accountId ? isFlagged(`blocked:${accountId}`) : Promise.resolve(false));
  const isSessionBlocked = sessionId =>
    sessionId ? isFlagged(`blocked:session:${sessionId}`) : Promise.resolve(false);

  /** Middleware: 401 se l'account e' disattivato o la sessione revocata */
  const sessionGuard = async (req, res, next) => {
    if (await isAccountBlocked(req.userData?.accountId)) {
      return res.status(401).json({ success: false, error: 'Account disattivato' });
    }
    if (await isSessionBlocked(req.userData?.sessionId)) {
      return res.status(401).json({ success: false, error: 'Sessione revocata' });
    }
    next();
  };

  return { isAccountBlocked, isSessionBlocked, sessionGuard };
}

module.exports = { createSessionGuard };
