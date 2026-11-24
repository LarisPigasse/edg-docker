// =============================================================================
// Controlli — riattivazione (2026-11-19; regola pura)
// =============================================================================
// Disattivare un controllo chiude in un colpo solo le sue scadenze aperte
// (motivo "controllo-disattivato", stesso istante). Riattivandolo si riaprono
// quelle, con le loro date, come per i soggetti ripristinati e i controlli
// ripresi (ADR110): non se ne creano di nuove che perderebbero le date. Si
// riapre per ogni soggetto solo se:
//   - non ha già una scadenza aperta di quel controllo
//   - il controllo non è "non seguito" per lui
//   - il controllo gli si applica ancora (tipo, categorie, non archiviato)
// Ai soggetti senza nulla da riaprire penserà poi la generazione normale.
// =============================================================================

export interface ChiusaDaDisattivazione {
  idScadenza: number;
  idSoggetto: number;
}

export interface FiltroRiapertura {
  /** Soggetti che hanno già una scadenza aperta del controllo */
  conAperta: ReadonlySet<number>;
  /** Soggetti per cui il controllo non si segue */
  nonSeguiti: ReadonlySet<number>;
  /** Soggetti a cui il controllo si applica oggi */
  ammessi: ReadonlySet<number>;
}

/** Le scadenze da riaprire: una per soggetto, fra quelle chiuse dall'ultima disattivazione (pura) */
export function scadenzeDaRiaprire(chiuse: readonly ChiusaDaDisattivazione[], f: FiltroRiapertura): number[] {
  const visti = new Set<number>();
  const ids: number[] = [];
  for (const c of chiuse) {
    if (visti.has(c.idSoggetto)) continue;
    visti.add(c.idSoggetto);
    if (f.conAperta.has(c.idSoggetto) || f.nonSeguiti.has(c.idSoggetto) || !f.ammessi.has(c.idSoggetto)) continue;
    ids.push(c.idScadenza);
  }
  return ids;
}
