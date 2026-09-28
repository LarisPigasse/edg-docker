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
  } = opts;

  const auditActor = (req: Request): string => {
    const account = (req as unknown as { account?: { email?: string; accountId?: number } }).account;
    return account?.email ?? `account#${account?.accountId ?? '?'}`;
  };

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
      console.error(`❌ [CRUD] Errore lista ${resourceName}:`, err);
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
      console.error(`❌ [CRUD] Errore get ${resourceName} #${req.params.id}:`, err);
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
      console.log(`✅ [CRUD] ${resourceName} #${newId} creato da ${auditActor(req)}`);
      createdResponse(res, record, `${resourceName} creato con successo`);
    } catch (err) {
      console.error(`❌ [CRUD] Errore creazione ${resourceName}:`, err);
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
        conflict(res, `${resourceName} di sistema: non può essere disattivato`);
        return;
      }
      await record.update(req.body);
      console.log(`✅ [CRUD] ${resourceName} #${req.params.id} aggiornato da ${auditActor(req)}`);
      successResponse(res, record, `${resourceName} aggiornato con successo`);
    } catch (err) {
      console.error(`❌ [CRUD] Errore aggiornamento ${resourceName} #${req.params.id}:`, err);
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
        conflict(res, `${resourceName} di sistema: non può essere eliminato`);
        return;
      }

      if (softDelete) {
        try {
          await record.destroy();
          console.log(`✅ [CRUD] ${resourceName} #${req.params.id} eliminato da ${auditActor(req)}`);
          successResponse(res, null, `${resourceName} eliminato definitivamente`);
          return;
        } catch (err) {
          if ((err as { name?: string }).name !== 'SequelizeForeignKeyConstraintError') {
            throw err;
          }
          // Referenziato altrove: non eliminabile, si disattiva al suo posto.
        }

        await record.update({ isActive: false } as Partial<M['_attributes']>);
        console.log(`⚠️  [CRUD] ${resourceName} #${req.params.id} disattivato (referenziato altrove) da ${auditActor(req)}`);
        successResponse(res, null, `${resourceName} disattivato: è referenziato altrove e non può essere eliminato`);
      } else {
        await record.destroy();
        console.log(`✅ [CRUD] ${resourceName} #${req.params.id} eliminato da ${auditActor(req)}`);
        successResponse(res, null, `${resourceName} eliminato`);
      }
    } catch (err) {
      console.error(`❌ [CRUD] Errore eliminazione ${resourceName} #${req.params.id}:`, err);
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
        conflict(res, `${resourceName} di sistema: non può essere disattivato`);
        return;
      }
      await record.update({ isActive: !current } as Partial<M['_attributes']>);
      console.log(`✅ [CRUD] ${resourceName} #${req.params.id} → ${!current ? 'attivato' : 'disattivato'} da ${auditActor(req)}`);
      successResponse(res, record, `${resourceName} ${!current ? 'attivato' : 'disattivato'}`);
    } catch (err) {
      console.error(`❌ [CRUD] Errore toggle ${resourceName} #${req.params.id}:`, err);
      throw err;
    }
  };

  return { list, getById, create, update, remove, toggleActive };
}
