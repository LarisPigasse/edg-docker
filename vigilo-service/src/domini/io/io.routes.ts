// =============================================================================
// Io — GET /api/vigilo/me
// =============================================================================
// Cio' che il frontend deve sapere dell'utente per Vigilo, in una chiamata:
// capacita' effettive (ADR068), tenant, se la procedura di avvio e' fatta
// (passo 3.5) e la persona collegata per l'addetto (passo 5.4).
// =============================================================================
import { Router, Request, Response } from 'express';
import { successResponse } from '../../core/utils/response';
import { profilo } from './io.service';

export const ioRoutes = Router();

ioRoutes.get('/me', async (req: Request, res: Response) => {
  successResponse(res, await profilo(req.user!));
});
