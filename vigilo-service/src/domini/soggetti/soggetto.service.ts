// =============================================================================
// Soggetti — servizio (01-dominio 1.1, 02-modello-dati)
// =============================================================================
// Oltre ai dati del soggetto tiene allineato cio' che ne dipende:
//   creato / nuova categoria  -> contatori della categoria e scadenze dei
//                                controlli automatici
//   dati cambiati             -> le scadenze "da completare" che ora si
//                                possono calcolare (es. immatricolazione) prendono la data
//   dismesso                  -> scadenze aperte chiuse, assegnazioni terminate
//   tornato in servizio       -> scadenze dei controlli automatici di nuovo
// =============================================================================
import { literal, Op, type Order, type Transaction, type WhereOptions } from 'sequelize';
import { sequelize } from '../../config/database';
import type { Contesto } from '../../core/contesto';
import { trovaNelTenant } from '../../core/db/tenant';
import { snapshot } from '../../core/services/logger';
import { traccia } from '../../core/services/traccia';
import { ConflictError, ForbiddenError, ValidationError } from '../../core/utils/errors';
import { comeTesto, type Pagina } from '../../core/utils/lista';
import { parti, primaScadenza, type Giorno } from '../../regole';
import { eliminaAllegatiDi } from '../allegati/allegati.service';
import { ambitoDi, verificaAmbito } from '../ambito/ambito.service';
import { erroriInterventi } from '../impostazioni/limiti';
import { Assegnazione, Categoria, Contatore, Controllo, Lettura, Registrazione, Scadenza, Soggetto } from '../modelli';
import { chiudiScadenze, controlliAutomaticiPer, generaScadenze, riapriScadenzeArchiviate } from '../scadenze/ciclo.service';
import { ricalcolaScadenze } from '../scadenze/ricalcolo.service';
import type { StatoSoggetto, TipoSoggetto } from '../valori';
import { validaCampi } from './campi';
import { IDENTIFICATIVO, normalizzaIdentificativo, validaDati } from './datiTipo';

const GRAVITA_SQL = `CASE s.stato WHEN 'scaduta' THEN 4 WHEN 'in-tolleranza' THEN 3 WHEN 'in-scadenza' THEN 2 WHEN 'da-completare' THEN 1 ELSE 0 END`;
const RIASSUNTO = {
  include: [
    [literal(`(SELECT count(*) FROM scadenze s WHERE s.id_soggetto = "Soggetto".id_soggetto AND s.chiusa_il IS NULL)`), 'nAperte'],
    [
      literal(
        `(SELECT s.stato FROM scadenze s WHERE s.id_soggetto = "Soggetto".id_soggetto AND s.chiusa_il IS NULL ORDER BY ${GRAVITA_SQL} DESC LIMIT 1)`
      ),
      'peggiore',
    ],
    [literal(`(SELECT min(s.urgenza_il) FROM scadenze s WHERE s.id_soggetto = "Soggetto".id_soggetto AND s.chiusa_il IS NULL)`), 'urgenza'],
  ] as [ReturnType<typeof literal>, string][],
};
const RIFERIMENTI = [
  { association: 'categoria' },
  { association: 'sede' },
  { association: 'referente' },
];

const ORDINI: Record<string, (verso: 'ASC' | 'DESC') => Order> = {
  nome: v => [['nome', v]],
  identificativo: v => [['identificativo', v], ['nome', 'ASC']],
  tipo: v => [['tipo', v], ['nome', 'ASC']],
  creatoIl: v => [['createdAt', v]],
};

export async function elencaSoggetti(ctx: Contesto, query: Record<string, unknown>, p: Pagina) {
  const where: WhereOptions<Soggetto> = { idTenant: ctx.idTenant };
  const ambito = await ambitoDi(ctx);
  if (!ambito.tutto) Object.assign(where, { idSoggetto: ambito.idSoggetti }); // l'addetto: la sua persona e i mezzi che usa (B9b)
  if (query.tipo) Object.assign(where, { tipo: query.tipo });
  if (!query.stato || query.stato === 'attivi') Object.assign(where, { stato: { [Op.ne]: 'dismesso' } });
  else Object.assign(where, { stato: query.stato });
  if (query.categoria) {
    const c = await trovaNelTenant(Categoria, 'uuidCategoria', String(query.categoria), ctx.idTenant, 'Categoria');
    Object.assign(where, { idCategoria: c.idCategoria });
  }
  if (query.sede) {
    const s = await trovaNelTenant(Soggetto, 'uuidSoggetto', String(query.sede), ctx.idTenant, 'Sede');
    Object.assign(where, { idSede: s.idSoggetto });
  }
  if (query.testo) {
    const t = comeTesto(String(query.testo));
    Object.assign(where, { [Op.or]: [{ nome: { [Op.iLike]: t } }, { identificativo: { [Op.iLike]: t } }, { codice: { [Op.iLike]: t } }] });
  }
  const count = await Soggetto.count({ where });
  const rows = await Soggetto.findAll({
    where,
    attributes: RIASSUNTO,
    include: RIFERIMENTI,
    // urgenza: la prima data da curare fra le scadenze aperte (calcolata nella query)
    order: p.ordina === 'urgenza' ? [literal(`"urgenza" ${p.verso} NULLS LAST`), ['nome', 'ASC']] : ORDINI[p.ordina](p.verso),
    limit: p.righe,
    offset: p.offset,
  });
  return { righe: rows, totale: count };
}

