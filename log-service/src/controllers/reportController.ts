// src/controllers/reportController.ts
//
// POST /api/alert/digest — invia subito il riepilogo giornaliero (ADR046),
// dal pulsante "Invia riepilogo ora" della scheda Salute. Sotto /api/alert
// perche' l'api-gateway inoltra a log-service quel prefisso.
import { Request, Response } from 'express';
import { sendDigestNow } from '../services/reports/dailyDigest';

export const sendDigest = async (_req: Request, res: Response): Promise<void> => {
  const outcome = await sendDigestNow();
  res.status(outcome.ok ? 200 : 502).json({
    success: outcome.ok,
    message: outcome.ok ? `Riepilogo ${outcome.message}` : `Riepilogo non inviato: ${outcome.message}`,
  });
};
