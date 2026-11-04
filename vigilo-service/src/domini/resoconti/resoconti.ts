// =============================================================================
// Resoconti — Spese e consumi, regole pure (B10c)
// =============================================================================
// Quanto si spende e quanto si usano i mezzi, dalle registrazioni eseguite e
// confermate (le segnalazioni da confermare restano fuori):
//   intervalloDi    il periodo scelto (anno in corso, ultimi 12 mesi, anno
//                   precedente, dal…al entro 4 anni) e lo stesso un anno prima
//   usoNelPeriodo   km o ore dai contatori: somma degli aumenti fra letture
//                   successive, partendo dall'ultima prima del periodo (le
//                   letture anomale sono già escluse da chi chiama)
//   costoPerUnita   spesa ÷ uso, solo sopra la soglia minima d'uso (sotto il
//                   numero sarebbe fuorviante: 500 € su 8 km)
//   variazione      percentuale rispetto all'anno prima
//   riepilogo       totali, mese per mese, per natura, per soggetto, per
//                   fornitore e per tipo di fornitore
// La spesa di una registrazione è importo + manodopera (ore × costo orario
// copiato nella riga, passo 8).
// =============================================================================
import { differenzaGiorni, giorniNelMese, giorno, parti, type Giorno } from '../../regole';
import type { NaturaEffettiva, TipoSoggetto } from '../valori';

export const PERIODI = ['anno', '12m', 'prec', 'personalizzato'] as const;
export type Periodo = (typeof PERIODI)[number];

export const LIMITI_RESOCONTI = {
  /** Periodo personalizzato al massimo di 4 anni */
  giorniMassimi: 1461,
  /** Fornitori e tipi restituiti, al massimo */
  fornitori: 64,
} as const;

export interface Intervallo {
  dal: Giorno;
  al: Giorno;
}

/** Lo stesso giorno un anno prima (il 29 febbraio diventa il 28) */
export function unAnnoPrima(g: Giorno): Giorno {
  const [a, m, d] = parti(g);
  return giorno(a - 1, m, Math.min(d, giorniNelMese(a - 1, m)));
}

/** Il periodo scelto, oppure l'errore da mostrare */
export function intervalloDi(periodo: Periodo, oggi: Giorno, dal?: Giorno, al?: Giorno): Intervallo | string {
  const [a, m] = parti(oggi);
  if (periodo === 'anno') return { dal: giorno(a, 1, 1), al: oggi };
  if (periodo === 'prec') return { dal: giorno(a - 1, 1, 1), al: giorno(a - 1, 12, 31) };
  if (periodo === '12m') return { dal: m === 12 ? giorno(a, 1, 1) : giorno(a - 1, m + 1, 1), al: oggi };
  if (!dal || !al) return 'Per un periodo personalizzato servono le date dal e al';
  if (al < dal) return 'La data di fine viene prima di quella di inizio';
  if (differenzaGiorni(dal, al) + 1 > LIMITI_RESOCONTI.giorniMassimi) return 'Il periodo può essere al massimo di 4 anni';
  return { dal, al };
}

/** Lo stesso periodo un anno prima */
export const confrontoDi = (p: Intervallo): Intervallo => ({ dal: unAnnoPrima(p.dal), al: unAnnoPrima(p.al) });

/** I mesi del periodo, "AAAA-MM" */
export function mesiDi(p: Intervallo): string[] {
  const mesi: string[] = [];
  let [a, m] = parti(p.dal);
  const [af, mf] = parti(p.al);
  while (a < af || (a === af && m <= mf)) {
    mesi.push(`${a}-${String(m).padStart(2, '0')}`);
    m === 12 ? ((a += 1), (m = 1)) : (m += 1);
  }
  return mesi;
}

/**
 * Uso nel periodo: somma degli aumenti fra letture successive, a partire
 * dall'ultima lettura prima del periodo (se c'è) o dalla prima del periodo.
 * Un calo (contatore sostituito) non conta. null se non si può dire.
 */
export function usoNelPeriodo(base: number | null, letture: readonly number[]): number | null {
  const valori = base == null ? [...letture] : [base, ...letture];
  if (valori.length < 2) return null;
  let uso = 0;
  for (let i = 1; i < valori.length; i++) uso += Math.max(0, valori[i] - valori[i - 1]);
  return uso;
}

/** Spesa per km o per ora, arrotondata al decimo di centesimo; null sotto la soglia */
export function costoPerUnita(spesa: number, uso: number | null, soglia: number): number | null {
  if (uso == null || uso < soglia || uso <= 0) return null;
  return Math.round((spesa / uso) * 1000) / 1000;
}

/** Variazione in percentuale intera; null se l'anno prima non c'era spesa */
export function variazione(ora: number, prima: number): number | null {
  if (!prima) return null;
  return Math.round(((ora - prima) / prima) * 100);
}

/** Una registrazione come la usa il resoconto */
export interface RigaSpesa {
  giorno: Giorno;
  idScadenza: number;
  soggetto: { id: number; uuid: string; nome: string; identificativo: string | null; tipo: TipoSoggetto } | null;
  natura: NaturaEffettiva;
  fornitore: { uuid: string; nome: string; tipo: { chiave: string; nome: string } | null } | null;
  importo: number;
  manodopera: number;
  ore: number;
}

