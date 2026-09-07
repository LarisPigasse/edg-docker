// src/core/utils/errors.ts

/**
 * Forma degli errori che arrivano dai servizi EDG: alcuni client HTTP
 * incapsulano il messaggio in `response.data.message`, altri lo espongono
 * direttamente su `message`.
 */
interface ApiErrorLike {
  response?: { data?: { message?: string; error?: string } };
  message?: string;
}

/**
 * Estrae un messaggio leggibile da un errore di tipo sconosciuto.
 *
 * Evita il `catch (err: any)` sparso nel codice: il blocco catch riceve
 * `unknown` (come vuole TypeScript) e la conversione a stringa avviene qui,
 * in un solo punto.
 *
 * @example
 * try { … } catch (err) {
 *   setError(getErrorMessage(err, 'Errore nel caricamento degli account'));
 * }
 */
export const getErrorMessage = (error: unknown, fallback = 'Si è verificato un errore imprevisto'): string => {
  if (typeof error === 'string' && error.trim()) return error;

  if (error && typeof error === 'object') {
    const candidate = error as ApiErrorLike;
    const fromResponse = candidate.response?.data?.message || candidate.response?.data?.error;
    if (fromResponse) return fromResponse;
    if (candidate.message) return candidate.message;
  }

  return fallback;
};
