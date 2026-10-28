// =============================================================================
// Scadenze — servizio (01-dominio 1.3, 06-servizio-api 6.3)
// =============================================================================
import { literal, Op, type Includeable, type Order, type Transaction, type WhereOptions } from 'sequelize';
import { sequelize } from '../../config/database';
import type { Contesto } from '../../core/contesto';
import { trovaNelTenant } from '../../core/db/tenant';
import { snapshot } from '../../core/services/logger';
import { traccia } from '../../core/services/traccia';
import { ConflictError, ValidationError } from '../../core/utils/errors';
import { comeTesto, type Pagina } from '../../core/utils/lista';
import { aggiungiGiorni, parti, primaScadenza, prossimaScadenza, STATI, type Cadenza, type Giorno, type UnitaUso } from '../../regole';
import { allegatiDi, eliminaAllegatiDi } from '../allegati/allegati.service';
import { ambitoDi, verificaAmbito } from '../ambito/ambito.service';
import { controllaCadenza } from '../coerenza';
import { conSegnalazione, scadenzeSegnalate } from '../registrazioni/registrazione.service';
import { nomeDellAccount } from '../soggetti/account.service';
import { Categoria, Contatore, Controllo, Registrazione, Scadenza, Soggetto } from '../modelli';
import { siApplica } from './ciclo.service';
import { effettiveDi, predefinitiDi, ricalcolaScadenze, situazioneDi } from './ricalcolo.service';

/** Gravità dello stato (4 scaduta … 0 in regola): per ordinare e per lo stato peggiore */
export const GRAVITA = `CASE "Scadenza"."stato" WHEN 'scaduta' THEN 4 WHEN 'in-tolleranza' THEN 3 WHEN 'in-scadenza' THEN 2 WHEN 'da-completare' THEN 1 ELSE 0 END`;

const ORDINI: Record<string, (v: 'ASC' | 'DESC') => Order> = {
  urgenza: v => [literal(`"Scadenza"."urgenza_il" ${v} NULLS LAST`), ['idScadenza', 'ASC']] as Order,
  scadeIl: v => [literal(`"Scadenza"."scade_il" ${v} NULLS LAST`), ['idScadenza', 'ASC']] as Order,
  soggetto: v => [[{ model: Soggetto, as: 'soggetto' }, 'nome', v], ['urgenzaIl', 'ASC']] as Order,
  stato: v => [literal(`${GRAVITA} ${v === 'ASC' ? 'DESC' : 'ASC'}`), literal(`"Scadenza"."urgenza_il" ASC NULLS LAST`)] as Order,
  chiusaIl: v => [['chiusaIl', v]],
};

/** Filtri comuni a lista e dashboard: condizioni sulla scadenza e sul soggetto, dentro l'ambito dell'utente (B9b) */
export async function filtri(ctx: Contesto, q: Record<string, unknown>) {
  const where: Record<string | symbol, unknown> = { idTenant: ctx.idTenant };
  const suSoggetto: Record<string | symbol, unknown> = {};
  const suControllo: Record<string | symbol, unknown> = {};
  const ambito = await ambitoDi(ctx);
  if (q.soggetto) {
    const idSoggetto = (await trovaNelTenant(Soggetto, 'uuidSoggetto', String(q.soggetto), ctx.idTenant, 'Soggetto')).idSoggetto;
    await verificaAmbito(ctx, idSoggetto, 'Soggetto');
    where.idSoggetto = idSoggetto;
  } else if (!ambito.tutto) where.idSoggetto = ambito.idSoggetti; // nessuno = nessuna scadenza
  if (q.controllo) {
    const uuids = String(q.controllo).split(',');
    const trovati = await Controllo.findAll({ where: { idTenant: ctx.idTenant, uuidControllo: uuids }, attributes: ['idControllo'] });
    where.idControllo = trovati.map(c => c.idControllo); // nessuno trovato = nessuna scadenza
  }
  if (q.categoria) suSoggetto.idCategoria = (await trovaNelTenant(Categoria, 'uuidCategoria', String(q.categoria), ctx.idTenant, 'Categoria')).idCategoria;
  if (q.sede) suSoggetto.idSede = (await trovaNelTenant(Soggetto, 'uuidSoggetto', String(q.sede), ctx.idTenant, 'Sede')).idSoggetto;
  if (q.tipo) suSoggetto.tipo = q.tipo;
  if (q.natura) suControllo.natura = q.natura;
  if (q.testo) {
    const t = comeTesto(String(q.testo));
    where[Op.or] = [
      { titolo: { [Op.iLike]: t } },
      { '$soggetto.nome$': { [Op.iLike]: t } },
      { '$soggetto.identificativo$': { [Op.iLike]: t } },
      { '$controllo.nome$': { [Op.iLike]: t } },
    ];
  }
  const include: Includeable[] = [
    { model: Soggetto, as: 'soggetto', required: Object.keys(suSoggetto).length > 0, where: Object.keys(suSoggetto).length ? suSoggetto : undefined },
    { model: Controllo, as: 'controllo', required: Object.keys(suControllo).length > 0, where: Object.keys(suControllo).length ? suControllo : undefined },
    { model: Contatore, as: 'contatore' },
  ];
  return { where, include };
}

