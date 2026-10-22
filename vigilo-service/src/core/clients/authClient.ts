// =============================================================================
// Client verso le rotte interne di auth-service (ADR088)
// =============================================================================
// Non passano dal gateway: segreto dei servizi, 4096 ms al massimo. Chi chiama
// decide come comportarsi se auth-service non risponde (eccezione).
//   configModulo  impostazioni di Vigilo scelte da EDG per il tenant
//   nomiAccount   nome ed email degli account (nome nel registro)
// =============================================================================

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
const TIMEOUT_MS = 4096;
const MODULO = 'vigilo';

async function leggi<T>(percorso: string): Promise<T> {
  const res = await fetch(`${AUTH_SERVICE_URL}/internal${percorso}`, {
    headers: { 'x-gateway-secret': process.env.GATEWAY_SECRET ?? '' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`auth-service ha risposto ${res.status}`);
  return ((await res.json()) as { data: T }).data;
}

export interface AttivazioneModulo {
  inForce: boolean;
  status: string | null;
  config: Record<string, unknown> | null;
  /** Nome e cliente collegato del tenant (ADR089) */
  tenant: { nome: string; clienteUuid: string | null } | null;
}

/** Attivazione di Vigilo per il tenant (config scelta da EDG all'attivazione) */
export const configModulo = (idTenant: number): Promise<AttivazioneModulo> =>
  leggi<AttivazioneModulo>(`/tenants/${idTenant}/modules/${MODULO}`);

export interface NomeAccount {
  id: number;
  email: string;
  nome: string;
}

export interface AccountTenant extends NomeAccount {
  permissions: string[];
}

/** Account attivi del tenant con i permessi del ruolo (ADR090: l'"ufficio" degli avvisi) */
export const accountTenant = (idTenant: number): Promise<AccountTenant[]> => leggi<AccountTenant[]>(`/tenants/${idTenant}/accounts`);

/** Nome ed email degli account (al massimo 64 per chiamata) */
export const nomiAccount = (ids: number[]): Promise<NomeAccount[]> =>
  ids.length ? leggi<NomeAccount[]>(`/accounts?ids=${[...new Set(ids)].slice(0, 64).join(',')}`) : Promise.resolve([]);
