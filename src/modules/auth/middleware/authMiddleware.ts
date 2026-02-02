// src/modules/auth/middleware/authMiddleware.ts (DUAL MODE - CORRETTO)
import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/TokenService';
import { AccountType } from '../types/auth.types';
import { verifyGateway, extractUserData } from './verifyGateway';

// Istanza TokenService per standalone mode
const tokenService = new TokenService();

/**
 * Middleware di autenticazione con supporto DUAL MODE
 *
 * STANDALONE MODE (GATEWAY_MODE=false):
 *   - Development/Testing locale
 *   - Valida JWT dal header Authorization
 *   - Estrae accountId e lo inietta in req.account
 *
 * GATEWAY MODE (GATEWAY_MODE=true):
 *   - Production con API Gateway
 *   - Verifica provenienza dal gateway (X-Gateway-Secret)
 *   - Estrae dati utente da X-User-Data header
 *   - NO validazione JWT (già fatto dal gateway)
 *
 * @example
 * router.get('/me', authenticate, handler)
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // GATEWAY MODE: Trust header dal gateway
  if (process.env.GATEWAY_MODE === 'true') {
    console.log('🔐 [AUTH] Gateway mode: verifica provenienza e estrai user data');
    return authenticateFromGateway(req, res, next);
  }

  // STANDALONE MODE: Valida JWT direttamente
  console.log('🔐 [AUTH] Standalone mode: valida JWT');
  return authenticateFromJWT(req, res, next);
};

/**
 * Autenticazione GATEWAY MODE
 * Usa i middleware verifyGateway e extractUserData in sequenza
 */
const authenticateFromGateway = (req: Request, res: Response, next: NextFunction): void => {
  // 1. Verifica che la richiesta provenga dal gateway
  verifyGateway(req, res, (err?: any) => {
    if (err || res.headersSent) return;

    // 2. Estrae user data dall'header X-User-Data
    extractUserData(req, res, (err?: any) => {
      if (err || res.headersSent) return;

      // 3. User data estratto e disponibile in req.user
      // Mappa in req.account per compatibilità con codice esistente
      const user = (req as any).user;
      (req as any).accountId = user.accountId;
      (req as any).account = {
        accountId: user.accountId,
        email: user.email,
        accountType: user.accountType,
        roleId: user.roleId,
        permissions: user.permissions || [],
      };

      console.log(`✅ [AUTH] Gateway mode: utente autenticato (${user.email})`);
      next();
    });
  });
};

/**
 * Autenticazione STANDALONE MODE
 * Valida JWT dal header Authorization (codice originale)
 */
const authenticateFromJWT = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = tokenService.extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Token di autenticazione mancante',
      });
      return;
    }

    const payload = tokenService.verifyAccessToken(token);

    if (!payload) {
      res.status(401).json({
        success: false,
        error: 'Token non valido o scaduto',
      });
      return;
    }

    // ✅ Aggiungi dati account alla request (codice originale)
    (req as any).accountId = payload.accountId;
    (req as any).account = payload;

    console.log(`✅ [AUTH] Standalone mode: utente autenticato (${payload.email})`);
    next();
  } catch (error) {
    console.error('❌ [AUTH] Errore durante autenticazione:', error);
    res.status(401).json({
      success: false,
      error: 'Errore durante autenticazione',
    });
  }
};

/**
 * Middleware per verificare il tipo di account
 * Uso: requireAccountType('operatore', 'admin')
 */
export const requireAccountType = (...allowedTypes: AccountType[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const account = (req as any).account;

    if (!account) {
      res.status(401).json({
        success: false,
        error: 'Autenticazione richiesta',
      });
      return;
    }

    if (!allowedTypes.includes(account.accountType)) {
      res.status(403).json({
        success: false,
        error: 'Accesso non autorizzato per questo tipo di account',
        required: allowedTypes,
      });
      return;
    }

    next();
  };
};

/**
 * Middleware opzionale - non fallisce se token mancante
 * Utile per endpoint pubblici che possono beneficiare di autenticazione
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // GATEWAY MODE
  if (process.env.GATEWAY_MODE === 'true') {
    // Estrae user data se presente, altrimenti continua
    try {
      const userDataHeader = req.headers['x-user-data'] as string;
      if (userDataHeader) {
        const userData = JSON.parse(userDataHeader);
        (req as any).accountId = userData.accountId;
        (req as any).account = userData;
      }
    } catch (error) {
      // Continua senza autenticazione
    }
    next();
    return;
  }

  // STANDALONE MODE (codice originale)
  try {
    const authHeader = req.headers.authorization;
    const token = tokenService.extractTokenFromHeader(authHeader);

    if (token) {
      const payload = tokenService.verifyAccessToken(token);
      if (payload) {
        (req as any).accountId = payload.accountId;
        (req as any).account = payload;
      }
    }

    next();
  } catch (error) {
    // Continua senza autenticazione
    next();
  }
};

/**
 * Middleware opzionale per verificare permessi specifici (futuro)
 *
 * @example
 * router.post('/admin', authenticate, requirePermission('sistema', 'admin'), handler)
 */
export const requirePermission = (module: string, action: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const account = (req as any).account;

    if (!account || !account.permissions) {
      res.status(403).json({
        success: false,
        error: 'Permessi non disponibili',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const requiredPermission = `${module}.${action}`;
    const hasPermission = account.permissions.some((p: string) => {
      // Root wildcard
      if (p === '*') return true;
      // Module wildcard
      if (p === `${module}.*`) return true;
      // Exact permission
      if (p === requiredPermission) return true;
      return false;
    });

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        error: 'Permesso negato',
        message: `Richiesto permesso: ${requiredPermission}`,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
};

/**
 * Export singoli per uso modulare
 */
export { verifyGateway, extractUserData };