/** Il soggetto con riferimenti, contatori e assegnazioni in corso */
export async function leggiSoggetto(ctx: Contesto, uuid: string, transaction?: Transaction): Promise<Soggetto> {
  const s = await trovaNelTenant(Soggetto, 'uuidSoggetto', uuid, ctx.idTenant, 'Soggetto', { attributes: RIASSUNTO, include: RIFERIMENTI, transaction });
  await verificaAmbito(ctx, s.idSoggetto, 'Soggetto');
  const contatori = await Contatore.findAll({ where: { idSoggetto: s.idSoggetto }, order: [['unita', 'ASC'], ['nome', 'ASC']], transaction });
  const assegnazioni = await Assegnazione.findAll({
    where: { [Op.or]: [{ idSoggetto: s.idSoggetto }, { idPersona: s.idSoggetto }], al: { [Op.or]: [null, { [Op.gte]: ctx.oggi }] } } as never,
    include: [{ association: 'persona' }, { association: 'soggetto' }],
    order: [['dal', 'DESC']],
    transaction,
  });
  // come fa Sequelize con gli include: proprieta' dell'istanza (setDataValue non basta, L055)
  Object.assign(s, { contatori, assegnazioni });
  return s;
}

const duplicato = (e: unknown) => (e as { name?: string }).name === 'SequelizeUniqueConstraintError';

async function categoriaDa(ctx: Contesto, uuid: string | null | undefined, tipo: TipoSoggetto, transaction: Transaction): Promise<Categoria | null> {
  if (!uuid) return null;
  const c = await trovaNelTenant(Categoria, 'uuidCategoria', uuid, ctx.idTenant, 'Categoria', { transaction });
  if (c.tipoSoggetto !== tipo) throw new ValidationError('La categoria è di un altro tipo di soggetto');
  return c;
}

async function collegatoDa(ctx: Contesto, uuid: string | null | undefined, tipo: TipoSoggetto, cosa: string, transaction: Transaction): Promise<number | null> {
  if (!uuid) return null;
  const s = await trovaNelTenant(Soggetto, 'uuidSoggetto', uuid, ctx.idTenant, cosa, { transaction });
  if (s.tipo !== tipo) throw new ValidationError(`${cosa}: serve un soggetto di tipo ${tipo}`);
  return s.idSoggetto;
}

function datiECampi(tipo: TipoSoggetto, categoria: Categoria | null, dati: unknown, campi: unknown) {
  const d = validaDati(tipo, dati);
  const c = validaCampi(categoria?.campi ?? [], (campi ?? {}) as Record<string, unknown>);
  const errori = [...d.errori, ...c.errori];
  if (errori.length) throw new ValidationError(`Dati non validi: ${errori.join('; ')}`);
  return { dati: d.valore, campi: c.valore };
}

/** Contatori della categoria che il soggetto non ha ancora */
async function aggiungiContatori(ctx: Contesto, s: Soggetto, categoria: Categoria | null, transaction: Transaction): Promise<void> {
  for (const unita of categoria?.contatori ?? []) {
    const esiste = await Contatore.count({ where: { idSoggetto: s.idSoggetto, unita, nome: '' }, transaction });
    if (!esiste) await Contatore.create({ idTenant: ctx.idTenant, idSoggetto: s.idSoggetto, unita }, { transaction });
  }
}

async function generaAutomatiche(ctx: Contesto, s: Soggetto, transaction: Transaction): Promise<number> {
  const controlli = await controlliAutomaticiPer(s, transaction);
  return (await generaScadenze(controlli.map(controllo => ({ soggetto: s, controllo })), ctx, transaction)).length;
}

/** Le scadenze "da completare" che ora hanno la data grazie ai dati del soggetto */
async function completaDaDati(ctx: Contesto, s: Soggetto, transaction: Transaction): Promise<number> {
  const vuote = await Scadenza.findAll({
    where: { idSoggetto: s.idSoggetto, chiusaIl: null, scadeIl: null, sogliaUso: null, idControllo: { [Op.ne]: null } },
    include: [{ model: Controllo, as: 'controllo' }],
    transaction,
  });
  let completate = 0;
  for (const sc of vuote) {
    const data = sc.controllo ? primaScadenza(sc.controllo.cadenza, s.dati ?? {}, ctx.oggi) : null;
    if (data) {
      await sc.update({ scadeIl: data, giornoAncora: parti(data)[2] }, { transaction });
      completate++;
    }
  }
  if (completate) await ricalcolaScadenze({ idSoggetto: s.idSoggetto }, ctx.oggi, transaction);
  return completate;
}

