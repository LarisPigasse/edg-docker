// src/modules/auth/middleware/assistenzaMiddleware.ts
// =============================================================================
// Accesso assistito (ADR085): azioni vietate con il token assistito
// =============================================================================
// Il token assistito porta l'account dell'operatore EDG: senza questo blocco
// la scheda assistita potrebbe cambiare la password dell'operatore o chiudere
// tutte le sue sessioni. Da usare DOPO authenticate.
// =============================================================================
import { Request, Response, NextFunction } from 'express';
import { logger } from '../../../services/logger';
import { requestActor } from '../../../services/requestActor';

export const vietatoInAssistenza = (req: Request, res: Response, next: NextFunction): void => {
  const assistenza = (req as any).account?.assistenza;
  if (!assistenza) {
    next();
    return;
  }
  logger.auditFailure(
    'auth.assistenza_vietato',
    `Azione non consentita durante l'accesso assistito: ${req.method} ${req.originalUrl}`,
    requestActor(req),
    { sessione: assistenza.id, path: req.originalUrl },
    'SECURITY'
  );
  res.status(403).json({ success: false, error: 'Non disponibile durante l’accesso assistito' });
};
