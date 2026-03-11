// =============================================================================
// EDG Vehicle Service - VehicleAssignment Controller
// Al create chiude automaticamente l'assignment aperto precedente
// (un veicolo può avere un solo driver attivo alla volta)
// =============================================================================
import { Request, Response } from 'express';
import { Op, WhereOptions } from 'sequelize';
import { VehicleAssignment, Vehicle, Driver } from '../models';
import { sequelize } from '../config/database';
import { successResponse, createdResponse, notFound, conflict, buildPaginationMeta, parsePagination } from '../utils/response';
import { logger } from '../services/logger';

const INCLUDE = [
  { model: Vehicle, as: 'vehicle', attributes: ['id', 'brand', 'model', 'plate'] },
  { model: Driver, as: 'driver', attributes: ['id', 'firstName', 'lastName', 'phone'] },
];

export const list = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const where: WhereOptions = {};

    if (req.query.vehicleId) (where as Record<string, unknown>).vehicleId = Number(req.query.vehicleId);
    if (req.query.driverId) (where as Record<string, unknown>).driverId = Number(req.query.driverId);

    // active=true → solo assignment aperti (endedAt IS NULL)
    if (req.query.active === 'true') {
      (where as Record<string, unknown>).endedAt = null;
    } else if (req.query.active === 'false') {
      (where as Record<string, unknown>).endedAt = { [Op.not]: null };
    }

    const { count, rows } = await VehicleAssignment.findAndCountAll({
      where,
      include: INCLUDE,
      limit,
      offset,
      order: [[sequelize.literal('"VehicleAssignment"."started_at"'), 'DESC']],
    });

    successResponse(res, rows, undefined, buildPaginationMeta(count, page, limit));
  } catch (err) {
    console.error('[vehicleAssignmentController.list]', err);
    throw err;
  }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const record = await VehicleAssignment.findByPk(req.params.id, { include: INCLUDE });
    if (!record) {
      notFound(res, 'Assegnazione');
      return;
    }
    successResponse(res, record);
  } catch (err) {
    console.error('[vehicleAssignmentController.getById]', err);
    throw err;
  }
};

// Ritorna l'assegnazione attiva corrente per un veicolo
export const getCurrent = async (req: Request, res: Response): Promise<void> => {
  try {
    const vehicleId = Number(req.params.vehicleId);
    const record = await VehicleAssignment.findOne({
      where: { vehicleId, endedAt: null },
      include: INCLUDE,
    });
    // 200 con null se non assegnato (non è un errore)
    successResponse(res, record);
  } catch (err) {
    console.error('[vehicleAssignmentController.getCurrent]', err);
    throw err;
  }
};

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    // Controlla se il veicolo è già assegnato ad un altro driver
    const activeForVehicle = await VehicleAssignment.findOne({
      where: { vehicleId: req.body.vehicleId, endedAt: null },
    });
    if (activeForVehicle && activeForVehicle.driverId !== req.body.driverId) {
      conflict(res, "Il veicolo è già assegnato ad un altro autista — chiudi prima l'assegnazione corrente");
      return;
    }

    // Chiudi eventuale assignment aperto dello stesso driver su altro veicolo
    const activeForDriver = await VehicleAssignment.findOne({
      where: { driverId: req.body.driverId, endedAt: null },
    });
    if (activeForDriver) {
      await activeForDriver.update({ endedAt: new Date(req.body.startedAt) });
      logger.info('vehicleAssignment.autoClose', `Auto-chiuso assignment #${activeForDriver.id} per nuovo veicolo`, {
        driverId: req.body.driverId,
      });
    }

    const record = await VehicleAssignment.create(req.body);
    const full = await VehicleAssignment.findByPk(record.id, { include: INCLUDE });

    logger.audit(
      'vehicleAssignment.create',
      `Assegnato veicolo #${req.body.vehicleId} a driver #${req.body.driverId}`,
      req.user!.id,
      req.user!.uuid ?? req.user!.email
    );

    createdResponse(res, full, 'Assegnazione creata');
  } catch (err) {
    console.error('[vehicleAssignmentController.create]', err);
    throw err;
  }
};

// Chiudi assegnazione — PATCH /:id/end
export const end = async (req: Request, res: Response): Promise<void> => {
  try {
    const record = await VehicleAssignment.findByPk(req.params.id);
    if (!record) {
      notFound(res, 'Assegnazione');
      return;
    }

    if (record.endedAt) {
      conflict(res, 'Assegnazione già terminata');
      return;
    }

    await record.update({ endedAt: req.body.endedAt ?? new Date(), notes: req.body.notes ?? record.notes });

    logger.audit('vehicleAssignment.end', `Chiusa assegnazione #${record.id}`, req.user!.id, req.user!.uuid ?? req.user!.email);

    const full = await VehicleAssignment.findByPk(record.id, { include: INCLUDE });
    successResponse(res, full, 'Assegnazione terminata');
  } catch (err) {
    console.error('[vehicleAssignmentController.end]', err);
    throw err;
  }
};
