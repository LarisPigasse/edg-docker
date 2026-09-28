// src/utils/diffUtils.ts
/**
 * Calcola le differenze tra due oggetti
 */
export const computeDiff = (
  before: Record<string, any> | null,
  after: Record<string, any> | null
): Record<string, any> | null => {
  if (!before || !after) return null;

  const diff: Record<string, any> = {};

  // Trova campi modificati o aggiunti
  Object.keys(after).forEach((key) => {
    // Se il campo non esisteva prima
    if (!(key in before)) {
      diff[key] = { added: after[key] };
    }
    // Se il valore è cambiato
    else if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      diff[key] = {
        from: before[key],
        to: after[key],
      };
    }
  });

  // Trova campi rimossi
  Object.keys(before).forEach((key) => {
    if (!(key in after)) {
      diff[key] = { removed: before[key] };
    }
  });

  return Object.keys(diff).length > 0 ? diff : null;
};
