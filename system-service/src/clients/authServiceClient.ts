// =============================================================================
// EDG System Service - Client verso auth-service (ADR058)
// =============================================================================
// Chiamate interne (rete dei container, fuori dal gateway) alle rotte
// /internal di auth-service, con il segreto condiviso dei servizi.
// =============================================================================

export interface AnagraficaLinks {
  /** Tenant collegato all'anagrafica (al massimo uno) */
  tenant: { id: number; name: string; slug: string } | null;
  /** Account collegati all'anagrafica (entityId) */
  accounts: number;
}

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
/** Oltre questo tempo si rinuncia: chi chiama decide come comportarsi */
const TIMEOUT_MS = 4096;

/** Cosa di auth-service punta a un'anagrafica. Lancia un errore se auth-service non risponde. */
export async function getAnagraficaLinks(uuid: string): Promise<AnagraficaLinks> {
  const res = await fetch(`${AUTH_SERVICE_URL}/internal/anagrafiche/${encodeURIComponent(uuid)}/links`, {
    headers: { 'x-gateway-secret': process.env.GATEWAY_SECRET ?? '' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`auth-service ha risposto ${res.status}`);
  const body = (await res.json()) as { data: AnagraficaLinks };
  return body.data;
}
