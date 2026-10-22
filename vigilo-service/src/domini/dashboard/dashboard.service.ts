// =============================================================================
// Dashboard — vista "Da fare" (07-interfaccia 7.3, rivista il 2026-10-13)
// =============================================================================
// Risponde a "che cosa devo fare, e entro quando?":
//   conteggi     i riquadri per stato (con gli stessi filtri dell'elenco)
//   perControllo le scadenze da fare per controllo (per nome), con lo stato peggiore
//   perMese      quante scadenze cadono nei prossimi 12 mesi, piu' l'arretrato
//   soggetti     quanti soggetti per tipo e il loro stato peggiore
//   fatteInTempo esecuzioni degli ultimi 12 mesi registrate entro la scadenza
// Le query sono in sequenza: sono letture semplici, il pool resta libero.
// =============================================================================
import { col, fn, literal, Op, QueryTypes, type Includeable, type WhereOptions } from 'sequelize';
import { sequelize } from '../../config/database';
import type { Contesto } from '../../core/contesto';
import { aggiungiGiorni, aggiungiMesi, STATI } from '../../regole';
import { Controllo, Scadenza } from '../modelli';
import { filtri, GRAVITA } from '../scadenze/scadenza.service';

/** 4 scaduta, 3 in tolleranza, 2 in scadenza, 1 da completare, 0 in regola */
const STATO_DI_GRAVITA = ['in-regola', 'da-completare', 'in-scadenza', 'in-tolleranza', 'scaduta'] as const;
const statoDi = (g: number | string | null) => STATO_DI_GRAVITA[Number(g) || 0];

type Filtri = Awaited<ReturnType<typeof filtri>>;

/** Le include dei filtri senza colonne: servono solo a filtrare (per i raggruppamenti) */
const soloFiltro = (f: Filtri): Includeable[] => f.include.map(i => ({ ...(i as object), attributes: [] }) as Includeable);

/** I riquadri per stato; usati anche dal riepilogo degli avvisi (con il solo tenant come filtro) */
export async function conteggi(ctx: Pick<Contesto, 'oggi'>, f: Pick<Filtri, 'where' | 'include'>) {
  const conta = (extra: Record<string, unknown>) =>
    // solo include belongsTo: una riga per scadenza, niente distinct
    Scadenza.count({ where: { ...f.where, chiusaIl: null, ...extra } as WhereOptions<Scadenza>, include: f.include });
  const n = {} as Record<(typeof STATI)[number], number>;
  for (const stato of STATI) n[stato] = await conta({ stato });
  return {
    scadute: n['scaduta'],
    inTolleranza: n['in-tolleranza'],
    entro8: await conta({ stato: 'in-scadenza', urgenzaIl: { [Op.lte]: aggiungiGiorni(ctx.oggi, 8) } }),
    entro32: await conta({ stato: 'in-scadenza', urgenzaIl: { [Op.lte]: aggiungiGiorni(ctx.oggi, 32) } }),
    inScadenza: n['in-scadenza'],
    daCompletare: n['da-completare'],
    inRegola: n['in-regola'],
    totale: STATI.reduce((t, s) => t + n[s], 0),
  };
}

async function perControllo(f: Filtri) {
  const righe = (await Scadenza.findAll({
    where: { ...f.where, chiusaIl: null, stato: { [Op.ne]: 'in-regola' } } as WhereOptions<Scadenza>,
    include: soloFiltro(f),
    attributes: [
      'idControllo',
      [fn('count', col('Scadenza.id_scadenza')), 'n'],
      [literal(`max(${GRAVITA})`), 'gravita'],
    ],
    group: ['Scadenza.id_controllo'],
    raw: true,
  })) as unknown as { idControllo: number | null; n: string; gravita: number }[];
  const controlli = await Controllo.findAll({
    where: { idControllo: righe.map(r => r.idControllo).filter((x): x is number => x != null) },
    attributes: ['idControllo', 'uuidControllo', 'nome'],
  });
  const perId = new Map(controlli.map(c => [c.idControllo, c]));
  // Per nome, non per controllo: i controlli omonimi (es. tre "Tagliando", uno
  // per categoria, con cadenze diverse) per chi guarda sono una cosa sola
  const perNome = new Map<string, { uuids: string[]; nome: string; n: number; gravita: number }>();
  for (const r of righe) {
    const c = r.idControllo != null ? perId.get(r.idControllo) : undefined;
    const nome = c?.nome ?? 'Promemoria';
    const g = perNome.get(nome.toLowerCase()) ?? { uuids: [], nome, n: 0, gravita: 0 };
    if (c) g.uuids.push(c.uuidControllo);
    g.n += Number(r.n);
    g.gravita = Math.max(g.gravita, Number(r.gravita) || 0);
    perNome.set(nome.toLowerCase(), g);
  }
  return [...perNome.values()]
    .map(g => ({ uuids: g.uuids, nome: g.nome, n: g.n, peggiore: statoDi(g.gravita) }))
    .sort((a, b) => STATO_DI_GRAVITA.indexOf(b.peggiore) - STATO_DI_GRAVITA.indexOf(a.peggiore) || b.n - a.n || a.nome.localeCompare(b.nome));
}

