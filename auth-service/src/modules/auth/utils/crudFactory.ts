// =============================================================================
// EDG Auth Service - CRUD Factory
// Genera handler CRUD standard per le tabelle di base di auth-service
// (Tenant, e in seguito Role). Stesso concetto del crudFactory di
// system-service, adattato alle differenze di questo servizio: request user
// su req.account (non req.user), MySQL (Op.like, non Op.iLike), nessun
// isolamento multi-tenant (queste tabelle SONO l'anagrafica dei tenant
// stessi, non dati di un tenant).
// =============================================================================
import { Request, Response } from 'express';
import { Model, ModelStatic, WhereOptions, Order, Op } from 'sequelize';
import { successResponse, createdResponse, notFound, conflict, buildPaginationMeta, parsePagination } from './response';
import { logger, snapshot, type StateChange } from '../../../services/logger';
import { requestActor } from '../../../services/requestActor';

export interface CrudFactoryOptions<M extends Model> {
  model: ModelStatic<M>;
  resourceName: string;
  searchFields?: string[];
  defaultOrder?: Order;
  // Se true: tenta prima l'eliminazione vera, e se il record è referenziato
  // altrove (vincolo FK) disattiva (isActive = false) invece di fallire.
  softDelete?: boolean;
  listFilters?: (query: Request['query']) => WhereOptions;
  // Nome di un campo booleano che, se true sul record, blocca eliminazione e
  // disattivazione (es. 'isSystem' per proteggere il tenant di sistema o un
  // ruolo predefinito da azioni distruttive accidentali via API).
  protectField?: string;
  // Messaggi per i valori duplicati (vincoli UNIQUE): al posto di un errore
  // 500, un 409 con un messaggio chiaro. `match` si cerca nel nome del campo
  // o dell'indice violato (es. 'slug', 'unique_tenant_cliente').
  uniqueMessages?: { match: string; message: string }[];
}

/** Messaggio per un vincolo UNIQUE violato, se previsto (altrimenti null) */
function uniqueViolation(err: unknown, messages: { match: string; message: string }[]): string | null {
  const e = err as { name?: string; fields?: Record<string, unknown>; parent?: { sqlMessage?: string } };
  if (e?.name !== 'SequelizeUniqueConstraintError') return null;
  const haystack = `${Object.keys(e.fields ?? {}).join(' ')} ${e.parent?.sqlMessage ?? ''}`;
  return messages.find(m => haystack.includes(m.match))?.message ?? 'Valore già usato da un altro record';
}

