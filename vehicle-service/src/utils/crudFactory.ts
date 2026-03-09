// =============================================================================
// EDG Vehicle Service - CRUD Factory
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
  softDelete?: boolean; // Se true → imposta isActive=false invece di DELETE
  listFilters?: (query: Request['query']) => WhereOptions; // Filtri aggiuntivi per la lista
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
  } = opts;

  // -----------------------------------------------------------------------
  // LIST  GET /
  // Query params: ?page=1&limit=20&active=true&search=xxx
  // -----------------------------------------------------------------------
  const list = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, limit, offset } = parsePagination(req.query);
      const where: WhereOptions = {};

      // Filtro isActive (default: solo attivi)
      if (req.query.active !== undefined) {
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

      if (!record) {
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
      const record = await model.create(req.body as M['_creationAttributes']);

      logger.audit(
        'crud.create',
        `Creato ${resourceName} #${(record as unknown as { id: number }).id}`,
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

      if (!record) {
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

      if (!record) {
        notFound(res, resourceName);
        return;
      }

      if (softDelete) {
        await record.update({ isActive: false } as Partial<M['_attributes']>);
        logger.audit(
          'crud.deactivate',
          `Disattivato ${resourceName} #${req.params.id}`,
          req.user!.id,
          req.user!.uuid ?? req.user!.email
        );
        successResponse(res, null, `${resourceName} disattivato`);
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

      if (!record) {
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