async function perMese(ctx: Contesto, f: Filtri) {
  const inizio = `${ctx.oggi.slice(0, 7)}-01`;
  const fine = aggiungiMesi(inizio, 12);
  const righe = (await Scadenza.findAll({
    where: { ...f.where, chiusaIl: null, scadeIl: { [Op.gte]: inizio, [Op.lt]: fine } } as WhereOptions<Scadenza>,
    include: soloFiltro(f),
    attributes: [[literal(`to_char("Scadenza"."scade_il", 'YYYY-MM')`), 'mese'], [fn('count', col('Scadenza.id_scadenza')), 'n']],
    group: ['mese'],
    raw: true,
  })) as unknown as { mese: string; n: string }[];
  const n = new Map(righe.map(r => [r.mese, Number(r.n)]));
  const mesi = Array.from({ length: 12 }, (_, i) => aggiungiMesi(inizio, i).slice(0, 7)).map(mese => ({ mese, n: n.get(mese) ?? 0 }));
  const arretrato = await Scadenza.count({
    where: { ...f.where, chiusaIl: null, scadeIl: { [Op.lt]: inizio } } as WhereOptions<Scadenza>,
    include: f.include,
  });
  return { arretrato, mesi };
}

/** Per tipo: quanti soggetti in uso e lo stato peggiore fra le loro scadenze aperte */
async function soggetti(ctx: Contesto) {
  const righe = await sequelize.query<{ tipo: string; n: string; gravita: number | null; critici: string }>(
    `SELECT so.tipo, count(*) AS n, max(x.g) AS gravita, count(*) FILTER (WHERE x.g >= 3) AS critici
       FROM soggetti so
       LEFT JOIN (SELECT id_soggetto, max(${GRAVITA.split('"Scadenza".').join('')}) AS g
                    FROM scadenze WHERE id_tenant = :t AND chiusa_il IS NULL GROUP BY id_soggetto) x
              ON x.id_soggetto = so.id_soggetto
      WHERE so.id_tenant = :t AND so.stato <> 'dismesso'
      GROUP BY so.tipo`,
    { replacements: { t: ctx.idTenant }, type: QueryTypes.SELECT }
  );
  return righe.map(r => ({ tipo: r.tipo, n: Number(r.n), peggiore: r.gravita == null ? null : statoDi(r.gravita), critici: Number(r.critici) }));
}

/** Ultimi 12 mesi, mese corrente compreso: esecuzioni con una data da rispettare, e quante entro quella data */
async function fatteInTempo(ctx: Contesto) {
  const inizio = aggiungiMesi(`${ctx.oggi.slice(0, 7)}-01`, -11);
  const righe = await sequelize.query<{ mese: string; totale: string; in_tempo: string }>(
    `SELECT to_char(eseguita_il, 'YYYY-MM') AS mese, count(*) AS totale,
            count(*) FILTER (WHERE eseguita_il <= data_precedente) AS in_tempo
       FROM registrazioni
      WHERE id_tenant = :t AND tipo = 'esecuzione' AND stato <> 'respinta'
        AND data_precedente IS NOT NULL AND eseguita_il >= :inizio
      GROUP BY 1`,
    { replacements: { t: ctx.idTenant, inizio }, type: QueryTypes.SELECT }
  );
  const perMese = new Map(righe.map(r => [r.mese, r]));
  return Array.from({ length: 12 }, (_, i) => aggiungiMesi(inizio, i).slice(0, 7)).map(mese => ({
    mese,
    totale: Number(perMese.get(mese)?.totale ?? 0),
    inTempo: Number(perMese.get(mese)?.in_tempo ?? 0),
  }));
}

export async function dashboard(ctx: Contesto, q: Record<string, unknown>) {
  const f = await filtri(ctx, q);
  return {
    oggi: ctx.oggi,
    conteggi: await conteggi(ctx, f),
    perControllo: await perControllo(f),
    perMese: await perMese(ctx, f),
    soggetti: await soggetti(ctx),
    fatteInTempo: await fatteInTempo(ctx),
  };
}
