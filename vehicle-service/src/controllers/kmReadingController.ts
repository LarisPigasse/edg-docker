// =============================================================================
// EDG Vehicle Service - KmReading Controller
// =============================================================================
import { Request, Response } from 'express';
import { Op, WhereOptions } from 'sequelize';
import { KmReading, Vehicle } from '../models';
import {
  successResponse,
  createdResponse,
  notFound,
  badRequest,
  buildPaginationMeta,
  parsePagination,
} from '../utils/response';
import { logger } from '../services/logger';

const INCLUDE = [{ model: Vehicle, as: 'vehicle', attributes: ['id', 'brand', 'model', 'plate'] }];

export const list = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const where: WhereOptions = {};

    if (req.query.vehicleId) (where as Record<string, unknown>).vehicleId = Number(req.query.vehicleId);
    if (req.query.source) (where as Record<string, unknown>).source = req.query.source;
    if (req.query.dateFrom || req.query.dateTo) {
      (where as Record<string, unknown>).readingDate = {
        ...(req.query.dateFrom ? { [Op.gte]: new Date(String(req.query.dateFrom)) } : {}),
        ...(req.query.dateTo ? { [Op.lte]: new Date(String(req.query.dateTo)) } : {}),
      };
    }

    const { count, rows } = await KmReading.findAndCountAll({
      where,
      include: INCLUDE,
      limit,
      offset,
      order: [['reading_date', 'DESC']],
    });

    successResponse(res, rows, undefined, buildPaginationMeta(count, page, limit));
  } catch (err) {
    console.error('[kmReadingController.list]', err);
    throw err;
  }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const record = await KmReading.findByPk(req.params.id, { include: INCLUDE });
    if (!record) {
      notFound(res, 'Lettura km');
      return;
    }
    successResponse(res, record);
  } catch (err) {
    console.error('[kmReadingController.getById]', err);
    throw err;
  }
};

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const vehicle = await Vehicle.findByPk(req.body.vehicleId);
    if (!vehicle) {
      notFound(res, 'Veicolo');
      return;
    }

    // Lettura non può essere inferiore all'ultima registrata
    const last = await KmReading.findOne({
      where: { vehicleId: req.body.vehicleId },
      order: [['reading_date', 'DESC']],
    });
    if (last && req.body.readingValue < last.readingValue) {
      badRequest(res, `Lettura ${req.body.readingValue} km inferiore all'ultima registrata (${last.readingValue} km)`);
      return;
    }

    const reading = await KmReading.create(req.body);

    // Aggiorna currentKm sul veicolo se la lettura è più recente
    if (req.body.readingValue > vehicle.currentKm) {
      await vehicle.update({ currentKm: req.body.readingValue });
    }

    logger.audit(
      'kmReading.create',
      `Lettura km #${reading.id} — veicolo #${req.body.vehicleId}: ${req.body.readingValue} km`,
      req.user!.id,
      req.user!.uuid ?? req.user!.email
    );

    createdResponse(res, reading, 'Lettura km registrata');
  } catch (err) {
    console.error('[kmReadingController.create]', err);
    throw err;
  }
};
