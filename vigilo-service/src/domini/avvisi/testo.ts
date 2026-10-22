// =============================================================================
// Testo di un avviso (04-avvisi 4.2) — regola pura
// =============================================================================
// "Revisione · Iveco S-Way 01 (GH128KM): scade tra 8 giorni · 30 ott"
// Il testo dello stato è quello della dashboard (regole/testi.ts): un avviso
// dice la stessa cosa che si legge nella scheda.
// =============================================================================

export interface PartiTesto {
  titolo: string;
  soggetto: { nome: string; identificativo: string | null } | null;
  /** testoStato(...) delle regole */
  stato: string;
}

export function testoAvviso(p: PartiTesto): string {
  const chi = p.soggetto ? ` · ${p.soggetto.nome}${p.soggetto.identificativo ? ` (${p.soggetto.identificativo})` : ''}` : '';
  const stato = p.stato.startsWith('tra ') ? `scade ${p.stato}` : p.stato;
  return `${p.titolo}${chi}: ${stato}`.slice(0, 512);
}
