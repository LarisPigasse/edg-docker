// =============================================================================
// EDG System Service - CRUD Factory
// Genera handler CRUD standard per le lookup tables
// Riduce la ripetizione mantenendo la consistenza tra entità
// =============================================================================
import { Request, Response } from 'express';
import { Model, ModelStatic, WhereOptions, Order, Op } from 'sequelize';
import { successResponse, createdResponse, notFound, buildPaginationMeta, parsePagination } from './response';
import { NotFoundError } from './errors';
import { logger } from '../services/logger';

// ---------------------------------------------------------------------------
// Configurazione factory
// ---------------------------------------------------------------------------
export interface CrudFactoryOptions<M extends Model> {
  model: ModelStatic<M>;
  resourceName: string; // Nome human-readable per messaggi
  searchFields?: string[]; // Campi su cui fare ricerca testuale con ?search=
  defaultOrder?: Order; // Ordinamento default
  // Se true (default per le tabelle di system-service): tenta prima l'eliminazione
  // vera, e se il record è referenziato altrove (vincolo FK) disattiva invece di
  // fallire. Se false: elimina sempre, nessun fallback.
  softDelete?: boolean;
  listFilters?: (query: Request['query']) => WhereOptions; // Filtri aggiuntivi per la lista
  // Isolamento multi-tenant (ADR021): se true, ogni operazione forza il tenant
  // dell'utente autenticato lato server, ignorando qualunque valore client.
  // Eccezione: account 'operatore' (chi accede a pro-frontend) opera sempre
  // su tutti i tenant — i ruoli/permessi governano cosa può fare, non il tenant.
  tenantScoped?: boolean;
  tenantField?: string; // Nome del campo tenant sul modello (default 'idTenant')
}

