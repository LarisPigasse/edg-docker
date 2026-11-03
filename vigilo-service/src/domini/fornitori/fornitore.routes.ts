// =============================================================================
// Fornitori — /api/vigilo/fornitori (lettura: read; modifiche: write)
// =============================================================================
// Rubrica di Vigilo (officine, enti, compagnie). Si elimina solo se nessuna
// registrazione lo cita; altrimenti si disattiva. Il tipo (obbligatorio) viene
// dal catalogo comune, per chiave (F0); l'elenco dice anche quante
// registrazioni citano il fornitore e l'ultima (F1). L'elenco filtra per stato
// (attivi, disattivati, tutti) e due fornitori del tenant non possono avere lo
// stesso nome (F1).
// =============================================================================
import Joi from 'joi';
import { col, fn, literal, Op, where as condizione, type Order, type WhereOptions } from 'sequelize';
import { Router, Request, Response } from 'express';
import { contestoDi } from '../../core/contesto';
import { trovaNelTenant } from '../../core/db/tenant';
import { richiedi } from '../../core/middleware/permessi';
import { validateBody, validateParams, validateQuery } from '../../core/middleware/validate';
import { snapshot } from '../../core/services/logger';
import { traccia } from '../../core/services/traccia';
import { ConflictError } from '../../core/utils/errors';
import { comeTesto, paginaDa, rispondiLista, schemaLista } from '../../core/utils/lista';
import { createdResponse, noContentResponse, successResponse } from '../../core/utils/response';
import { Fornitore, Registrazione, TipoFornitore } from '../modelli';
import { erroreDoppione, filtroAttivo, STATI_FORNITORI, type StatoFornitori } from './fornitori';
import { tipoAssegnabile } from './tipi.service';
import { paramUuid } from '../schemi';

const CON_TIPO = { model: TipoFornitore, as: 'tipo', attributes: ['chiave', 'nome', 'attivo'] };
const USO = {
  include: [
    [literal(`(SELECT count(*) FROM registrazioni r WHERE r.id_fornitore = "Fornitore".id_fornitore)`), 'nRegistrazioni'],
    [literal(`(SELECT max(r.eseguita_il) FROM registrazioni r WHERE r.id_fornitore = "Fornitore".id_fornitore)`), 'ultimaIl'],
  ] as [ReturnType<typeof literal>, string][],
};

const presenta = (f: Fornitore) => {
  const uso = f.get() as { nRegistrazioni?: string | number; ultimaIl?: string | null };
  return {
    uuid: f.uuidFornitore,
    nome: f.nome,
    tipo: f.tipo ? { chiave: f.tipo.chiave, nome: f.tipo.nome, attivo: f.tipo.attivo } : null,
    telefono: f.telefono ?? null,
    email: f.email ?? null,
    indirizzo: f.indirizzo ?? null,
    referente: f.referente ?? null,
    note: f.note ?? null,
    attivo: f.attivo,
    ...(uso.nRegistrazioni !== undefined ? { registrazioni: Number(uso.nRegistrazioni), ultimaIl: uso.ultimaIl ?? null } : {}),
  };
};

/** Il fornitore con il suo tipo e l'uso, come lo restituiscono le rotte */
const rileggi = (idTenant: number, uuid: string) =>
  trovaNelTenant(Fornitore, 'uuidFornitore', uuid, idTenant, 'Fornitore', { include: [CON_TIPO], attributes: USO });

const testo = (max: number) => Joi.string().trim().max(max).allow('', null);
const campi = {
  nome: Joi.string().trim().min(1).max(128),
  tipo: Joi.string().max(32).label('Il tipo'),
  telefono: testo(64),
  email: Joi.string().trim().lowercase().email().max(256).allow('', null),
  indirizzo: testo(256),
  referente: testo(128),
  note: testo(4096),
  attivo: Joi.boolean(),
};
const crea = Joi.object({ ...campi, nome: campi.nome.required(), tipo: campi.tipo.required() });
const modifica = Joi.object(campi).min(1);
const lista = schemaLista(['nome', 'tipo'], 'nome', {
  stato: Joi.string().valid(...STATI_FORNITORI),
  attivo: Joi.boolean(), // il vecchio filtro, per il modulo Registra
  tipo: Joi.string().max(32),
});
/** Per tipo: per il nome del tipo, poi per nome */
const ordine = (campo: string, verso: 'ASC' | 'DESC'): Order =>
  campo === 'tipo' ? [[{ model: TipoFornitore, as: 'tipo' }, 'nome', verso], ['nome', 'ASC']] : [[campo, verso], ['nome', 'ASC']];
