// =============================================================================
// Guasti — servizio (B10a passo 2, passo 8 dell'analisi)
// =============================================================================
//   segnalaGuasto      l'ufficio o l'addetto (sui mezzi del suo ambito): una
//                      scadenza senza controllo di natura "riparazione", una
//                      volta sola; "blocca l'uso" sospende il mezzo
//   bloccantiAperti    i guasti aperti che bloccano il mezzo
//   rimettiSeUltimo    riparato l'ultimo guasto bloccante, il mezzo sospeso
//                      torna in servizio (se chi registra lo chiede)
// =============================================================================
import { Op, type Transaction } from 'sequelize';
import { sequelize } from '../../config/database';
import type { Contesto } from '../../core/contesto';
import { trovaNelTenant } from '../../core/db/tenant';
import { snapshot } from '../../core/services/logger';
import { traccia } from '../../core/services/traccia';
import { ValidationError } from '../../core/utils/errors';
import { confronta, parti, type Giorno } from '../../regole';
import { verificaAmbito } from '../ambito/ambito.service';
import { avvisaGuasto } from '../avvisi/guasti.service';
import { dopo } from '../avvisi/immediati.service';
import { interventiEffettivi } from '../impostazioni/limiti';
import { ImpostazioniTenant, Scadenza, Soggetto } from '../modelli';
import { ricalcolaScadenze } from '../scadenze/ricalcolo.service';
import { daRimettereInServizio, entroProposto, TIPI_CON_GUASTI } from './interventi';

export interface DatiGuasto {
  titolo: string;
  descrizione?: string | null;
  bloccaUso?: boolean;
  /** Entro quando ripararlo; senza, la proposta (oggi se blocca l'uso, altrimenti tra i giorni del tenant) */
  scadeIl?: Giorno | null;
}

export async function segnalaGuasto(ctx: Contesto, uuidSoggetto: string, d: DatiGuasto): Promise<{ uuid: string; sospeso: boolean }> {
  const esito = await sequelize.transaction(async transaction => {
    const sog = await trovaNelTenant(Soggetto, 'uuidSoggetto', uuidSoggetto, ctx.idTenant, 'Soggetto', { transaction });
    await verificaAmbito(ctx, sog.idSoggetto, 'Soggetto');
    if (!TIPI_CON_GUASTI.includes(sog.tipo)) throw new ValidationError('I guasti si segnalano su veicoli, macchine, attrezzature e sedi');
    if (sog.stato === 'dismesso') throw new ValidationError('Il soggetto è archiviato');
    const bloccaUso = !!d.bloccaUso;
    const regole = interventiEffettivi((await ImpostazioniTenant.findByPk(ctx.idTenant, { attributes: ['idTenant', 'interventi'], transaction }))?.interventi);
    const scadeIl = d.scadeIl ?? entroProposto(bloccaUso, regole.giorniRiparazione, ctx.oggi);
    if (confronta(scadeIl, ctx.oggi) < 0) throw new ValidationError('La data entro cui ripararlo non può essere già passata');

    const s = await Scadenza.create(
      {
        idTenant: ctx.idTenant,
        idSoggetto: sog.idSoggetto,
        idControllo: null,
        natura: 'riparazione',
        bloccaUso,
        titolo: d.titolo,
        note: d.descrizione || null,
        scadeIl,
        giornoAncora: parti(scadeIl)[2],
      },
      { transaction }
    );
    await ricalcolaScadenze({ idScadenza: s.idScadenza }, ctx.oggi, transaction);

    let sospeso = false;
    if (bloccaUso && sog.stato === 'in-servizio') {
      const prima = snapshot(sog);
      await sog.update({ stato: 'fermo', statoDal: ctx.oggi }, { transaction });
      sospeso = true;
      traccia(ctx, 'vigilo.soggetto.stato', `${sog.nome}: in-servizio → fermo (guasto: ${d.titolo})`, prima, sog);
    }
    traccia(ctx, 'vigilo.guasto.segnalato', `Guasto segnalato: ${d.titolo}${bloccaUso ? ' (blocca l’uso)' : ''}`, null, s, { soggetto: sog.uuidSoggetto, sospeso });
    return { idScadenza: s.idScadenza, uuid: s.uuidScadenza, sospeso };
  });
  dopo('guasto', () => avvisaGuasto(esito.idScadenza));
  return { uuid: esito.uuid, sospeso: esito.sospeso };
}

/** I guasti aperti che bloccano il soggetto, escluso quello indicato */
export const bloccantiAperti = (idSoggetto: number, escludi: number | null, transaction?: Transaction): Promise<number> =>
  Scadenza.count({
    where: { idSoggetto, natura: 'riparazione', bloccaUso: true, chiusaIl: null, ...(escludi ? { idScadenza: { [Op.ne]: escludi } } : {}) },
    transaction,
  });

/** Va proposto "Rimetti in servizio" per questo guasto? (soggetto già caricato) */
export async function propostaRimessa(s: Scadenza, sog: Soggetto | null | undefined, transaction?: Transaction): Promise<boolean> {
  if (!sog || s.chiusaIl || s.natura !== 'riparazione' || !s.bloccaUso) return false;
  return daRimettereInServizio(s, sog.stato, await bloccantiAperti(sog.idSoggetto, s.idScadenza, transaction));
}

/** Riparato un guasto bloccante: il mezzo sospeso torna in servizio se non ce ne sono altri. true = rimesso */
export async function rimettiSeUltimo(ctx: Contesto, s: Scadenza, transaction: Transaction): Promise<boolean> {
  if (s.natura !== 'riparazione' || !s.bloccaUso || !s.idSoggetto) return false;
  const sog = await Soggetto.findByPk(s.idSoggetto, { transaction });
  if (!sog || !daRimettereInServizio(s, sog.stato, await bloccantiAperti(sog.idSoggetto, s.idScadenza, transaction))) return false;
  const prima = snapshot(sog);
  await sog.update({ stato: 'in-servizio', statoDal: ctx.oggi }, { transaction });
  traccia(ctx, 'vigilo.soggetto.stato', `${sog.nome}: fermo → in-servizio (riparato: ${s.titolo})`, prima, sog);
  return true;
}
