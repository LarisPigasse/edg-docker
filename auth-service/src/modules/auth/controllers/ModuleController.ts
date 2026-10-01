// src/modules/auth/controllers/ModuleController.ts
// =============================================================================
// Gestione moduli (ADR047): catalogo (root) e attivazioni per tenant (admin, root)
// =============================================================================
// Il controller fa solo da traduttore: input gia' validato (Joi), regole nei
// servizi, qui risposta standard (utils/response) e audit (ADR034/ADR039).
//   - modifica riuscita   -> auditChange con prima/dopo
//   - regola violata      -> auditFailure (chi ha tentato cosa) + 4xx
//   - errore imprevisto   -> logger.error con autore + 500
// =============================================================================
import { Request, Response } from 'express';
import { ModuleCatalogService } from '../services/ModuleCatalogService';
import { ModuleActivationService } from '../services/ModuleActivationService';
import { isModuleError } from '../services/ModuleError';
import { createdResponse, errorResponse, serverError, successResponse } from '../utils/response';
import { logger, snapshot, type StateChange } from '../../../services/logger';
import { requestActor } from '../../../services/requestActor';

type Handler = (req: Request, res: Response) => Promise<void>;

export class ModuleController {
  constructor(
    private catalog: ModuleCatalogService,
    private activations: ModuleActivationService
  ) {}

  // ===========================================================================
  // CATALOGO
  // ===========================================================================

  listCatalog: Handler = this.handle('module.catalog.list', async (_req, res) => {
    successResponse(res, await this.catalog.list());
  });

  getCatalog: Handler = this.handle('module.catalog.get', async (req, res) => {
    successResponse(res, await this.catalog.get(req.params.key as string));
  });

  createCatalog: Handler = this.handle('crud.create', async (req, res) => {
    const record = await this.catalog.create(req.body);
    this.audit(req, 'crud.create', `Creato modulo '${record.key}' nel catalogo`, { module: record.key }, {
      precedente: null,
      nuovo: snapshot(record),
    });
    createdResponse(res, record, `Modulo '${record.name}' aggiunto al catalogo`);
  });

  updateCatalog: Handler = this.handle('crud.update', async (req, res) => {
    const key = req.params.key as string;
    const { before, after } = await this.catalog.update(key, req.body);
    this.audit(req, 'crud.update', `Aggiornato modulo '${key}' del catalogo`, { module: key }, {
      precedente: snapshot(before),
      nuovo: snapshot(after),
    });
    successResponse(res, after, `Modulo '${after.name}' aggiornato`);
  });

  removeCatalog: Handler = this.handle('crud.delete', async (req, res) => {
    const key = req.params.key as string;
    const before = await this.catalog.remove(key);
    this.audit(req, 'crud.delete', `Eliminato modulo '${key}' dal catalogo`, { module: key }, {
      precedente: snapshot(before),
      nuovo: null,
    });
    successResponse(res, null, `Modulo '${key}' eliminato dal catalogo`);
  });

  // ===========================================================================
  // ATTIVAZIONI PER TENANT
  // ===========================================================================

  listForTenant: Handler = this.handle('module.activation.list', async (req, res) => {
    successResponse(res, await this.activations.listForTenant(Number(req.params.tenantId)));
  });

  activate: Handler = this.handle('module.activate', async (req, res) => {
    const tenantId = Number(req.params.tenantId);
    const record = await this.activations.activate(tenantId, req.body, requestActor(req)?.id ?? null);
    const label = record.status === 'prova' ? 'in prova' : 'attivato';
    this.audit(
      req,
      'module.activate',
      `Modulo '${record.module}' ${label} per il tenant #${tenantId}`,
      { tenantId, module: record.module, status: record.status },
      { precedente: null, nuovo: snapshot(record) }
    );
    createdResponse(res, record, `Modulo ${label}`);
  });

  updateActivation: Handler = this.handle('module.update', async (req, res) => {
    const tenantId = Number(req.params.tenantId);
    const key = req.params.key as string;
    const { before, after, lostModules } = await this.activations.update(tenantId, key, req.body);
    this.audit(
      req,
      'module.update',
      `Modulo '${key}' del tenant #${tenantId}: ${before.status} → ${after.status}`,
      { tenantId, module: key, status: after.status, lostModules },
      { precedente: snapshot(before), nuovo: snapshot(after) }
    );
    const warning = lostModules.length > 0 ? ` Non più in vigore per dipendenza: ${lostModules.join(', ')}.` : '';
    successResponse(res, { activation: after, lostModules }, `Attivazione aggiornata.${warning}`);
  });

  // ===========================================================================
  // Supporto
  // ===========================================================================

  /** Avvolge un handler: regole violate -> 4xx con audit, il resto -> 500 con log */
  private handle(action: string, fn: Handler): Handler {
    return async (req, res) => {
      try {
        await fn(req, res);
      } catch (err) {
        const meta = { params: req.params };
        if (isModuleError(err)) {
          logger.auditFailure(action, err.message, requestActor(req), meta, 'DATA');
          errorResponse(res, err.status, err.message);
          return;
        }
        logger.error(action, `Errore gestione moduli: ${String(err)}`, meta, 'DATA', requestActor(req));
        serverError(res);
      }
    };
  }

  private audit(req: Request, action: string, message: string, meta: Record<string, unknown>, stato: StateChange): void {
    const actor = requestActor(req);
    if (actor) logger.auditChange(action, message, actor, stato, meta, 'DATA');
    else logger.info(action, message, meta, 'DATA');
  }
}
