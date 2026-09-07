// =============================================================================
// ASSET MODULE — API HELPERS CONDIVISI
// features/assets/api/apiHelpers.ts
// =============================================================================
//
// Utility HTTP del modulo. Il frontend parla SOLO con l'API Gateway: mai
// URL diretti verso i microservizi.
//
// `createResourceApi` è una factory che genera le 6 operazioni CRUD standard
// per una risorsa REST. Ogni entità la invoca una volta con i propri tipi:
// zero duplicazione della logica HTTP, un solo punto da correggere se il
// contratto REST cambia.
//

import { apiFetch, getAuthHeaders } from '@/core/services/apiFetch';

import type { ApiResponse, PaginatedApiResponse } from '../types';

/** Entry point unico: l'API Gateway. */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

/**
 * Prefisso REST del microservizio del modulo.
 * TODO(asset-service): allineare al path effettivo esposto dal gateway.
 */
export const ASSETS_BASE = `${API_BASE_URL}/api/assets`;

/** Costruisce una query string scartando i valori undefined / null / ''. */
export const buildQuery = (params: Record<string, string | number | boolean | undefined | null>): string => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.append(key, String(value));
    }
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
};

/**
 * Factory CRUD per una risorsa REST del modulo.
 *
 * @param basePath path relativo a ASSETS_BASE, con lo slash iniziale (es. '/categories')
 *
 * @example
 * // features/assets/api/categories.api.ts
 * export const categoriesApi = createResourceApi<Category, CategoryFilters, CreateCategory, UpdateCategory>('/categories');
 */
export function createResourceApi<T, TFilters extends object, TCreate, TUpdate>(basePath: string) {
  const url = (suffix = '') => `${ASSETS_BASE}${basePath}${suffix}`;

  return {
    /** GET /basePath?filtri — lista paginata */
    fetchList: (filters: TFilters = {} as TFilters): Promise<PaginatedApiResponse<T>> =>
      apiFetch<PaginatedApiResponse<T>>(
        url(buildQuery(filters as Record<string, string | number | boolean | undefined | null>)),
        { headers: getAuthHeaders() }
      ),

    /** GET /basePath/:id */
    fetchById: (id: number): Promise<ApiResponse<T>> => apiFetch<ApiResponse<T>>(url(`/${id}`), { headers: getAuthHeaders() }),

    /** POST /basePath */
    create: (data: TCreate): Promise<ApiResponse<T>> =>
      apiFetch<ApiResponse<T>>(url(), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }),

    /** PUT /basePath/:id */
    update: (id: number, data: TUpdate): Promise<ApiResponse<T>> =>
      apiFetch<ApiResponse<T>>(url(`/${id}`), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }),

    /** PATCH /basePath/:id/toggle — attiva / disattiva */
    toggle: (id: number): Promise<ApiResponse<T>> =>
      apiFetch<ApiResponse<T>>(url(`/${id}/toggle`), { method: 'PATCH', headers: getAuthHeaders() }),

    /** DELETE /basePath/:id */
    remove: (id: number): Promise<ApiResponse<T>> =>
      apiFetch<ApiResponse<T>>(url(`/${id}`), { method: 'DELETE', headers: getAuthHeaders() }),
  };
}

/** Tipo dell'oggetto restituito da `createResourceApi`. */
export type ResourceApi<T, TFilters extends object, TCreate, TUpdate> = ReturnType<
  typeof createResourceApi<T, TFilters, TCreate, TUpdate>
>;
