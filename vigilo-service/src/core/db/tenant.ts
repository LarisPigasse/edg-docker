// =============================================================================
// Trovare una risorsa del tenant per uuid (ADR068)
// =============================================================================
// Una risorsa di un altro tenant e' "non trovata" (404), mai "vietata" (403):
// non si rivela nemmeno che esiste.
// =============================================================================
import type { FindOptions, Model, ModelStatic, Transaction } from 'sequelize';
import { NotFoundError } from '../utils/errors';

export async function trovaNelTenant<M extends Model>(
  Modello: ModelStatic<M>,
  campoUuid: string,
  /** uuid, o l'id interno quando campoUuid è la chiave */
  uuid: string | number,
  idTenant: number,
  risorsa: string,
  opzioni: Omit<FindOptions, 'where'> & { transaction?: Transaction } = {}
): Promise<M> {
  const riga = await Modello.findOne({ ...opzioni, where: { [campoUuid]: uuid, idTenant } as never });
  if (!riga) throw new NotFoundError(risorsa);
  return riga;
}

/** Piu' uuid insieme: errore se anche uno solo manca o non e' del tenant */
export async function trovaTuttiNelTenant<M extends Model>(
  Modello: ModelStatic<M>,
  campoUuid: string,
  uuids: string[],
  idTenant: number,
  risorsa: string,
  transaction?: Transaction
): Promise<M[]> {
  const unici = [...new Set(uuids)];
  if (!unici.length) return [];
  const righe = await Modello.findAll({ where: { [campoUuid]: unici, idTenant } as never, transaction });
  if (righe.length !== unici.length) throw new NotFoundError(risorsa);
  return righe;
}
