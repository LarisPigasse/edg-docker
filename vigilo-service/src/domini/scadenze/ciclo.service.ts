// =============================================================================
// Nascita e chiusura delle scadenze dei controlli (01-dominio 1.2, 1.6)
// =============================================================================
//   controllo automatico  -> una scadenza aperta per ogni soggetto a cui si
//                            applica (tipo, categorie, non dismesso), con la
//                            prima data se si calcola dai dati del soggetto,
//                            altrimenti "da completare"
//   soggetto dismesso     -> le sue scadenze aperte si chiudono
//   soggetto ripristinato -> si riaprono quelle chiuse dall'ultima
//                            archiviazione, con le loro date
//   controllo disattivato -> le sue scadenze aperte si chiudono
//   controllo riattivato  -> si riaprono quelle chiuse dalla
//                            disattivazione, con le loro date (2026-11-19)
//   categorie cambiate    -> si chiudono quelle dei soggetti rimasti fuori
//                            ('fuori-ambito') e si riaprono, con le loro
//                            date, quelle dei soggetti rientrati
//   controllo non seguito -> per quel soggetto non nasce né si riapre niente
//                            (esclusioni, revisione 2026-11-11)
// Una sola scadenza aperta per (soggetto, controllo): lo garantisce anche il
// database (uq_scadenze_aperta).
// =============================================================================
import { Op, type Transaction, type WhereOptions } from 'sequelize';
import { parti, primaScadenza, type Giorno } from '../../regole';
import type { Contesto } from '../../core/contesto';
import { Contatore, Controllo, Scadenza, Soggetto } from '../modelli';
import type { MotivoChiusura } from '../valori';
import { coppia } from '../esclusioni/esclusioni';
import { controlliNonSeguitiDi, coppieNonSeguite } from '../esclusioni/inCorso';
import { scadenzeDaRiaprire } from '../controlli/riattivazione';
import { ricalcolaScadenze } from './ricalcolo.service';

/** Il controllo riguarda il soggetto per tipo e categoria (categorie vuote = tutti), qualunque sia il suo stato */
export const valePer = (controllo: Controllo, idCategorie: number[], soggetto: Soggetto): boolean =>
  controllo.tipoSoggetto === soggetto.tipo &&
  (idCategorie.length === 0 || (soggetto.idCategoria != null && idCategorie.includes(soggetto.idCategoria)));

/** Il controllo vale per il soggetto? (stesso tipo e categoria, soggetto non dismesso) */
export const siApplica = (controllo: Controllo, idCategorie: number[], soggetto: Soggetto): boolean =>
  soggetto.stato !== 'dismesso' && valePer(controllo, idCategorie, soggetto);

/** I soggetti (non dismessi) a cui si applica un controllo */
export async function soggettiDelControllo(controllo: Controllo, idCategorie: number[], transaction?: Transaction): Promise<Soggetto[]> {
  return Soggetto.findAll({
    where: {
      idTenant: controllo.idTenant,
      tipo: controllo.tipoSoggetto,
      stato: { [Op.ne]: 'dismesso' },
      ...(idCategorie.length ? { idCategoria: idCategorie } : {}),
    },
    transaction,
  });
}

/** I controlli automatici attivi che valgono per un soggetto */
export async function controlliAutomaticiPer(soggetto: Soggetto, transaction?: Transaction): Promise<Controllo[]> {
  const controlli = await Controllo.findAll({
    where: { idTenant: soggetto.idTenant, tipoSoggetto: soggetto.tipo, automatico: true, attivo: true },
    include: [{ association: 'categorie', attributes: ['idCategoria'], through: { attributes: [] } }],
    transaction,
  });
  return controlli.filter(c => siApplica(c, (c.categorie ?? []).map(k => k.idCategoria), soggetto));
}

/**
 * Crea le scadenze che mancano per le coppie (soggetto, controllo): salta le
 * coppie che ne hanno gia' una aperta. Restituisce quelle create, gia'
 * ricalcolate.
 */
