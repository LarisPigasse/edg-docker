// =============================================================================
// Resoconti — interventi e costi per fornitore (report, 2026-11-12; regole pure)
// =============================================================================
// Le spese del periodo pagate ai fornitori (interventi e rifornimenti con un
// fornitore), raggruppate per fornitore: per ognuno le righe dalla più
// vecchia, il numero, il subtotale e la quota sul totale; i fornitori dal più
// costoso. Si conta l'importo pagato al fornitore, non la manodopera interna.
// Le righe le legge resoconti.service (le stesse di Spese e consumi).
// =============================================================================
import type { Giorno } from '../../regole';
import type { NaturaResoconto } from './resoconti';

export interface FornitoreRif {
  uuid: string;
  nome: string;
  tipo: { chiave: string; nome: string } | null;
}

export interface RigaFornitore {
  giorno: Giorno;
  soggetto: { nome: string; identificativo: string | null } | null;
  /** Il titolo della scadenza o "Rifornimento: Carburante" */
  intervento: string;
  natura: NaturaResoconto;
  riferimento: string | null;
  importo: number;
  litri: number | null;
  fornitore: FornitoreRif;
}

const tondo = (n: number) => Math.round(n * 100) / 100;

/** Raggruppa per fornitore: dal più costoso, righe dalla più vecchia (pura) */
export function perFornitore(righe: readonly RigaFornitore[]) {
  const gruppi = new Map<string, { fornitore: FornitoreRif; righe: RigaFornitore[] }>();
  for (const r of righe) {
    const g = gruppi.get(r.fornitore.uuid) ?? { fornitore: r.fornitore, righe: [] };
    g.righe.push(r);
    gruppi.set(r.fornitore.uuid, g);
  }
  const totale = tondo(righe.reduce((t, r) => t + r.importo, 0));
  const fornitori = [...gruppi.values()]
    .map(g => {
      const subtotale = tondo(g.righe.reduce((t, r) => t + r.importo, 0));
      return {
        ...g.fornitore,
        interventi: g.righe.length,
        totale: subtotale,
        /** Percentuale intera sul totale del periodo */
        quota: totale > 0 ? Math.round((subtotale / totale) * 100) : 0,
        righe: [...g.righe].sort((a, b) => a.giorno.localeCompare(b.giorno)).map(({ fornitore: _f, ...r }) => r),
      };
    })
    .sort((a, b) => b.totale - a.totale || a.nome.localeCompare(b.nome, 'it'));
  return { totale, interventi: righe.length, fornitori };
}
