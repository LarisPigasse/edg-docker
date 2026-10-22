// =============================================================================
// Testo e tono di un avviso (04-avvisi 4.2) — regole pure
// =============================================================================
// "Revisione · Iveco S-Way 01 (GH128KM): scade tra 8 giorni · 30 ott"
// Il testo dello stato è quello della dashboard (regole/testi.ts): un avviso
// dice la stessa cosa che si legge nella scheda. Il testo intero resta per le
// email; la campanella lo mostra su due righe (titolo, poi soggetto e stato:
// statoDelTesto) e colora il pallino col tono (ADR091).
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
  return `${p.titolo}${chi}${SEPARATORE}${stato}`.slice(0, 512);
}

/** Fra titolo e soggetto e lo stato: lo stato non lo contiene mai */
const SEPARATORE = ': ';

/** Lo stato com'era alla nascita dell'avviso ("scade tra 2 giorni · 24 ott") */
export function statoDelTesto(testo: string): string {
  const i = testo.lastIndexOf(SEPARATORE);
  return i < 0 ? testo : testo.slice(i + SEPARATORE.length);
}

/** Come i colori della dashboard: rosso, arancio ("Entro 8 giorni"), normale */
export type TonoAvviso = 'pericolo' | 'attenzione' | 'normale';

/** Preavvisi a giorni entro questa soglia valgono "attenzione", come "Entro 8 giorni" della dashboard */
export const GIORNI_ATTENZIONE = 8;

/** Il tono dall'evento: urgente → pericolo; tolleranza o preavviso a giorni entro 8 → attenzione */
export function tonoAvviso(evento: string, urgente: boolean): TonoAvviso {
  if (urgente) return 'pericolo';
  if (evento.startsWith('tolleranza')) return 'attenzione';
  const m = /^preavviso(?:-stima)?:(\d+)$/.exec(evento);
  return m && Number(m[1]) <= GIORNI_ATTENZIONE ? 'attenzione' : 'normale';
}