export async function elencaScadenze(ctx: Contesto, q: Record<string, unknown>, p: Pagina) {
  const { where, include } = await filtri(ctx, q);
  where.chiusaIl = q.aperte === false || q.aperte === 'false' ? { [Op.ne]: null } : null;
  if (q.stati) {
    const stati = String(q.stati).split(',');
    if (stati.some(s => !(STATI as readonly string[]).includes(s))) throw new ValidationError(`Stati ammessi: ${STATI.join(', ')}`);
    where.stato = stati;
  }
  if (q.entro !== undefined) where.urgenzaIl = { [Op.lte]: aggiungiGiorni(ctx.oggi, Number(q.entro)) };
  if (q.segnalate === true || q.segnalate === 'true') where.idScadenza = scadenzeSegnalate(ctx.idTenant);
  const { rows, count } = await Scadenza.findAndCountAll({
    where: where as WhereOptions<Scadenza>,
    include,
    order: ORDINI[p.ordina](p.verso),
    limit: p.righe,
    offset: p.offset,
  });
  const predefiniti = (await predefinitiDi([ctx.idTenant])).get(ctx.idTenant)!;
  const segnalate = await conSegnalazione(rows.map(s => s.idScadenza));
  return {
    righe: rows.map(s => ({ s, sit: situazioneDi(s, s.controllo, s.contatore, predefiniti, ctx.oggi).sit, segnalata: segnalate.has(s.idScadenza) })),
    totale: count,
  };
}

/** Il dettaglio: impostazioni effettive con origine, registrazioni, prossima se registrata oggi, segnalazione in attesa (B9c) */
export async function leggiScadenza(ctx: Contesto, uuid: string, transaction?: Transaction) {
  const s = await trovaNelTenant(Scadenza, 'uuidScadenza', uuid, ctx.idTenant, 'Scadenza', {
    include: [
      { model: Soggetto, as: 'soggetto' },
      { model: Controllo, as: 'controllo' },
      { model: Contatore, as: 'contatore' },
    ],
    transaction,
  });
  await verificaAmbito(ctx, s.idSoggetto, 'Scadenza');
  const predefiniti = (await predefinitiDi([ctx.idTenant], transaction)).get(ctx.idTenant)!;
  const { eff, sit } = situazioneDi(s, s.controllo, s.contatore, predefiniti, ctx.oggi);
  const registrazioni = await Registrazione.findAll({
    where: { idScadenza: s.idScadenza },
    include: [{ association: 'fornitore' }],
    order: [['eseguitaIl', 'DESC'], ['idRegistrazione', 'DESC']],
    limit: 64,
    transaction,
  });
  // la segnalazione in attesa è fra le più recenti: finché aspetta non si registra altro
  const inAttesa = registrazioni.find(r => r.stato === 'da-confermare') ?? null;
  const segnalazione = inAttesa
    ? { r: inAttesa, da: await nomeDellAccount(ctx.idTenant, inAttesa.creatoDa), documenti: await allegatiDi(ctx.idTenant, inAttesa.idRegistrazione, transaction) }
    : null;
  const prossima = s.chiusaIl
    ? null
    : prossimaScadenza(
        eff.cadenza,
        { scadeIl: s.scadeIl ?? null, sogliaUso: s.sogliaUso ?? null },
        { eseguitaIl: ctx.oggi, lettura: s.contatore?.valore ?? null },
        { fineIl: s.fineIl, ripetizioniRimaste: s.ripetizioniRimaste },
        s.giornoAncora ?? null,
        (s.soggetto?.dati ?? {}) as Record<string, unknown>
      );
  return { s, eff, sit, registrazioni, prossima, segnalazione };
}

