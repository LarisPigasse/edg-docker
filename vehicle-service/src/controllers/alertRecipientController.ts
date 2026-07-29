// =============================================================================
// EDG Vehicle Service - AlertRecipient Controller
// Create/update gestiscono l'intero array di preferenze in transazione —
// update sostituisce sempre tutte le preferenze esistenti con quelle inviate
// =============================================================================
import { Request, Response } from 'express';
import { WhereOptions } from 'sequelize';
import { sequelize } from '../config/database';
import { AlertRecipient, AlertRecipientPreference, DeadlineType, MaintenanceType, DriverComplianceType } from '../models';
import { successResponse, createdResponse, notFound, conflict, buildPaginationMeta, parsePagination } from '../utils/response';
import { logger } from '../services/logger';

interface PreferenceInput {
  deadlineTypeId?: number | null;
  maintenanceTypeId?: number | null;
  complianceTypeId?: number | null;
}

const INCLUDE = [
  {
    model: AlertRecipientPreference,
    as: 'preferences',
    include: [
      { model: DeadlineType, as: 'deadlineType', attributes: ['id', 'name', 'label'] },
      { model: MaintenanceType, as: 'maintenanceType', attributes: ['id', 'name', 'label'] },
      { model: DriverComplianceType, as: 'complianceType', attributes: ['id', 'name', 'label'] },
    ],
  },
];

const toPreferenceRows = (recipientId: number, preferences: PreferenceInput[]) =>
  preferences.map(p => ({
    recipientId,
    deadlineTypeId: p.deadlineTypeId ?? null,
    maintenanceTypeId: p.maintenanceTypeId ?? null,
    complianceTypeId: p.complianceTypeId ?? null,
  }));

export const list = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const where: WhereOptions = {};

    if (req.query.isActive !== undefined)
      (where as Record<string, unknown>).isActive = req.query.isActive as unknown as boolean;

    const { count, rows } = await AlertRecipient.findAndCountAll({
      where,
      include: INCLUDE,
      limit,
      offset,
      order: [[sequelize.literal('"AlertRecipient"."email"'), 'ASC']],
    });

    successResponse(res, rows, undefined, buildPaginationMeta(count, page, limit));
  } catch (err) {
    console.error('[alertRecipientController.list]', err);
    throw err;
  }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const record = await AlertRecipient.findByPk(req.params.id, { include: INCLUDE });
    if (!record) {
      notFound(res, 'Destinatario');
      return;
    }
    successResponse(res, record);
  } catch (err) {
    console.error('[alertRecipientController.getById]', err);
    throw err;
  }
};

export const create = async (req: Request, res: Response): Promise<void> => {
  const transaction = await sequelize.transaction();
  try {
    const existing = await AlertRecipient.findOne({ where: { email: req.body.email }, transaction });
    if (existing) {
      await transaction.rollback();
      conflict(res, 'Destinatario già presente con questa email');
      return;
    }

    const recipient = await AlertRecipient.create(
      {
        email: req.body.email,
        name: req.body.name,
        receivesAll: req.body.receivesAll,
        isActive: req.body.isActive,
      },
      { transaction }
    );

    const preferences: PreferenceInput[] = req.body.preferences ?? [];
    if (preferences.length > 0) {
      await AlertRecipientPreference.bulkCreate(toPreferenceRows(recipient.id, preferences), { transaction });
    }

    await transaction.commit();

    const full = await AlertRecipient.findByPk(recipient.id, { include: INCLUDE });

    logger.audit(
      'alertRecipient.create',
      `Destinatario avvisi #${recipient.id} creato (${recipient.email})`,
      req.user!.id,
      req.user!.uuid ?? req.user!.email
    );

    createdResponse(res, full, 'Destinatario creato');
  } catch (err) {
    await transaction.rollback();
    console.error('[alertRecipientController.create]', err);
    throw err;
  }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  const transaction = await sequelize.transaction();
  try {
    const record = await AlertRecipient.findByPk(req.params.id, { transaction });
    if (!record) {
      await transaction.rollback();
      notFound(res, 'Destinatario');
      return;
    }

    const { preferences, ...fields } = req.body as { preferences?: PreferenceInput[] } & Record<string, unknown>;

    if (Object.keys(fields).length > 0) {
      await record.update(fields, { transaction });
    }

    // Le preferenze, se presenti nel payload, sostituiscono sempre l'intero set esistente
    if (preferences !== undefined) {
      await AlertRecipientPreference.destroy({ where: { recipientId: record.id }, transaction });
      if (preferences.length > 0) {
        await AlertRecipientPreference.bulkCreate(toPreferenceRows(record.id, preferences), { transaction });
      }
    }

    await transaction.commit();

    const full = await AlertRecipient.findByPk(record.id, { include: INCLUDE });

    logger.audit(
      'alertRecipient.update',
      `Aggiornato destinatario #${record.id}`,
      req.user!.id,
      req.user!.uuid ?? req.user!.email
    );

    successResponse(res, full, 'Destinatario aggiornato');
  } catch (err) {
    await transaction.rollback();
    console.error('[alertRecipientController.update]', err);
    throw err;
  }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const record = await AlertRecipient.findByPk(req.params.id);
    if (!record) {
      notFound(res, 'Destinatario');
      return;
    }
    // Le preferenze collegate si eliminano da sole (ON DELETE CASCADE)
    await record.destroy();
    logger.audit(
      'alertRecipient.delete',
      `Eliminato destinatario #${req.params.id}`,
      req.user!.id,
      req.user!.uuid ?? req.user!.email
    );
    successResponse(res, null, 'Destinatario eliminato');
  } catch (err) {
    console.error('[alertRecipientController.remove]', err);
    throw err;
  }
};
