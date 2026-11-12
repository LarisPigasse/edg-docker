// =============================================================================
// Chi ha scritto: i nomi degli autori dello storico (revisione 2026-11-10)
// =============================================================================
// Registrazioni, conferme delle segnalazioni, guasti e scadenze aggiunte a
// mano salvano l'account di chi le ha scritte (creatoDa, confermataDa). Qui
// i loro nomi, letti da auth-service con una sola richiesta per risposta.
// Se auth non risponde i nomi mancano ma la risposta parte lo stesso (come
// per i documenti allegati). creatoDa null: l'ha scritta un processo.
// =============================================================================
import { logger } from '../../core/services/logger';
import { indirizziDi } from '../avvisi/email';

/** Id dell'account → nome */
export type NomiAutori = ReadonlyMap<number, string>;

export const NESSUN_NOME: NomiAutori = new Map();

/** I nomi degli account indicati (null e doppioni si ignorano); vuota se auth non risponde */
export async function nomiAutori(ids: readonly (number | null | undefined)[]): Promise<NomiAutori> {
  const validi = [...new Set(ids.filter((id): id is number => id != null))];
  if (!validi.length) return NESSUN_NOME;
  try {
    const account = await indirizziDi(validi);
    return new Map([...account].map(([id, a]) => [id, a.nome]));
  } catch (err) {
    logger.warn('vigilo.autori', `Nomi di chi ha scritto non letti: ${String(err)}`);
    return NESSUN_NOME;
  }
}

/** Il nome di un autore; null se l'ha scritta un processo o se il nome non si è letto (pura) */
export const nomeAutore = (nomi: NomiAutori, id: number | null | undefined): string | null => (id != null ? (nomi.get(id) ?? null) : null);
