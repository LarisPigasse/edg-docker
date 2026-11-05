// =============================================================================
// Resoconti — Spese e consumi (B10c)
// =============================================================================
// Legge le registrazioni eseguite e confermate del periodo e dello stesso
// periodo un anno prima (con i filtri: tipo di soggetto, sede, ricerca),
// le riassume con le regole pure di resoconti.ts e aggiunge, per ogni
// soggetto con spese, l'uso nel periodo dal suo contatore principale (km,
// altrimenti ore; letture anomale escluse) e il costo per km o per ora sopra
// la soglia minima (parametri VIGILO_SOGLIA_KM e VIGILO_SOGLIA_ORE).
// Le query sono in sequenza: letture semplici, il pool resta libero.
// righeCsv: il dettaglio delle stesse registrazioni per il CSV, una riga per
// spesa, al massimo VIGILO_ESPORTA_RIGHE (oltre: si restringono i filtri).
// =============================================================================
import { QueryTypes } from 'sequelize';
import { sequelize } from '../../config/database';
import type { Contesto } from '../../core/contesto';
import { trovaNelTenant } from '../../core/db/tenant';
import { PARAMETRI } from '../../core/parametri';
import { comeTesto } from '../../core/utils/lista';
import { ValidationError } from '../../core/utils/errors';
import type { Giorno, UnitaUso } from '../../regole';
import { costoManodopera, oreManodopera } from '../interventi/interventi';
import { Soggetto } from '../modelli';
import type { Esecuzione, NaturaEffettiva, RigaManodopera, TipoSoggetto, VoceRifornimento } from '../valori';
import { confrontoDi, costoPerUnita, intervalloDi, riepilogo, usoNelPeriodo, type Intervallo, type NaturaResoconto, type Periodo, type RigaSpesa } from './resoconti';
import { nomeFileCsv, testoCsv, type RigaCsv } from './csv';
import { NOMI_VOCI } from '../rifornimenti/rifornimenti';

export interface FiltriSpese {
  periodo?: Periodo;
  dal?: Giorno;
  al?: Giorno;
  tipo?: TipoSoggetto;
  sede?: string;
  testo?: string;
}

export interface Filtro {
  sql: string;
  valori: Record<string, unknown>;
}

/** I filtri come condizioni SQL sul soggetto */
export async function filtroDi(ctx: Contesto, q: FiltriSpese): Promise<Filtro> {
  const parti: string[] = [];
  const valori: Record<string, unknown> = {};
  if (q.tipo) {
    parti.push('so.tipo = :tipo');
    valori.tipo = q.tipo;
  }
  if (q.sede) {
    parti.push('so.id_sede = :sede');
    valori.sede = (await trovaNelTenant(Soggetto, 'uuidSoggetto', q.sede, ctx.idTenant, 'Sede')).idSoggetto;
  }
  if (q.testo?.trim()) {
    parti.push('(so.nome ILIKE :testo OR so.identificativo ILIKE :testo)');
    valori.testo = comeTesto(q.testo.trim());
  }
  return { sql: parti.map(p => ` AND ${p}`).join(''), valori };
}

interface RigaDb {
  giorno: Giorno;
  id_scadenza: number;
  id_soggetto: number | null;
  uuid_soggetto: string | null;
  nome_soggetto: string | null;
  identificativo: string | null;
  tipo_soggetto: TipoSoggetto | null;
  natura: NaturaEffettiva;
  uuid_fornitore: string | null;
  nome_fornitore: string | null;
  chiave_tipo: string | null;
  nome_tipo: string | null;
  importo: string | number | null;
  manodopera: RigaManodopera[] | null;
}