/** Controlli di significato sulle ridefinizioni (cadenza: date del tipo, contatori del soggetto) */
async function verificaRidefinizioni(s: { cadenza?: Cadenza | null }, soggetto: Soggetto | null, transaction?: Transaction) {
  if (!s.cadenza) return;
  const unita = soggetto ? (await Contatore.findAll({ where: { idSoggetto: soggetto.idSoggetto }, transaction })).map(c => c.unita as UnitaUso) : [];
  controllaCadenza(s.cadenza, soggetto?.tipo ?? 'azienda', [unita]);
}

export async function creaScadenza(ctx: Contesto, body: Record<string, unknown>) {
  let uuid = '';
  await sequelize.transaction(async transaction => {
    const soggetto = body.soggetto ? await trovaNelTenant(Soggetto, 'uuidSoggetto', String(body.soggetto), ctx.idTenant, 'Soggetto', { transaction }) : null;
    if (soggetto?.stato === 'dismesso') throw new ValidationError('Il soggetto è dismesso');
    const controllo = body.controllo
      ? await trovaNelTenant(Controllo, 'uuidControllo', String(body.controllo), ctx.idTenant, 'Controllo', {
          include: [{ association: 'categorie', attributes: ['idCategoria'], through: { attributes: [] } }],
          transaction,
        })
      : null;
    if (controllo) {
      if (!controllo.attivo) throw new ValidationError('Il controllo è disattivato');
      if (!soggetto) throw new ValidationError('Una scadenza di un controllo ha bisogno del soggetto');
      if (!siApplica(controllo, (controllo.categorie ?? []).map(c => c.idCategoria), soggetto))
        throw new ValidationError('Il controllo non si applica a questo soggetto (tipo o categoria diversi)');
    } else if (!body.titolo) {
      throw new ValidationError('Un promemoria ha bisogno di un titolo');
    }
    await verificaRidefinizioni(body as { cadenza?: Cadenza | null }, soggetto, transaction);

    const bozza = Scadenza.build({
      idTenant: ctx.idTenant,
      idSoggetto: soggetto?.idSoggetto ?? null,
      idControllo: controllo?.idControllo ?? null,
      titolo: (body.titolo as string) || null,
      cadenza: (body.cadenza as Cadenza) ?? null,
      preavvisi: (body.preavvisi as never) ?? null,
      tolleranza: (body.tolleranza as never) ?? null,
      destinatari: (body.destinatari as never) ?? null,
      fineIl: (body.fineIl as string) ?? null,
      ripetizioniRimaste: (body.ripetizioniRimaste as number) ?? null,
      sogliaUso: (body.sogliaUso as number) ?? null,
      note: (body.note as string) || null,
    });
    const eff = effettiveDi(bozza, controllo, (await predefinitiDi([ctx.idTenant], transaction)).get(ctx.idTenant)!);
    if (eff.cadenza.uso) {
      const contatore = soggetto ? await Contatore.findOne({ where: { idSoggetto: soggetto.idSoggetto, unita: eff.cadenza.uso.unita, nome: '' }, transaction }) : null;
      if (!contatore) throw new ValidationError(`Serve un contatore ${eff.cadenza.uso.unita} sul soggetto`);
      bozza.idContatore = contatore.idContatore;
    }
    const scadeIl = (body.scadeIl as Giorno | undefined) ?? (soggetto ? primaScadenza(eff.cadenza, soggetto.dati ?? {}, ctx.oggi) : null);
    bozza.scadeIl = scadeIl ?? null;
    bozza.giornoAncora = scadeIl ? parti(scadeIl)[2] : null;
    try {
      await bozza.save({ transaction });
    } catch (e) {
      if ((e as { name?: string }).name === 'SequelizeUniqueConstraintError') throw new ConflictError('Il soggetto ha già una scadenza aperta per questo controllo');
      throw e;
    }
    await bozza.reload({ transaction });
    await ricalcolaScadenze({ idScadenza: bozza.idScadenza }, ctx.oggi, transaction);
    traccia(ctx, 'vigilo.scadenza.creata', `Scadenza creata: ${bozza.titolo || controllo?.nome}`, null, bozza);
    uuid = bozza.uuidScadenza;
  });
  return leggiScadenza(ctx, uuid);
}

