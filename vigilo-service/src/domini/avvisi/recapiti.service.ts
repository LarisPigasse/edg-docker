// =============================================================================
// Recapiti email senza account: "Non ricevere più questi avvisi" (B8d-4, ADR098)
// =============================================================================
//   escluseDelTenant  indirizzi che hanno chiesto di non ricevere più
//                     (generazione e anteprima: per loro niente consegne)
//   recapitiDi        il recapito di ogni indirizzo senza account di un
//                     gruppo di consegne, creato al primo invio (codice)
//   leggiRecapito     la pagina pubblica: tenant ed email mascherata
//   cambiaRecapito    non ricevere più (le consegne in coda si risolvono) o
//                     riceverli di nuovo
// Le rotte pubbliche non hanno un utente: il codice è la sola credenziale e
// vale solo per il suo indirizzo. Codice sbagliato o sconosciuto: sempre lo
// stesso 404, senza dire perché.
// =============================================================================
import { Op } from 'sequelize';
import { sequelize } from '../../config/database';
import { logger } from '../../core/services/logger';
import { NotFoundError } from '../../core/utils/errors';
import { Consegna, RecapitoEmail } from '../modelli';
import { nomiTenant } from './email';
import { chiaveRecapito, codiceValido, emailPulita, mascheraEmail, nuovoCodice } from './recapiti';

const NON_VALIDO = 'Collegamento non valido';

/** Gli indirizzi (in minuscolo) di un tenant che hanno chiesto di non ricevere più */
export async function escluseDelTenant(idTenant: number): Promise<Set<string>> {
  const righe = await RecapitoEmail.findAll({ where: { idTenant, esclusoIl: { [Op.ne]: null } }, attributes: ['email'] });
  return new Set(righe.map(r => r.email));
}

/** I recapiti degli indirizzi senza account delle consegne (chiave chiaveRecapito), creati se mancano */
export async function recapitiDi(consegne: Consegna[]): Promise<Map<string, RecapitoEmail>> {
  const voluti = new Map<string, { idTenant: number; email: string }>();
  for (const c of consegne) {
    if (c.idAccount != null || !c.email) continue;
    voluti.set(chiaveRecapito(c.idTenant, c.email), { idTenant: c.idTenant, email: emailPulita(c.email) });
  }
  if (!voluti.size) return new Map();

  const leggi = () => RecapitoEmail.findAll({ where: { [Op.or]: [...voluti.values()] } });
  let righe = await leggi();
  const presenti = new Set(righe.map(r => chiaveRecapito(r.idTenant, r.email)));
  const mancanti = [...voluti].filter(([k]) => !presenti.has(k)).map(([, v]) => ({ ...v, codice: nuovoCodice() }));
  if (mancanti.length) {
    // due giri insieme sullo stesso indirizzo: resta la prima riga (vincolo unico)
    await RecapitoEmail.bulkCreate(mancanti, { ignoreDuplicates: true });
    righe = await leggi();
  }
  return new Map(righe.map(r => [chiaveRecapito(r.idTenant, r.email), r]));
}

export interface SchedaRecapito {
  /** Il nome del tenant che manda gli avvisi; null se auth-service non risponde */
  tenant: string | null;
  /** L'indirizzo mascherato */
  email: string;
  escluso: boolean;
}

async function trova(codice: unknown): Promise<RecapitoEmail> {
  if (!codiceValido(codice)) throw new NotFoundError(NON_VALIDO);
  const r = await RecapitoEmail.findOne({ where: { codice } });
  if (!r) throw new NotFoundError(NON_VALIDO);
  return r;
}

const scheda = async (r: RecapitoEmail): Promise<SchedaRecapito> => ({
  tenant: await nomiTenant()(r.idTenant),
  email: mascheraEmail(r.email),
  escluso: !!r.esclusoIl,
});

export async function leggiRecapito(codice: unknown): Promise<SchedaRecapito> {
  return scheda(await trova(codice));
}

/** escluso true: non ricevere più (e le consegne in coda si risolvono); false: riceverli di nuovo */
export async function cambiaRecapito(codice: unknown, escluso: boolean): Promise<SchedaRecapito> {
  const r = await trova(codice);
  const meta = { idTenant: r.idTenant, idRecapito: r.idRecapito };
  if (escluso && !r.esclusoIl) {
    const risolte = await sequelize.transaction(async transaction => {
      await r.update({ esclusoIl: new Date() }, { transaction });
      const [n] = await Consegna.update(
        { stato: 'risolto', errore: 'Ha chiesto di non ricevere più le email' },
        { where: { idTenant: r.idTenant, canale: 'email', stato: 'in-coda', idAccount: null, email: r.email }, validate: false, transaction } // L054
      );
      return n;
    });
    logger.info('vigilo.recapiti', `${mascheraEmail(r.email)} ha chiesto di non ricevere più gli avvisi (${risolte} in coda annullati)`, { ...meta, risolte });
  } else if (!escluso && r.esclusoIl) {
    await r.update({ esclusoIl: null });
    logger.info('vigilo.recapiti', `${mascheraEmail(r.email)} ha chiesto di ricevere di nuovo gli avvisi`, meta);
  }
  return scheda(r);
}