/** Le registrazioni eseguite e confermate di un periodo */
export async function righe(ctx: Contesto, p: Intervallo, f: Filtro): Promise<RigaSpesa[]> {
  const rr = await sequelize.query<RigaDb>(
    `SELECT to_char(r.eseguita_il, 'YYYY-MM-DD') AS giorno, r.id_scadenza, r.importo, r.manodopera,
            so.id_soggetto, so.uuid_soggetto, so.nome AS nome_soggetto, so.identificativo, so.tipo AS tipo_soggetto,
            COALESCE(sc.natura, c.natura, 'promemoria') AS natura,
            fo.uuid_fornitore, fo.nome AS nome_fornitore, tf.chiave AS chiave_tipo, tf.nome AS nome_tipo
       FROM registrazioni r
       JOIN scadenze sc ON sc.id_scadenza = r.id_scadenza
       LEFT JOIN soggetti so ON so.id_soggetto = sc.id_soggetto
       LEFT JOIN controlli c ON c.id_controllo = sc.id_controllo
       LEFT JOIN fornitori fo ON fo.id_fornitore = r.id_fornitore
       LEFT JOIN tipi_fornitore tf ON tf.id_tipo = fo.id_tipo
      WHERE r.id_tenant = :t AND r.tipo = 'esecuzione' AND r.stato = 'confermata'
        AND r.eseguita_il BETWEEN :dal AND :al${f.sql}`,
    { replacements: { t: ctx.idTenant, dal: p.dal, al: p.al, ...f.valori }, type: QueryTypes.SELECT }
  );
  // i rifornimenti del periodo (costo dei mezzi, tappa 2): natura "uso", con voce e litri
  const rif = await sequelize.query<RigaRifornimentoDb>(
    `SELECT to_char(r.fatto_il, 'YYYY-MM-DD') AS giorno, r.voce, r.litri, r.importo,
            so.id_soggetto, so.uuid_soggetto, so.nome AS nome_soggetto, so.identificativo, so.tipo AS tipo_soggetto,
            fo.uuid_fornitore, fo.nome AS nome_fornitore, tf.chiave AS chiave_tipo, tf.nome AS nome_tipo
       FROM rifornimenti r
       JOIN soggetti so ON so.id_soggetto = r.id_soggetto
       LEFT JOIN fornitori fo ON fo.id_fornitore = r.id_fornitore
       LEFT JOIN tipi_fornitore tf ON tf.id_tipo = fo.id_tipo
      WHERE r.id_tenant = :t AND r.fatto_il BETWEEN :dal AND :al${f.sql}`,
    { replacements: { t: ctx.idTenant, dal: p.dal, al: p.al, ...f.valori }, type: QueryTypes.SELECT }
  );
  const rifornimenti: RigaSpesa[] = rif.map(r => ({
    giorno: r.giorno,
    idScadenza: null,
    soggetto: { id: r.id_soggetto, uuid: r.uuid_soggetto, nome: r.nome_soggetto, identificativo: r.identificativo, tipo: r.tipo_soggetto },
    natura: 'uso',
    voce: r.voce,
    litri: r.litri == null ? null : Number(r.litri),
    fornitore: r.uuid_fornitore ? { uuid: r.uuid_fornitore, nome: r.nome_fornitore!, tipo: r.chiave_tipo ? { chiave: r.chiave_tipo, nome: r.nome_tipo! } : null } : null,
    importo: Number(r.importo),
    manodopera: 0,
    ore: 0,
  }));
  return rr
    .map((r): RigaSpesa => ({
      giorno: r.giorno,
      idScadenza: r.id_scadenza,
      soggetto:
        r.id_soggetto != null
          ? { id: r.id_soggetto, uuid: r.uuid_soggetto!, nome: r.nome_soggetto!, identificativo: r.identificativo, tipo: r.tipo_soggetto! }
          : null,
      natura: r.natura,
      fornitore: r.uuid_fornitore ? { uuid: r.uuid_fornitore, nome: r.nome_fornitore!, tipo: r.chiave_tipo ? { chiave: r.chiave_tipo, nome: r.nome_tipo! } : null } : null,
      importo: r.importo == null ? 0 : Number(r.importo),
      manodopera: costoManodopera(r.manodopera) ?? 0,
      ore: oreManodopera(r.manodopera),
    }))
    .concat(rifornimenti);
}

interface RigaRifornimentoDb {
  giorno: Giorno;
  voce: VoceRifornimento;
  litri: string | number | null;
  importo: string | number;
  id_soggetto: number;
  uuid_soggetto: string;
  nome_soggetto: string;
  identificativo: string | null;
  tipo_soggetto: TipoSoggetto;
  uuid_fornitore: string | null;
  nome_fornitore: string | null;
  chiave_tipo: string | null;
  nome_tipo: string | null;
}

