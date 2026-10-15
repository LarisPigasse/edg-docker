// =============================================================================
// Controlli — servizio (01-dominio 1.2, 02-modello-dati)
// =============================================================================
// Oltre a leggere e scrivere il controllo, tiene allineate le sue scadenze:
//   automatico (o riattivato, o con categorie nuove) -> crea quelle mancanti
//   disattivato                                     -> chiude le aperte
//   preavvisi/tolleranza/cadenza cambiati           -> ricalcola gli stati
// =============================================================================
import { literal, Op, type Order, type Transaction, type WhereOptions } from 'sequelize';
import { sequelize } from '../../config/database';
import type { Contesto } from '../../core/contesto';
import { trovaNelTenant, trovaTuttiNelTenant } from '../../core/db/tenant';
import { snapshot } from '../../core/services/logger';
import { traccia } from '../../core/services/traccia';
import { ConflictError, ValidationError } from '../../core/utils/errors';
import { comeTesto, type Pagina } from '../../core/utils/lista';
import type { UnitaUso } from '../../regole';
import { controllaCadenza } from '../coerenza';
import { PREDEFINITI_INIZIALI } from '../impostazioni/impostazioni.model';
import { Categoria, Controllo, ControlloCategoria, ImpostazioniTenant, Scadenza } from '../modelli';
import { chiudiScadenze, generaScadenze, soggettiDelControllo } from '../scadenze/ciclo.service';
import { ricalcolaScadenze } from '../scadenze/ricalcolo.service';

const CON_CATEGORIE = { association: 'categorie', through: { attributes: [] } };
const APERTE = {
  include: [
    [literal(`(SELECT count(*) FROM scadenze s WHERE s.id_controllo = "Controllo".id_controllo AND s.chiusa_il IS NULL)`), 'nAperte'],
  ] as [ReturnType<typeof literal>, string][],
};

const ORDINI: Record<string, (verso: 'ASC' | 'DESC') => Order> = {
  ordine: v => [['ordine', v], ['nome', 'ASC']],
  nome: v => [['nome', v]],
  tipoSoggetto: v => [['tipoSoggetto', v], ['ordine', 'ASC'], ['nome', 'ASC']],
  natura: v => [['natura', v], ['nome', 'ASC']],
  creatoIl: v => [['createdAt', v]],
};

export async function elencaControlli(ctx: Contesto, query: Record<string, unknown>, p: Pagina) {
  const where: WhereOptions<Controllo> = { idTenant: ctx.idTenant };
  if (query.tipo) Object.assign(where, { tipoSoggetto: query.tipo });
  if (query.natura) Object.assign(where, { natura: query.natura });
  if (query.attivo !== undefined) Object.assign(where, { attivo: query.attivo });
  if (query.automatico !== undefined) Object.assign(where, { automatico: query.automatico });
  if (query.libreria !== undefined) Object.assign(where, { chiaveLibreria: query.libreria ? { [Op.ne]: null } : null });
  if (query.testo) Object.assign(where, { nome: { [Op.iLike]: comeTesto(String(query.testo)) } });
  if (query.categoria) {
    const cat = await trovaNelTenant(Categoria, 'uuidCategoria', String(query.categoria), ctx.idTenant, 'Categoria');
    Object.assign(where, {
      idControllo: { [Op.in]: literal(`(SELECT id_controllo FROM controlli_categorie WHERE id_categoria = ${Number(cat.idCategoria)})`) },
    });
  }
  const count = await Controllo.count({ where });
  const rows = await Controllo.findAll({
    where,
    attributes: APERTE,
    include: [CON_CATEGORIE],
    order: ORDINI[p.ordina](p.verso),
    limit: p.righe,
    offset: p.offset,
  });
  return { righe: rows, totale: count };
}

export const leggiControllo = (ctx: Contesto, uuid: string, transaction?: Transaction) =>
  trovaNelTenant(Controllo, 'uuidControllo', uuid, ctx.idTenant, 'Controllo', { attributes: APERTE, include: [CON_CATEGORIE], transaction });

/** Categorie richieste (uuid) del tenant e dello stesso tipo del controllo */
async function categorieDa(ctx: Contesto, uuids: string[], tipo: string, transaction: Transaction): Promise<Categoria[]> {
  const categorie = await trovaTuttiNelTenant(Categoria, 'uuidCategoria', uuids, ctx.idTenant, 'Categoria', transaction);
  if (categorie.some(c => c.tipoSoggetto !== tipo)) throw new ValidationError('Le categorie devono essere dello stesso tipo di soggetto del controllo');
  return categorie;
}

/** Controlli di significato sulla cadenza con le categorie scelte */
function verifica(c: Controllo, categorie: Categoria[]): void {
  controllaCadenza(c.cadenza, c.tipoSoggetto, c.cadenza.uso ? categorie.map(k => k.contatori as UnitaUso[]) : null);
}

async function impostaCategorie(ctx: Contesto, c: Controllo, categorie: Categoria[], transaction: Transaction): Promise<void> {
  await ControlloCategoria.destroy({ where: { idControllo: c.idControllo }, transaction });
  if (categorie.length)
    await ControlloCategoria.bulkCreate(
      categorie.map(k => ({ idControllo: c.idControllo, idCategoria: k.idCategoria, idTenant: ctx.idTenant })),
      { transaction }
    );
}

