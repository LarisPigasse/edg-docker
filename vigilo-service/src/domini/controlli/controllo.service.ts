// =============================================================================
// Controlli — servizio (01-dominio 1.2, 02-modello-dati)
// =============================================================================
// Oltre a leggere e scrivere il controllo, tiene allineate le sue scadenze:
//   automatico (o riattivato, o con categorie nuove) -> crea quelle mancanti
//   disattivato                                     -> chiude le aperte
//   riattivato                                      -> riapre quelle chiuse, con le date
//   categorie cambiate                              -> chiude quelle fuori ambito, riapre
//                                                      quelle rientrate, con le date
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
import { chiudiFuoriAmbito, chiudiScadenze, generaScadenze, riapriScadenzeChiuse, soggettiDelControllo } from '../scadenze/ciclo.service';
import { ricalcolaScadenze } from '../scadenze/ricalcolo.service';
import { frasiControllo } from './controllo.presenta';

const CON_CATEGORIE = { association: 'categorie', through: { attributes: [] } };
const APERTE = {
  include: [
    [literal(`(SELECT count(*) FROM scadenze s WHERE s.id_controllo = "Controllo".id_controllo AND s.chiusa_il IS NULL)`), 'nAperte'],
    // senza nessuna scadenza, nemmeno chiusa: si può eliminare (2026-11-19)
    [literal(`NOT EXISTS (SELECT 1 FROM scadenze s WHERE s.id_controllo = "Controllo".id_controllo)`), 'eliminabile'],
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

/** Il cuore della creazione, dentro una transazione data: comune alla creazione e alla sua anteprima */
async function creaNellaTransazione(ctx: Contesto, dati: Record<string, unknown>, transaction: Transaction): Promise<{ c: Controllo; scadenzeCreate: number }> {
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
  const scadenzeCreate = await generaPer(ctx, c, categorie, transaction);
  return { c, scadenzeCreate };
}

export async function creaControllo(ctx: Contesto, dati: Record<string, unknown>): Promise<{ controllo: Controllo; scadenzeCreate: number }> {
  let uuid = '';
  let scadenzeCreate = 0;
  await sequelize.transaction(async transaction => {
    const creato = await creaNellaTransazione(ctx, dati, transaction);
    scadenzeCreate = creato.scadenzeCreate;
    traccia(ctx, 'vigilo.controllo.creato', `Controllo creato: ${creato.c.nome}`, null, creato.c, { scadenzeCreate });
    uuid = creato.c.uuidControllo ?? (await creato.c.reload({ transaction })).uuidControllo;
  });
  return { controllo: await leggiControllo(ctx, uuid), scadenzeCreate };
}

/**
 * Che cosa succederebbe creando il controllo, senza crearlo (2026-11-19):
 * la stessa creazione in una transazione che poi si annulla. Quante scadenze
 * nascerebbero e le frasi in parole; gli errori (nome già usato, cadenza non
 * coerente) arrivano come per la creazione.
 */
export async function anteprimaCreazione(ctx: Contesto, dati: Record<string, unknown>): Promise<{ scadenzeCreate: number; frasi: ReturnType<typeof frasiControllo> }> {
  const transaction = await sequelize.transaction();
  try {
    const { c, scadenzeCreate } = await creaNellaTransazione(ctx, dati, transaction);
    return { scadenzeCreate, frasi: frasiControllo(c) };
  } finally {
    await transaction.rollback();
  }
}

const cambiato = (a: unknown, b: unknown) => JSON.stringify(a) !== JSON.stringify(b);

export interface EsitoModifica {
  controllo: Controllo;
  scadenzeCreate: number;
  scadenzeChiuse: number;
  /** Riattivazione: riaperte con le loro date (2026-11-19) */
  scadenzeRiaperte: number;
  scadenzeRicalcolate: number;
}

export type EsitoScadenze = Omit<EsitoModifica, 'controllo'>;

/**
 * Il cuore della modifica, comune al PATCH e agli aggiornamenti della libreria
 * (B10b): scrive i campi, le categorie (null = invariate) e tiene allineate le
 * scadenze. Il controllo arriva con le sue categorie; nessuna traccia (la
 * scrive chi chiama).
 */
export async function applicaAlControllo(
  ctx: Contesto,
  c: Controllo,
  campi: Record<string, unknown>,
  nuoveCategorie: Categoria[] | null,
  transaction: Transaction
): Promise<EsitoScadenze> {
  const esito = { scadenzeCreate: 0, scadenzeChiuse: 0, scadenzeRiaperte: 0, scadenzeRicalcolate: 0 };
  const categoriePrima = (c.categorie ?? []).map(k => k.idCategoria).sort();
  const categorie = nuoveCategorie ?? (await Categoria.findAll({ where: { idCategoria: categoriePrima }, transaction }));
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
  } else if (c.attivo) {
    const idCategorie = categorie.map(k => k.idCategoria);
    // categorie cambiate: fuori chi non c'entra più, e si riaprono, con le loro date, quelle di chi rientra
    if (categorieCambiate) {
      esito.scadenzeChiuse = await chiudiFuoriAmbito(c, idCategorie, transaction);
      esito.scadenzeRiaperte += await riapriScadenzeChiuse(c, idCategorie, 'fuori-ambito', ctx.oggi, transaction);
    }
    // riattivato: si riaprono, con le loro date, quelle chiuse dalla disattivazione
    if (!eraAttivo) esito.scadenzeRiaperte += await riapriScadenzeChiuse(c, idCategorie, 'controllo-disattivato', ctx.oggi, transaction);
    // poi nascono solo quelle che mancano (soggetti nuovi, categorie nuove)
    if (c.attivo && c.automatico && (!eraAttivo || !eraAutomatico || categorieCambiate)) esito.scadenzeCreate = await generaPer(ctx, c, categorie, transaction);
  }
  if (statoCambia && c.attivo) esito.scadenzeRicalcolate = await ricalcolaScadenze({ idControllo: c.idControllo }, ctx.oggi, transaction);
  return esito;
}

export async function modificaControllo(ctx: Contesto, uuid: string, dati: Record<string, unknown>): Promise<EsitoModifica> {
  let esito: EsitoScadenze = { scadenzeCreate: 0, scadenzeChiuse: 0, scadenzeRiaperte: 0, scadenzeRicalcolate: 0 };
  await sequelize.transaction(async transaction => {
    const c = await leggiControllo(ctx, uuid, transaction);
    const prima = snapshot(c);
    const { categorie: uuidCategorie, ...campi } = dati as { categorie?: string[] } & Record<string, unknown>;

    if (campi.tipoSoggetto && campi.tipoSoggetto !== c.tipoSoggetto && (await Scadenza.count({ where: { idControllo: c.idControllo }, transaction })))
      throw new ConflictError('Il tipo di soggetto non si cambia: il controllo ha già delle scadenze');

    const tipo = String(campi.tipoSoggetto ?? c.tipoSoggetto);
    const categorie = uuidCategorie ? await categorieDa(ctx, uuidCategorie, tipo, transaction) : null;
    esito = await applicaAlControllo(ctx, c, campi, categorie, transaction);
    traccia(ctx, 'vigilo.controllo.modificato', `Controllo modificato: ${c.nome}`, prima, c, esito);
  });
  return { controllo: await leggiControllo(ctx, uuid), ...esito };
}

/**
 * Che cosa cambierebbe salvando la modifica, senza salvarla (2026-11-19): la
 * stessa modifica in una transazione che poi si annulla, così i conteggi
 * (ricalcolate, chiuse, riaperte, create) sono quelli veri e la regola è una
 * sola. Nessuna traccia; il segnale agli avvisi che il ricalcolo manda
 * rigenera dallo stato invariato, senza effetti.
 */
export async function anteprimaModifica(
  ctx: Contesto,
  uuid: string,
  dati: Record<string, unknown>
): Promise<EsitoScadenze & { scadenzeAperte: number; frasi: ReturnType<typeof frasiControllo> }> {
  const transaction = await sequelize.transaction();
  try {
    const c = await leggiControllo(ctx, uuid, transaction);
    const scadenzeAperte = await Scadenza.count({ where: { idControllo: c.idControllo, chiusaIl: null }, transaction });
    const { categorie: uuidCategorie, ...campi } = dati as { categorie?: string[] } & Record<string, unknown>;
    if (campi.tipoSoggetto && campi.tipoSoggetto !== c.tipoSoggetto && (await Scadenza.count({ where: { idControllo: c.idControllo }, transaction })))
      throw new ConflictError('Il tipo di soggetto non si cambia: il controllo ha già delle scadenze');
    const tipo = String(campi.tipoSoggetto ?? c.tipoSoggetto);
    const categorie = uuidCategorie ? await categorieDa(ctx, uuidCategorie, tipo, transaction) : null;
    const esito = await applicaAlControllo(ctx, c, campi, categorie, transaction);
    // le frasi come risulterebbero (cadenza, preavvisi, tolleranza in parole), per l'editor
    return { ...esito, scadenzeAperte, frasi: frasiControllo(c) };
  } finally {
    await transaction.rollback();
  }
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
