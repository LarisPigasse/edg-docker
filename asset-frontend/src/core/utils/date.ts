// =============================================================================
// CORE UTILS: date conversions & formatting
// core/utils/date.ts
// =============================================================================
//
// Il DatePicker del template lavora con oggetti Date; le API del backend con
// stringhe ISO "YYYY-MM-DD". toISODate/fromISODate fanno da ponte tra i due.
// formatDate è invece per la sola visualizzazione (tabelle, dettagli).
//

export const toISODate = (date?: Date): string | undefined => {
  if (!date) return undefined;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const fromISODate = (iso: string | null | undefined): Date | undefined => (iso ? new Date(iso) : undefined);

type DateDisplayStyle = 'short' | 'long';

/**
 * Formatta una data ISO per la visualizzazione in italiano.
 * style='short' → "6 lug 2026" (tabelle, spazi compatti)
 * style='long'  → "6 luglio 2026" (dettagli, modali)
 */
export const formatDate = (dateString: string | null | undefined, style: DateDisplayStyle = 'short'): string => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: style,
    year: 'numeric',
  });
};
