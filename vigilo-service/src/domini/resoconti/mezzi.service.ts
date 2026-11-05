// =============================================================================
// Resoconti — Costo dei mezzi (stima, tappa 1)
// =============================================================================
// GET /resoconti/mezzi: per ogni veicolo, macchina o attrezzatura del periodo
// (con i filtri di Spese e consumi) il costo stimato nei blocchi Possesso e
// Manutenzione e guasti, l'unità e il confronto con la categoria (regole in
// mezzi.ts). Entrano i mezzi con un costo di possesso o con spese nel periodo;
// gli archiviati prima dell'inizio no. Con `soggetto` si risponde per quel
// solo mezzo, ma il confronto si fa sempre con tutta la categoria.
// GET /resoconti/possesso/anteprima: la quota mensile, gli errori e l'avviso
// morbido mentre si scrive il costo di possesso (regole in possesso.ts).
// =============================================================================
import { QueryTypes } from 'sequelize';
import { sequelize } from '../../config/database';
import type { Contesto } from '../../core/contesto';
import { trovaNelTenant } from '../../core/db/tenant';
import { PARAMETRI } from '../../core/parametri';
import type { Giorno } from '../../regole';
import { Categoria } from '../modelli';
import { avvisoQuota, erroriPossesso, quotaMensile, TIPI_CON_POSSESSO, type DatiPossesso, type Possesso } from '../soggetti/possesso';
import type { StatoSoggetto, TipoSoggetto } from '../valori';
import { bloccoDi, costiMezzi, type MezzoDaCalcolare } from './mezzi';
import { filtroDi, periodoDi, righe, usi, type FiltriSpese } from './resoconti.service';

export interface FiltriMezzi extends FiltriSpese {
  /** uuid di un solo mezzo */
  soggetto?: string;
}

interface MezzoDb {
  id_soggetto: number;
  uuid_soggetto: string;
  nome: string;
  identificativo: string | null;
  tipo: TipoSoggetto;
  stato: StatoSoggetto;
  stato_dal: Giorno | null;
  possesso: Possesso | null;
  uuid_categoria: string | null;
  nome_categoria: string | null;
}

/** GET /resoconti/mezzi */
export async function costoMezzi(ctx: Contesto, q: FiltriMezzi) {
  const periodo = periodoDi(ctx, q);
  const f = await filtroDi(ctx, q);
  const mezzi = await sequelize.query<MezzoDb>(
    `SELECT so.id_soggetto, so.uuid_soggetto, so.nome, so.identificativo, so.tipo, so.stato,
            to_char(so.stato_dal, 'YYYY-MM-DD') AS stato_dal, so.possesso,
            ca.uuid_categoria, ca.nome AS nome_categoria
       FROM soggetti so
       LEFT JOIN categorie ca ON ca.id_categoria = so.id_categoria
      WHERE so.id_tenant = :t AND so.tipo IN (:tipi)
        AND NOT (so.stato = 'dismesso' AND so.stato_dal < :dal)${f.sql}`,
    { replacements: { t: ctx.idTenant, tipi: TIPI_CON_POSSESSO, dal: periodo.dal, ...f.valori }, type: QueryTypes.SELECT }
  );
  // le spese del periodo, per mezzo e per blocco
  const spese = new Map<number, MezzoDaCalcolare['spese']>();
  for (const r of await righe(ctx, periodo, f)) {
    if (!r.soggetto) continue;
    const s = spese.get(r.soggetto.id) ?? { obblighi: 0, manutenzione: 0, uso: 0, guasti: 0, litri: 0 };
    s[bloccoDi(r.natura)] += r.importo + r.manodopera;
    if (r.natura === 'riparazione') s.guasti += 1;
    if (r.voce === 'carburante') s.litri += r.litri ?? 0;
    spese.set(r.soggetto.id, s);
  }
  const presenti = mezzi.filter(m => m.possesso || spese.has(m.id_soggetto));
  const uso = await usi(
    ctx,
    presenti.map(m => m.id_soggetto),
    periodo
  );
  const soglie = { km: PARAMETRI.sogliaKm, ore: PARAMETRI.sogliaOre };
  const sogliaScostamento = PARAMETRI.scostamentoPercento;
  const costi = costiMezzi(
    presenti.map(m => ({
      uuid: m.uuid_soggetto,
      nome: m.nome,
      identificativo: m.identificativo,
      tipo: m.tipo,
      categoria: m.uuid_categoria ? { uuid: m.uuid_categoria, nome: m.nome_categoria! } : null,
      possesso: m.possesso ? { mensile: Number(m.possesso.mensile), dal: m.possesso.dal ?? null } : null,
      fine: m.stato === 'dismesso' ? m.stato_dal : null,
      uso: uso.get(m.id_soggetto) ?? null,
      spese: spese.get(m.id_soggetto) ?? { obblighi: 0, manutenzione: 0, uso: 0, guasti: 0, litri: 0 },
    })),
    periodo,
    soglie,
    sogliaScostamento
  );
  return {
    periodo,
    soglie,
    sogliaScostamento,
    mezzi: q.soggetto ? costi.filter(c => c.uuid === q.soggetto) : costi,
  };
}

export interface RichiestaAnteprima extends Partial<DatiPossesso> {
  /** uuid della categoria del mezzo, per l'avviso */
  categoria?: string;
  /** uuid del mezzo stesso, da non contare fra gli altri */
  escludi?: string;
}

/** GET /resoconti/possesso/anteprima */
export async function anteprimaPossesso(ctx: Contesto, q: RichiestaAnteprima) {
  const { categoria, escludi, ...dati } = q;
  const errori = erroriPossesso(dati);
  if (errori.length) return { mensile: null, errori, avviso: null };
  const mensile = quotaMensile(dati as DatiPossesso);
  if (!categoria) return { mensile, errori, avviso: null };
  const cat = await trovaNelTenant(Categoria, 'uuidCategoria', categoria, ctx.idTenant, 'Categoria');
  const altre = await sequelize.query<{ mensile: string }>(
    `SELECT possesso->>'mensile' AS mensile FROM soggetti
      WHERE id_tenant = :t AND id_categoria = :c AND possesso IS NOT NULL AND stato <> 'dismesso'
        AND (CAST(:escludi AS uuid) IS NULL OR uuid_soggetto <> CAST(:escludi AS uuid))`,
    { replacements: { t: ctx.idTenant, c: cat.idCategoria, escludi: escludi ?? null }, type: QueryTypes.SELECT }
  );
  return { mensile, errori, avviso: avvisoQuota(mensile, altre.map(a => Number(a.mensile)), cat.nome) };
}
