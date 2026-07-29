// =============================================================================
// EDG Vehicle Service - Notification Delivery Log Controller
// Sola lettura: le righe vengono scritte esclusivamente da emailNotifier.ts
// durante l'invio della cascata di avvisi, mai via API.
// =============================================================================
import { Request, Response } from 'express';
import { Op, WhereOptions } from 'sequelize';
import { NotificationDeliveryLog, Notification } from '../models';
import { successResponse, buildPaginationMeta, parsePagination } from '../utils/response';

export const list = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const where: WhereOptions = {};

    if (req.query.notificationId) (where as Record<string, unknown>).notificationId = Number(req.query.notificationId);
    if (req.query.status) (where as Record<string, unknown>).status = req.query.status;

    if (req.query.dateFrom || req.query.dateTo) {
      (where as Record<string, unknown>).createdAt = {
        ...(req.query.dateFrom ? { [Op.gte]: new Date(String(req.query.dateFrom)) } : {}),
        ...(req.query.dateTo ? { [Op.lte]: new Date(String(req.query.dateTo)) } : {}),
      };
    }

    const { count, rows } = await NotificationDeliveryLog.findAndCountAll({
      where,
      include: [{ model: Notification, as: 'notification', attributes: ['id', 'title', 'type', 'severity', 'createdAt'] }],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    successResponse(res, rows, undefined, buildPaginationMeta(count, page, limit));
  } catch (err) {
    console.error('[notificationDeliveryLogController.list]', err);
    throw err;
  }
};
