// src/modules/auth/middleware/verifyGateway.ts
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware per verificare che la richiesta provenga dal Gateway
 *
 * Quando GATEWAY_MODE=true, questo middleware verifica che la richiesta
 * contenga l'header X-Gateway-Secret con il valore corretto.
 *
 * Questo previene che qualcuno bypassa il gateway e chiami direttamente
 * il microservizio con header X-User-Data forgiati.
 *
 * @example
 * router.get('/protected', verifyGateway, authenticate, handler)
 */
export const verifyGateway = (req: Request, res: Response, next: NextFunction): void => {
  // Solo in gateway mode
  if (process.env.GATEWAY_MODE !== 'true') {
    return next();
  }

  const gatewaySecret = req.headers['x-gateway-secret'] as string;
  const expectedSecret = process.env.GATEWAY_SECRET;

  // Verifica che il secret sia configurato
  if (!expectedSecret) {
    console.error('⚠️ GATEWAY_SECRET non configurato in .env!');
    res.status(500).json({
      success: false,
      error: 'Configurazione server non valida',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Verifica che la richiesta contenga il secret corretto
  if (gatewaySecret !== expectedSecret) {
    console.warn('🚨 Tentativo di accesso diretto al microservizio (bypass gateway)');
    console.warn(`   IP: ${req.ip}`);
    console.warn(`   Path: ${req.path}`);
    console.warn(`   Headers: ${JSON.stringify(req.headers)}`);

    res.status(403).json({
      success: false,
      error: 'Accesso diretto non consentito',
      message: 'Le richieste devono passare attraverso il gateway',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Secret corretto, procedi
  next();
};

/**
 * Middleware per estrarre user data dall'header X-User-Data (gateway mode)
 *
 * In gateway mode, il gateway valida il JWT e inietta i dati utente
 * nell'header X-User-Data come JSON. Questo middleware estrae questi dati
 * e li rende disponibili in req.user.
 *
 * @example
 * router.get('/me', verifyGateway, extractUserData, handler)
 */
export const extractUserData = (req: Request, res: Response, next: NextFunction): void => {
  // Solo in gateway mode
  if (process.env.GATEWAY_MODE !== 'true') {
    return next();
  }

  try {
    const userDataHeader = req.headers['x-user-data'] as string;

    if (!userDataHeader) {
      res.status(401).json({
        success: false,
        error: 'Header X-User-Data mancante',
        message: 'Richiesta non autenticata',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Parse JSON
    const userData = JSON.parse(userDataHeader);

    // Validazione base
    if (!userData.accountId || !userData.email) {
      res.status(401).json({
        success: false,
        error: 'Dati utente non validi',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Inietta in req.user per uso nei controller
    (req as any).user = {
      accountId: userData.accountId,
      email: userData.email,
      accountType: userData.accountType,
      tenantId: userData.tenantId ?? null, // ADR009
      roleId: userData.roleId,
      permissions: userData.permissions || [],
      modules: userData.modules || [], // ADR009
      sessionId: userData.sessionId ?? null,
    };

    next();
  } catch (error) {
    console.error('❌ Errore parsing X-User-Data header:', error);
    res.status(401).json({
      success: false,
      error: 'Header X-User-Data malformato',
      timestamp: new Date().toISOString(),
    });
  }
};
