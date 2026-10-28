// =============================================================================
// Segnalazioni dell'addetto — servizio (05-permessi 5.4, B9c, ADR101)
// =============================================================================
//   segnala   l'addetto, dentro il suo ambito, su una scadenza aperta: una
//             registrazione "da-confermare" con data, lettura, note e
//             documenti; la scadenza resta aperta, la lettura non va al
//             contatore
//   ritira    chi l'ha mandata, finché aspetta: i documenti tornano sulla
//             scadenza
//   conferma  l'ufficio, con i dati del modulo Registra (correggibili):
//             diventa una registrazione vera, con gli stessi effetti
//   respingi  l'ufficio, con un motivo: resta nello storico come "respinta"
// Regole dei dati in comune con registraEsecuzione (registrazione.service).
// =============================================================================
import { UniqueConstraintError, type Transaction } from 'sequelize';
import { sequelize } from '../../config/database';
import type { Contesto } from '../../core/contesto';
import { trovaNelTenant } from '../../core/db/tenant';
import { snapshot } from '../../core/services/logger';
import { traccia } from '../../core/services/traccia';
import { ConflictError } from '../../core/utils/errors';
import type { Giorno } from '../../regole';
import { allegatiDi, collegaAllaRegistrazione, riportaSullaScadenza } from '../allegati/allegati.service';
import { verificaAmbito } from '../ambito/ambito.service';
import { avvisaEsito, avvisaSegnalazione, dopo, risolviSegnalazione } from '../avvisi/segnalazioni.service';
import { Fornitore, Registrazione, Scadenza } from '../modelli';
import { concludiEsecuzione, datiEsecuzione, effettive, inAttesaDi, scadenzaAperta, type DatiEsecuzione } from '../registrazioni/registrazione.service';
import { DATI_ADDETTO, erroreDecisione, erroreRitiro } from './segnalazioni';

export interface DatiSegnalazione {
  eseguitaIl: Giorno;
  lettura?: number | null;
  note?: string | null;
  /** uuid dei documenti caricati sulla scadenza */
  allegati?: string[];
}

const titoloDi = (s: Scadenza) => s.titolo || s.controllo?.nome || 'Scadenza';

export async function segnala(ctx: Contesto, uuidScadenza: string, d: DatiSegnalazione): Promise<Registrazione> {
  const reg = await sequelize.transaction(async transaction => {
    const s = await scadenzaAperta(ctx, uuidScadenza, transaction);
    await verificaAmbito(ctx, s.idSoggetto, 'Scadenza');
    if (await inAttesaDi(s.idScadenza, transaction)) throw new ConflictError('La scadenza ha già una segnalazione da confermare');
    const eff = await effettive(s, transaction);
    const dati = await datiEsecuzione(ctx, s, eff, { ...d, esito: 'positivo' }, transaction, { obbligatori: DATI_ADDETTO });
    let r: Registrazione;
    try {
      r = await Registrazione.create(
        { idTenant: ctx.idTenant, idScadenza: s.idScadenza, tipo: 'esecuzione', stato: 'da-confermare', ...dati.attributi },
        { transaction }
      );
    } catch (err) {
      // due segnalazioni nello stesso istante: l'indice unico ne lascia passare una
      if (err instanceof UniqueConstraintError) throw new ConflictError('La scadenza ha già una segnalazione da confermare');
      throw err;
    }
    if (dati.allegati.length) await collegaAllaRegistrazione(ctx.idTenant, dati.allegati, s.idScadenza, r.idRegistrazione, transaction);
    traccia(ctx, 'vigilo.segnalazione.inviata', `Segnalata fatta: ${titoloDi(s)}`, null, r, { scadenza: s.uuidScadenza });
    return r.reload({ transaction });
  });
  dopo('nuova', () => avvisaSegnalazione(reg.idRegistrazione, ctx.oggi));
  return reg;
}

/** La segnalazione per uuid, nel tenant e (per l'addetto) nel suo ambito */
async function segnalazione(ctx: Contesto, uuid: string, transaction: Transaction): Promise<Registrazione & { scadenza: Scadenza }> {
  const r = await trovaNelTenant(Registrazione, 'uuidRegistrazione', uuid, ctx.idTenant, 'Segnalazione', {
    include: [
      { model: Scadenza, as: 'scadenza', required: true, attributes: ['idScadenza', 'uuidScadenza', 'idSoggetto', 'titolo', 'idControllo'], include: [{ association: 'controllo', attributes: ['nome'] }] },
      { model: Fornitore, as: 'fornitore' },
    ],
    transaction,
  });
  await verificaAmbito(ctx, r.scadenza?.idSoggetto, 'Segnalazione');
  return r as Registrazione & { scadenza: Scadenza };
}

