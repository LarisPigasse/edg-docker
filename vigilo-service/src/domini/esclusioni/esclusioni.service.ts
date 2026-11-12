// =============================================================================
// Controlli non seguiti per soggetto (revisione 2026-11-11)
// =============================================================================
//   controlliDelSoggetto  i controlli attivi che valgono per il soggetto, se si
//                         seguono, e lo storico delle decisioni con i nomi
//   nonSeguire            motivo obbligatorio; la scadenza aperta si chiude
//                         ("non-seguita"); niente se c'è una segnalazione
//                         dell'addetto da confermare
//   riprendi              la decisione resta come storico (chi e quando ha
//                         ripreso, nota facoltativa); la scadenza chiusa si
//                         riapre con le sue date, o ne nasce una nuova
//                         (comeRiprendere in esclusioni.ts)
//   elencoNonSeguiti      tutte le decisioni del tenant, per il report di
//                         Configurazione: solo quelle in corso o anche le
//                         riprese, per soggetto e controllo (2026-11-12)
// Le altre parti di Vigilo leggono le esclusioni da inCorso.ts.
// =============================================================================
import { Op, type Transaction } from 'sequelize';
import { sequelize } from '../../config/database';
import type { Contesto } from '../../core/contesto';
import { trovaNelTenant } from '../../core/db/tenant';
import { traccia } from '../../core/services/traccia';
import { ConflictError, ValidationError } from '../../core/utils/errors';
import { verificaAmbito } from '../ambito/ambito.service';
import { Controllo, ControlloNonSeguito, Registrazione, Scadenza, Soggetto } from '../modelli';
import { chiudiScadenze, generaScadenze, valePer } from '../scadenze/ciclo.service';
import { ricalcolaScadenze } from '../scadenze/ricalcolo.service';
import { nomeAutore, nomiAutori } from '../soggetti/autori';
import { comeRiprendere, motivoValido, notaValida, type Ripresa } from './esclusioni';

const CATEGORIE = { association: 'categorie', attributes: ['idCategoria'], through: { attributes: [] } };
const idCategorie = (c: Controllo) => (c.categorie ?? []).map(k => k.idCategoria);

/** I controlli attivi che valgono per il soggetto, con lo stato (seguito o no) e lo storico delle decisioni */
export async function controlliDelSoggetto(ctx: Contesto, uuidSoggetto: string) {
  const soggetto = await trovaNelTenant(Soggetto, 'uuidSoggetto', uuidSoggetto, ctx.idTenant, 'Soggetto');
  await verificaAmbito(ctx, soggetto.idSoggetto, 'Soggetto');
  const controlli = (
    await Controllo.findAll({
      where: { idTenant: ctx.idTenant, tipoSoggetto: soggetto.tipo, attivo: true },
      include: [CATEGORIE],
      order: [['ordine', 'ASC'], ['nome', 'ASC']],
    })
  ).filter(c => valePer(c, idCategorie(c), soggetto));
  const decisioni = await ControlloNonSeguito.findAll({
    where: { idSoggetto: soggetto.idSoggetto },
    include: [{ association: 'controllo', attributes: ['uuidControllo', 'nome'] }],
    order: [['createdAt', 'DESC'], ['idEsclusione', 'DESC']],
  });
  const aperte = new Set(
    (
      await Scadenza.findAll({
        where: { idSoggetto: soggetto.idSoggetto, chiusaIl: null, idControllo: { [Op.ne]: null } },
        attributes: ['idControllo'],
      })
    ).map(s => s.idControllo)
  );
  const nomi = await nomiAutori(decisioni.flatMap(d => [d.creatoDa, d.ripresaDa]));
  const inCorso = new Map(decisioni.filter(d => !d.ripresaIl).map(d => [d.idControllo, d]));
  return {
    controlli: controlli.map(c => {
      const d = inCorso.get(c.idControllo);
      return {
        uuid: c.uuidControllo,
        nome: c.nome,
        natura: c.natura,
        automatico: c.automatico,
        seguito: !d,
        /** C'è una scadenza aperta di questo controllo per il soggetto */
        aperta: aperte.has(c.idControllo),
        nonSeguito: d ? { motivo: d.motivo, da: nomeAutore(nomi, d.creatoDa), il: d.createdAt } : null,
      };
    }),
    decisioni: decisioni.map(d => ({
      uuid: d.uuidEsclusione,
      controllo: { uuid: d.controllo?.uuidControllo ?? null, nome: d.controllo?.nome ?? '' },
      motivo: d.motivo,
      decisaDa: nomeAutore(nomi, d.creatoDa),
      decisaIl: d.createdAt,
      ripresaDa: nomeAutore(nomi, d.ripresaDa),
      ripresaIl: d.ripresaIl ?? null,
      notaRipresa: d.notaRipresa ?? null,
    })),
  };
}

/** Righe massime del report dei controlli non seguiti (come le altre esportazioni) */
export const MASSIMO_REPORT = 1024;

export type QualiDecisioni = 'in-corso' | 'tutte';

