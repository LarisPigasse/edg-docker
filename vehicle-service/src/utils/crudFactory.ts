// =============================================================================
// EDG Vehicle Service - CRUD Factory
// Genera handler CRUD standard per le lookup tables
// Riduce la ripetizione mantenendo la consistenza tra entità
// =============================================================================
import { Request, Response } from 'express';
import { Model, ModelStatic, WhereOptions, Order, Op } from 'sequelize';
import { successResponse, createdResponse, notFound, buildPaginationMeta, parsePagination } from './response';
import { NotFoundError } from './errors';
import { logger, snapshot } from '../services/logger';

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
      // Un errore qui (query fallita, tabella mancante, DB irraggiungibile...)
      // non e' mai un "non trovato" - zero risultati validi sono gia' gestiti
      // sopra da findAndCountAll con una risposta 200 e lista vuota. Si
      // propaga all'errorHandler globale, che distingue il tipo di errore
      // reale (validazione, vincolo, DB, ...) invece di mascherarlo da 404.
      logger.error('crud.list', `Errore lista ${resourceName}`, { error: String(err) }, 'DATA', req.user);
      throw err;
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
      // Stesso criterio di list(): il "non trovato" legittimo e' gia'
      // gestito sopra (record assente o fuori tenant). Qui arrivano solo
      // errori inattesi, che l'errorHandler globale sa classificare meglio
      // di un generico 404.
      logger.error('crud.getById', `Errore get ${resourceName}`, { id: req.params.id, error: String(err) }, 'DATA', req.user);
      throw err;
    }
  };

  // -----------------------------------------------------------------------
  // CREATE  POST /
  // -----------------------------------------------------------------------
  const create = async (req: Request, res: Response): Promise<void> => {
    try {
      const record = await model.create(req.body as M['_creationAttributes']);

      const newId = (record as unknown as { id: number }).id;
      logger.auditChange('crud.create', `Creato ${resourceName} #${newId}`, req.user!, {
        precedente: null,
        nuovo: snapshot(record),
      }, { id: newId });

      createdResponse(res, record, `${resourceName} creato con successo`);
    } catch (err) {
      logger.error('crud.create', `Errore creazione ${resourceName}`, { body: req.body, error: String(err) }, 'DATA', req.user);
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

      const precedente = snapshot(record);
      await record.update(req.body);

      logger.auditChange('crud.update', `Aggiornato ${resourceName} #${req.params.id}`, req.user!, {
        precedente,
        nuovo: snapshot(record),
      }, { id: req.params.id });

      successResponse(res, record, `${resourceName} aggiornato con successo`);
    } catch (err) {
      logger.error('crud.update', `Errore aggiornamento ${resourceName}`, { id: req.params.id, error: String(err) }, 'DATA', req.user);
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

      const precedente = snapshot(record);
      if (softDelete) {
        await record.update({ isActive: false } as Partial<M['_attributes']>);
        logger.auditChange('crud.deactivate', `Disattivato ${resourceName} #${req.params.id}`, req.user!, {
          precedente,
          nuovo: snapshot(record),
        }, { id: req.params.id });
        successResponse(res, null, `${resourceName} disattivato`);
      } else {
        await record.destroy();
        logger.auditChange('crud.delete', `Eliminato ${resourceName} #${req.params.id}`, req.user!, {
          precedente,
          nuovo: null,
        }, { id: req.params.id });
        successResponse(res, null, `${resourceName} eliminato`);
      }
    } catch (err) {
      logger.error('crud.delete', `Errore eliminazione ${resourceName}`, { id: req.params.id, error: String(err) }, 'DATA', req.user);
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
      const precedente = snapshot(record);
      await record.update({ isActive: !current } as Partial<M['_attributes']>);

      logger.auditChange(
        'crud.toggle',
        `${resourceName} #${req.params.id} ${!current ? 'attivato' : 'disattivato'}`,
        req.user!,
        { precedente, nuovo: snapshot(record) },
        { id: req.params.id, isActive: !current }
      );

      successResponse(res, record, `${resourceName} ${!current ? 'attivato' : 'disattivato'}`);
    } catch (err) {
      logger.error('crud.toggle', `Errore toggle ${resourceName}`, { id: req.params.id, error: String(err) }, 'DATA', req.user);
      throw err;
    }
  };

  return { list, getById, create, update, remove, toggleActive };
}
