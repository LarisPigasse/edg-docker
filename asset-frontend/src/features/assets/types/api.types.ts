// =============================================================================
// ASSET MODULE — CONTRATTI API CONDIVISI
// features/assets/types/api.types.ts
// =============================================================================
//
// Forme di risposta standard dei microservizi EDG. Ogni entità del modulo
// riusa questi wrapper invece di ridichiararli: se il contratto REST cambia,
// si corregge qui e basta.
//

/** Risposta a singola risorsa: `{ success, data, message? }` */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/** Metadati di paginazione restituiti dai microservizi EDG. */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** Risposta a collezione paginata. ⚠️ il campo è `meta`, NON `pagination`. */
export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

/** Filtri comuni a qualsiasi lista paginata. Estendere per entità. */
export interface BaseFilters {
  page?: number;
  limit?: number;
  search?: string;
}

/** Valori di default per la paginazione (lista vuota, prima pagina). */
export const DEFAULT_PAGINATION: PaginationMeta = {
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
};
