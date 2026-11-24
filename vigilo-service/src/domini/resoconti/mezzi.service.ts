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
// GET /resoconti/mezzi/:id/andamento: i tre blocchi del costo mese per mese
// (regole in andamento.ts), anche "da quando c'è" (2026-11-16).
// =============================================================================
import { QueryTypes } from 'sequelize';
import { sequelize } from '../../config/database';
import type { Contesto } from '../../core/contesto';
import { trovaNelTenant } from '../../core/db/tenant';
import { PARAMETRI } from '../../core/parametri';
import { aggiungiGiorni, differenzaGiorni, type Giorno } from '../../regole';
import { ValidationError } from '../../core/utils/errors';
import { Categoria, ImpostazioniTenant, Soggetto } from '../modelli';
import { stimaEffettiva } from '../impostazioni/limiti';
import { componentiMezzo } from './componenti';
import { avvisoQuota, erroriPossesso, quotaMensile, TIPI_CON_POSSESSO, type DatiPossesso, type Possesso } from '../soggetti/possesso';
import type { StatoSoggetto, TipoSoggetto } from '../valori';
import { bloccoDi, costiMezzi, type MezzoDaCalcolare } from './mezzi';
import { andamentoCosti, inizioLettura, soloMesiChiusi, ultimiMesiChiusi } from './andamento';
import { intervalloDi, LIMITI_RESOCONTI, type Intervallo, type Periodo } from './resoconti';
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
  // le due componenti di ogni mezzo: fissa per ora di impiego, variabile per km (o ora motore)
  const imp = await ImpostazioniTenant.findByPk(ctx.idTenant, { attributes: ['idTenant', 'stima'] });
  const oreImpiegoAnnue = stimaEffettiva(imp?.stima).oreImpiegoAnnue;
  const scelti = q.soggetto ? costi.filter(c => c.uuid === q.soggetto) : costi;
  return {
    periodo,
    soglie,
    sogliaScostamento,
    /** Le ore di impiego annue con cui si calcola la parte fissa (parametro della stima) */
    oreImpiegoAnnue,
    mezzi: scelti.map(c => ({ ...c, componenti: componentiMezzo(c, oreImpiegoAnnue) })),
  };
}

/**
 * I periodi dell'andamento: "chiusi" (gli ultimi 12 mesi chiusi, predefinito),
 * quelli di Spese e consumi ("12m" fino a oggi, come la scheda dei costi, con il
 * mese in corso) e "da quando c'è"
 */
export type PeriodoAndamento = Periodo | 'chiusi' | 'inizio';

export interface FiltriAndamento {
  periodo?: PeriodoAndamento;
  dal?: Giorno;
  al?: Giorno;
}

/**
 * GET /resoconti/mezzi/:id/andamento: il costo del mezzo mese per mese. Solo
 * mesi chiusi (predefinito: gli ultimi 12), tranne "12m": fino a oggi come la
 * scheda dei costi, con il mese in corso (segnalato in meseInCorso).
 */
export async function andamentoMezzo(ctx: Contesto, uuid: string, q: FiltriAndamento) {
  const s = await trovaNelTenant(Soggetto, 'uuidSoggetto', uuid, ctx.idTenant, 'Mezzo');
  if (!TIPI_CON_POSSESSO.includes(s.tipo)) throw new ValidationError('L\'andamento dei costi vale per veicoli, macchine e attrezzature');
  const possesso = s.possesso ? { mensile: Number(s.possesso.mensile), dal: s.possesso.dal ?? null } : null;
  const fine = s.stato === 'dismesso' ? (s.statoDal ?? null) : null;
  const infoPossesso = s.possesso ? { mensile: Number(s.possesso.mensile), modo: s.possesso.modo, dal: s.possesso.dal ?? null } : null;
  let periodo: Intervallo;
  let troncato = false;
  if (q.periodo === 'inizio') {
    // da quando c'è: dalla data del possesso, o da quando è stato inserito; al massimo gli ultimi 4 anni
    const al = fine && fine < ctx.oggi ? fine : ctx.oggi;
    let dal = possesso?.dal ?? (s.createdAt.toISOString().slice(0, 10) as Giorno);
    if (differenzaGiorni(dal, al) + 1 > LIMITI_RESOCONTI.giorniMassimi) {
      dal = aggiungiGiorni(al, -(LIMITI_RESOCONTI.giorniMassimi - 1));
      troncato = true;
    }
    periodo = { dal: dal > al ? al : dal, al };
  } else if ((q.periodo ?? 'chiusi') === 'chiusi') {
    periodo = ultimiMesiChiusi(ctx.oggi, 12);
  } else {
    const p = intervalloDi(q.periodo as Periodo, ctx.oggi, q.dal, q.al);
    if (typeof p === 'string') throw new ValidationError(p);
    periodo = p;
  }
  // solo dati consolidati: il mese in corso non entra (sembrerebbe un calo), tranne in "12m" (come la scheda)
  const comeLaScheda = q.periodo === '12m';
  const chiuso = comeLaScheda ? periodo : soloMesiChiusi(periodo, ctx.oggi);
  if (!chiuso) {
    return { periodo, troncato, nessunMeseChiuso: true, obblighiRipartiti: true, meseInCorso: null, possesso: infoPossesso, mesi: [], totali: { quota: 0, obblighi: 0, possesso: 0, manutenzione: 0, uso: 0, totale: 0 }, quote: { possesso: 0, manutenzione: 0, uso: 0 } };
  }
  periodo = chiuso;
  // le spese del mezzo dal primo mese che ha ancora rate di obblighi nel periodo
  const spese = (
    await righe(ctx, { dal: inizioLettura(periodo), al: periodo.al }, { sql: ' AND so.id_soggetto = :idSoggetto', valori: { idSoggetto: s.idSoggetto } })
  ).map(r => ({ giorno: r.giorno, blocco: bloccoDi(r.natura), spesa: r.importo + r.manodopera }));
  return {
    periodo,
    /** "Da quando c'è" oltre i 4 anni: si mostrano gli ultimi 4 */
    troncato,
    /** Il periodo non contiene ancora mesi chiusi (es. anno in corso a gennaio) */
    nessunMeseChiuso: false,
    /** "12m": obblighi per intero nel mese del pagamento, come la scheda; altrimenti ripartiti sui 12 mesi */
    obblighiRipartiti: !comeLaScheda,
    /** "AAAA-MM" del mese in corso se il periodo lo contiene (solo "12m"): è parziale, fino a oggi */
    meseInCorso: comeLaScheda && periodo.al >= `${ctx.oggi.slice(0, 7)}-01` ? ctx.oggi.slice(0, 7) : null,
    possesso: infoPossesso,
    ...andamentoCosti({ periodo, possesso, fine, spese, ripartisciObblighi: !comeLaScheda }),
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
