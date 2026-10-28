// =============================================================================
// Ambito dell'utente nella richiesta (B9b)
// =============================================================================
//   ambitoDi        calcolato una volta per richiesta (contesto): con read,
//                   write o config tutto; con solo own la persona collegata e
//                   i soggetti assegnati oggi (ambito.ts)
//   verificaAmbito  404 se il soggetto non è nell'ambito
// =============================================================================
import { Op } from 'sequelize';
import type { Contesto } from '../../core/contesto';
import { NotFoundError } from '../../core/utils/errors';
import { Assegnazione, Soggetto } from '../modelli';
import { TUTTO, ambitoAddetto, nellAmbito, type Ambito } from './ambito';

const calcolati = new WeakMap<Contesto, Promise<Ambito>>();

async function calcola(ctx: Contesto): Promise<Ambito> {
  if (ctx.capacita.read) return TUTTO; // read comprende write e config
  if (!ctx.capacita.own) return ambitoAddetto(null, [], ctx.oggi);
  const persona = await Soggetto.findOne({
    where: { idTenant: ctx.idTenant, idAccount: ctx.utente.id, tipo: 'persona', stato: { [Op.ne]: 'dismesso' } },
    attributes: ['idSoggetto'],
  });
  if (!persona) return ambitoAddetto(null, [], ctx.oggi);
  const assegnazioni = await Assegnazione.findAll({
    where: { idTenant: ctx.idTenant, idPersona: persona.idSoggetto },
    attributes: ['idSoggetto', 'dal', 'al'],
  });
  return ambitoAddetto(
    persona.idSoggetto,
    assegnazioni.map(a => ({ idSoggetto: a.idSoggetto, dal: a.dal, al: a.al ?? null })),
    ctx.oggi
  );
}

/** L'ambito dell'utente, calcolato una sola volta per richiesta */
export function ambitoDi(ctx: Contesto): Promise<Ambito> {
  let a = calcolati.get(ctx);
  if (!a) {
    a = calcola(ctx);
    calcolati.set(ctx, a);
  }
  return a;
}

/** 404 (con il nome della risorsa) se il soggetto non è nell'ambito */
export async function verificaAmbito(ctx: Contesto, idSoggetto: number | null | undefined, risorsa: string): Promise<void> {
  if (!nellAmbito(await ambitoDi(ctx), idSoggetto)) throw new NotFoundError(risorsa);
}
