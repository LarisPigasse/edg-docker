// =============================================================================
// Analisi — indicatori dell'azienda (2026-11-23, fase B; regole pure)
// =============================================================================
// "Come sta andando, e che cosa conviene fare?": numeri dell'azienda, non di
// un soggetto. Tutto dai dati che Vigilo ha già:
//   flotta           parte fissa media (€ per ora di impiego, dai veicoli con
//                    il costo di possesso) e variabile media (€ per km, da
//                    tutti i veicoli) negli ultimi 12 mesi, pesate (somma dei
//                    costi ÷ somma delle ore o dei km)
//   costo pieno      per ora di servizio: fissa + conducente + costi
//                    aziendali per ora; per km: variabile + le voci orarie ÷
//                    velocità media. È il prezzo minimo di pareggio
//   stime            scostamento fra stimato e reale (medio, nel suo verso,
//                    in valore assoluto), quante entro la tolleranza; con i
//                    prezzi il margine medio e i servizi in perdita
//   struttura        costi aziendali dell'anno contro l'anno prima, voce
//                    per voce
//   margine annuo    ricavi − costi aziendali − costo dei mezzi − conducenti
//                    (ore di servizio × costo orario): una stima, lo dice
// Ciò che manca non si inventa: diventa un avviso con il rimedio.
// =============================================================================

const alCentesimo = (n: number) => Math.round(n * 100) / 100;
const alMillesimo = (n: number) => Math.round(n * 1000) / 1000;
const alDecimo = (n: number) => Math.round(n * 10) / 10;

/** Un mezzo come lo dà il costo dei mezzi, quanto serve qui */
export interface MezzoPerFlotta {
  fissi: number;
  oreImpiego: number;
  rifornimenti: number;
  km: number | null;
  totale: number;
}

/** Un mezzo con quanto serve a sceglierlo per il costo pieno */
export interface MezzoDaScegliere extends MezzoPerFlotta {
  tipo: string;
  /** Quota di possesso del periodo: zero se il mezzo non ha il costo di possesso */
  quota: number;
}

/**
 * I mezzi per il costo pieno di un servizio (2026-11-23): solo i veicoli
 * (macchine e attrezzature non fanno trasporti); la parte fissa solo da quelli
 * con il costo di possesso (senza, la loro ora di impiego costerebbe quasi
 * niente e abbasserebbe la media); la parte variabile da tutti i veicoli (pura)
 */
export function mezziPerCostoPieno<T extends MezzoDaScegliere>(mezzi: readonly T[]): { veicoli: T[]; perFissa: T[]; senzaPossesso: number } {
  const veicoli = mezzi.filter(m => m.tipo === 'veicolo');
  const perFissa = veicoli.filter(m => m.quota > 0);
  return { veicoli, perFissa, senzaPossesso: veicoli.length - perFissa.length };
}

export interface Flotta {
  mezzi: number;
  /** € per ora di impiego; null senza ore */
  fissoOra: number | null;
  /** € per km in movimento; null senza km */
  variabileKm: number | null;
  costoTotale: number;
}

/** La flotta in media, pesata (pura) */
export function flotta(mezzi: readonly MezzoPerFlotta[]): Flotta {
  const conOre = mezzi.filter(m => m.oreImpiego > 0);
  const conKm = mezzi.filter(m => m.km && m.km > 0);
  const ore = conOre.reduce((s, m) => s + m.oreImpiego, 0);
  const km = conKm.reduce((s, m) => s + (m.km ?? 0), 0);
  return {
    mezzi: mezzi.length,
    fissoOra: ore > 0 ? alCentesimo(conOre.reduce((s, m) => s + m.fissi, 0) / ore) : null,
    variabileKm: km > 0 ? alMillesimo(conKm.reduce((s, m) => s + m.rifornimenti, 0) / km) : null,
    costoTotale: alCentesimo(mezzi.reduce((s, m) => s + m.totale, 0)),
  };
}

export interface VociCostoPieno {
  /** € per ora di impiego del mezzo medio */
  mezzoOra: number | null;
  /** € per km in movimento del mezzo medio */
  mezzoKm: number | null;
  conducenteOra: number | null;
  aziendaliOra: number | null;
  velocitaMedia: number;
}

