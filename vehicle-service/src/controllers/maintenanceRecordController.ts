// =============================================================================
// EDG Vehicle Service - MaintenanceRecord Controller
// Al create aggiorna automaticamente il MaintenanceSchedule associato
// =============================================================================
import { Request, Response } from 'express';
import { WhereOptions } from 'sequelize';
import { sequelize } from '../config/database';
import { MaintenanceRecord, MaintenanceSchedule, MaintenanceType, Vehicle, Workshop } from '../models';
import { successResponse, createdResponse, notFound, buildPaginationMeta, parsePagination } from '../utils/response';
import { logger } from '../services/logger';

const INCLUDE = [
  { model: Vehicle, as: 'vehicle', attributes: ['id', 'brand', 'model', 'plate'] },
  { model: MaintenanceType, as: 'maintenanceType', attributes: ['id', 'name', 'label'] },
  { model: Workshop, as: 'workshop', attributes: ['id', 'name', 'city'], required: false },
];

export const list = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const where: WhereOptions = {};

    if (req.query.vehicleId) (where as Record<string, unknown>).vehicleId = Number(req.query.vehicleId);
    if (req.query.maintenanceTypeId) (where as Record<string, unknown>).maintenanceTypeId = Number(req.query.maintenanceTypeId);
    if (req.query.workshopId) (where as Record<string, unknown>).workshopId = Number(req.query.workshopId);

    const { count, rows } = await MaintenanceRecord.findAndCountAll({
      where,
      include: INCLUDE,
      limit,
      offset,
      order: [[sequelize.literal('"MaintenanceRecord"."performed_at"'), 'DESC']],
    });

    successResponse(res, rows, undefined, buildPaginationMeta(count, page, limit));
  } catch (err) {
    console.error('[maintenanceRecordController.list]', err);
    throw err;
  }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const record = await MaintenanceRecord.findByPk(req.params.id, { include: INCLUDE });
    if (!record) {
      notFound(res, 'Intervento di manutenzione');
      return;
    }
    successResponse(res, record);
  } catch (err) {
    console.error('[maintenanceRecordController.getById]', err);
    throw err;
  }
};

export const create = async (req: Request, res: Response): Promise<void> => {
  const transaction = await sequelize.transaction();
  try {
    // 1. Crea il record di manutenzione
    const record = await MaintenanceRecord.create({ ...req.body, createdBy: req.user!.id }, { transaction });

    // 2. Aggiorna (o crea) il MaintenanceSchedule
    const [schedule] = await MaintenanceSchedule.findOrCreate({
      where: { vehicleId: req.body.vehicleId, maintenanceTypeId: req.body.maintenanceTypeId },
      defaults: {
        vehicleId: req.body.vehicleId,
        maintenanceTypeId: req.body.maintenanceTypeId,
        lastKm: req.body.kmAtService ?? null,
        lastDate: req.body.performedAt,
        nextKm: req.body.nextKm ?? null,
        nextDate: req.body.nextDate ?? null,
        status: 'ok',
      },
      transaction,
    });

    // Se lo schedule esisteva già, aggiorna i campi
    if (!schedule.isNewRecord) {
      await schedule.update(
        {
          lastKm: req.body.kmAtService ?? schedule.lastKm,
          lastDate: req.body.performedAt,
          nextKm: req.body.nextKm ?? null,
          nextDate: req.body.nextDate ?? null,
          status: 'ok',
        },
        { transaction }
      );
    }

    // 3. Aggiorna scheduleId nel record
    await record.update({ scheduleId: schedule.id }, { transaction });

    await transaction.commit();

    const full = await MaintenanceRecord.findByPk(record.id, { include: INCLUDE });

    logger.audit(
      'maintenanceRecord.create',
      `Intervento #${record.id} — veicolo #${req.body.vehicleId}`,
      req.user!.id,
      req.user!.uuid ?? req.user!.email,
      { type: req.body.maintenanceTypeId, km: req.body.kmAtService }
    );

    createdResponse(res, full, 'Intervento registrato');
  } catch (err) {
    await transaction.rollback();
    console.error('[maintenanceRecordController.create]', err);
    throw err;
  }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const record = await MaintenanceRecord.findByPk(req.params.id);
    if (!record) {
      notFound(res, 'Intervento di manutenzione');
      return;
    }

    await record.update(req.body);
    const full = await MaintenanceRecord.findByPk(record.id, { include: INCLUDE });

    logger.audit(
      'maintenanceRecord.update',
      `Aggiornato intervento #${record.id}`,
      req.user!.id,
      req.user!.uuid ?? req.user!.email
    );

    successResponse(res, full, 'Intervento aggiornato');
  } catch (err) {
    console.error('[maintenanceRecordController.update]', err);
    throw err;
  }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const record = await MaintenanceRecord.findByPk(req.params.id);
    if (!record) {
      notFound(res, 'Intervento di manutenzione');
      return;
    }
    await record.destroy();
    logger.audit(
      'maintenanceRecord.delete',
      `Eliminato intervento #${req.params.id}`,
      req.user!.id,
      req.user!.uuid ?? req.user!.email
    );
    successResponse(res, null, 'Intervento eliminato');
  } catch (err) {
    console.error('[maintenanceRecordController.remove]', err);
    throw err;
  }
};
