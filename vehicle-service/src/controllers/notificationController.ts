// =============================================================================
// EDG Vehicle Service - Notification Controller
// Le notifiche vengono principalmente generate dal sistema (cron).
// Questa API espone lettura, archiviazione, mark-as-read e creazione manuale.
// =============================================================================
import { Request, Response } from 'express';
import { Op, WhereOptions } from 'sequelize';
import { sequelize } from '../config/database';
import { Notification } from '../models';
import { successResponse, createdResponse, notFound, buildPaginationMeta, parsePagination } from '../utils/response';
import { logger } from '../services/logger';

export const list = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const where: WhereOptions = {};

    if (req.query.vehicleId) (where as Record<string, unknown>).vehicleId = Number(req.query.vehicleId);
    if (req.query.driverId) (where as Record<string, unknown>).driverId = Number(req.query.driverId);
    if (req.query.type) (where as Record<string, unknown>).type = req.query.type;
    if (req.query.severity) (where as Record<string, unknown>).severity = req.query.severity;

    // isRead: default tutto, ma filtrabile
    if (req.query.isRead !== undefined) {
      (where as Record<string, unknown>).isRead = req.query.isRead === 'true';
    }
    // isArchived: default false (non mostrare archiviate a meno che richiesto)
    (where as Record<string, unknown>).isArchived = req.query.isArchived === 'true' ? true : false;

    const { count, rows } = await Notification.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sequelize.literal('"Notification"."created_at"'), 'DESC']],
    });

    successResponse(res, rows, undefined, buildPaginationMeta(count, page, limit));
  } catch (err) {
    console.error('[notificationController.list]', err);
    throw err;
  }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const record = await Notification.findByPk(req.params.id);
    if (!record) {
      notFound(res, 'Notifica');
      return;
    }
    successResponse(res, record);
  } catch (err) {
    console.error('[notificationController.getById]', err);
    throw err;
  }
};

// Contatore non lette (utile per badge UI)
export const unreadCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const where: WhereOptions = { isRead: false, isArchived: false };
    if (req.query.vehicleId) (where as Record<string, unknown>).vehicleId = Number(req.query.vehicleId);
    if (req.query.driverId) (where as Record<string, unknown>).driverId = Number(req.query.driverId);

    const count = await Notification.count({ where });
    successResponse(res, { count });
  } catch (err) {
    console.error('[notificationController.unreadCount]', err);
    throw err;
  }
};

// Segna come letta
export const markRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const record = await Notification.findByPk(req.params.id);
    if (!record) {
      notFound(res, 'Notifica');
      return;
    }

    if (!record.isRead) {
      await record.update({ isRead: true, readAt: new Date() });
    }
    successResponse(res, record, 'Notifica segnata come letta');
  } catch (err) {
    console.error('[notificationController.markRead]', err);
    throw err;
  }
};

// Segna tutte come lette (con filtri opzionali vehicleId / driverId)
export const markAllRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const where: WhereOptions = { isRead: false, isArchived: false };
    if (req.query.vehicleId) (where as Record<string, unknown>).vehicleId = Number(req.query.vehicleId);
    if (req.query.driverId) (where as Record<string, unknown>).driverId = Number(req.query.driverId);

    const [count] = await Notification.update({ isRead: true, readAt: new Date() }, { where });

    logger.info('notification.markAllRead', `Segnate come lette: ${count} notifiche`, {
      userId: req.user!.id,
    });

    successResponse(res, { updated: count }, `${count} notifiche segnate come lette`);
  } catch (err) {
    console.error('[notificationController.markAllRead]', err);
    throw err;
  }
};

// Archivia (nasconde dalla lista normale)
export const archive = async (req: Request, res: Response): Promise<void> => {
  try {
    const record = await Notification.findByPk(req.params.id);
    if (!record) {
      notFound(res, 'Notifica');
      return;
    }

    await record.update({ isArchived: true, isRead: true, readAt: record.readAt ?? new Date() });
    successResponse(res, record, 'Notifica archiviata');
  } catch (err) {
    console.error('[notificationController.archive]', err);
    throw err;
  }
};

// Creazione manuale (admin / uso interno sistema)
export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const record = await Notification.create(req.body);

    logger.audit(
      'notification.create',
      `Notifica manuale #${record.id}: ${record.title}`,
      req.user!.id,
      req.user!.uuid ?? req.user!.email
    );

    createdResponse(res, record, 'Notifica creata');
  } catch (err) {
    console.error('[notificationController.create]', err);
    throw err;
  }
};

// Elimina (solo notifiche archiviate o sistema)
export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const record = await Notification.findByPk(req.params.id);
    if (!record) {
      notFound(res, 'Notifica');
      return;
    }
    await record.destroy();

    logger.audit(
      'notification.delete',
      `Eliminata notifica #${req.params.id}`,
      req.user!.id,
      req.user!.uuid ?? req.user!.email
    );

    successResponse(res, null, 'Notifica eliminata');
  } catch (err) {
    console.error('[notificationController.remove]', err);
    throw err;
  }
};