export interface CostoPieno {
  perOra: { mezzo: number; conducente: number; aziendali: number; totale: number };
  perKm: { movimento: number; orarie: number; totale: number };
  /** Voci mancanti: contano zero, e il costo pieno è parziale */
  mancanti: ('mezzo' | 'conducente' | 'aziendali')[];
}

/** Il costo pieno di un'ora e di un km di servizio: il prezzo minimo di pareggio (pura) */
export function costoPieno(v: VociCostoPieno): CostoPieno {
  const mancanti: CostoPieno['mancanti'] = [];
  if (v.mezzoOra === null && v.mezzoKm === null) mancanti.push('mezzo');
  if (v.conducenteOra === null) mancanti.push('conducente');
  if (v.aziendaliOra === null) mancanti.push('aziendali');
  const mezzo = v.mezzoOra ?? 0;
  const conducente = v.conducenteOra ?? 0;
  const aziendali = v.aziendaliOra ?? 0;
  const ora = alCentesimo(mezzo + conducente + aziendali);
  // per km: il movimento più le voci orarie distribuite sui km che si fanno in un'ora
  const orarie = v.velocitaMedia > 0 ? alMillesimo(ora / v.velocitaMedia) : 0;
  const movimento = v.mezzoKm ?? 0;
  return {
    perOra: { mezzo, conducente, aziendali, totale: ora },
    perKm: { movimento, orarie, totale: alMillesimo(movimento + orarie) },
    mancanti,
  };
}

/** Un veicolo con la sua categoria (null = senza categoria) */
export type MezzoConCategoria = MezzoDaScegliere & { categoria: string | null };

export interface CostoPienoCategoria {
  categoria: string | null;
  veicoli: number;
  conPossesso: number;
  mezzoOra: number | null;
  mezzoKm: number | null;
  perOra: number;
  perKm: number;
  mancanti: CostoPieno['mancanti'];
}

/**
 * Il costo pieno per categoria di veicoli (2026-11-23): la stessa regola della
 * flotta (fissa dai veicoli con il costo di possesso, variabile da tutti),
 * dentro ogni categoria; conducente e costi aziendali sono gli stessi. Così il
 * prezzo minimo di un trasporto col camion non lo abbassano le auto. In ordine
 * di costo per ora, dal più alto (pura)
 */
export function costoPienoPerCategoria(
  mezzi: readonly MezzoConCategoria[],
  comuni: Pick<VociCostoPieno, 'conducenteOra' | 'aziendaliOra' | 'velocitaMedia'>
): CostoPienoCategoria[] {
  const { veicoli } = mezziPerCostoPieno(mezzi);
  const gruppi = new Map<string | null, MezzoConCategoria[]>();
  for (const v of veicoli) gruppi.set(v.categoria, [...(gruppi.get(v.categoria) ?? []), v]);
  return [...gruppi.entries()]
    .map(([categoria, gruppo]) => {
      const perFissa = gruppo.filter(m => m.quota > 0);
      const mezzoOra = flotta(perFissa).fissoOra;
      const mezzoKm = flotta(gruppo).variabileKm;
      const c = costoPieno({ ...comuni, mezzoOra, mezzoKm });
      return { categoria, veicoli: gruppo.length, conPossesso: perFissa.length, mezzoOra, mezzoKm, perOra: c.perOra.totale, perKm: c.perKm.totale, mancanti: c.mancanti };
    })
    .sort((a, b) => b.perOra - a.perOra);
}

export interface StimaPerAnalisi {
  totale: number;
  costoReale: number | null;
  prezzo: number | null;
}

export interface AffidabilitaStime {
  stime: number;
  conReale: number;
  /** Media di (reale − stimato) / stimato, in %: positivo = si stima meno del reale */
  scostamentoMedio: number | null;
  /** Media dei valori assoluti, in % */
  scostamentoAssoluto: number | null;
  /** Quante entro la tolleranza (± %) */
  entroTolleranza: number;
  tolleranza: number;
  /** Se si sbaglia sempre nello stesso verso: 'sotto' = stime più basse del reale */
  verso: 'sotto' | 'sopra' | 'misto' | null;
  conPrezzo: number;
  /** Media dei margini sul prezzo, in % (sul reale se c'è, altrimenti sulla stima) */
  margineMedio: number | null;
  inPerdita: number;
}

