// =============================================================================
// JWT VALIDATOR MIDDLEWARE
// =============================================================================
// Valida il JWT token e estrae i dati utente
// Utilizzato dal gateway per autenticare richieste protette
// =============================================================================

const jwt = require('jsonwebtoken');

/**
 * Estrae il token JWT dall'header Authorization
 * 
 * @param {string} authHeader - Header Authorization (es: "Bearer eyJ...")
 * @returns {string|null} - Token JWT o null se non presente
 */
function extractToken(authHeader) {
  if (!authHeader) {
    return null;
  }

  // Formato: "Bearer <token>"
  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Valida il JWT token e estrae i dati utente
 * 
 * @param {string} token - JWT token
 * @param {string} jwtSecret - Secret per validare il token
 * @returns {object|null} - Dati utente dal token o null se invalido
 */
function validateToken(token, jwtSecret) {
  if (!token || !jwtSecret) {
    return null;
  }

  try {
    // Verifica e decodifica il token
    const payload = jwt.verify(token, jwtSecret);

    // Validazione base del payload
    if (!payload.accountId || !payload.email) {
      console.warn('⚠️ [JWT] Token valido ma payload incompleto');
      console.warn('   Payload ricevuto:', JSON.stringify(payload, null, 2));
      return null;
    }

    return {
      accountId: payload.accountId,
      email: payload.email,
      accountType: payload.accountType,
      roleId: payload.roleId,
      permissions: payload.permissions || [],
    };
  } catch (error) {
    // Token invalido, scaduto o malformato
    if (error.name === 'TokenExpiredError') {
      console.warn('⚠️ [JWT] Token scaduto');
    } else if (error.name === 'JsonWebTokenError') {
      console.warn('⚠️ [JWT] Token non valido:', error.message);
    } else {
      console.error('❌ [JWT] Errore validazione token:', error.message);
    }
    return null;
  }
}

/**
 * Middleware Express per validare JWT e iniettare user data nella request
 * 
 * Estrae e valida il token JWT, poi aggiunge i dati utente a req.userData
 * Se il token non è valido, risponde con 401 Unauthorized
 * 
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {function} next - Express next function
 */
function jwtValidatorMiddleware(req, res, next) {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error('❌ [JWT] JWT_SECRET non configurato!');
    return res.status(500).json({
      success: false,
      error: 'Configurazione server non valida',
    });
  }

  // Estrai token dall'header Authorization
  const authHeader = req.headers.authorization;
  const token = extractToken(authHeader);

  if (!token) {
    console.warn('⚠️ [JWT] Token mancante nella richiesta');
    return res.status(401).json({
      success: false,
      error: 'Token di autenticazione mancante',
    });
  }

  // Valida token ed estrai dati utente
  const userData = validateToken(token, jwtSecret);

  if (!userData) {
    return res.status(401).json({
      success: false,
      error: 'Token non valido o scaduto',
    });
  }

  // Inietta user data nella request per i middleware successivi
  req.userData = userData;

  next();
}

module.exports = {
  extractToken,
  validateToken,
  jwtValidatorMiddleware,
};
