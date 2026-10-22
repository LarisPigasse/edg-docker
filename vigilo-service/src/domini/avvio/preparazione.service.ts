// =============================================================================
// Chi prepara Vigilo per il tenant (ADR088): da auth-service, con una cache
// =============================================================================
// La scelta di EDG sta in tenant_modules.config (auth-service). Si tiene in
// memoria per 64 secondi per tenant: una modifica in EDG Pro vale al più
// tardi dopo un minuto, senza chiedere ad auth-service a ogni pagina.
//   rigorosa  (POST /avvio)  se auth-service non risponde: 503
//   morbida   (GET)          se auth-service non risponde: prepara il cliente
// =============================================================================
import { AppError } from '../../core/utils/errors';
import { logger } from '../../core/services/logger';
import { configModulo } from '../../core/clients/authClient';
import { leggiPreparazione, type Preparazione } from './preparazione';

const VALIDITA_MS = 64_000;
const cache = new Map<number, { valore: Preparazione; scade: number }>();

const PREDEFINITA: Preparazione = { chi: 'cliente', modelli: [] };

export async function preparazioneDelTenant(idTenant: number, rigorosa = false): Promise<Preparazione> {
  const inCache = cache.get(idTenant);
  if (inCache && inCache.scade > Date.now()) return inCache.valore;
  try {
    const attivazione = await configModulo(idTenant);
    const valore = leggiPreparazione(attivazione.config);
    cache.set(idTenant, { valore, scade: Date.now() + VALIDITA_MS });
    return valore;
  } catch (err) {
    logger.warn('vigilo.preparazione', `Impossibile leggere chi prepara Vigilo per il tenant ${idTenant}: ${String(err)}`, { idTenant });
    if (rigorosa) throw new AppError('Impossibile verificare chi prepara Vigilo: riprova tra poco', 503);
    return PREDEFINITA;
  }
}
