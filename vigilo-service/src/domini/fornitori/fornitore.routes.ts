// =============================================================================
// Fornitori — /api/vigilo/fornitori (lettura: read; modifiche: write)
// =============================================================================
// Rubrica di Vigilo (officine, enti, compagnie). Si elimina solo se nessuna
// registrazione lo cita; altrimenti si disattiva.
// =============================================================================
import Joi from 'joi';
import { Op, type WhereOptions } from 'sequelize';
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
import { Fornitore, Registrazione } from '../modelli';
import { paramUuid } from '../schemi';

const presenta = (f: Fornitore) => ({
  uuid: f.uuidFornitore,
  nome: f.nome,
  tipo: f.tipo ?? null,
  telefono: f.telefono ?? null,
  email: f.email ?? null,
  indirizzo: f.indirizzo ?? null,
  referente: f.referente ?? null,
  note: f.note ?? null,
  attivo: f.attivo,
});

const testo = (max: number) => Joi.string().trim().max(max).allow('', null);
const campi = {
  nome: Joi.string().trim().min(1).max(128),
  tipo: testo(64),
  telefono: testo(64),
  email: Joi.string().trim().lowercase().email().max(256).allow('', null),
  indirizzo: testo(256),
  referente: testo(128),
  note: testo(4096),
  attivo: Joi.boolean(),
};
const crea = Joi.object({ ...campi, nome: campi.nome.required() });
const modifica = Joi.object(campi).min(1);
const lista = schemaLista(['nome', 'tipo'], 'nome', { attivo: Joi.boolean() });
/** '' diventa null: nel database solo valori veri */
const pulisci = (b: Record<string, unknown>) => Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v === '' ? null : v]));

export const fornitoriRoutes = Router();

fornitoriRoutes.get('/fornitori', richiedi('read'), validateQuery(lista), async (req: Request, res: Response) => {
  const ctx = contestoDi(req);
  const p = paginaDa(req.query);
  const where: WhereOptions<Fornitore> = { idTenant: ctx.idTenant, attivo: req.query.attivo === undefined ? true : (req.query.attivo as unknown as boolean) };
  if (req.query.testo) Object.assign(where, { nome: { [Op.iLike]: comeTesto(String(req.query.testo)) } });
  const { rows, count } = await Fornitore.findAndCountAll({ where, order: [[p.ordina, p.verso], ['nome', 'ASC']], limit: p.righe, offset: p.offset });
  rispondiLista(res, rows.map(presenta), count, p);
});

fornitoriRoutes.get('/fornitori/:id', richiedi('read'), validateParams(paramUuid), async (req: Request, res: Response) => {
  const ctx = contestoDi(req);
  successResponse(res, presenta(await trovaNelTenant(Fornitore, 'uuidFornitore', req.params.id, ctx.idTenant, 'Fornitore')));
});

fornitoriRoutes.post('/fornitori', richiedi('write'), validateBody(crea), async (req: Request, res: Response) => {
  const ctx = contestoDi(req);
  const f = await Fornitore.create({ ...pulisci(req.body), idTenant: ctx.idTenant } as never);
  await f.reload();
  traccia(ctx, 'vigilo.fornitore.creato', `Fornitore creato: ${f.nome}`, null, f);
  createdResponse(res, presenta(f), 'Fornitore creato');
});

fornitoriRoutes.patch('/fornitori/:id', richiedi('write'), validateParams(paramUuid), validateBody(modifica), async (req: Request, res: Response) => {
  const ctx = contestoDi(req);
  const f = await trovaNelTenant(Fornitore, 'uuidFornitore', req.params.id, ctx.idTenant, 'Fornitore');
  const prima = snapshot(f);
  await f.update(pulisci(req.body) as never);
  traccia(ctx, 'vigilo.fornitore.modificato', `Fornitore modificato: ${f.nome}`, prima, f);
  successResponse(res, presenta(f), 'Fornitore modificato');
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
