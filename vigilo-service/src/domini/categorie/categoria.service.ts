// =============================================================================
// Categorie — servizio (02-modello-dati, categorie)
// =============================================================================
import { literal, Op, type Order, type WhereOptions } from 'sequelize';
import { sequelize } from '../../config/database';
import type { Contesto } from '../../core/contesto';
import { trovaNelTenant } from '../../core/db/tenant';
import { traccia } from '../../core/services/traccia';
import { ConflictError } from '../../core/utils/errors';
import { comeTesto, type Pagina } from '../../core/utils/lista';
import { snapshot } from '../../core/services/logger';
import { Categoria, Contatore, Controllo, Soggetto } from '../modelli';
import type { UnitaUso } from '../../regole';

const CONTEGGI = {
  include: [
    [literal(`(SELECT count(*) FROM soggetti s WHERE s.id_categoria = "Categoria".id_categoria AND s.stato <> 'dismesso')`), 'nSoggetti'],
    [literal(`(SELECT count(*) FROM controlli_categorie cc WHERE cc.id_categoria = "Categoria".id_categoria)`), 'nControlli'],
  ] as [ReturnType<typeof literal>, string][],
};

const ORDINI: Record<string, (verso: 'ASC' | 'DESC') => Order> = {
  ordine: v => [['ordine', v], ['nome', 'ASC']],
  nome: v => [['nome', v]],
  tipoSoggetto: v => [['tipoSoggetto', v], ['ordine', 'ASC'], ['nome', 'ASC']],
  creataIl: v => [['createdAt', v]],
};

export async function elencaCategorie(ctx: Contesto, query: Record<string, unknown>, p: Pagina) {
  const where: WhereOptions<Categoria> = { idTenant: ctx.idTenant };
  if (query.tipo) Object.assign(where, { tipoSoggetto: query.tipo });
  if (query.attiva !== undefined) Object.assign(where, { attiva: query.attiva });
  if (query.testo) Object.assign(where, { nome: { [Op.iLike]: comeTesto(String(query.testo)) } });
  const { rows, count } = await Categoria.findAndCountAll({
    where,
    attributes: CONTEGGI,
    order: ORDINI[p.ordina](p.verso),
    limit: p.righe,
    offset: p.offset,
  });
  return { righe: rows, totale: count };
}

export const leggiCategoria = (ctx: Contesto, uuid: string) =>
  trovaNelTenant(Categoria, 'uuidCategoria', uuid, ctx.idTenant, 'Categoria', { attributes: CONTEGGI });

const nomeDuplicato = (e: unknown) => (e as { name?: string }).name === 'SequelizeUniqueConstraintError';

export async function creaCategoria(ctx: Contesto, dati: Record<string, unknown>): Promise<Categoria> {
  try {
    const c = await Categoria.create({ ...(dati as object), idTenant: ctx.idTenant } as never);
    traccia(ctx, 'vigilo.categoria.creata', `Categoria creata: ${c.nome}`, null, c);
    return leggiCategoria(ctx, c.uuidCategoria ?? (await c.reload()).uuidCategoria);
  } catch (e) {
    if (nomeDuplicato(e)) throw new ConflictError('Esiste già una categoria con questo nome per questo tipo di soggetto');
    throw e;
  }
}

export async function modificaCategoria(ctx: Contesto, uuid: string, dati: Record<string, unknown>): Promise<Categoria> {
  await sequelize.transaction(async transaction => {
    const c = await trovaNelTenant(Categoria, 'uuidCategoria', uuid, ctx.idTenant, 'Categoria', { transaction });
    const prima = snapshot(c);
    if (dati.tipoSoggetto && dati.tipoSoggetto !== c.tipoSoggetto) {
      const usata =
        (await Soggetto.count({ where: { idCategoria: c.idCategoria }, transaction })) +
        (await Controllo.count({ include: [{ association: 'categorie', where: { idCategoria: c.idCategoria } }], transaction }));
      if (usata) throw new ConflictError('Il tipo di soggetto non si cambia: la categoria ha già soggetti o controlli');
    }
    const contatoriPrima = c.contatori;
    try {
      await c.update(dati as never, { transaction });
    } catch (e) {
      if (nomeDuplicato(e)) throw new ConflictError('Esiste già una categoria con questo nome per questo tipo di soggetto');
      throw e;
    }
    // Contatori aggiunti alla categoria: si aggiungono ai soggetti che non li hanno
    const nuovi = (c.contatori as UnitaUso[]).filter(u => !contatoriPrima.includes(u));
    if (nuovi.length) {
      const soggetti = await Soggetto.findAll({ where: { idCategoria: c.idCategoria, stato: { [Op.ne]: 'dismesso' } }, transaction });
      for (const s of soggetti) {
        for (const unita of nuovi) {
          const esiste = await Contatore.count({ where: { idSoggetto: s.idSoggetto, unita, nome: '' }, transaction });
          if (!esiste) await Contatore.create({ idTenant: ctx.idTenant, idSoggetto: s.idSoggetto, unita }, { transaction });
        }
      }
    }
    traccia(ctx, 'vigilo.categoria.modificata', `Categoria modificata: ${c.nome}`, prima, c);
  });
  return leggiCategoria(ctx, uuid);
}

/** Si elimina solo una categoria senza soggetti (anche dismessi): altrimenti si disattiva */
export async function eliminaCategoria(ctx: Contesto, uuid: string): Promise<void> {
  await sequelize.transaction(async transaction => {
    const c = await trovaNelTenant(Categoria, 'uuidCategoria', uuid, ctx.idTenant, 'Categoria', { transaction });
    if (await Soggetto.count({ where: { idCategoria: c.idCategoria }, transaction }))
      throw new ConflictError('La categoria ha dei soggetti: si può solo disattivare');
    const prima = snapshot(c);
    await c.destroy({ transaction });
    traccia(ctx, 'vigilo.categoria.eliminata', `Categoria eliminata: ${c.nome}`, prima, null);
  });
}