function conflittoIdentificativo(tipo: TipoSoggetto): ConflictError {
  return new ConflictError(`Esiste già un soggetto di tipo ${tipo} in servizio con questo valore di ${IDENTIFICATIVO[tipo].toLowerCase()}`);
}

/** Il costo orario dal corpo della richiesta (passo 8): solo persone, solo con vigilo.costi, dentro i limiti. undefined = non cambia */
function costoOrarioDa(ctx: Contesto, tipo: TipoSoggetto, valore: unknown): number | null | undefined {
  if (valore === undefined) return undefined;
  if (!ctx.capacita.costi) throw new ForbiddenError('Per il costo orario serve il permesso vigilo.costi');
  if (valore === null) return null;
  if (tipo !== 'persona') throw new ValidationError('Il costo orario è solo delle persone');
  const errori = erroriInterventi({ costoOrario: valore as number });
  if (errori.length) throw new ValidationError(errori.join('. '));
  return valore as number;
}

export async function creaSoggetto(ctx: Contesto, body: Record<string, unknown>) {
  let uuid = '';
  let scadenzeCreate = 0;
  await sequelize.transaction(async transaction => {
    const tipo = body.tipo as TipoSoggetto;
    const categoria = await categoriaDa(ctx, body.categoria as string | null, tipo, transaction);
    const { dati, campi } = datiECampi(tipo, categoria, body.dati, body.campi);
    let s: Soggetto;
    try {
      s = await Soggetto.create(
        {
          idTenant: ctx.idTenant,
          tipo,
          idCategoria: categoria?.idCategoria ?? null,
          nome: String(body.nome),
          identificativo: normalizzaIdentificativo(tipo, body.identificativo as string | null),
          codice: (body.codice as string) || null,
          dati,
          campi,
          idSede: await collegatoDa(ctx, body.sede as string | null, 'sede', 'Sede', transaction),
          idReferente: await collegatoDa(ctx, body.referente as string | null, 'persona', 'Referente', transaction),
          note: (body.note as string) || null,
          costoOrario: costoOrarioDa(ctx, tipo, body.costoOrario) ?? null,
        },
        { transaction }
      );
    } catch (e) {
      if (duplicato(e)) throw conflittoIdentificativo(tipo);
      throw e;
    }
    await s.reload({ transaction });
    await aggiungiContatori(ctx, s, categoria, transaction);
    scadenzeCreate = await generaAutomatiche(ctx, s, transaction);
    traccia(ctx, 'vigilo.soggetto.creato', `Soggetto creato: ${s.nome}`, null, s, { scadenzeCreate });
    uuid = s.uuidSoggetto;
  });
  return { soggetto: await leggiSoggetto(ctx, uuid), scadenzeCreate };
}

export async function modificaSoggetto(ctx: Contesto, uuid: string, body: Record<string, unknown>) {
  const esito = { scadenzeCreate: 0, scadenzeCompletate: 0 };
  await sequelize.transaction(async transaction => {
    const s = await trovaNelTenant(Soggetto, 'uuidSoggetto', uuid, ctx.idTenant, 'Soggetto', { include: [{ association: 'categoria' }], transaction });
    const prima = snapshot(s);
    const cambiaCategoria = 'categoria' in body;
    const categoria = cambiaCategoria ? await categoriaDa(ctx, body.categoria as string | null, s.tipo, transaction) : (s.categoria ?? null);
    const { dati, campi } = datiECampi(
      s.tipo,
      categoria,
      { ...s.dati, ...((body.dati as object) ?? {}) },
      { ...s.campi, ...((body.campi as object) ?? {}) }
    );
    const datiCambiati = JSON.stringify(dati) !== JSON.stringify(s.dati);
    const nuovaCategoria = cambiaCategoria && (categoria?.idCategoria ?? null) !== (s.idCategoria ?? null);

    if ('nome' in body) s.nome = String(body.nome);
    if ('identificativo' in body) s.identificativo = normalizzaIdentificativo(s.tipo, body.identificativo as string | null);
    if ('codice' in body) s.codice = (body.codice as string) || null;
    if ('note' in body) s.note = (body.note as string) || null;
    if ('costoOrario' in body) s.costoOrario = costoOrarioDa(ctx, s.tipo, body.costoOrario) ?? null;
    if ('sede' in body) s.idSede = await collegatoDa(ctx, body.sede as string | null, 'sede', 'Sede', transaction);
    if ('referente' in body) s.idReferente = await collegatoDa(ctx, body.referente as string | null, 'persona', 'Referente', transaction);
    if (s.idSede === s.idSoggetto || s.idReferente === s.idSoggetto) throw new ValidationError('Un soggetto non può essere sede o referente di sé stesso');
    s.idCategoria = categoria?.idCategoria ?? null;
    s.dati = dati;
    s.campi = campi;
    try {
      await s.save({ transaction });
    } catch (e) {
      if (duplicato(e)) throw conflittoIdentificativo(s.tipo);
      throw e;
    }
    if (nuovaCategoria) {
      await aggiungiContatori(ctx, s, categoria, transaction);
      if (s.stato !== 'dismesso') esito.scadenzeCreate = await generaAutomatiche(ctx, s, transaction);
    }
    if (datiCambiati) esito.scadenzeCompletate = await completaDaDati(ctx, s, transaction);
    traccia(ctx, 'vigilo.soggetto.modificato', `Soggetto modificato: ${s.nome}`, prima, s, esito);
  });
  return { soggetto: await leggiSoggetto(ctx, uuid), ...esito };
}

