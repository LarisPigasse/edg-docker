// =============================================================================
// Tenant con un'eliminazione dei dati in corso (fase 3, ADR117)
// =============================================================================
// Mentre si eliminano i dati di un tenant, i processi che creano righe (la
// generazione degli avvisi) lo saltano; un ultimo passaggio dopo la
// transazione toglie ciò che fosse nato nel frattempo. Un'istanza sola di
// vigilo-service: basta un insieme in memoria.
// =============================================================================

const inCorso = new Set<number>();

export const eInEliminazione = (idTenant: number): boolean => inCorso.has(idTenant);

/** Esegue `lavoro` con il tenant segnato; un'altra eliminazione dello stesso tenant è rifiutata */
export async function conTenantInEliminazione<T>(idTenant: number, lavoro: () => Promise<T>): Promise<T> {
  if (inCorso.has(idTenant)) throw new Error('Eliminazione già in corso per questo tenant');
  inCorso.add(idTenant);
  try {
    return await lavoro();
  } finally {
    inCorso.delete(idTenant);
  }
}
