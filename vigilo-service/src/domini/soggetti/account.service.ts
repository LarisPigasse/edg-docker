// =============================================================================
// Account collegati alle persone (05-permessi 5.4, B9b)
// =============================================================================
// Un account (auth-service) si collega a un soggetto di tipo persona: è così
// che l'addetto vede le sue scadenze e i mezzi che usa, e che una persona
// riceve gli avvisi in app invece che per email. Un account a una sola
// persona (vincolo unico nel database). Lo fa l'ufficio (vigilo.write).
// =============================================================================
import { Op } from 'sequelize';
import type { Contesto } from '../../core/contesto';
import { accountTenant, nomiAccount } from '../../core/clients/authClient';
import { trovaNelTenant } from '../../core/db/tenant';
import { capacitaDi } from '../../core/middleware/permessi';
import { logger, snapshot } from '../../core/services/logger';
import { traccia } from '../../core/services/traccia';
import { ConflictError, ValidationError } from '../../core/utils/errors';
import { Soggetto } from '../modelli';

export interface AccountCollegabile {
  id: number;
  nome: string;
  email: string;
  /** Ha solo vigilo.own: un addetto */
  addetto: boolean;
  /** La persona a cui è già collegato */
  persona: { uuid: string; nome: string } | null;
}

/** Gli account attivi del tenant, con la persona a cui ciascuno è già collegato */
export async function elencaAccount(ctx: Contesto): Promise<AccountCollegabile[]> {
  const account = await accountTenant(ctx.idTenant);
  const collegati = await Soggetto.findAll({
    where: { idTenant: ctx.idTenant, tipo: 'persona', idAccount: { [Op.in]: account.map(a => a.id) } },
    attributes: ['uuidSoggetto', 'nome', 'idAccount'],
  });
  const di = new Map(collegati.map(p => [p.idAccount, { uuid: p.uuidSoggetto, nome: p.nome }]));
  return account
    .map(a => {
      const c = capacitaDi(a.permissions);
      return { id: a.id, nome: a.nome, email: a.email, addetto: c.own && !c.read, persona: di.get(a.id) ?? null };
    })
    .sort((x, y) => x.nome.localeCompare(y.nome, 'it'));
}

/** Collega (o scollega, con null) un account a una persona */
export async function collegaAccount(ctx: Contesto, uuidPersona: string, idAccount: number | null): Promise<Soggetto> {
  const p = await trovaNelTenant(Soggetto, 'uuidSoggetto', uuidPersona, ctx.idTenant, 'Soggetto');
  if (p.tipo !== 'persona') throw new ValidationError('Solo una persona si collega a un account');
  if (idAccount !== null) {
    if (!(await accountTenant(ctx.idTenant)).some(a => a.id === idAccount)) throw new ValidationError('L’account non è fra quelli attivi dell’azienda');
    const altra = await Soggetto.findOne({ where: { idTenant: ctx.idTenant, idAccount, idSoggetto: { [Op.ne]: p.idSoggetto } }, attributes: ['nome'] });
    if (altra) throw new ConflictError(`L’account è già collegato a ${altra.nome}`);
  }
  if ((p.idAccount ?? null) === idAccount) return p;
  const prima = snapshot(p);
  await p.update({ idAccount });
  traccia(ctx, 'vigilo.soggetto.account', idAccount ? `Account collegato a ${p.nome}` : `Account scollegato da ${p.nome}`, prima, p);
  return p;
}

/** Il nome della persona collegata a un account (chi ha segnalato, B9c); null se nessuna */
export async function nomeDellAccount(idTenant: number, idAccount: number | null | undefined): Promise<string | null> {
  if (!idAccount) return null;
  const p = await Soggetto.findOne({ where: { idTenant, idAccount, tipo: 'persona' }, attributes: ['nome'] });
  return p?.nome ?? null;
}

/** Nome ed email dell'account collegato a una persona; null se non c'è o se auth non risponde */
export async function accountDi(s: Soggetto): Promise<{ id: number; nome: string; email: string } | null> {
  if (s.tipo !== 'persona' || !s.idAccount) return null;
  try {
    const [a] = await nomiAccount([s.idAccount]);
    return a ? { id: a.id, nome: a.nome, email: a.email } : null;
  } catch (err) {
    logger.warn('vigilo.soggetti', `Account della persona ${s.uuidSoggetto} non letto: ${String(err)}`);
    return null;
  }
}
