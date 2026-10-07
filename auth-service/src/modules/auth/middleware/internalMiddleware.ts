// src/modules/auth/middleware/internalMiddleware.ts
// =============================================================================
// Chiamate interne tra servizi (ADR058)
// =============================================================================
// Le rotte /internal non passano dal gateway (che inoltra ad auth-service solo
// /auth/*): sono raggiungibili solo dalla rete interna dei container. In più
// chi chiama deve presentare il segreto condiviso dei servizi (GATEWAY_SECRET,
// che i servizi conoscono già per riconoscere il gateway).
import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response';

export const requireInternalCall = (req: Request, res: Response, next: NextFunction): void => {
  const expected = process.env.GATEWAY_SECRET;
  if (!expected) {
    errorResponse(res, 500, 'Configurazione server non valida');
    return;
  }
  if (req.headers['x-gateway-secret'] !== expected) {
    console.warn(`🚨 Chiamata interna rifiutata: ${req.method} ${req.originalUrl} da ${req.ip}`);
    errorResponse(res, 403, 'Accesso non consentito');
    return;
  }
  next();
};