/** Le decisioni del tenant (in corso o tutte) con soggetto, controllo e nomi, per soggetto e controllo */
export async function elencoNonSeguiti(ctx: Contesto, quali: QualiDecisioni) {
  const righe = await ControlloNonSeguito.findAll({
    where: { idTenant: ctx.idTenant, ...(quali === 'in-corso' ? { ripresaIl: { [Op.is]: null } } : {}) },
    include: [
      { association: 'soggetto', attributes: ['uuidSoggetto', 'nome', 'tipo', 'identificativo'] },
      { association: 'controllo', attributes: ['uuidControllo', 'nome'] },
    ],
    order: [
      [{ model: Soggetto, as: 'soggetto' }, 'nome', 'ASC'],
      [{ model: Controllo, as: 'controllo' }, 'nome', 'ASC'],
      ['createdAt', 'DESC'],
    ],
    limit: MASSIMO_REPORT + 1,
  });
  const troncate = righe.length > MASSIMO_REPORT;
  const elenco = righe.slice(0, MASSIMO_REPORT);
  const nomi = await nomiAutori(elenco.flatMap(d => [d.creatoDa, d.ripresaDa]));
  return {
    troncate,
    righe: elenco.map(d => ({
      uuid: d.uuidEsclusione,
      soggetto: {
        uuid: d.soggetto?.uuidSoggetto ?? null,
        nome: d.soggetto?.nome ?? '',
        tipo: d.soggetto?.tipo ?? null,
        identificativo: d.soggetto?.identificativo ?? null,
      },
      controllo: { uuid: d.controllo?.uuidControllo ?? null, nome: d.controllo?.nome ?? '' },
      motivo: d.motivo,
      decisaDa: nomeAutore(nomi, d.creatoDa),
      decisaIl: d.createdAt,
      ripresaDa: nomeAutore(nomi, d.ripresaDa),
      ripresaIl: d.ripresaIl ?? null,
      notaRipresa: d.notaRipresa ?? null,
    })),
  };
}

/** Il soggetto e il controllo della coppia; il controllo deve riguardarlo per tipo e categoria */
async function coppiaDi(ctx: Contesto, uuidSoggetto: string, uuidControllo: string, transaction: Transaction) {
  const soggetto = await trovaNelTenant(Soggetto, 'uuidSoggetto', uuidSoggetto, ctx.idTenant, 'Soggetto', { transaction });
  const controllo = await trovaNelTenant(Controllo, 'uuidControllo', uuidControllo, ctx.idTenant, 'Controllo', {
    include: [CATEGORIE],
    transaction,
  });
  if (!valePer(controllo, idCategorie(controllo), soggetto)) throw new ValidationError('Il controllo non riguarda questo soggetto (tipo o categoria diversi)');
  return { soggetto, controllo };
}

/** Smette di seguire il controllo per il soggetto: motivo obbligatorio, la scadenza aperta si chiude */
export async function nonSeguire(ctx: Contesto, uuidSoggetto: string, uuidControllo: string, motivoGrezzo: unknown) {
  const motivo = motivoValido(motivoGrezzo);
  return sequelize.transaction(async transaction => {
    const { soggetto, controllo } = await coppiaDi(ctx, uuidSoggetto, uuidControllo, transaction);
    const coppia = { idSoggetto: soggetto.idSoggetto, idControllo: controllo.idControllo };
    if (await ControlloNonSeguito.count({ where: { ...coppia, ripresaIl: { [Op.is]: null } }, transaction }))
      throw new ConflictError('Questo controllo già non si segue per il soggetto');
    const aperta = await Scadenza.findOne({ where: { ...coppia, chiusaIl: null }, attributes: ['idScadenza'], transaction });
    if (aperta && (await Registrazione.count({ where: { idScadenza: aperta.idScadenza, stato: 'da-confermare' }, transaction })))
      throw new ConflictError("C'è una segnalazione dell'addetto da confermare: confermala o respingila prima");
    const riga = await ControlloNonSeguito.create({ idTenant: ctx.idTenant, ...coppia, motivo }, { transaction });
    const scadenzeChiuse = await chiudiScadenze(coppia, 'non-seguita', transaction);
    traccia(ctx, 'vigilo.controllo.non-seguito', `${soggetto.nome}: non si segue più "${controllo.nome}"`, null, riga, { scadenzeChiuse });
    return { scadenzeChiuse };
  });
}

/** Torna a seguire il controllo: la decisione resta nello storico, la scadenza si riapre (o nasce) */
export async function riprendi(ctx: Contesto, uuidSoggetto: string, uuidControllo: string, notaGrezza: unknown): Promise<{ scadenza: Ripresa }> {
  const nota = notaValida(notaGrezza);
  return sequelize.transaction(async transaction => {
    const { soggetto, controllo } = await coppiaDi(ctx, uuidSoggetto, uuidControllo, transaction);
    const coppia = { idSoggetto: soggetto.idSoggetto, idControllo: controllo.idControllo };
    const riga = await ControlloNonSeguito.findOne({ where: { ...coppia, ripresaIl: { [Op.is]: null } }, transaction });
    if (!riga) throw new ConflictError('Questo controllo si segue già per il soggetto');
    await riga.update({ ripresaIl: new Date(), ripresaDa: ctx.utente.id, notaRipresa: nota }, { transaction });

    const giaAperta = (await Scadenza.count({ where: { ...coppia, chiusaIl: null }, transaction })) > 0;
    const daRiaprire = await Scadenza.findOne({ where: { ...coppia, motivoChiusura: 'non-seguita' }, order: [['chiusaIl', 'DESC']], transaction });
    const azione = comeRiprendere({
      soggettoDismesso: soggetto.stato === 'dismesso',
      controlloAttivo: controllo.attivo,
      controlloAutomatico: controllo.automatico,
      daRiaprire: !!daRiaprire,
      giaAperta,
    });
    if (azione === 'riapri' && daRiaprire) {
      await daRiaprire.update({ chiusaIl: null, motivoChiusura: null }, { transaction });
      await ricalcolaScadenze({ idScadenza: [daRiaprire.idScadenza] }, ctx.oggi, transaction);
    } else if (azione === 'genera') {
      await generaScadenze([{ soggetto, controllo }], ctx, transaction);
    }
    traccia(ctx, 'vigilo.controllo.ripreso', `${soggetto.nome}: si segue di nuovo "${controllo.nome}"`, null, riga, { scadenza: azione });
    return { scadenza: azione };
  });
}
