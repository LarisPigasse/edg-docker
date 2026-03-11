// =============================================================================
// EDG Vehicle Service - Multer Upload Middleware
// =============================================================================
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

// Cartella base per gli upload — montata come volume Docker
const UPLOAD_BASE = process.env.UPLOAD_PATH || '/uploads';

// Tipi MIME consentiti
const ALLOWED_MIMETYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
]);

// Dimensione massima: 10 MB
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

// Storage: organizzato per entityType → entityId
const storage = multer.diskStorage({
  destination: (req: Request, _file, cb) => {
    const entityType = req.body?.entityType ?? 'misc';
    const entityId = req.body?.entityId ?? '0';
    const dir = path.join(UPLOAD_BASE, entityType, String(entityId));

    try {
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    } catch (err) {
      cb(err as Error, dir);
    }
  },
  filename: (_req, file, cb) => {
    // UUID + estensione originale per evitare collisioni e path traversal
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (ALLOWED_MIMETYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo file non consentito: ${file.mimetype}`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_BYTES },
});

// Helper per costruire il percorso relativo da salvare sul DB
export function relativeUploadPath(absolutePath: string): string {
  return absolutePath.replace(UPLOAD_BASE, '').replace(/\\/g, '/');
}

// Helper per il percorso assoluto dato quello relativo
export function absoluteUploadPath(relativePath: string): string {
  return path.join(UPLOAD_BASE, relativePath);
}
