// =============================================================================
// ASSET MODULE — HOOK GENERICO: useCrudResource
// features/assets/hooks/useCrudResource.ts
// =============================================================================
//
// Hook factory per la gestione di una risorsa CRUD: lista + paginazione +
// filtri + create/update/toggle/remove con refetch automatico.
//
// Si accoppia a `createResourceApi` (api/apiHelpers.ts): una riga per creare
// il client HTTP, una riga per creare l'hook, e la pagina si occupa solo di
// presentazione.
//
// @example
// const { data, loading, error, setFilters, create } = useCrudResource(categoriesApi, { page: 1, limit: 20 });
//

import { useState, useEffect, useCallback } from 'react';

import type { ApiResponse, PaginatedApiResponse, PaginationMeta } from '../types';
import { DEFAULT_PAGINATION } from '../types';

/** Contratto minimo che l'API passata all'hook deve rispettare. */
interface CrudApi<T, TFilters, TCreate, TUpdate> {
  fetchList: (filters: TFilters) => Promise<PaginatedApiResponse<T>>;
  fetchById: (id: number) => Promise<ApiResponse<T>>;
  create: (data: TCreate) => Promise<ApiResponse<T>>;
  update: (id: number, data: TUpdate) => Promise<ApiResponse<T>>;
  toggle: (id: number) => Promise<ApiResponse<T>>;
  remove: (id: number) => Promise<ApiResponse<T>>;
}

interface UseCrudResourceReturn<T, TFilters, TCreate, TUpdate> {
  /** Elementi della pagina corrente */
  data: T[];
  /** Metadati di paginazione restituiti dal backend */
  pagination: PaginationMeta;
  /** True durante il caricamento della lista */
  loading: boolean;
  /** Messaggio d'errore leggibile, oppure null */
  error: string | null;
  /** True durante una mutazione (create / update / toggle / remove) */
  submitting: boolean;
  /** Filtri correnti */
  filters: TFilters;
  /** Applica filtri parziali e torna a pagina 1 */
  setFilters: (partial: Partial<TFilters>) => void;
  /** Ripristina i filtri iniziali */
  resetFilters: () => void;
  /** Cambia pagina mantenendo i filtri */
  setPage: (page: number) => void;
  /** Ricarica la lista corrente */
  reload: () => Promise<void>;
  create: (data: TCreate) => Promise<T>;
  update: (id: number, data: TUpdate) => Promise<T>;
  toggle: (id: number) => Promise<T>;
  remove: (id: number) => Promise<T>;
}

export function useCrudResource<T, TFilters extends { page?: number; limit?: number }, TCreate, TUpdate>(
  api: CrudApi<T, TFilters, TCreate, TUpdate>,
  defaultFilters: TFilters
): UseCrudResourceReturn<T, TFilters, TCreate, TUpdate> {
  const [filters, setFiltersState] = useState<TFilters>(defaultFilters);
  const [data, setData] = useState<T[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.fetchList(filters);
      setData(res.data);
      setPagination(res.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `api` è un oggetto stabile creato una sola volta dal chiamante
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const setFilters = useCallback((partial: Partial<TFilters>) => {
    setFiltersState(prev => ({ ...prev, ...partial, page: partial.page ?? 1 }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `defaultFilters` è passato una sola volta all'invocazione dell'hook
  }, []);

  const setPage = useCallback((page: number) => {
    setFiltersState(prev => ({ ...prev, page }));
  }, []);

  const reload = useCallback(async () => {
    await load();
  }, [load]);

  /** Esegue una mutazione, ricarica la lista e restituisce l'entità aggiornata. */
  const mutate = useCallback(
    async (operation: () => Promise<ApiResponse<T>>): Promise<T> => {
      setSubmitting(true);
      try {
        const res = await operation();
        await load();
        return res.data;
      } finally {
        setSubmitting(false);
      }
    },
    [load]
  );

  const handleCreate = useCallback((createData: TCreate) => mutate(() => api.create(createData)), [mutate]); // eslint-disable-line react-hooks/exhaustive-deps
  const handleUpdate = useCallback((id: number, updateData: TUpdate) => mutate(() => api.update(id, updateData)), [mutate]); // eslint-disable-line react-hooks/exhaustive-deps
  const handleToggle = useCallback((id: number) => mutate(() => api.toggle(id)), [mutate]); // eslint-disable-line react-hooks/exhaustive-deps
  const handleRemove = useCallback((id: number) => mutate(() => api.remove(id)), [mutate]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    data,
    pagination,
    loading,
    error,
    submitting,
    filters,
    setFilters,
    resetFilters,
    setPage,
    reload,
    create: handleCreate,
    update: handleUpdate,
    toggle: handleToggle,
    remove: handleRemove,
  };
}

export default useCrudResource;
