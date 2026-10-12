// =============================================================================
// Diagnostica — POST /api/vigilo/diagnostica/flusso   (TEMPORANEA, blocco B1)
// =============================================================================
// Verifica che l'inoltro a flusso del gateway (stream: true, ADR069) porti il
// corpo della richiesta intatto: risponde con dimensione, tipo e impronta
// SHA-256 di cio' che ha ricevuto, senza salvare nulla. Si toglie quando
// arrivano gli allegati veri (blocco B9).
// =============================================================================
import { Router, Request, Response } from 'express';
import express from 'express';
import crypto from 'crypto';
import { richiedi } from '../../core/middleware/permessi';
import { successResponse } from '../../core/utils/response';

export const diagnosticaRoutes = Router();

diagnosticaRoutes.post(
  '/diagnostica/flusso',
  richiedi('config'),
  express.raw({ type: () => true, limit: '16mb' }),
  (req: Request, res: Response) => {
    const corpo = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
    successResponse(res, {
      byte: corpo.length,
      tipo: req.headers['content-type'] ?? null,
      sha256: crypto.createHash('sha256').update(corpo).digest('hex'),
    });
  }
);