/** Crea le scadenze mancanti di un controllo automatico e attivo (anche per l'avvio) */
export async function generaPer(ctx: Contesto, c: Controllo, categorie: Categoria[], transaction: Transaction): Promise<number> {
  if (!c.automatico || !c.attivo) return 0;
  const soggetti = await soggettiDelControllo(c, categorie.map(k => k.idCategoria), transaction);
  const create = await generaScadenze(soggetti.map(soggetto => ({ soggetto, controllo: c })), ctx, transaction);
  return create.length;
}

export async function creaControllo(ctx: Contesto, dati: Record<string, unknown>): Promise<{ controllo: Controllo; scadenzeCreate: number }> {
  let uuid = '';
  let scadenzeCreate = 0;
  await sequelize.transaction(async transaction => {
    const imp = await ImpostazioniTenant.findByPk(ctx.idTenant, { transaction });
    const predefiniti = imp?.predefiniti ?? PREDEFINITI_INIZIALI;
    const { categorie: uuidCategorie = [], ...campi } = dati as { categorie?: string[] } & Record<string, unknown>;
    const categorie = await categorieDa(ctx, uuidCategorie, String(campi.tipoSoggetto), transaction);
    const c = Controllo.build({
      preavvisi: predefiniti.preavvisi,
      tolleranza: predefiniti.tolleranza,
      destinatari: [{ tipo: 'ufficio' }],
      ...(campi as object),
      idTenant: ctx.idTenant,
    } as never);
    verifica(c, categorie);
    await c.save({ transaction });
    await impostaCategorie(ctx, c, categorie, transaction);
    scadenzeCreate = await generaPer(ctx, c, categorie, transaction);
    traccia(ctx, 'vigilo.controllo.creato', `Controllo creato: ${c.nome}`, null, c, { scadenzeCreate });
    uuid = c.uuidControllo ?? (await c.reload({ transaction })).uuidControllo;
  });
  return { controllo: await leggiControllo(ctx, uuid), scadenzeCreate };
}

const cambiato = (a: unknown, b: unknown) => JSON.stringify(a) !== JSON.stringify(b);

export interface EsitoModifica {
  controllo: Controllo;
  scadenzeCreate: number;
  scadenzeChiuse: number;
  scadenzeRicalcolate: number;
}

export async function modificaControllo(ctx: Contesto, uuid: string, dati: Record<string, unknown>): Promise<EsitoModifica> {
  const esito = { scadenzeCreate: 0, scadenzeChiuse: 0, scadenzeRicalcolate: 0 };
  await sequelize.transaction(async transaction => {
    const c = await leggiControllo(ctx, uuid, transaction);
    const prima = snapshot(c);
    const { categorie: uuidCategorie, ...campi } = dati as { categorie?: string[] } & Record<string, unknown>;

    if (campi.tipoSoggetto && campi.tipoSoggetto !== c.tipoSoggetto && (await Scadenza.count({ where: { idControllo: c.idControllo }, transaction })))
      throw new ConflictError('Il tipo di soggetto non si cambia: il controllo ha già delle scadenze');

    const tipo = String(campi.tipoSoggetto ?? c.tipoSoggetto);
    const categoriePrima = (c.categorie ?? []).map(k => k.idCategoria).sort();
    const categorie = uuidCategorie
      ? await categorieDa(ctx, uuidCategorie, tipo, transaction)
      : await Categoria.findAll({ where: { idCategoria: categoriePrima }, transaction });
    const categorieCambiate = cambiato(categoriePrima, categorie.map(k => k.idCategoria).sort());

    const eraAttivo = c.attivo;
    const eraAutomatico = c.automatico;
    const statoCambia = (['cadenza', 'preavvisi', 'tolleranza'] as const).some(g => g in campi && cambiato(campi[g], c[g]));

    c.set(campi as never);
    verifica(c, categorie);
    await c.save({ transaction });
    if (categorieCambiate) await impostaCategorie(ctx, c, categorie, transaction);

    if (eraAttivo && !c.attivo) {
      esito.scadenzeChiuse = await chiudiScadenze({ idControllo: c.idControllo }, 'controllo-disattivato', transaction);
    } else if (c.attivo && c.automatico && (!eraAttivo || !eraAutomatico || categorieCambiate)) {
      esito.scadenzeCreate = await generaPer(ctx, c, categorie, transaction);
    }
    if (statoCambia && c.attivo) esito.scadenzeRicalcolate = await ricalcolaScadenze({ idControllo: c.idControllo }, ctx.oggi, transaction);

    traccia(ctx, 'vigilo.controllo.modificato', `Controllo modificato: ${c.nome}`, prima, c, esito);
  });
  return { controllo: await leggiControllo(ctx, uuid), ...esito };
}

/** Si elimina solo un controllo senza scadenze (nemmeno chiuse): altrimenti si disattiva */
export async function eliminaControllo(ctx: Contesto, uuid: string): Promise<void> {
  await sequelize.transaction(async transaction => {
    const c = await trovaNelTenant(Controllo, 'uuidControllo', uuid, ctx.idTenant, 'Controllo', { transaction });
    if (await Scadenza.count({ where: { idControllo: c.idControllo }, transaction }))
      throw new ConflictError('Il controllo ha uno storico di scadenze: si può solo disattivare');
    const prima = snapshot(c);
    await c.destroy({ transaction });
    traccia(ctx, 'vigilo.controllo.eliminato', `Controllo eliminato: ${c.nome}`, prima, null);
  });
}
