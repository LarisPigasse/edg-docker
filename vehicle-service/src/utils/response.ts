// =============================================================================
// EDG Vehicle Service - Response Utilities
// Helper per risposte JSON standardizzate
// =============================================================================
import { Response } from 'express';

// ---------------------------------------------------------------------------
// Interfacce
// ---------------------------------------------------------------------------
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ValidationErrorDetail[];
  meta?: PaginationMeta;
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Successo - 200 OK
// ---------------------------------------------------------------------------
export function successResponse<T>(
  res: Response,
  data: T,
  message?: string,
  meta?: PaginationMeta
): Response {
  const body: ApiResponse<T> = { success: true, data };
  if (message) body.message = message;
  if (meta) body.meta = meta;
  return res.status(200).json(body);
}

// ---------------------------------------------------------------------------
// Creato - 201 Created
// ---------------------------------------------------------------------------
export function createdResponse<T>(res: Response, data: T, message?: string): Response {
  const body: ApiResponse<T> = { success: true, data };
  if (message) body.message = message;
  return res.status(201).json(body);
}

// ---------------------------------------------------------------------------
// Nessun contenuto - 204 No Content
// ---------------------------------------------------------------------------
export function noContentResponse(res: Response): Response {
  return res.status(204).send();
}

// ---------------------------------------------------------------------------
// Errore generico
// ---------------------------------------------------------------------------
export function errorResponse(
  res: Response,
  status: number,
  message: string,
  errors?: ValidationErrorDetail[]
): Response {
  const body: ApiResponse = { success: false, message };
  if (errors && errors.length > 0) body.errors = errors;
  return res.status(status).json(body);
}

// ---------------------------------------------------------------------------
// Shorthand per errori comuni
// ---------------------------------------------------------------------------
export const badRequest = (res: Response, message = 'Bad request', errors?: ValidationErrorDetail[]) =>
  errorResponse(res, 400, message, errors);

export const unauthorized = (res: Response, message = 'Non autorizzato') =>
  errorResponse(res, 401, message);

export const forbidden = (res: Response, message = 'Accesso negato') =>
  errorResponse(res, 403, message);

export const notFound = (res: Response, resource = 'Risorsa') =>
  errorResponse(res, 404, `${resource} non trovato/a`);

export const conflict = (res: Response, message = 'Risorsa già esistente') =>
  errorResponse(res, 409, message);

export const serverError = (res: Response, message = 'Errore interno del server') =>
  errorResponse(res, 500, message);

// ---------------------------------------------------------------------------
// Helper paginazione
// ---------------------------------------------------------------------------
export function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

// ---------------------------------------------------------------------------
// Helper per estrarre parametri di paginazione dalla query string
// ---------------------------------------------------------------------------
export function parsePagination(query: Record<string, unknown>): { page: number; limit: number; offset: number } {
  const page = Math.max(1, parseInt(String(query.page || '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || '20'), 10)));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}
