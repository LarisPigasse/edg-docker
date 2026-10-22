// =============================================================================
// Registro delle decisioni sulla libreria (ADR074)
// =============================================================================
// Una riga per ogni scelta del cliente, all'avvio (incluso/escluso) e sugli
// aggiornamenti (B10). Chi decide si copia nella riga: account, email e nome.
// Il nome (ADR088): nell'accesso assistito quello dell'operatore EDG (dal
// token); altrimenti la persona di cui l'account e' l'addetto, poi nome e
// cognome dell'account da auth-service. Le righe non si modificano: lo vieta
// il database.
// =============================================================================
import type { Transaction } from 'sequelize';
import type { Contesto } from '../../core/contesto';
import { DecisioneLibreria, Soggetto } from '../modelli';
import { nomiAccount } from '../../core/clients/authClient';
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
  const base = { decisoDa: ctx.utente.id || null, decisoDaEmail: ctx.utente.email };
  // Accesso assistito: decide l'operatore EDG, che e' anche l'account del token
  if (ctx.utente.assistenza) return { ...base, decisoDaNome: ctx.utente.assistenza.operatore.nome };

  const persona = ctx.utente.id
    ? await Soggetto.findOne({
        where: { idTenant: ctx.idTenant, idAccount: ctx.utente.id, tipo: 'persona' },
        attributes: ['nome'],
        transaction,
      })
    : null;
  if (persona) return { ...base, decisoDaNome: persona.nome };
  if (!ctx.utente.id) return { ...base, decisoDaNome: null };
  // Il nome dell'account: se auth-service non risponde la decisione si registra lo stesso, senza nome
  const nome = await nomiAccount([ctx.utente.id])
    .then(r => r[0]?.nome ?? null)
    .catch(() => null);
  return { ...base, decisoDaNome: nome };
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