export function createCrudHandlers<M extends Model>(opts: CrudFactoryOptions<M>) {
  const {
    model,
    resourceName,
    searchFields = [],
    defaultOrder = [['id', 'ASC']],
    softDelete = true,
    listFilters,
    protectField,
    uniqueMessages = [],
  } = opts;

  // Audit (ADR034): stessi nomi di evento del crudFactory di system-service
  // e vehicle-service (crud.create/update/delete/deactivate/toggle), cosi'
  // filtri dei Logs e regole di allarme valgono uguale per tutti i servizi.
  const audit = (req: Request, action: string, message: string, meta?: Record<string, unknown>, stato?: StateChange) => {
    const actor = requestActor(req);
    if (actor && stato) logger.auditChange(action, message, actor, stato, meta, 'DATA');
    else if (actor) logger.audit(action, message, actor, meta, 'DATA');
    else logger.info(action, message, meta, 'DATA');
  };
  /** Tentativo rifiutato da una regola (es. record di sistema): esito 'fallito' con autore */
  const denied = (req: Request, action: string, message: string, meta?: Record<string, unknown>) =>
    logger.auditFailure(action, message, requestActor(req), meta, 'DATA');
  /** Errore imprevisto: con autore, per sapere chi stava tentando l'operazione (1c) */
  const failed = (req: Request, action: string, message: string, err: unknown, meta?: Record<string, unknown>) =>
    logger.error(action, message, { ...meta, error: String(err) }, 'DATA', requestActor(req));

  const isProtected = (record: M): boolean =>
    !!protectField && (record as unknown as Record<string, unknown>)[protectField] === true;

  // -----------------------------------------------------------------------
  // LIST  GET /
  // -----------------------------------------------------------------------
  const list = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, limit, offset } = parsePagination(req.query);
      const where: WhereOptions = {};

      if (req.query.active === 'all') {
        // nessun filtro su isActive
      } else if (req.query.active !== undefined) {
        (where as Record<string, unknown>).isActive = req.query.active !== 'false';
      } else {
        (where as Record<string, unknown>).isActive = true;
      }

      if (req.query.search && searchFields.length > 0) {
        const search = String(req.query.search);
        (where as unknown as { [key: symbol]: unknown })[Op.or] = searchFields.map(field => ({
          [field]: { [Op.like]: `%${search}%` },
        }));
      }

      if (listFilters) {
        Object.assign(where, listFilters(req.query));
      }

      const { count, rows } = await model.findAndCountAll({ where, limit, offset, order: defaultOrder });

      successResponse(res, rows, undefined, buildPaginationMeta(count, page, limit));
    } catch (err) {
      failed(req, 'crud.list', `Errore lista ${resourceName}`, err);
      notFound(res, resourceName);
    }
  };

  // -----------------------------------------------------------------------
  // GET BY ID  GET /:id
  // -----------------------------------------------------------------------
  const getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const record = await model.findByPk(req.params.id);
      if (!record) {
        notFound(res, resourceName);
        return;
      }
      successResponse(res, record);
    } catch (err) {
      failed(req, 'crud.getById', `Errore lettura ${resourceName} #${req.params.id}`, err, { id: req.params.id });
      notFound(res, resourceName);
    }
  };

  // -----------------------------------------------------------------------
  // CREATE  POST /
  // -----------------------------------------------------------------------
  const create = async (req: Request, res: Response): Promise<void> => {
    try {
      const record = await model.create(req.body as M['_creationAttributes']);
      const newId = (record as unknown as Record<string, unknown>)[model.primaryKeyAttribute];
      audit(req, 'crud.create', `Creato ${resourceName} #${newId}`, { id: newId }, { precedente: null, nuovo: snapshot(record) });
      createdResponse(res, record, `${resourceName} creato con successo`);
    } catch (err) {
      const duplicate = uniqueViolation(err, uniqueMessages);
      if (duplicate) {
        denied(req, 'crud.create', `Creazione ${resourceName} rifiutata: ${duplicate}`, { body: req.body });
        conflict(res, duplicate);
        return;
      }
      failed(req, 'crud.create', `Errore creazione ${resourceName}`, err, { body: req.body });
      throw err;
    }
  };

  // -----------------------------------------------------------------------
  // UPDATE  PUT /:id
  // -----------------------------------------------------------------------
  const update = async (req: Request, res: Response): Promise<void> => {
    try {
      const record = await model.findByPk(req.params.id);
      if (!record) {
        notFound(res, resourceName);
        return;
      }
      // Stessa protezione di toggleActive: un record protetto (es. tenant di
      // sistema) non può essere disattivato nemmeno passando da PUT invece
      // che dall'endpoint /toggle dedicato.
      const currentActive = (record as unknown as { isActive?: boolean }).isActive;
      if (isProtected(record) && currentActive === true && (req.body as { isActive?: unknown })?.isActive === false) {
        denied(req, 'crud.update', `Tentata disattivazione di ${resourceName} di sistema #${req.params.id}`, { id: req.params.id });
        conflict(res, `${resourceName} di sistema: non può essere disattivato`);
        return;
      }
      const precedente = snapshot(record);
      await record.update(req.body);
      audit(req, 'crud.update', `Aggiornato ${resourceName} #${req.params.id}`, { id: req.params.id }, {
        precedente,
        nuovo: snapshot(record),
      });
      successResponse(res, record, `${resourceName} aggiornato con successo`);
    } catch (err) {
      const duplicate = uniqueViolation(err, uniqueMessages);
      if (duplicate) {
        denied(req, 'crud.update', `Modifica ${resourceName} #${req.params.id} rifiutata: ${duplicate}`, { id: req.params.id });
        conflict(res, duplicate);
        return;
      }
      failed(req, 'crud.update', `Errore aggiornamento ${resourceName} #${req.params.id}`, err, { id: req.params.id });
      throw err;
    }
  };

  // -----------------------------------------------------------------------
  // DELETE  DELETE /:id
  // -----------------------------------------------------------------------
  const remove = async (req: Request, res: Response): Promise<void> => {
    try {
      const record = await model.findByPk(req.params.id);
      if (!record) {
        notFound(res, resourceName);
        return;
      }
      if (isProtected(record)) {
        denied(req, 'crud.delete', `Tentata eliminazione di ${resourceName} di sistema #${req.params.id}`, { id: req.params.id });
        conflict(res, `${resourceName} di sistema: non può essere eliminato`);
        return;
      }

      const precedente = snapshot(record);
      if (softDelete) {
        try {
          await record.destroy();
          audit(req, 'crud.delete', `Eliminato ${resourceName} #${req.params.id}`, { id: req.params.id }, { precedente, nuovo: null });
          successResponse(res, null, `${resourceName} eliminato definitivamente`);
          return;
        } catch (err) {
          if ((err as { name?: string }).name !== 'SequelizeForeignKeyConstraintError') {
            throw err;
          }
          // Referenziato altrove: non eliminabile, si disattiva al suo posto.
        }

        await record.update({ isActive: false } as Partial<M['_attributes']>);
        audit(
          req,
          'crud.deactivate',
          `Disattivato ${resourceName} #${req.params.id} (referenziato altrove, eliminazione non consentita)`,
          { id: req.params.id },
          { precedente, nuovo: snapshot(record) }
        );
        successResponse(res, null, `${resourceName} disattivato: è referenziato altrove e non può essere eliminato`);
      } else {
        await record.destroy();
        audit(req, 'crud.delete', `Eliminato ${resourceName} #${req.params.id}`, { id: req.params.id }, { precedente, nuovo: null });
        successResponse(res, null, `${resourceName} eliminato`);
      }
    } catch (err) {
      failed(req, 'crud.delete', `Errore eliminazione ${resourceName} #${req.params.id}`, err, { id: req.params.id });
      throw err;
    }
  };

  // -----------------------------------------------------------------------
  // TOGGLE ACTIVE  PATCH /:id/toggle
  // -----------------------------------------------------------------------
  const toggleActive = async (req: Request, res: Response): Promise<void> => {
    try {
      const record = await model.findByPk(req.params.id);
      if (!record) {
        notFound(res, resourceName);
        return;
      }
      const current = (record as unknown as { isActive: boolean }).isActive;
      if (isProtected(record) && current) {
        denied(req, 'crud.toggle', `Tentata disattivazione di ${resourceName} di sistema #${req.params.id}`, { id: req.params.id });
        conflict(res, `${resourceName} di sistema: non può essere disattivato`);
        return;
      }
      const precedente = snapshot(record);
      await record.update({ isActive: !current } as Partial<M['_attributes']>);
      audit(
        req,
        'crud.toggle',
        `${resourceName} #${req.params.id} ${!current ? 'attivato' : 'disattivato'}`,
        { id: req.params.id, isActive: !current },
        { precedente, nuovo: snapshot(record) }
      );
      successResponse(res, record, `${resourceName} ${!current ? 'attivato' : 'disattivato'}`);
    } catch (err) {
      failed(req, 'crud.toggle', `Errore cambio stato ${resourceName} #${req.params.id}`, err, { id: req.params.id });
      throw err;
    }
  };

  return { list, getById, create, update, remove, toggleActive };
}
