// =============================================================================
// ASSET MODULE — BARREL EXPORT
// features/assets/index.ts
// =============================================================================
//
// Punto di accesso unico al modulo Asset.
// Importare sempre da qui, mai dai file interni direttamente.
//

// --- Pagine ---
export { AssetDashboard } from './pages';

// --- Hook ---
export { useCrudResource } from './hooks';

// --- API ---
export { API_BASE_URL, ASSETS_BASE, buildQuery, createResourceApi } from './api';

// --- Tipi ---
export type { ApiResponse, PaginationMeta, PaginatedApiResponse, BaseFilters } from './types';
export { DEFAULT_PAGINATION } from './types';