export async function generaScadenze(
  coppie: { soggetto: Soggetto; controllo: Controllo }[],
  ctx: Contesto,
  transaction: Transaction
): Promise<Scadenza[]> {
  if (!coppie.length) return [];
  const aperte = await Scadenza.findAll({
    where: {
      idTenant: ctx.idTenant,
      chiusaIl: null,
      idSoggetto: [...new Set(coppie.map(c => c.soggetto.idSoggetto))],
      idControllo: [...new Set(coppie.map(c => c.controllo.idControllo))],
    },
    attributes: ['idSoggetto', 'idControllo'],
    transaction,
  });
  const esistenti = new Set(aperte.map(s => coppia(Number(s.idSoggetto), Number(s.idControllo))));
  // le coppie che l'ufficio ha deciso di non seguire non ricevono scadenze
  const nonSeguite = await coppieNonSeguite(
    coppie.map(c => c.soggetto.idSoggetto),
    coppie.map(c => c.controllo.idControllo),
    transaction
  );

  const create: Scadenza[] = [];
  for (const { soggetto, controllo } of coppie) {
    const chiave = coppia(soggetto.idSoggetto, controllo.idControllo);
    if (esistenti.has(chiave) || nonSeguite.has(chiave)) continue;
    esistenti.add(chiave);
    const uso = controllo.cadenza.uso;
    const contatore = uso
      ? await Contatore.findOne({ where: { idSoggetto: soggetto.idSoggetto, unita: uso.unita, nome: '' }, transaction })
      : null;
    const scadeIl = primaScadenza(controllo.cadenza, soggetto.dati ?? {}, ctx.oggi);
    create.push(
      await Scadenza.create(
        {
          idTenant: ctx.idTenant,
          idSoggetto: soggetto.idSoggetto,
          idControllo: controllo.idControllo,
          scadeIl,
          idContatore: contatore?.idContatore ?? null,
          giornoAncora: scadeIl ? parti(scadeIl)[2] : null,
        },
        { transaction }
      )
    );
  }
  if (create.length) await ricalcolaScadenze({ idScadenza: create.map(s => s.idScadenza) }, ctx.oggi, transaction);
  return create;
}

/**
 * Riapre le scadenze chiuse dall'ULTIMA archiviazione del soggetto, con le
 * loro date: le riconosce dal motivo e dall'istante di chiusura (una sola
 * UPDATE le chiude tutte insieme). Quelle di archiviazioni precedenti restano
 * chiuse: al ripristino di allora ne erano già nate altre. Restituisce quante.
 */
export async function riapriScadenzeArchiviate(idSoggetto: number, oggi: Giorno, transaction: Transaction): Promise<number> {
  const dove = { idSoggetto, motivoChiusura: 'soggetto-dismesso' } as WhereOptions<Scadenza>;
  const ultima = (await Scadenza.max('chiusaIl', { where: dove, transaction })) as Date | null;
  if (!ultima) return 0;
  // quelle dei controlli che nel frattempo si è deciso di non seguire restano chiuse
  const nonSeguiti = await controlliNonSeguitiDi(idSoggetto, transaction);
  const seguite = nonSeguiti.length ? { [Op.or]: [{ idControllo: null }, { idControllo: { [Op.notIn]: nonSeguiti } }] } : {};
  const [n] = await Scadenza.update(
    { chiusaIl: null, motivoChiusura: null },
    { where: { ...(dove as object), ...seguite, chiusaIl: ultima } as WhereOptions<Scadenza>, transaction, validate: false }
  );
  if (n) await ricalcolaScadenze({ idSoggetto }, oggi, transaction);
  return n;
}