/** Quanto ci si può fidare delle stime, e che margine danno i prezzi (pura) */
export function affidabilitaStime(righe: readonly StimaPerAnalisi[], tolleranza = 10): AffidabilitaStime {
  const reali = righe.filter(r => r.costoReale !== null && r.totale > 0);
  const scarti = reali.map(r => ((r.costoReale! - r.totale) / r.totale) * 100);
  const media = (xs: number[]) => (xs.length ? alDecimo(xs.reduce((s, x) => s + x, 0) / xs.length) : null);
  // lo stesso verso in almeno 3 casi su 4 (con almeno 4 stime) è un errore sistematico, non il caso
  let verso: AffidabilitaStime['verso'] = null;
  if (scarti.length >= 4) {
    const sopra = scarti.filter(x => x > 0).length / scarti.length;
    verso = sopra >= 0.75 ? 'sotto' : sopra <= 0.25 ? 'sopra' : 'misto';
  }
  const conPrezzo = righe.filter(r => r.prezzo !== null && r.prezzo > 0);
  const margini = conPrezzo.map(r => ((r.prezzo! - (r.costoReale ?? r.totale)) / r.prezzo!) * 100);
  return {
    stime: righe.length,
    conReale: reali.length,
    scostamentoMedio: media(scarti),
    scostamentoAssoluto: media(scarti.map(Math.abs)),
    entroTolleranza: scarti.filter(x => Math.abs(x) <= tolleranza).length,
    tolleranza,
    verso,
    conPrezzo: conPrezzo.length,
    margineMedio: media(margini),
    inPerdita: margini.filter(m => m < 0).length,
  };
}

export interface VoceConfronto {
  voce: string;
  nome: string;
  prima: number;
  dopo: number;
  differenza: number;
  /** Sulla voce di prima; null se prima era zero */
  percentuale: number | null;
}

/** I costi aziendali di un anno contro quelli dell'anno prima, voce per voce (pura) */
export function confrontoStruttura(
  voci: readonly { chiave: string; nome: string }[],
  prima: Partial<Record<string, number | null>>,
  dopo: Partial<Record<string, number | null>>
): { voci: VoceConfronto[]; totale: VoceConfronto } {
  const riga = (voce: string, nome: string, a: number, b: number): VoceConfronto => ({
    voce,
    nome,
    prima: alCentesimo(a),
    dopo: alCentesimo(b),
    differenza: alCentesimo(b - a),
    percentuale: a > 0 ? alDecimo(((b - a) / a) * 100) : null,
  });
  const righe = voci.map(v => riga(v.chiave, v.nome, Number(prima[v.chiave] ?? 0), Number(dopo[v.chiave] ?? 0)));
  return {
    voci: righe,
    totale: riga(
      'totale',
      'Totale',
      righe.reduce((s, r) => s + r.prima, 0),
      righe.reduce((s, r) => s + r.dopo, 0)
    ),
  };
}

export interface MargineAnno {
  ricavi: number;
  costi: { aziendali: number; mezzi: number; conducenti: number; totale: number };
  euro: number;
  /** Sui ricavi; null se i ricavi sono zero */
  percentuale: number | null;
}

/** Il margine dell'anno: ricavi meno tutti i costi che Vigilo conosce o stima (pura) */
export function margineAnno(ricavi: number, aziendali: number, mezzi: number, conducenti: number): MargineAnno {
  const totale = alCentesimo(aziendali + mezzi + conducenti);
  const euro = alCentesimo(ricavi - totale);
  return {
    ricavi,
    costi: { aziendali: alCentesimo(aziendali), mezzi: alCentesimo(mezzi), conducenti: alCentesimo(conducenti), totale },
    euro,
    percentuale: ricavi > 0 ? alDecimo((euro / ricavi) * 100) : null,
  };
}