export async function cambiaStato(ctx: Contesto, uuid: string, stato: StatoSoggetto, dal: Giorno = ctx.oggi) {
  const esito = { scadenzeChiuse: 0, scadenzeRiaperte: 0, scadenzeCreate: 0, assegnazioniTerminate: 0 };
  await sequelize.transaction(async transaction => {
    const s = await trovaNelTenant(Soggetto, 'uuidSoggetto', uuid, ctx.idTenant, 'Soggetto', { transaction });
    if (s.stato === stato) return;
    const prima = snapshot(s);
    const eraDismesso = s.stato === 'dismesso';
    try {
      await s.update({ stato, statoDal: dal }, { transaction });
    } catch (e) {
      if (duplicato(e)) throw conflittoIdentificativo(s.tipo);
      throw e;
    }
    if (stato === 'dismesso') {
      esito.scadenzeChiuse = await chiudiScadenze({ idSoggetto: s.idSoggetto }, 'soggetto-dismesso', transaction);
      const [n] = await Assegnazione.update(
        { al: literal(`GREATEST(dal, DATE '${dal}')`) as never },
        { where: { al: null, [Op.or]: [{ idSoggetto: s.idSoggetto }, { idPersona: s.idSoggetto }] } as never, transaction }
      );
      esito.assegnazioniTerminate = n;
    } else if (eraDismesso) {
      // prima tornano quelle chiuse dall'archiviazione (con le loro date), poi
      // nascono solo quelle che mancano (es. controlli automatici aggiunti nel frattempo)
      esito.scadenzeRiaperte = await riapriScadenzeArchiviate(s.idSoggetto, ctx.oggi, transaction);
      esito.scadenzeCreate = await generaAutomatiche(ctx, s, transaction);
    }
    traccia(ctx, 'vigilo.soggetto.stato', `${s.nome}: ${prima?.stato} → ${stato}`, prima, s, esito);
  });
  return { soggetto: await leggiSoggetto(ctx, uuid), ...esito };
}

/** Si elimina solo un soggetto senza storico (registrazioni o letture): altrimenti si dismette */
export async function eliminaSoggetto(ctx: Contesto, uuid: string): Promise<void> {
  await sequelize.transaction(async transaction => {
    const s = await trovaNelTenant(Soggetto, 'uuidSoggetto', uuid, ctx.idTenant, 'Soggetto', { transaction });
    const registrazioni = await Registrazione.count({
      include: [{ model: Scadenza, as: 'scadenza', where: { idSoggetto: s.idSoggetto }, attributes: [] }],
      transaction,
    });
    const letture = await Lettura.count({
      include: [{ model: Contatore, as: 'contatore', where: { idSoggetto: s.idSoggetto }, attributes: [] }],
      transaction,
    });
    if (registrazioni || letture) throw new ConflictError('Il soggetto ha uno storico (registrazioni o letture): si può solo dismettere');
    const prima = snapshot(s);
    // i documenti del soggetto e delle sue scadenze (che se ne vanno con lui)
    const scadenze = await Scadenza.findAll({ where: { idTenant: ctx.idTenant, idSoggetto: s.idSoggetto }, attributes: ['idScadenza'], transaction });
    await eliminaAllegatiDi(
      ctx.idTenant,
      [
        { entita: 'soggetto', idEntita: [s.idSoggetto] },
        { entita: 'scadenza', idEntita: scadenze.map(x => x.idScadenza) },
      ],
      transaction
    );
    await s.destroy({ transaction });
    traccia(ctx, 'vigilo.soggetto.eliminato', `Soggetto eliminato: ${s.nome}`, prima, null);
  });
}
