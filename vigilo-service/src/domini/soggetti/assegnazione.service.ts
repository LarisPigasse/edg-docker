// =============================================================================
// Assegnazioni — chi usa un mezzo o un'attrezzatura e da quando
// =============================================================================
// La persona assegnata e' l'"assegnatario" degli avvisi (passo 4) e cio' che
// l'addetto vede come "il mio mezzo" (B9). Si possono eliminare (errori di
// inserimento): lo storico che conta e' quello delle registrazioni.
// =============================================================================
import { Op, type WhereOptions } from 'sequelize';
import { sequelize } from '../../config/database';
import type { Contesto } from '../../core/contesto';
import { trovaNelTenant } from '../../core/db/tenant';
import { snapshot } from '../../core/services/logger';
import { traccia } from '../../core/services/traccia';
import { ValidationError } from '../../core/utils/errors';
import type { Pagina } from '../../core/utils/lista';
import { Assegnazione, Soggetto } from '../modelli';

const ASSEGNABILI = ['veicolo', 'macchina', 'attrezzatura'];
const CON = [{ association: 'soggetto' }, { association: 'persona' }];

export async function elencaAssegnazioni(ctx: Contesto, query: Record<string, unknown>, p: Pagina) {
  const where: WhereOptions<Assegnazione> = { idTenant: ctx.idTenant };
  if (query.soggetto) Object.assign(where, { idSoggetto: (await trovaNelTenant(Soggetto, 'uuidSoggetto', String(query.soggetto), ctx.idTenant, 'Soggetto')).idSoggetto });
  if (query.persona) Object.assign(where, { idPersona: (await trovaNelTenant(Soggetto, 'uuidSoggetto', String(query.persona), ctx.idTenant, 'Persona')).idSoggetto });
  if (query.inCorso) Object.assign(where, { dal: { [Op.lte]: ctx.oggi }, al: { [Op.or]: [null, { [Op.gte]: ctx.oggi }] } });
  const { rows, count } = await Assegnazione.findAndCountAll({ where, include: CON, order: [['dal', p.verso === 'ASC' ? 'DESC' : 'ASC']], limit: p.righe, offset: p.offset });
  return { righe: rows, totale: count };
}

const leggi = (ctx: Contesto, uuid: string) => trovaNelTenant(Assegnazione, 'uuidAssegnazione', uuid, ctx.idTenant, 'Assegnazione', { include: CON });

export async function creaAssegnazione(ctx: Contesto, body: { soggetto: string; persona: string; dal: string; al?: string | null; note?: string | null }) {
  const soggetto = await trovaNelTenant(Soggetto, 'uuidSoggetto', body.soggetto, ctx.idTenant, 'Soggetto');
  const persona = await trovaNelTenant(Soggetto, 'uuidSoggetto', body.persona, ctx.idTenant, 'Persona');
  if (!ASSEGNABILI.includes(soggetto.tipo)) throw new ValidationError('Si assegnano solo veicoli, macchine e attrezzature');
  if (persona.tipo !== 'persona') throw new ValidationError('Si assegna a una persona');
  if (soggetto.stato === 'dismesso' || persona.stato === 'dismesso') throw new ValidationError('Non si assegna un soggetto dismesso');
  if (body.al && body.al < body.dal) throw new ValidationError('La fine non può precedere l\'inizio');
  const a = await Assegnazione.create({
    idTenant: ctx.idTenant,
    idSoggetto: soggetto.idSoggetto,
    idPersona: persona.idSoggetto,
    dal: body.dal,
    al: body.al ?? null,
    note: body.note || null,
  });
  traccia(ctx, 'vigilo.assegnazione.creata', `${soggetto.nome} assegnato a ${persona.nome}`, null, a);
  return leggi(ctx, (await a.reload()).uuidAssegnazione);
}

export async function modificaAssegnazione(ctx: Contesto, uuid: string, body: { dal?: string; al?: string | null; note?: string | null }) {
  await sequelize.transaction(async transaction => {
    const a = await trovaNelTenant(Assegnazione, 'uuidAssegnazione', uuid, ctx.idTenant, 'Assegnazione', { transaction });
    const prima = snapshot(a);
    const dal = body.dal ?? a.dal;
    const al = 'al' in body ? (body.al ?? null) : a.al;
    if (al && al < dal) throw new ValidationError('La fine non può precedere l\'inizio');
    await a.update({ dal, al, ...('note' in body ? { note: body.note || null } : {}) }, { transaction });
    traccia(ctx, 'vigilo.assegnazione.modificata', 'Assegnazione modificata', prima, a);
  });
  return leggi(ctx, uuid);
}

export async function eliminaAssegnazione(ctx: Contesto, uuid: string): Promise<void> {
  const a = await trovaNelTenant(Assegnazione, 'uuidAssegnazione', uuid, ctx.idTenant, 'Assegnazione');
  const prima = snapshot(a);
  await a.destroy();
  traccia(ctx, 'vigilo.assegnazione.eliminata', 'Assegnazione eliminata', prima, null);
}