// ---------------------------------------------------------------------------
// Factory: ritorna un oggetto con tutti i handler CRUD
// ---------------------------------------------------------------------------
export function createCrudHandlers<M extends Model>(opts: CrudFactoryOptions<M>) {
  const {
    model,
    resourceName,
    searchFields = [],
    defaultOrder = [
      ['sort_order', 'ASC'],
      ['name', 'ASC'],
    ],
    softDelete = true,
    listFilters,
    tenantScoped = false,
    tenantField = 'idTenant',
  } = opts;

  // Account 'operatore' (pro-frontend): accesso cross-tenant per progetto,
  // esente da qualunque forzatura di tenant. Vedi ADR021.
  const isOperatore = (req: Request): boolean => req.user?.role === 'operatore';

  // Un record è visibile/modificabile se non siamo in modalità tenantScoped,
  // se l'utente è 'operatore' (cross-tenant), o se il tenant del record
  // coincide con quello dell'utente autenticato.
  const belongsToUserTenant = (req: Request, record: M): boolean => {
    if (!tenantScoped || isOperatore(req)) return true;
    const recordTenant = (record as unknown as Record<string, unknown>)[tenantField];
    return recordTenant === req.user!.tenantId;
  };

  // -----------------------------------------------------------------------
  // LIST  GET /
  // Query params: ?page=1&limit=20&active=true&search=xxx
  // -----------------------------------------------------------------------
  const list = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, limit, offset } = parsePagination(req.query);
      const where: WhereOptions = {};

      // Filtro isActive (default: solo attivi).
      // 'all' e' un valore esplicito che richiede nessun filtro: distinto
      // dal parametro assente, che resta di default solo-attivi per i
      // chiamanti (es. esterni) che non conoscono il tri-stato.
      if (req.query.active === 'all') {
        // nessun filtro su isActive: mostra tutto
      } else if (req.query.active !== undefined) {
        (where as Record<string, unknown>).isActive = req.query.active !== 'false';
      } else {
        (where as Record<string, unknown>).isActive = true;
      }

      // Ricerca testuale
      if (req.query.search && searchFields.length > 0) {
        const search = String(req.query.search);
        (where as unknown as { [key: symbol]: unknown })[Op.or] = searchFields.map(field => ({
          [field]: { [Op.iLike]: `%${search}%` },
        }));
      }

      // Filtri custom
      if (listFilters) {
        Object.assign(where, listFilters(req.query));
      }

      // Isolamento multi-tenant (ADR021): sovrascrive sempre, per ultimo,
      // qualunque idTenant arrivato dal client — tranne per 'operatore'.
      if (tenantScoped && !isOperatore(req)) {
        (where as Record<string, unknown>)[tenantField] = req.user!.tenantId;
      }

      const { count, rows } = await model.findAndCountAll({
        where,
        limit,
        offset,
        order: defaultOrder,
      });

      successResponse(res, rows, undefined, buildPaginationMeta(count, page, limit));
    } catch (err) {
      logger.error('crud.list', `Errore lista ${resourceName}`, { error: String(err) });
      notFound(res, resourceName);
    }
  };

  // -----------------------------------------------------------------------
  // GET BY ID  GET /:id
  // -----------------------------------------------------------------------
  const getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const record = await model.findByPk(req.params.id);

      if (!record || !belongsToUserTenant(req, record)) {
        notFound(res, resourceName);
        return;
      }

      successResponse(res, record);
    } catch (err) {
      logger.error('crud.getById', `Errore get ${resourceName}`, { id: req.params.id, error: String(err) });
      notFound(res, resourceName);
    }
  };

  // -----------------------------------------------------------------------
  // CREATE  POST /
  // -----------------------------------------------------------------------
  const create = async (req: Request, res: Response): Promise<void> => {
    try {
      if (tenantScoped && !isOperatore(req)) {
        (req.body as Record<string, unknown>)[tenantField] = req.user!.tenantId;
      }

      const record = await model.create(req.body as M['_creationAttributes']);

      const newId = (record as unknown as Record<string, unknown>)[model.primaryKeyAttribute];
      logger.audit(
        'crud.create',
        `Creato ${resourceName} #${newId}`,
        req.user!.id,
        req.user!.uuid ?? req.user!.email,
        { body: req.body }
      );

      createdResponse(res, record, `${resourceName} creato con successo`);
    } catch (err) {
      logger.error('crud.create', `Errore creazione ${resourceName}`, { body: req.body, error: String(err) });
      throw err; // Propagato all'errorHandler globale
    }
  };

  // -----------------------------------------------------------------------
  // UPDATE  PUT /:id
  // -----------------------------------------------------------------------
  const update = async (req: Request, res: Response): Promise<void> => {
    try {
      const record = await model.findByPk(req.params.id);

      if (!record || !belongsToUserTenant(req, record)) {
        notFound(res, resourceName);
        return;
      }

      await record.update(req.body);

      logger.audit(
        'crud.update',
        `Aggiornato ${resourceName} #${req.params.id}`,
        req.user!.id,
        req.user!.uuid ?? req.user!.email,
        { body: req.body }
      );

      successResponse(res, record, `${resourceName} aggiornato con successo`);
    } catch (err) {
      logger.error('crud.update', `Errore aggiornamento ${resourceName}`, { id: req.params.id, error: String(err) });
      throw err;
    }
  };

  // -----------------------------------------------------------------------
  // DELETE  DELETE /:id
  // Soft delete (isActive = false) o hard delete in base a softDelete
  // -----------------------------------------------------------------------
  const remove = async (req: Request, res: Response): Promise<void> => {
    try {
      const record = await model.findByPk(req.params.id);

      if (!record || !belongsToUserTenant(req, record)) {
        notFound(res, resourceName);
        return;
      }

      if (softDelete) {
        // Tenta sempre prima l'eliminazione vera. Se nessuna tabella lo
        // referenzia (vincoli FK ON DELETE RESTRICT — vedi ADR014), il DB la
        // lascia passare. Se è referenziato, Postgres la rifiuta e si ripiega
        // sulla disattivazione: un solo criterio, valido per qualunque
        // relazione presente o futura, senza doverla conoscere qui — è il DB
        // stesso a sapere, in ogni istante, se un record è "in uso".
        try {
          await record.destroy();
          logger.audit(
            'crud.delete',
            `Eliminato ${resourceName} #${req.params.id}`,
            req.user!.id,
            req.user!.uuid ?? req.user!.email
          );
          successResponse(res, null, `${resourceName} eliminato definitivamente`);
          return;
        } catch (err) {
          if ((err as { name?: string }).name !== 'SequelizeForeignKeyConstraintError') {
            throw err;
          }
          // Referenziato altrove: non eliminabile, si disattiva al suo posto.
        }

        await record.update({ isActive: false } as Partial<M['_attributes']>);
        logger.audit(
          'crud.deactivate',
          `Disattivato ${resourceName} #${req.params.id} (referenziato altrove, eliminazione non consentita)`,
          req.user!.id,
          req.user!.uuid ?? req.user!.email
        );
        successResponse(res, null, `${resourceName} disattivato: è referenziato altrove e non può essere eliminato`);
      } else {
        await record.destroy();
        logger.audit(
          'crud.delete',
          `Eliminato ${resourceName} #${req.params.id}`,
          req.user!.id,
          req.user!.uuid ?? req.user!.email
        );
        successResponse(res, null, `${resourceName} eliminato`);
      }
    } catch (err) {
      logger.error('crud.delete', `Errore eliminazione ${resourceName}`, { id: req.params.id, error: String(err) });
      throw err;
    }
  };

  // -----------------------------------------------------------------------
  // TOGGLE ACTIVE  PATCH /:id/toggle
  // Inverte lo stato isActive senza passare per update completo
  // -----------------------------------------------------------------------
  const toggleActive = async (req: Request, res: Response): Promise<void> => {
    try {
      const record = await model.findByPk(req.params.id);

      if (!record || !belongsToUserTenant(req, record)) {
        notFound(res, resourceName);
        return;
      }

      const current = (record as unknown as { isActive: boolean }).isActive;
      await record.update({ isActive: !current } as Partial<M['_attributes']>);

      logger.audit(
        'crud.toggle',
        `Toggle ${resourceName} #${req.params.id} → ${!current}`,
        req.user!.id,
        req.user!.uuid ?? req.user!.email
      );

      successResponse(res, record, `${resourceName} ${!current ? 'attivato' : 'disattivato'}`);
    } catch (err) {
      logger.error('crud.toggle', `Errore toggle ${resourceName}`, { id: req.params.id, error: String(err) });
      throw err;
    }
  };

  return { list, getById, create, update, remove, toggleActive };
}