export interface Uso {
  unita: UnitaUso;
  valore: number | null;
}

/** L'uso nel periodo di ogni soggetto, dal contatore principale (km prima delle ore, il "principale" prima degli altri) */
export async function usi(ctx: Contesto, idSoggetti: number[], p: Intervallo): Promise<Map<number, Uso>> {
  const risultato = new Map<number, Uso>();
  if (!idSoggetti.length) return risultato;
  const contatori = await sequelize.query<{ id_contatore: number; id_soggetto: number; unita: UnitaUso }>(
    `SELECT DISTINCT ON (id_soggetto) id_contatore, id_soggetto, unita
       FROM contatori WHERE id_tenant = :t AND id_soggetto IN (:ids)
      ORDER BY id_soggetto, (nome = '') DESC, (unita = 'km') DESC, id_contatore`,
    { replacements: { t: ctx.idTenant, ids: idSoggetti }, type: QueryTypes.SELECT }
  );
  if (!contatori.length) return risultato;
  const ids = contatori.map(c => c.id_contatore);
  const basi = await sequelize.query<{ id_contatore: number; valore: number }>(
    `SELECT DISTINCT ON (id_contatore) id_contatore, valore FROM letture
      WHERE id_contatore IN (:ids) AND NOT anomala AND letto_il < :dal
      ORDER BY id_contatore, letto_il DESC, id_lettura DESC`,
    { replacements: { ids, dal: p.dal }, type: QueryTypes.SELECT }
  );
  const letture = await sequelize.query<{ id_contatore: number; valore: number }>(
    `SELECT id_contatore, valore FROM letture
      WHERE id_contatore IN (:ids) AND NOT anomala AND letto_il BETWEEN :dal AND :al
      ORDER BY id_contatore, letto_il, id_lettura`,
    { replacements: { ids, dal: p.dal, al: p.al }, type: QueryTypes.SELECT }
  );
  const base = new Map(basi.map(b => [b.id_contatore, Number(b.valore)]));
  for (const c of contatori) {
    const valori = letture.filter(l => l.id_contatore === c.id_contatore).map(l => Number(l.valore));
    risultato.set(c.id_soggetto, { unita: c.unita, valore: usoNelPeriodo(base.get(c.id_contatore) ?? null, valori) });
  }
  return risultato;
}

/** Il periodo chiesto, oppure l'errore in parole */
export function periodoDi(ctx: Contesto, q: FiltriSpese): Intervallo {
  const periodo = intervalloDi(q.periodo ?? 'anno', ctx.oggi, q.dal, q.al);
  if (typeof periodo === 'string') throw new ValidationError(periodo);
  return periodo;
}

interface RigaCsvDb {
  giorno: Giorno;
  nome_soggetto: string | null;
  identificativo: string | null;
  tipo_soggetto: TipoSoggetto | null;
  nome_sede: string | null;
  scadenza: string | null;
  natura: NaturaResoconto;
  esecuzione: Esecuzione | null;
  litri: string | number | null;
  nome_fornitore: string | null;
  nome_tipo: string | null;
  riferimento: string | null;
  importo: string | number | null;
  manodopera: RigaManodopera[] | null;
}