const tondo = (n: number) => Math.round(n * 100) / 100;
const spesaDi = (r: RigaSpesa) => r.importo + r.manodopera;
const somma = (rr: readonly RigaSpesa[], f: (r: RigaSpesa) => number) => tondo(rr.reduce((t, r) => t + f(r), 0));

/** Totali di un insieme di registrazioni */
function totali(rr: readonly RigaSpesa[]) {
  return {
    spesa: somma(rr, spesaDi),
    importi: somma(rr, r => r.importo),
    manodopera: somma(rr, r => r.manodopera),
    ore: somma(rr, r => r.ore),
    registrazioni: rr.length,
    conImporto: rr.filter(r => r.importo > 0).length,
  };
}

/** Raggruppa per chiave: spesa e numero */
function perChiave<K>(rr: readonly RigaSpesa[], chiave: (r: RigaSpesa) => K | null, valore: (r: RigaSpesa) => number) {
  const m = new Map<K, { spesa: number; n: number; righe: RigaSpesa[] }>();
  for (const r of rr) {
    const k = chiave(r);
    if (k === null) continue;
    const e = m.get(k) ?? { spesa: 0, n: 0, righe: [] };
    e.spesa += valore(r);
    e.n += 1;
    e.righe.push(r);
    m.set(k, e);
  }
  return m;
}

/** Il resoconto del periodo, con il confronto con l'anno prima (senza l'uso dei contatori: lo aggiunge chi chiama) */
export function riepilogo(ora: readonly RigaSpesa[], prima: readonly RigaSpesa[], periodo: Intervallo) {
  const mese = (g: Giorno) => g.slice(0, 7);
  const meseDopo = (g: Giorno) => {
    const [a, m] = parti(g);
    return `${a + 1}-${String(m).padStart(2, '0')}`;
  };
  const riparazioni = (rr: readonly RigaSpesa[]) => rr.filter(r => r.natura === 'riparazione');

  const perMese = mesiDi(periodo).map(m => {
    const rr = ora.filter(r => mese(r.giorno) === m);
    // lo stesso mese un anno prima: la riga dell'anno prima spostata di un anno
    const pp = prima.filter(r => meseDopo(r.giorno) === m);
    return { mese: m, importi: somma(rr, r => r.importo), manodopera: somma(rr, r => r.manodopera), prima: somma(pp, spesaDi) };
  });

  const nature = perChiave(ora, r => r.natura, spesaDi);
  const perNatura = [...nature.entries()].map(([natura, e]) => ({ natura, spesa: tondo(e.spesa), n: e.n })).sort((a, b) => b.spesa - a.spesa);

  const spesaPrima = perChiave(prima, r => r.soggetto?.id ?? null, spesaDi);
  const soggetti = perChiave(ora, r => r.soggetto?.id ?? null, spesaDi);
  const perSoggetto = [...soggetti.values()]
    .map(e => {
      const s = e.righe[0].soggetto!;
      const p = tondo(spesaPrima.get(s.id)?.spesa ?? 0);
      return { id: s.id, uuid: s.uuid, nome: s.nome, identificativo: s.identificativo, tipo: s.tipo, n: e.n, spesa: tondo(e.spesa), spesaPrima: p, variazione: variazione(e.spesa, p) };
    })
    .sort((a, b) => b.spesa - a.spesa || a.nome.localeCompare(b.nome, 'it'));

  const conFornitore = ora.filter(r => r.fornitore && r.importo > 0);
  const fornitori = perChiave(conFornitore, r => r.fornitore!.uuid, r => r.importo);
  const perFornitore = [...fornitori.values()]
    .map(e => ({ uuid: e.righe[0].fornitore!.uuid, nome: e.righe[0].fornitore!.nome, tipo: e.righe[0].fornitore!.tipo, importi: tondo(e.spesa), n: e.n }))
    .sort((a, b) => b.importi - a.importi)
    .slice(0, LIMITI_RESOCONTI.fornitori);
  const tipi = perChiave(conFornitore, r => r.fornitore!.tipo?.chiave ?? null, r => r.importo);
  const perTipoFornitore = [...tipi.entries()]
    .map(([chiave, e]) => ({ chiave, nome: e.righe[0].fornitore!.tipo!.nome, importi: tondo(e.spesa), n: e.n }))
    .sort((a, b) => b.importi - a.importi)
    .slice(0, LIMITI_RESOCONTI.fornitori);

  const rip = riparazioni(ora);
  const ripPrima = riparazioni(prima);
  return {
    totale: totali(ora),
    totalePrima: totali(prima),
    riparazioni: { spesa: somma(rip, spesaDi), guasti: new Set(rip.map(r => r.idScadenza)).size, spesaPrima: somma(ripPrima, spesaDi) },
    perMese,
    perNatura,
    perSoggetto,
    perFornitore,
    perTipoFornitore,
  };
}

