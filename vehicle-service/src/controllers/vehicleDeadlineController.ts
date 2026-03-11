// =============================================================================
// EDG Vehicle Service - VehicleDeadline Controller
// =============================================================================
import { Request, Response } from 'express';
import { WhereOptions } from 'sequelize';
import { VehicleDeadline, Vehicle, DeadlineType } from '../models';
import { sequelize } from '../config/database';
import { successResponse, createdResponse, notFound, conflict, buildPaginationMeta, parsePagination } from '../utils/response';
import { logger } from '../services/logger';

const INCLUDE = [
  { model: Vehicle, as: 'vehicle', attributes: ['id', 'brand', 'model', 'plate'] },
  { model: DeadlineType, as: 'deadlineType', attributes: ['id', 'name', 'label', 'alertDays1', 'alertDays2', 'alertDays3'] },
];

// Helper: calcola status automatico in base alla data
function computeStatus(expiryDate: Date, alertDays1: number, alertDays2: number): 'valid' | 'expiring' | 'expired' {
  const today = new Date();
  const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return 'expired';
  if (daysLeft <= alertDays2) return 'expiring';
  return 'valid';
}

export const list = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const where: WhereOptions = {};

    if (req.query.vehicleId) (where as Record<string, unknown>).vehicleId = Number(req.query.vehicleId);
    if (req.query.status && req.query.status !== 'all') (where as Record<string, unknown>).status = req.query.status;

    const { count, rows } = await VehicleDeadline.findAndCountAll({
      where,
      include: INCLUDE,
      limit,
      offset,
      order: [[sequelize.literal('"VehicleDeadline"."expiry_date"'), 'ASC']],
    });

    successResponse(res, rows, undefined, buildPaginationMeta(count, page, limit));
  } catch (err) {
    console.error('[vehicleDeadlineController.list]', err);
    throw err;
  }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const record = await VehicleDeadline.findByPk(req.params.id, { include: INCLUDE });
    if (!record) {
      notFound(res, 'Scadenza');
      return;
    }
    successResponse(res, record);
  } catch (err) {
    console.error('[vehicleDeadlineController.getById]', err);
    throw err;
  }
};

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    // Un solo record per vehicle + deadlineType (UNIQUE constraint)
    const existing = await VehicleDeadline.findOne({
      where: { vehicleId: req.body.vehicleId, deadlineTypeId: req.body.deadlineTypeId },
    });
    if (existing) {
      conflict(res, 'Scadenza già presente per questo veicolo e tipo');
      return;
    }

    const deadlineType = await DeadlineType.findByPk(req.body.deadlineTypeId);
    if (!deadlineType) {
      notFound(res, 'Tipo scadenza');
      return;
    }

    const status = computeStatus(new Date(req.body.expiryDate), deadlineType.alertDays1, deadlineType.alertDays2);
    const record = await VehicleDeadline.create({ ...req.body, status });

    logger.audit(
      'vehicleDeadline.create',
      `Scadenza #${record.id} creata — veicolo #${req.body.vehicleId}`,
      req.user!.id,
      req.user!.uuid ?? req.user!.email
    );

    const full = await VehicleDeadline.findByPk(record.id, { include: INCLUDE });
    createdResponse(res, full, 'Scadenza creata');
  } catch (err) {
    console.error('[vehicleDeadlineController.create]', err);
    throw err;
  }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const record = await VehicleDeadline.findByPk(req.params.id, { include: INCLUDE });
    if (!record) {
      notFound(res, 'Scadenza');
      return;
    }

    await record.update(req.body);
    successResponse(res, record, 'Scadenza aggiornata');
  } catch (err) {
    console.error('[vehicleDeadlineController.update]', err);
    throw err;
  }
};

export const renew = async (req: Request, res: Response): Promise<void> => {
  try {
    const record = await VehicleDeadline.findByPk(req.params.id, { include: INCLUDE });
    if (!record) {
      notFound(res, 'Scadenza');
      return;
    }

    const deadlineType = await DeadlineType.findByPk(record.deadlineTypeId);
    const status = deadlineType
      ? computeStatus(new Date(req.body.expiryDate), deadlineType.alertDays1, deadlineType.alertDays2)
      : 'valid';

    await record.update({ ...req.body, status });

    logger.audit(
      'vehicleDeadline.renew',
      `Rinnovata scadenza #${record.id} → ${req.body.expiryDate}`,
      req.user!.id,
      req.user!.uuid ?? req.user!.email
    );

    successResponse(res, record, 'Scadenza rinnovata');
  } catch (err) {
    console.error('[vehicleDeadlineController.renew]', err);
    throw err;
  }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const record = await VehicleDeadline.findByPk(req.params.id);
    if (!record) {
      notFound(res, 'Scadenza');
      return;
    }
    await record.destroy();
    logger.audit(
      'vehicleDeadline.delete',
      `Eliminata scadenza #${req.params.id}`,
      req.user!.id,
      req.user!.uuid ?? req.user!.email
    );
    successResponse(res, null, 'Scadenza eliminata');
  } catch (err) {
    console.error('[vehicleDeadlineController.remove]', err);
    throw err;
  }
};
