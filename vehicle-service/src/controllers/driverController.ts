// =============================================================================
// EDG Vehicle Service - Driver Controller
// =============================================================================
import { Request, Response } from 'express';
import { Op, WhereOptions } from 'sequelize';
import { Driver } from '../models';
import { successResponse, createdResponse, notFound, conflict, buildPaginationMeta, parsePagination } from '../utils/response';
import { logger } from '../services/logger';

// ---------------------------------------------------------------------------
// LIST  GET /api/vehicles/drivers
// Filtri: active, search (nome/cognome/email/fiscalCode), city
// ---------------------------------------------------------------------------
export const list = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const where: WhereOptions = {};

    // Filtro isActive (default: solo attivi)
    if (req.query.active !== undefined) {
      (where as Record<string, unknown>).isActive = req.query.active !== 'false';
    } else {
      (where as Record<string, unknown>).isActive = true;
    }

    // Filtro città
    if (req.query.city) {
      (where as Record<string, unknown>).city = { [Op.iLike]: `%${req.query.city}%` };
    }

    // Ricerca testuale su nome/cognome/email/codice fiscale
    if (req.query.search) {
      const search = String(req.query.search);
      (where as Record<string, unknown>)[Op.or as unknown as string] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { fiscalCode: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Driver.findAndCountAll({
      where,
      limit,
      offset,
      order: [
        ['lastName', 'ASC'],
        ['firstName', 'ASC'],
      ],
    });

    successResponse(res, rows, undefined, buildPaginationMeta(count, page, limit));
  } catch (err) {
    console.error('[driverController.list]', err);
    throw err;
  }
};

// ---------------------------------------------------------------------------
// GET BY ID  GET /api/vehicles/drivers/:id
// ---------------------------------------------------------------------------
export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const driver = await Driver.findByPk(req.params.id);

    if (!driver) {
      notFound(res, 'Autista');
      return;
    }

    successResponse(res, driver);
  } catch (err) {
    console.error('[driverController.getById]', err);
    throw err;
  }
};

// ---------------------------------------------------------------------------
// CREATE  POST /api/vehicles/drivers
// ---------------------------------------------------------------------------
export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    // Verifica unicità codice fiscale
    if (req.body.fiscalCode) {
      const existing = await Driver.findOne({ where: { fiscalCode: req.body.fiscalCode } });
      if (existing) {
        conflict(res, `Codice fiscale ${req.body.fiscalCode} già registrato`);
        return;
      }
    }

    const driver = await Driver.create(req.body);

    logger.audit(
      'driver.create',
      `Creato autista #${driver.id} ${driver.firstName} ${driver.lastName}`,
      req.user!.id,
      req.user!.uuid ?? req.user!.email
    );

    createdResponse(res, driver, 'Autista creato con successo');
  } catch (err) {
    console.error('[driverController.create]', err);
    throw err;
  }
};

// ---------------------------------------------------------------------------
// UPDATE  PUT /api/vehicles/drivers/:id
// ---------------------------------------------------------------------------
export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const driver = await Driver.findByPk(req.params.id);
    if (!driver) {
      notFound(res, 'Autista');
      return;
    }

    // Verifica unicità codice fiscale se cambia
    if (req.body.fiscalCode && req.body.fiscalCode !== driver.fiscalCode) {
      const existing = await Driver.findOne({ where: { fiscalCode: req.body.fiscalCode } });
      if (existing) {
        conflict(res, `Codice fiscale ${req.body.fiscalCode} già registrato`);
        return;
      }
    }

    await driver.update(req.body);

    logger.audit('driver.update', `Aggiornato autista #${driver.id}`, req.user!.id, req.user!.uuid ?? req.user!.email, {
      changes: Object.keys(req.body),
    });

    successResponse(res, driver, 'Autista aggiornato con successo');
  } catch (err) {
    console.error('[driverController.update]', err);
    throw err;
  }
};

// ---------------------------------------------------------------------------
// TOGGLE ACTIVE  PATCH /api/vehicles/drivers/:id/toggle
// Attiva/disattiva autista senza cancellarlo
// ---------------------------------------------------------------------------
export const toggleActive = async (req: Request, res: Response): Promise<void> => {
  try {
    const driver = await Driver.findByPk(req.params.id);
    if (!driver) {
      notFound(res, 'Autista');
      return;
    }

    const newState = !driver.isActive;
    await driver.update({ isActive: newState });

    logger.audit(
      'driver.toggle',
      `Autista #${driver.id} → ${newState ? 'attivato' : 'disattivato'}`,
      req.user!.id,
      req.user!.uuid ?? req.user!.email
    );

    successResponse(res, driver, `Autista ${newState ? 'attivato' : 'disattivato'}`);
  } catch (err) {
    console.error('[driverController.toggleActive]', err);
    throw err;
  }
};

// ---------------------------------------------------------------------------
// DELETE (soft)  DELETE /api/vehicles/drivers/:id
// Imposta isActive = false e terminationDate = oggi
// ---------------------------------------------------------------------------
export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const driver = await Driver.findByPk(req.params.id);
    if (!driver) {
      notFound(res, 'Autista');
      return;
    }

    await driver.update({
      isActive: false,
      terminationDate: driver.terminationDate ?? new Date(),
    });

    logger.audit(
      'driver.terminate',
      `Terminato autista #${driver.id} ${driver.firstName} ${driver.lastName}`,
      req.user!.id,
      req.user!.uuid ?? req.user!.email
    );

    successResponse(res, null, 'Autista disattivato');
  } catch (err) {
    console.error('[driverController.remove]', err);
    throw err;
  }
};
