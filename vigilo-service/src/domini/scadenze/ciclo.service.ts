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
// Una sola scadenza aperta per (soggetto, controllo): lo garantisce anche il
// database (uq_scadenze_aperta).
// =============================================================================
import { Op, type Transaction, type WhereOptions } from 'sequelize';
import { parti, primaScadenza, type Giorno } from '../../regole';
import type { Contesto } from '../../core/contesto';
import { Contatore, Controllo, Scadenza, Soggetto } from '../modelli';
import type { MotivoChiusura } from '../valori';
import { ricalcolaScadenze } from './ricalcolo.service';

/** Il controllo vale per il soggetto? (stesso tipo; categorie vuote = tutti) */
export const siApplica = (controllo: Controllo, idCategorie: number[], soggetto: Soggetto): boolean =>
  controllo.tipoSoggetto === soggetto.tipo &&
  soggetto.stato !== 'dismesso' &&
  (idCategorie.length === 0 || (soggetto.idCategoria != null && idCategorie.includes(soggetto.idCategoria)));

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
  const esistenti = new Set(aperte.map(s => `${s.idSoggetto}:${s.idControllo}`));

  const create: Scadenza[] = [];
  for (const { soggetto, controllo } of coppie) {
    const chiave = `${soggetto.idSoggetto}:${controllo.idControllo}`;
    if (esistenti.has(chiave)) continue;
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
  const [n] = await Scadenza.update(
    { chiusaIl: null, motivoChiusura: null },
    { where: { ...(dove as object), chiusaIl: ultima } as WhereOptions<Scadenza>, transaction, validate: false }
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
