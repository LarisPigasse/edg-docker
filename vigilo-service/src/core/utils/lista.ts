// =============================================================================
// Liste paginate (06-servizio-api 6.3): filtri e ordinamento sul server
// =============================================================================
// Pagine da 32 righe, al massimo 128 (potenze di 2). Ordinamento solo sui
// campi dichiarati dalla rotta: niente ordinamenti arbitrari sul database.
// =============================================================================
import Joi from 'joi';
import type { Response } from 'express';
import { buildPaginationMeta, successResponse } from './response';

export const RIGHE_PREDEFINITE = 32;
export const RIGHE_MASSIME = 128;

export interface Pagina {
  pagina: number;
  righe: number;
  offset: number;
  ordina: string;
  verso: 'ASC' | 'DESC';
}

/**
 * Schema Joi della query di una lista: pagina, righe, ordinamento, piu' i
 * filtri della rotta.
 */
export function schemaLista(ordinabili: readonly string[], predefinito: string, filtri: Joi.PartialSchemaMap = {}) {
  return Joi.object({
    pagina: Joi.number().integer().min(1).default(1),
    righe: Joi.number().integer().min(1).max(RIGHE_MASSIME).default(RIGHE_PREDEFINITE),
    ordina: Joi.string()
      .valid(...ordinabili)
      .default(predefinito),
    verso: Joi.string().valid('asc', 'desc').default('asc'),
    testo: Joi.string().trim().max(64).allow(''),
    ...filtri,
  });
}

export function paginaDa(query: Record<string, unknown>): Pagina {
  const pagina = Number(query.pagina) || 1;
  const righe = Number(query.righe) || RIGHE_PREDEFINITE;
  return {
    pagina,
    righe,
    offset: (pagina - 1) * righe,
    ordina: String(query.ordina),
    verso: query.verso === 'desc' ? 'DESC' : 'ASC',
  };
}

/** Risposta di una lista con i metadati di paginazione */
export function rispondiLista<T>(res: Response, elementi: T[], totale: number, p: Pagina): Response {
  return successResponse(res, elementi, undefined, buildPaginationMeta(totale, p.pagina, p.righe));
}

/** Testo per ILIKE con i caratteri speciali neutralizzati */
export const comeTesto = (testo: string): string => `%${testo.replace(/[\\%_]/g, c => `\\${c}`)}%`;
