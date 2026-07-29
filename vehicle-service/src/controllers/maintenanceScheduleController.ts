// =============================================================================
// EDG Vehicle Service - MaintenanceSchedule Controller
// Gli schedule vengono creati/aggiornati automaticamente dai maintenanceRecord.
// Questo controller espone solo lettura e override manuale.
// =============================================================================
import { Request, Response } from 'express';
import { WhereOptions } from 'sequelize';
import { MaintenanceSchedule, MaintenanceType, Vehicle } from '../models';
import { sequelize } from '../config/database';
import { successResponse, createdResponse, notFound, conflict, buildPaginationMeta, parsePagination } from '../utils/response';
import { logger } from '../services/logger';

const INCLUDE = [
  { model: Vehicle, as: 'vehicle', attributes: ['id', 'brand', 'model', 'plate'] },
  {
    model: MaintenanceType,
    as: 'maintenanceType',
    attributes: [
      'id',
      'name',
      'label',
      'kmThreshold',
      'daysThreshold',
      'alertKmBefore',
      'alertDays1',
      'alertDays2',
      'alertDays3',
    ],
  },
];

export const list = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const where: WhereOptions = {};

    if (req.query.vehicleId) (where as Record<string, unknown>).vehicleId = Number(req.query.vehicleId);
    if (req.query.status && req.query.status !== 'all') (where as Record<string, unknown>).status = req.query.status;

    const { count, rows } = await MaintenanceSchedule.findAndCountAll({
      where,
      include: INCLUDE,
      limit,
      offset,
      order: [
        [sequelize.literal('"MaintenanceSchedule"."status"'), 'ASC'],
        [sequelize.literal('"MaintenanceSchedule"."next_date"'), 'ASC'],
      ],
    });

    successResponse(res, rows, undefined, buildPaginationMeta(count, page, limit));
  } catch (err) {
    console.error('[maintenanceScheduleController.list]', err);
    throw err;
  }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const record = await MaintenanceSchedule.findByPk(req.params.id, { include: INCLUDE });
    if (!record) {
      notFound(res, 'Programma manutenzione');
      return;
    }
    successResponse(res, record);
  } catch (err) {
    console.error('[maintenanceScheduleController.getById]', err);
    throw err;
  }
};

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await MaintenanceSchedule.findOne({
      where: { vehicleId: req.body.vehicleId, maintenanceTypeId: req.body.maintenanceTypeId },
    });
    if (existing) {
      conflict(res, 'Programmazione già presente per questo veicolo e tipo');
      return;
    }

    const record = await MaintenanceSchedule.create({
      vehicleId: req.body.vehicleId,
      maintenanceTypeId: req.body.maintenanceTypeId,
      nextKm: req.body.nextKm,
      nextDate: req.body.nextDate,
      notes: req.body.notes,
      status: 'ok',
    });

    logger.audit(
      'maintenanceSchedule.create',
      `Programmazione #${record.id} creata — veicolo #${req.body.vehicleId}`,
      req.user!.id,
      req.user!.uuid ?? req.user!.email
    );

    const full = await MaintenanceSchedule.findByPk(record.id, { include: INCLUDE });
    createdResponse(res, full, 'Programmazione creata');
  } catch (err) {
    console.error('[maintenanceScheduleController.create]', err);
    throw err;
  }
};
// Override manuale dello status o delle date previste
export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const record = await MaintenanceSchedule.findByPk(req.params.id);
    if (!record) {
      notFound(res, 'Programma manutenzione');
      return;
    }

    await record.update(req.body);

    logger.audit(
      'maintenanceSchedule.update',
      `Aggiornato schedule #${record.id}`,
      req.user!.id,
      req.user!.uuid ?? req.user!.email,
      { changes: Object.keys(req.body) }
    );

    const full = await MaintenanceSchedule.findByPk(record.id, { include: INCLUDE });
    successResponse(res, full, 'Programma aggiornato');
  } catch (err) {
    console.error('[maintenanceScheduleController.update]', err);
    throw err;
  }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const record = await MaintenanceSchedule.findByPk(req.params.id);
    if (!record) {
      notFound(res, 'Programma manutenzione');
      return;
    }
    await record.destroy();
    logger.audit(
      'maintenanceSchedule.delete',
      `Eliminata programmazione #${req.params.id}`,
      req.user!.id,
      req.user!.uuid ?? req.user!.email
    );
    successResponse(res, null, 'Programmazione eliminata');
  } catch (err) {
    console.error('[maintenanceScheduleController.remove]', err);
    throw err;
  }
};