export async function ritira(ctx: Contesto, uuid: string): Promise<void> {
  const id = await sequelize.transaction(async transaction => {
    const r = await segnalazione(ctx, uuid, transaction);
    const errore = erroreRitiro(r, ctx.utente.id);
    if (errore) throw new ConflictError(errore);
    const prima = snapshot(r);
    await riportaSullaScadenza(ctx.idTenant, r.idRegistrazione, r.idScadenza, transaction);
    await r.destroy({ transaction });
    traccia(ctx, 'vigilo.segnalazione.ritirata', `Segnalazione ritirata: ${titoloDi(r.scadenza)}`, prima, null, { scadenza: r.scadenza.uuidScadenza });
    return r.idRegistrazione;
  });
  dopo('ritirata', () => risolviSegnalazione(ctx.idTenant, id));
}

/** Correzioni dell'ufficio: i campi del modulo Registra, tutti facoltativi */
export type Correzioni = Partial<Omit<DatiEsecuzione, 'esito' | 'dataNuova'>>;

export async function conferma(ctx: Contesto, uuid: string, c: Correzioni) {
  const esito = await sequelize.transaction(async transaction => {
    const r = await segnalazione(ctx, uuid, transaction);
    const errore = erroreDecisione(r);
    if (errore) throw new ConflictError(errore);
    const s = await scadenzaAperta(ctx, { id: r.idScadenza }, transaction);
    const eff = await effettive(s, transaction);
    // i dati della segnalazione, con le correzioni dell'ufficio sopra
    const ha = (k: keyof Correzioni) => Object.prototype.hasOwnProperty.call(c, k);
    const d: DatiEsecuzione = {
      eseguitaIl: c.eseguitaIl ?? r.eseguitaIl,
      esito: 'positivo',
      lettura: ha('lettura') ? c.lettura : (r.lettura ?? null),
      importo: ha('importo') ? c.importo : (r.importo ?? null),
      fornitore: ha('fornitore') ? c.fornitore : (r.fornitore?.uuidFornitore ?? null),
      riferimento: ha('riferimento') ? c.riferimento : (r.riferimento ?? null),
      note: ha('note') ? c.note : (r.note ?? null),
      prossima: c.prossima,
      allegati: c.allegati,
    };
    const dati = await datiEsecuzione(ctx, s, eff, d, transaction, { allegatiGia: await allegatiDi(ctx.idTenant, r.idRegistrazione, transaction) });
    const prima = snapshot(r);
    await r.update({ ...dati.attributi, stato: 'confermata', confermataDa: ctx.utente.id, confermataIl: new Date() }, { transaction });
    const successiva = await concludiEsecuzione(ctx, s, eff, r, dati, d, transaction);
    traccia(ctx, 'vigilo.segnalazione.confermata', `Segnalazione confermata: ${titoloDi(s)}`, prima, r, { scadenza: s.uuidScadenza });
    return { registrazione: await r.reload({ include: [{ model: Fornitore, as: 'fornitore' }], transaction }), scadenza: await s.reload({ transaction }), successiva };
  });
  const id = esito.registrazione.idRegistrazione;
  dopo('confermata', async () => {
    await risolviSegnalazione(ctx.idTenant, id);
    await avvisaEsito(id, 'confermata', ctx.oggi);
  });
  return esito;
}

export async function respingi(ctx: Contesto, uuid: string, motivo: string): Promise<Registrazione> {
  const reg = await sequelize.transaction(async transaction => {
    const r = await segnalazione(ctx, uuid, transaction);
    const errore = erroreDecisione(r);
    if (errore) throw new ConflictError(errore);
    const prima = snapshot(r);
    await r.update({ stato: 'respinta', motivoRifiuto: motivo, confermataDa: ctx.utente.id, confermataIl: new Date() }, { transaction });
    traccia(ctx, 'vigilo.segnalazione.respinta', `Segnalazione respinta: ${titoloDi(r.scadenza)} — ${motivo}`, prima, r, { scadenza: r.scadenza.uuidScadenza });
    return r;
  });
  dopo('respinta', async () => {
    await risolviSegnalazione(ctx.idTenant, reg.idRegistrazione);
    await avvisaEsito(reg.idRegistrazione, 'respinta', ctx.oggi);
  });
  return reg;
}