/** Nessun altro fornitore del tenant con lo stesso nome (maiuscole e spazi non contano), nemmeno disattivato */
async function nomeLibero(idTenant: number, nome: string, escludi?: number) {
  const esistente = await Fornitore.findOne({
    where: {
      idTenant,
      ...(escludi ? { idFornitore: { [Op.ne]: escludi } } : {}),
      [Op.and]: [condizione(fn('lower', col('nome')), fn('lower', nome.trim()))],
    } as WhereOptions<Fornitore>,
    attributes: ['nome', 'attivo'],
  });
  const errore = erroreDoppione(esistente);
  if (errore) throw new ConflictError(errore);
}

/** '' diventa null: nel database solo valori veri */
const pulisci = (b: Record<string, unknown>) => Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v === '' ? null : v]));

export const fornitoriRoutes = Router();

fornitoriRoutes.get('/fornitori', richiedi('read'), validateQuery(lista), async (req: Request, res: Response) => {
  const ctx = contestoDi(req);
  const p = paginaDa(req.query);
  const attivo = filtroAttivo(req.query.stato as StatoFornitori | undefined, req.query.attivo as unknown as boolean | undefined);
  const where: WhereOptions<Fornitore> = { idTenant: ctx.idTenant, ...(attivo !== undefined ? { attivo } : {}) };
  if (req.query.testo) Object.assign(where, { nome: { [Op.iLike]: comeTesto(String(req.query.testo)) } });
  if (req.query.tipo) {
    const tipo = await TipoFornitore.findOne({ where: { chiave: String(req.query.tipo) }, attributes: ['idTipo'] });
    Object.assign(where, { idTipo: tipo?.idTipo ?? -1 }); // tipo sconosciuto: nessun fornitore
  }
  const { rows, count } = await Fornitore.findAndCountAll({
    where,
    include: [CON_TIPO],
    attributes: USO,
    order: ordine(p.ordina, p.verso),
    limit: p.righe,
    offset: p.offset,
  });
  rispondiLista(res, rows.map(presenta), count, p);
});

fornitoriRoutes.get('/fornitori/:id', richiedi('read'), validateParams(paramUuid), async (req: Request, res: Response) => {
  const ctx = contestoDi(req);
  successResponse(res, presenta(await rileggi(ctx.idTenant, req.params.id)));
});

fornitoriRoutes.post('/fornitori', richiedi('write'), validateBody(crea), async (req: Request, res: Response) => {
  const ctx = contestoDi(req);
  const { tipo, ...dati } = pulisci(req.body);
  await nomeLibero(ctx.idTenant, String(dati.nome));
  const t = await tipoAssegnabile(String(tipo));
  const f = await Fornitore.create({ ...dati, idTipo: t.idTipo, idTenant: ctx.idTenant } as never);
  await f.reload();
  traccia(ctx, 'vigilo.fornitore.creato', `Fornitore creato: ${f.nome}`, null, f);
  createdResponse(res, presenta(await rileggi(ctx.idTenant, f.uuidFornitore)), 'Fornitore creato');
});

fornitoriRoutes.patch('/fornitori/:id', richiedi('write'), validateParams(paramUuid), validateBody(modifica), async (req: Request, res: Response) => {
  const ctx = contestoDi(req);
  const f = await trovaNelTenant(Fornitore, 'uuidFornitore', req.params.id, ctx.idTenant, 'Fornitore');
  const prima = snapshot(f);
  const { tipo, ...dati } = pulisci(req.body);
  if (dati.nome !== undefined) await nomeLibero(ctx.idTenant, String(dati.nome), f.idFornitore);
  const idTipo = tipo !== undefined ? (await tipoAssegnabile(String(tipo), f.idTipo)).idTipo : undefined;
  await f.update({ ...dati, ...(idTipo !== undefined ? { idTipo } : {}) } as never);
  traccia(ctx, 'vigilo.fornitore.modificato', `Fornitore modificato: ${f.nome}`, prima, f);
  successResponse(res, presenta(await rileggi(ctx.idTenant, f.uuidFornitore)), 'Fornitore modificato');
});

fornitoriRoutes.delete('/fornitori/:id', richiedi('write'), validateParams(paramUuid), async (req: Request, res: Response) => {
  const ctx = contestoDi(req);
  const f = await trovaNelTenant(Fornitore, 'uuidFornitore', req.params.id, ctx.idTenant, 'Fornitore');
  if (await Registrazione.count({ where: { idFornitore: f.idFornitore } }))
    throw new ConflictError('Il fornitore è citato in alcune registrazioni: si può solo disattivare');
  const prima = snapshot(f);
  await f.destroy();
  traccia(ctx, 'vigilo.fornitore.eliminato', `Fornitore eliminato: ${f.nome}`, prima, null);
  noContentResponse(res);
});