const MODIFICABILI = ['scadeIl', 'sogliaUso', 'titolo', 'note', 'fineIl', 'ripetizioniRimaste', 'cadenza', 'preavvisi', 'tolleranza', 'destinatari'] as const;

export async function modificaScadenza(ctx: Contesto, uuid: string, body: Record<string, unknown>) {
  await sequelize.transaction(async transaction => {
    const s = await trovaNelTenant(Scadenza, 'uuidScadenza', uuid, ctx.idTenant, 'Scadenza', { include: [{ model: Soggetto, as: 'soggetto' }], transaction });
    if (s.chiusaIl && Object.keys(body).some(k => k !== 'note')) throw new ConflictError('Una scadenza chiusa non si modifica (solo le note)');
    if ('titolo' in body && s.idControllo && body.titolo) throw new ValidationError('Il titolo si cambia solo nei promemoria: le altre prendono il nome del controllo');
    if ('titolo' in body && !s.idControllo && !body.titolo) throw new ValidationError('Un promemoria ha bisogno di un titolo');
    await verificaRidefinizioni(body as { cadenza?: Cadenza | null }, s.soggetto ?? null, transaction);
    const prima = snapshot(s);
    for (const k of MODIFICABILI) if (k in body) s.set(k, (body[k] === '' ? null : body[k]) as never);
    if ('scadeIl' in body && body.scadeIl) s.giornoAncora = parti(String(body.scadeIl))[2];
    await s.save({ transaction });
    await ricalcolaScadenze({ idScadenza: s.idScadenza }, ctx.oggi, transaction);
    traccia(ctx, 'vigilo.scadenza.modificata', 'Scadenza modificata', prima, s);
  });
  return leggiScadenza(ctx, uuid);
}

/** Si elimina solo una scadenza senza registrazioni (inserita per errore) */
export async function eliminaScadenza(ctx: Contesto, uuid: string): Promise<void> {
  await sequelize.transaction(async transaction => {
    const s = await trovaNelTenant(Scadenza, 'uuidScadenza', uuid, ctx.idTenant, 'Scadenza', { transaction });
    if (await Registrazione.count({ where: { idScadenza: s.idScadenza }, transaction }))
      throw new ConflictError('La scadenza ha delle registrazioni: non si elimina');
    const prima = snapshot(s);
    await eliminaAllegatiDi(ctx.idTenant, [{ entita: 'scadenza', idEntita: [s.idScadenza] }], transaction);
    await s.destroy({ transaction });
    traccia(ctx, 'vigilo.scadenza.eliminata', 'Scadenza eliminata', prima, null);
  });
}
