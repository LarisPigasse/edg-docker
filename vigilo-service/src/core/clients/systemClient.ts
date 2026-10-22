// =============================================================================
// Client verso le rotte interne di system-service (ADR089)
// =============================================================================
// Segreto dei servizi, 4096 ms al massimo; chi chiama gestisce l'eccezione.
// =============================================================================

const SYSTEM_SERVICE_URL = process.env.SYSTEM_SERVICE_URL || 'http://system-service:3004';
const TIMEOUT_MS = 4096;

export interface ContattiAnagrafica {
  ragioneSociale: string;
  referente: string | null;
  telefonoReferente: string | null;
  emailReferente: string | null;
  /** Email dell'azienda */
  email: string | null;
  isActive: boolean;
  /** Operatore EDG che segue il cliente (ADR086) */
  seguitoDa: { nome: string; email: string | null; isActive: boolean } | null;
}

/** Contatti di un'anagrafica di system-service */
export async function contattiAnagrafica(uuid: string): Promise<ContattiAnagrafica> {
  const res = await fetch(`${SYSTEM_SERVICE_URL}/internal/anagrafiche/${encodeURIComponent(uuid)}/contatti`, {
    headers: { 'x-gateway-secret': process.env.GATEWAY_SECRET ?? '' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`system-service ha risposto ${res.status}`);
  return ((await res.json()) as { data: ContattiAnagrafica }).data;
}
