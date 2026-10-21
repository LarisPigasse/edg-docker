// src/modules/auth/controllers/AssistenzaController.ts
// =============================================================================
// Accesso assistito (ADR085): traduttore HTTP di AssistenzaService
// =============================================================================
//   - regola violata    -> auditFailure (chi ha tentato cosa) + 4xx
//   - errore imprevisto -> logger.error con autore + 500
// Gli eventi riusciti li registra il servizio (aperta, entrata, chiusa).
// =============================================================================
import { Request, Response } from 'express';
import { AssistenzaService, isAssistenzaError } from '../services/AssistenzaService';
import { createdResponse, errorResponse, serverError, successResponse, unauthorized } from '../utils/response';
import { extractClientIp } from '../utils/ipExtractor';
import { logger } from '../../../services/logger';
import { requestActor } from '../../../services/requestActor';

type Handler = (req: Request, res: Response) => Promise<void>;

const provenienza = (req: Request) => ({
  ipAddress: extractClientIp(req) ?? null,
  userAgent: (req.headers['user-agent'] as string | undefined) ?? null,
});

export class AssistenzaController {
  constructor(private service: AssistenzaService) {}

  apri: Handler = this.handle('auth.assistenza_aperta', async (req, res) => {
    const chi = requestActor(req);
    if (!chi) return void unauthorized(res);
    const apertura = await this.service.apri(chi, req.body, provenienza(req));
    createdResponse(res, apertura, 'Accesso assistito aperto');
  });

  scambia: Handler = this.handle('auth.assistenza_entrata', async (req, res) => {
    successResponse(res, await this.service.scambia(req.body.codice, provenienza(req)));
  });

  esci: Handler = this.handle('auth.assistenza_chiusa', async (req, res) => {
    const chi = requestActor(req);
    if (!chi) return void unauthorized(res);
    const claim = (req as any).account?.assistenza;
    successResponse(res, await this.service.esci(claim, chi), 'Sessione di assistenza chiusa');
  });

  chiudi: Handler = this.handle('auth.assistenza_chiusa', async (req, res) => {
    const chi = requestActor(req);
    if (!chi) return void unauthorized(res);
    successResponse(res, await this.service.chiudiDaEdg(Number(req.params.id), chi), 'Sessione di assistenza chiusa');
  });

  elenco: Handler = this.handle('auth.assistenza_elenco', async (req, res) => {
    const { aperte, limit } = req.query as unknown as { aperte?: boolean; limit?: number };
    successResponse(res, await this.service.elenco({ aperte, limit }));
  });

  private handle(action: string, fn: Handler): Handler {
    return async (req, res) => {
      try {
        await fn(req, res);
      } catch (err) {
        const meta = { params: req.params };
        if (isAssistenzaError(err)) {
          logger.auditFailure(action, err.message, requestActor(req), meta, 'SECURITY');
          errorResponse(res, err.status, err.message);
          return;
        }
        logger.error(action, `Errore accesso assistito: ${String(err)}`, meta, 'SECURITY', requestActor(req));
        serverError(res);
      }
    };
  }
}
