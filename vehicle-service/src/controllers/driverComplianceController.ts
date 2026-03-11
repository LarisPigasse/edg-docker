// =============================================================================
// EDG Vehicle Service - DriverCompliance Controller
// =============================================================================
import { Request, Response } from 'express';
import { WhereOptions } from 'sequelize';
import { DriverCompliance, Driver, DriverComplianceType } from '../models';
import { sequelize } from '../config/database';
import { successResponse, createdResponse, notFound, conflict, buildPaginationMeta, parsePagination } from '../utils/response';
import { logger } from '../services/logger';

const INCLUDE = [
  { model: Driver, as: 'driver', attributes: ['id', 'firstName', 'lastName'] },
  {
    model: DriverComplianceType,
    as: 'complianceType',
    attributes: ['id', 'name', 'label', 'alertDays1', 'alertDays2', 'alertDays3', 'hasExpiry'],
  },
];

function computeStatus(expiresAt: Date | null, alertDays2: number): 'valid' | 'expiring' | 'expired' {
  if (!expiresAt) return 'valid';
  const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return 'expired';
  if (daysLeft <= alertDays2) return 'expiring';
  return 'valid';
}

export const list = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const where: WhereOptions = {};

    if (req.query.driverId) (where as Record<string, unknown>).driverId = Number(req.query.driverId);
    if (req.query.status && req.query.status !== 'all') (where as Record<string, unknown>).status = req.query.status;

    const { count, rows } = await DriverCompliance.findAndCountAll({
      where,
      include: INCLUDE,
      limit,
      offset,
      order: [[sequelize.literal('"DriverCompliance"."expires_at"'), 'ASC']],
    });

    successResponse(res, rows, undefined, buildPaginationMeta(count, page, limit));
  } catch (err) {
    console.error('[driverComplianceController.list]', err);
    throw err;
  }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const record = await DriverCompliance.findByPk(req.params.id, { include: INCLUDE });
    if (!record) {
      notFound(res, 'Conformità');
      return;
    }
    successResponse(res, record);
  } catch (err) {
    console.error('[driverComplianceController.getById]', err);
    throw err;
  }
};

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await DriverCompliance.findOne({
      where: { driverId: req.body.driverId, typeId: req.body.typeId },
    });
    if (existing) {
      conflict(res, 'Conformità già presente per questo autista e tipo — usa aggiorna o rinnova');
      return;
    }

    const complianceType = await DriverComplianceType.findByPk(req.body.typeId);
    if (!complianceType) {
      notFound(res, 'Tipo conformità');
      return;
    }

    const status = computeStatus(req.body.expiresAt ? new Date(req.body.expiresAt) : null, complianceType.alertDays2);

    const record = await DriverCompliance.create({ ...req.body, status });
    const full = await DriverCompliance.findByPk(record.id, { include: INCLUDE });

    logger.audit(
      'driverCompliance.create',
      `Conformità #${record.id} — driver #${req.body.driverId}`,
      req.user!.id,
      req.user!.uuid ?? req.user!.email
    );

    createdResponse(res, full, 'Conformità creata');
  } catch (err) {
    console.error('[driverComplianceController.create]', err);
    throw err;
  }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const record = await DriverCompliance.findByPk(req.params.id, { include: INCLUDE });
    if (!record) {
      notFound(res, 'Conformità');
      return;
    }

    await record.update(req.body);
    successResponse(res, record, 'Conformità aggiornata');
  } catch (err) {
    console.error('[driverComplianceController.update]', err);
    throw err;
  }
};

export const renew = async (req: Request, res: Response): Promise<void> => {
  try {
    const record = await DriverCompliance.findByPk(req.params.id, { include: INCLUDE });
    if (!record) {
      notFound(res, 'Conformità');
      return;
    }

    const complianceType = await DriverComplianceType.findByPk(record.typeId);
    const status = computeStatus(req.body.expiresAt ? new Date(req.body.expiresAt) : null, complianceType?.alertDays2 ?? 30);

    await record.update({ ...req.body, status });

    logger.audit(
      'driverCompliance.renew',
      `Rinnovata conformità #${record.id} → ${req.body.expiresAt}`,
      req.user!.id,
      req.user!.uuid ?? req.user!.email
    );

    successResponse(res, record, 'Conformità rinnovata');
  } catch (err) {
    console.error('[driverComplianceController.renew]', err);
    throw err;
  }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const record = await DriverCompliance.findByPk(req.params.id);
    if (!record) {
      notFound(res, 'Conformità');
      return;
    }
    await record.destroy();
    logger.audit(
      'driverCompliance.delete',
      `Eliminata conformità #${req.params.id}`,
      req.user!.id,
      req.user!.uuid ?? req.user!.email
    );
    successResponse(res, null, 'Conformità eliminata');
  } catch (err) {
    console.error('[driverComplianceController.remove]', err);
    throw err;
  }
};
