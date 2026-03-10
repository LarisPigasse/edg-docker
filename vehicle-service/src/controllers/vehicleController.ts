// =============================================================================
// EDG Vehicle Service - Vehicle Controller
// =============================================================================
import { Request, Response } from 'express';
import { Op, WhereOptions } from 'sequelize';
import { Vehicle, VehicleCategory, TelematicsProvider } from '../models';
import { successResponse, createdResponse, notFound, conflict, buildPaginationMeta, parsePagination } from '../utils/response';
import { logger } from '../services/logger';

// Associazioni da includere di default nelle risposte
const DEFAULT_INCLUDE = [
  { model: VehicleCategory, as: 'category', attributes: ['id', 'name', 'label'] },
  { model: TelematicsProvider, as: 'telematicsProvider', attributes: ['id', 'name'], required: false },
];

// ---------------------------------------------------------------------------
// LIST  GET /api/vehicles/vehicles
// Filtri: status, categoryId, fuelType, hasPlate, search (brand/model/plate/vin/internalCode)
// ---------------------------------------------------------------------------
export const list = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const where: WhereOptions = {};

    // Filtro status (default: solo active)
    if (!req.query.status || req.query.status === 'all') {
      // nessun filtro status
    } else {
      (where as Record<string, unknown>).status = req.query.status;
    }

    // Filtro categoria
    if (req.query.categoryId) {
      (where as Record<string, unknown>).categoryId = Number(req.query.categoryId);
    }

    // Filtro fuelType
    if (req.query.fuelType) {
      (where as Record<string, unknown>).fuelType = req.query.fuelType;
    }

    // Filtro hasPlate
    if (req.query.hasPlate !== undefined) {
      (where as Record<string, unknown>).hasPlate = req.query.hasPlate === 'true';
    }

    // Ricerca testuale su brand/model/plate/vin/internalCode
    if (req.query.search) {
      const search = String(req.query.search);
      (where as Record<string, unknown>)[Op.or as unknown as string] = [
        { brand: { [Op.iLike]: `%${search}%` } },
        { model: { [Op.iLike]: `%${search}%` } },
        { plate: { [Op.iLike]: `%${search}%` } },
        { vin: { [Op.iLike]: `%${search}%` } },
        { internalCode: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Vehicle.findAndCountAll({
      where,
      include: DEFAULT_INCLUDE,
      limit,
      offset,
      order: [
        ['brand', 'ASC'],
        ['model', 'ASC'],
      ],
      distinct: true,
    });

    successResponse(res, rows, undefined, buildPaginationMeta(count, page, limit));
  } catch (err) {
    console.error('[vehicleController.list]', err);
    throw err;
  }
};

// ---------------------------------------------------------------------------
// GET BY ID  GET /api/vehicles/vehicles/:id
// ---------------------------------------------------------------------------
export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id, { include: DEFAULT_INCLUDE });

    if (!vehicle) {
      notFound(res, 'Veicolo');
      return;
    }

    successResponse(res, vehicle);
  } catch (err) {
    console.error('[vehicleController.getById]', err);
    throw err;
  }
};

// ---------------------------------------------------------------------------
// CREATE  POST /api/vehicles/vehicles
// ---------------------------------------------------------------------------
export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    // Verifica unicità plate (se presente)
    if (req.body.plate) {
      const existing = await Vehicle.findOne({ where: { plate: req.body.plate } });
      if (existing) {
        conflict(res, `Targa ${req.body.plate} già registrata`);
        return;
      }
    }

    // Verifica unicità VIN (se presente)
    if (req.body.vin) {
      const existing = await Vehicle.findOne({ where: { vin: req.body.vin } });
      if (existing) {
        conflict(res, `VIN ${req.body.vin} già registrato`);
        return;
      }
    }

    const vehicle = await Vehicle.create(req.body);

    // Ricarica con associazioni
    const full = await Vehicle.findByPk(vehicle.id, { include: DEFAULT_INCLUDE });

    logger.audit(
      'vehicle.create',
      `Creato veicolo #${vehicle.id} ${vehicle.brand} ${vehicle.model}`,
      req.user!.id,
      req.user!.uuid ?? req.user!.email,
      { plate: vehicle.plate }
    );

    createdResponse(res, full, 'Veicolo creato con successo');
  } catch (err) {
    console.error('[vehicleController.create]', err);
    throw err;
  }
};

// ---------------------------------------------------------------------------
// UPDATE  PUT /api/vehicles/vehicles/:id
// ---------------------------------------------------------------------------
export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) {
      notFound(res, 'Veicolo');
      return;
    }

    // Verifica unicità plate se cambia
    if (req.body.plate && req.body.plate !== vehicle.plate) {
      const existing = await Vehicle.findOne({ where: { plate: req.body.plate } });
      if (existing) {
        conflict(res, `Targa ${req.body.plate} già registrata`);
        return;
      }
    }

    // Verifica unicità VIN se cambia
    if (req.body.vin && req.body.vin !== vehicle.vin) {
      const existing = await Vehicle.findOne({ where: { vin: req.body.vin } });
      if (existing) {
        conflict(res, `VIN ${req.body.vin} già registrato`);
        return;
      }
    }

    await vehicle.update(req.body);

    const full = await Vehicle.findByPk(vehicle.id, { include: DEFAULT_INCLUDE });

    logger.audit('vehicle.update', `Aggiornato veicolo #${vehicle.id}`, req.user!.id, req.user!.uuid ?? req.user!.email, {
      changes: Object.keys(req.body),
    });

    successResponse(res, full, 'Veicolo aggiornato con successo');
  } catch (err) {
    console.error('[vehicleController.update]', err);
    throw err;
  }
};

// ---------------------------------------------------------------------------
// UPDATE STATUS  PATCH /api/vehicles/vehicles/:id/status
// Endpoint dedicato per cambio stato — separato dall'update generico
// ---------------------------------------------------------------------------
export const updateStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) {
      notFound(res, 'Veicolo');
      return;
    }

    const prevStatus = vehicle.status;
    await vehicle.update({ status: req.body.status });

    logger.audit(
      'vehicle.status',
      `Stato veicolo #${vehicle.id}: ${prevStatus} → ${req.body.status}`,
      req.user!.id,
      req.user!.uuid ?? req.user!.email,
      { notes: req.body.notes }
    );

    successResponse(res, { id: vehicle.id, status: vehicle.status }, `Stato aggiornato: ${req.body.status}`);
  } catch (err) {
    console.error('[vehicleController.updateStatus]', err);
    throw err;
  }
};

// ---------------------------------------------------------------------------
// DELETE (soft)  DELETE /api/vehicles/vehicles/:id
// Non cancella fisicamente — imposta status = decommissioned
// ---------------------------------------------------------------------------
export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) {
      notFound(res, 'Veicolo');
      return;
    }

    await vehicle.update({ status: 'decommissioned', decommissionDate: new Date() });

    logger.audit(
      'vehicle.decommission',
      `Dismesso veicolo #${vehicle.id} ${vehicle.brand} ${vehicle.model}`,
      req.user!.id,
      req.user!.uuid ?? req.user!.email
    );

    successResponse(res, null, 'Veicolo dismesso');
  } catch (err) {
    console.error('[vehicleController.remove]', err);
    throw err;
  }
};
