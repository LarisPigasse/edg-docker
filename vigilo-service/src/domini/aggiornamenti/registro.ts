// =============================================================================
// Registro delle decisioni sulla libreria (ADR074)
// =============================================================================
// Una riga per ogni scelta del cliente, all'avvio (incluso/escluso) e sugli
// aggiornamenti (B10). Chi decide si copia nella riga: account, email e, se
// l'account e' l'addetto di una persona, il suo nome (il gateway non porta il
// nome dell'account). Le righe non si modificano: lo vieta il database.
// =============================================================================
import type { Transaction } from 'sequelize';
import type { Contesto } from '../../core/contesto';
import { DecisioneLibreria, Soggetto } from '../modelli';
import type { CampoDecisione, ContestoDecisione, EntitaDecisione, EsitoDecisione } from '../valori';

export interface NuovaDecisione {
  contesto: ContestoDecisione;
  entita: EntitaDecisione;
  chiaveLibreria: string;
  nome: string;
  idEntita?: number | null;
  versioneDa?: number | null;
  versioneA: number;
  novita?: string | null;
  disponibileDal?: Date | null;
  vistoIl?: Date | null;
  esito: EsitoDecisione;
  campi?: CampoDecisione[];
}

/** Chi decide, copiato nella riga */
async function chiDecide(ctx: Contesto, transaction: Transaction) {
  const persona = ctx.utente.id
    ? await Soggetto.findOne({
        where: { idTenant: ctx.idTenant, idAccount: ctx.utente.id, tipo: 'persona' },
        attributes: ['nome'],
        transaction,
      })
    : null;
  return { decisoDa: ctx.utente.id || null, decisoDaNome: persona?.nome ?? null, decisoDaEmail: ctx.utente.email };
}

/** Scrive le decisioni con lo stesso istante e lo stesso autore; restituisce quante */
export async function registraDecisioni(ctx: Contesto, righe: NuovaDecisione[], transaction: Transaction): Promise<number> {
  if (!righe.length) return 0;
  const chi = await chiDecide(ctx, transaction);
  const decisoIl = new Date();
  await DecisioneLibreria.bulkCreate(
    righe.map(r => ({ ...r, idTenant: ctx.idTenant, decisoIl, ...chi })),
    { transaction, validate: true }
  );
  return righe.length;
}
