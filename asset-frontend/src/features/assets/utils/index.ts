// =============================================================================
// ASSET MODULE — UTILITY DI DOMINIO
// features/assets/utils/index.ts
// =============================================================================
//
// Funzioni pure specifiche del modulo. Le utility generiche (date, cn, …)
// vivono invece in `src/core/utils/`.
//

/** Converte '' in null: i form HTML producono stringhe vuote, il backend vuole null. */
export const emptyToNull = (value: string | null | undefined): string | null => {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

/** Converte null/undefined in '': utile per popolare un input controllato. */
export const nullToEmpty = (value: string | number | null | undefined): string =>
  value === null || value === undefined ? '' : String(value);
