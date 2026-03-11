// =============================================================================
// EDG Vehicle Service - Attachment Controller
// Upload e gestione allegati per qualsiasi entità (veicolo, autista, ecc.)
// =============================================================================
import { Request, Response } from 'express';
import fs from 'fs';
import { WhereOptions } from 'sequelize';
import { Attachment } from '../models';
import { relativeUploadPath, absoluteUploadPath } from '../middleware/upload';
import {
  successResponse,
  createdResponse,
  notFound,
  badRequest,
  buildPaginationMeta,
  parsePagination,
} from '../utils/response';
import { logger } from '../services/logger';

export const list = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const where: WhereOptions = {
      entityType: req.query.entityType,
      entityId: Number(req.query.entityId),
    };

    const { count, rows } = await Attachment.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });

    successResponse(res, rows, undefined, buildPaginationMeta(count, page, limit));
  } catch (err) {
    console.error('[attachmentController.list]', err);
    throw err;
  }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const record = await Attachment.findByPk(req.params.id);
    if (!record) {
      notFound(res, 'Allegato');
      return;
    }
    successResponse(res, record);
  } catch (err) {
    console.error('[attachmentController.getById]', err);
    throw err;
  }
};

// Download diretto del file
export const download = async (req: Request, res: Response): Promise<void> => {
  try {
    const record = await Attachment.findByPk(req.params.id);
    if (!record) {
      notFound(res, 'Allegato');
      return;
    }

    const absolutePath = absoluteUploadPath(record.filepath);
    if (!fs.existsSync(absolutePath)) {
      notFound(res, 'File fisico');
      return;
    }

    res.setHeader('Content-Type', record.mimetype);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(record.filename)}"`);
    res.sendFile(absolutePath);
  } catch (err) {
    console.error('[attachmentController.download]', err);
    throw err;
  }
};

// Upload — il file è già salvato su disco da multer
export const upload = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      badRequest(res, 'Nessun file ricevuto');
      return;
    }

    const { entityType, entityId, description } = req.body;

    const record = await Attachment.create({
      entityType,
      entityId: Number(entityId),
      filename: req.file.originalname,
      filepath: relativeUploadPath(req.file.path),
      filesize: req.file.size,
      mimetype: req.file.mimetype,
      description: description ?? null,
      uploadedBy: req.user!.id,
    });

    logger.audit(
      'attachment.upload',
      `Upload allegato #${record.id} — ${entityType}#${entityId}: ${req.file.originalname}`,
      req.user!.id,
      req.user!.uuid ?? req.user!.email,
      { size: req.file.size, mime: req.file.mimetype }
    );

    createdResponse(res, record, 'Allegato caricato');
  } catch (err) {
    // Se il record DB fallisce, rimuovi il file già salvato
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('[attachmentController.upload]', err);
    throw err;
  }
};

// Elimina allegato (DB + file fisico)
export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const record = await Attachment.findByPk(req.params.id);
    if (!record) {
      notFound(res, 'Allegato');
      return;
    }

    // Rimuovi il file fisico (silenzioso se non esiste)
    const absolutePath = absoluteUploadPath(record.filepath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    await record.destroy();

    logger.audit(
      'attachment.delete',
      `Eliminato allegato #${req.params.id} (${record.filename})`,
      req.user!.id,
      req.user!.uuid ?? req.user!.email
    );

    successResponse(res, null, 'Allegato eliminato');
  } catch (err) {
    console.error('[attachmentController.remove]', err);
    throw err;
  }
};