/** GET /resoconti/spese/righe.csv: il dettaglio del periodo, dalla spesa più vecchia */
export async function righeCsv(ctx: Contesto, q: FiltriSpese): Promise<{ nome: string; testo: string; righe: number }> {
  const periodo = periodoDi(ctx, q);
  const f = await filtroDi(ctx, q);
  const massimo = PARAMETRI.esportaRighe;
  // registrazioni e rifornimenti insieme, dalla spesa più vecchia
  const voci = Object.entries(NOMI_VOCI).map(([k, n]) => `WHEN '${k}' THEN '${n}'`).join(' ');
  const rr = await sequelize.query<RigaCsvDb>(
    `SELECT * FROM (
       SELECT r.eseguita_il AS il, to_char(r.eseguita_il, 'YYYY-MM-DD') AS giorno, r.importo, r.manodopera, r.esecuzione, r.riferimento,
              NULL::numeric AS litri, so.nome AS nome_soggetto, so.identificativo, so.tipo AS tipo_soggetto, se.nome AS nome_sede,
              COALESCE(sc.titolo, c.nome) AS scadenza, COALESCE(sc.natura, c.natura, 'promemoria') AS natura,
              fo.nome AS nome_fornitore, tf.nome AS nome_tipo, 0 AS ordine, r.id_registrazione AS id
         FROM registrazioni r
         JOIN scadenze sc ON sc.id_scadenza = r.id_scadenza
         LEFT JOIN soggetti so ON so.id_soggetto = sc.id_soggetto
         LEFT JOIN soggetti se ON se.id_soggetto = so.id_sede
         LEFT JOIN controlli c ON c.id_controllo = sc.id_controllo
         LEFT JOIN fornitori fo ON fo.id_fornitore = r.id_fornitore
         LEFT JOIN tipi_fornitore tf ON tf.id_tipo = fo.id_tipo
        WHERE r.id_tenant = :t AND r.tipo = 'esecuzione' AND r.stato = 'confermata'
          AND r.eseguita_il BETWEEN :dal AND :al${f.sql}
       UNION ALL
       SELECT r.fatto_il, to_char(r.fatto_il, 'YYYY-MM-DD'), r.importo, NULL::jsonb, NULL, r.riferimento,
              r.litri, so.nome, so.identificativo, so.tipo, se.nome,
              CASE r.voce ${voci} END, 'uso',
              fo.nome, tf.nome, 1, r.id_rifornimento
         FROM rifornimenti r
         JOIN soggetti so ON so.id_soggetto = r.id_soggetto
         LEFT JOIN soggetti se ON se.id_soggetto = so.id_sede
         LEFT JOIN fornitori fo ON fo.id_fornitore = r.id_fornitore
         LEFT JOIN tipi_fornitore tf ON tf.id_tipo = fo.id_tipo
        WHERE r.id_tenant = :t AND r.fatto_il BETWEEN :dal AND :al${f.sql}
     ) spese
     ORDER BY il, nome_soggetto NULLS LAST, ordine, id
     LIMIT :limite`,
    { replacements: { t: ctx.idTenant, dal: periodo.dal, al: periodo.al, limite: massimo + 1, ...f.valori }, type: QueryTypes.SELECT }
  );
  if (rr.length > massimo) {
    throw new ValidationError(`Oltre ${massimo} spese nel periodo: restringi il periodo o i filtri per esportarle`);
  }
  const righe: RigaCsv[] = rr.map(r => ({
    giorno: r.giorno,
    soggetto: r.nome_soggetto,
    identificativo: r.identificativo,
    tipo: r.tipo_soggetto,
    sede: r.nome_sede,
    scadenza: r.scadenza ?? '',
    natura: r.natura,
    esecuzione: r.esecuzione,
    fornitore: r.nome_fornitore,
    tipoFornitore: r.nome_tipo,
    riferimento: r.riferimento,
    litri: r.litri == null ? null : Number(r.litri),
    importo: r.importo == null ? 0 : Number(r.importo),
    ore: oreManodopera(r.manodopera),
    manodopera: costoManodopera(r.manodopera) ?? 0,
  }));
  return { nome: nomeFileCsv(periodo), testo: testoCsv(righe), righe: righe.length };
}

/** GET /resoconti/spese */
export async function spese(ctx: Contesto, q: FiltriSpese) {
  const periodo = periodoDi(ctx, q);
  const confronto = confrontoDi(periodo);
  const f = await filtroDi(ctx, q);
  const ora = await righe(ctx, periodo, f);
  const prima = await righe(ctx, confronto, f);
  const r = riepilogo(ora, prima, periodo);
  const uso = await usi(ctx, r.perSoggetto.map(s => s.id), periodo);
  const soglie = { km: PARAMETRI.sogliaKm, ore: PARAMETRI.sogliaOre };
  return {
    periodo,
    confronto,
    soglie,
    ...r,
    perSoggetto: r.perSoggetto.map(({ id, ...s }) => {
      const u = uso.get(id) ?? null;
      return { ...s, uso: u, costoPerUnita: u ? costoPerUnita(s.spesa, u.valore, soglie[u.unita]) : null };
    }),
  };
}