/** Chiude le scadenze aperte che rispondono al filtro; restituisce quante */
export async function chiudiScadenze(where: WhereOptions<Scadenza>, motivo: MotivoChiusura, transaction: Transaction): Promise<number> {
  const [n] = await Scadenza.update(
    { chiusaIl: new Date(), motivoChiusura: motivo },
    // validate: false — i validatori di modello vedrebbero solo i campi aggiornati (L054); i vincoli veri sono nel database
    { where: { ...(where as object), chiusaIl: null } as WhereOptions<Scadenza>, transaction, validate: false }
  );
  return n;
}

/**
 * Riapre, con le loro date, le scadenze di un controllo chiuse per `motivo`
 * ('controllo-disattivato' alla riattivazione, 'fuori-ambito' quando una
 * categoria torna fra le sue): per ogni soggetto si guarda la sua ultima
 * scadenza chiusa, e si riapre se è stata chiusa per quel motivo, se il
 * soggetto non ne ha una aperta, se il controllo si segue e gli si applica
 * (controlli/riattivazione.ts). Restituisce quante.
 */
export async function riapriScadenzeChiuse(
  controllo: Controllo,
  idCategorie: number[],
  motivo: 'controllo-disattivato' | 'fuori-ambito',
  oggi: Giorno,
  transaction: Transaction
): Promise<number> {
  const chiuse = await Scadenza.findAll({
    where: { idControllo: controllo.idControllo, chiusaIl: { [Op.ne]: null } },
    attributes: ['idScadenza', 'idSoggetto', 'motivoChiusura', 'chiusaIl'],
    order: [['chiusaIl', 'DESC'], ['idScadenza', 'DESC']],
    transaction,
  });
  // l'ultima chiusa di ogni soggetto, se è stata chiusa per quel motivo
  const ultime = new Map<number, Scadenza>();
  for (const s of chiuse) if (!ultime.has(Number(s.idSoggetto))) ultime.set(Number(s.idSoggetto), s);
  const candidate = [...ultime.values()].filter(s => s.motivoChiusura === motivo);
  if (!candidate.length) return 0;
  const idSoggetti = candidate.map(s => Number(s.idSoggetto));
  const aperte = await Scadenza.findAll({ where: { idControllo: controllo.idControllo, chiusaIl: null }, attributes: ['idSoggetto'], transaction });
  const nonSeguite = await coppieNonSeguite(idSoggetti, [controllo.idControllo], transaction);
  const ammessi = await soggettiDelControllo(controllo, idCategorie, transaction);
  const ids = scadenzeDaRiaprire(
    candidate.map(s => ({ idScadenza: Number(s.idScadenza), idSoggetto: Number(s.idSoggetto) })),
    {
      conAperta: new Set(aperte.map(s => Number(s.idSoggetto))),
      nonSeguiti: new Set(idSoggetti.filter(id => nonSeguite.has(coppia(id, controllo.idControllo)))),
      ammessi: new Set(ammessi.map(s => s.idSoggetto)),
    }
  );
  if (!ids.length) return 0;
  // validate: false — i validatori di modello vedrebbero solo i campi aggiornati (L054)
  await Scadenza.update({ chiusaIl: null, motivoChiusura: null }, { where: { idScadenza: ids }, transaction, validate: false });
  // lo stato si ricalcola sulla data di oggi (nel frattempo potrebbero essere scadute)
  await ricalcolaScadenze({ idScadenza: ids }, oggi, transaction);
  return ids.length;
}

/**
 * Categorie cambiate: chiude, con motivo 'fuori-ambito', le scadenze aperte
 * dei soggetti a cui il controllo non si applica più. Restituisce quante.
 */
export async function chiudiFuoriAmbito(controllo: Controllo, idCategorie: number[], transaction: Transaction): Promise<number> {
  const ammessi = await soggettiDelControllo(controllo, idCategorie, transaction);
  const dentro = ammessi.map(s => s.idSoggetto);
  return chiudiScadenze(
    { idControllo: controllo.idControllo, ...(dentro.length ? { idSoggetto: { [Op.notIn]: dentro } } : {}) } as WhereOptions<Scadenza>,
    'fuori-ambito',
    transaction
  );
}
