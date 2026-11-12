// =============================================================================
// Rifornimenti (costo dei mezzi, tappa 2: blocco Uso)
// =============================================================================
// Carburante, AdBlue, pedaggi o altro di un veicolo, una macchina o
// un'attrezzatura (regole in rifornimenti.ts). I km o le ore letti diventano
// una lettura del contatore principale del mezzo (fonte 'rifornimento') e si
// correggono solo dal rifornimento. Chi può:
//   ufficio (write)  inserisce, corregge ed elimina; indica il fornitore
//   addetto (own)    inserisce per i mezzi del suo ambito; corregge ed
//                    elimina solo i suoi
// L'importo lo vede chi ha vigilo.costi e chi ha scritto il rifornimento.
// =============================================================================
import { Op, type Transaction, type WhereOptions } from 'sequelize';
import { sequelize } from '../../config/database';
import type { Contesto } from '../../core/contesto';
import { trovaNelTenant } from '../../core/db/tenant';
import { snapshot } from '../../core/services/logger';
import { traccia } from '../../core/services/traccia';
import { ConflictError, ForbiddenError, ValidationError } from '../../core/utils/errors';
import type { Pagina } from '../../core/utils/lista';
import type { Giorno } from '../../regole';
import { eliminaAllegatiDi } from '../allegati/allegati.service';
import { ambitoDi, verificaAmbito } from '../ambito/ambito.service';
import { aggiornaContatore, registraLettura } from '../contatori/contatore.service';
import { Contatore, Fornitore, Lettura, Rifornimento, Soggetto } from '../modelli';
import { ricalcolaScadenze } from '../scadenze/ricalcolo.service';
import { NESSUN_NOME, nomeAutore, nomiAutori, type NomiAutori } from '../soggetti/autori';
import type { VoceRifornimento } from '../valori';
import { erroriRifornimento, NOMI_VOCI, prezzoAlLitro, TIPI_CON_RIFORNIMENTI, type DatiRifornimento } from './rifornimenti';

export interface CorpoRifornimento {
  soggetto?: string;
  fattoIl?: Giorno;
  voce?: VoceRifornimento;
  litri?: number | null;
  importo?: number;
  lettura?: number | null;
  fornitore?: string | null;
  riferimento?: string | null;
  note?: string | null;
}

const CON_TUTTO = [
  { model: Soggetto, as: 'soggetto', attributes: ['idSoggetto', 'uuidSoggetto', 'nome', 'identificativo', 'tipo'] },
  { model: Fornitore, as: 'fornitore', attributes: ['uuidFornitore', 'nome'] },
  { model: Lettura, as: 'lettura', include: [{ model: Contatore, as: 'contatore', attributes: ['unita', 'nome'] }] },
];

export function presentaRifornimento(r: Rifornimento, ctx: Contesto, nomi: NomiAutori = NESSUN_NOME) {
  const mio = r.creatoDa != null && r.creatoDa === ctx.utente.id;
  const conImporto = ctx.capacita.costi || mio;
  return {
    uuid: r.uuidRifornimento,
    soggetto: r.soggetto ? { uuid: r.soggetto.uuidSoggetto, nome: r.soggetto.nome, identificativo: r.soggetto.identificativo ?? null, tipo: r.soggetto.tipo } : null,
    fattoIl: r.fattoIl,
    voce: r.voce,
    nomeVoce: NOMI_VOCI[r.voce],
    litri: r.litri ?? null,
    ...(conImporto ? { importo: r.importo, prezzoAlLitro: prezzoAlLitro(r.importo, r.litri) } : {}),
    fornitore: r.fornitore ? { uuid: r.fornitore.uuidFornitore, nome: r.fornitore.nome } : null,
    riferimento: r.riferimento ?? null,
    note: r.note ?? null,
    lettura: r.lettura ? { valore: r.lettura.valore, unita: r.lettura.contatore?.unita ?? 'km', anomala: r.lettura.anomala } : null,
    mio,
    /** Chi l'ha registrato (revisione 2026-11-12); null se il nome non si è letto */
    registratoDa: nomeAutore(nomi, r.creatoDa),
    /** Può correggerlo ed eliminarlo chi chiede */
    modificabile: ctx.capacita.write || mio,
    creatoIl: r.createdAt,
  };
}

/** Il contatore principale del mezzo: quello senza nome, i km prima delle ore */
async function contatorePrincipale(idSoggetto: number, transaction: Transaction): Promise<Contatore | null> {
  const contatori = await Contatore.findAll({ where: { idSoggetto }, transaction });
  return contatori.sort((a, b) => Number(a.nome !== '') - Number(b.nome !== '') || Number(a.unita !== 'km') - Number(b.unita !== 'km') || a.idContatore - b.idContatore)[0] ?? null;
}

/** Errori dei dati in un'eccezione sola */
function valida(d: Partial<DatiRifornimento>, oggi: Giorno): void {
  const errori = erroriRifornimento(d, oggi);
  if (errori.length) throw new ValidationError(errori.join('. '));
}

async function fornitoreDa(ctx: Contesto, uuid: string | null | undefined, transaction: Transaction): Promise<number | null | undefined> {
  if (uuid === undefined) return undefined;
  if (!ctx.capacita.write) throw new ForbiddenError("Il fornitore lo indica l'ufficio");
  if (uuid === null || uuid === '') return null;
  return (await trovaNelTenant(Fornitore, 'uuidFornitore', uuid, ctx.idTenant, 'Fornitore', { transaction })).idFornitore;
}

/** La lettura del rifornimento: si toglie quella che c'era e si scrive la nuova */
async function scriviLettura(ctx: Contesto, r: Rifornimento, valore: number | null, transaction: Transaction): Promise<void> {
  const vecchia = await Lettura.findOne({ where: { idRifornimento: r.idRifornimento }, transaction });
  if (vecchia) {
    const c = await Contatore.findByPk(vecchia.idContatore, { transaction });
    await vecchia.destroy({ transaction });
    if (c) {
      await aggiornaContatore(c, ctx.oggi, transaction);
      await ricalcolaScadenze({ idContatore: c.idContatore }, ctx.oggi, transaction);
    }
  }
  if (valore === null) return;
  const c = await contatorePrincipale(r.idSoggetto, transaction);
  if (!c) throw new ValidationError('Il mezzo non ha un contatore: togli i km o le ore letti');
  await registraLettura(ctx, c, { valore, lettoIl: r.fattoIl, fonte: 'rifornimento', idRifornimento: r.idRifornimento }, transaction);
}

/** Il rifornimento, se chi chiede può correggerlo (ufficio, o l'addetto che l'ha scritto, nel suo ambito) */
async function modificabile(ctx: Contesto, uuid: string, transaction: Transaction): Promise<Rifornimento> {
  const r = await trovaNelTenant(Rifornimento, 'uuidRifornimento', uuid, ctx.idTenant, 'Rifornimento', { transaction });
  if (!ctx.capacita.write) {
    await verificaAmbito(ctx, r.idSoggetto, 'Rifornimento');
    if (r.creatoDa !== ctx.utente.id) throw new ConflictError('Puoi correggere solo i rifornimenti che hai scritto tu');
  }
  return r;
}

export async function leggiRifornimento(ctx: Contesto, uuid: string, transaction?: Transaction) {
  const r = await trovaNelTenant(Rifornimento, 'uuidRifornimento', uuid, ctx.idTenant, 'Rifornimento', { include: CON_TUTTO, transaction });
  await verificaAmbito(ctx, r.idSoggetto, 'Rifornimento');
  return presentaRifornimento(r, ctx, await nomiAutori([r.creatoDa]));
}

/** GET /rifornimenti: dal più recente; l'addetto vede quelli dei mezzi del suo ambito */
export async function elencaRifornimenti(ctx: Contesto, q: { soggetto?: string; voce?: VoceRifornimento; dal?: Giorno; al?: Giorno }, p: Pagina) {
  const where: WhereOptions<Rifornimento> = { idTenant: ctx.idTenant };
  if (q.soggetto) {
    const s = await trovaNelTenant(Soggetto, 'uuidSoggetto', q.soggetto, ctx.idTenant, 'Soggetto');
    await verificaAmbito(ctx, s.idSoggetto, 'Soggetto');
    Object.assign(where, { idSoggetto: s.idSoggetto });
  } else {
    const a = await ambitoDi(ctx);
    if (!a.tutto) Object.assign(where, { idSoggetto: a.idSoggetti });
  }
  if (q.voce) Object.assign(where, { voce: q.voce });
  if (q.dal || q.al) Object.assign(where, { fattoIl: { ...(q.dal ? { [Op.gte]: q.dal } : {}), ...(q.al ? { [Op.lte]: q.al } : {}) } });
  const { rows, count } = await Rifornimento.findAndCountAll({
    where,
    include: CON_TUTTO,
    order: [['fattoIl', 'DESC'], ['idRifornimento', 'DESC']],
    limit: p.righe,
    offset: p.offset,
    distinct: true,
  });
  const nomi = await nomiAutori(rows.map(r => r.creatoDa));
  return { elementi: rows.map(r => presentaRifornimento(r, ctx, nomi)), totale: count };
}

/** POST /rifornimenti */
export async function creaRifornimento(ctx: Contesto, body: CorpoRifornimento) {
  const uuid = await sequelize.transaction(async transaction => {
    const s = await trovaNelTenant(Soggetto, 'uuidSoggetto', String(body.soggetto), ctx.idTenant, 'Soggetto', { transaction });
    if (!TIPI_CON_RIFORNIMENTI.includes(s.tipo)) throw new ValidationError('I rifornimenti sono di veicoli, macchine e attrezzature');
    if (!ctx.capacita.write) await verificaAmbito(ctx, s.idSoggetto, 'Soggetto');
    if (s.stato === 'dismesso') throw new ConflictError('Il mezzo è archiviato: ripristinalo prima di registrare un rifornimento');
    valida(body as Partial<DatiRifornimento>, ctx.oggi);
    const r = await Rifornimento.create(
      {
        idTenant: ctx.idTenant,
        idSoggetto: s.idSoggetto,
        fattoIl: body.fattoIl!,
        voce: body.voce!,
        litri: body.litri ?? null,
        importo: body.importo!,
        idFornitore: (await fornitoreDa(ctx, body.fornitore, transaction)) ?? null,
        riferimento: body.riferimento || null,
        note: body.note || null,
      },
      { transaction }
    );
    if (body.lettura != null) await scriviLettura(ctx, r, body.lettura, transaction);
    traccia(ctx, 'vigilo.rifornimento.creato', `${NOMI_VOCI[r.voce]} registrato: ${s.nome}`, null, r);
    return r.uuidRifornimento;
  });
  return leggiRifornimento(ctx, uuid);
}

/** PATCH /rifornimenti/:id */
export async function modificaRifornimento(ctx: Contesto, uuid: string, body: CorpoRifornimento) {
  await sequelize.transaction(async transaction => {
    const r = await modificabile(ctx, uuid, transaction);
    const prima = snapshot(r);
    const lettura = await Lettura.findOne({ where: { idRifornimento: r.idRifornimento }, transaction });
    const dati: Partial<DatiRifornimento> = {
      fattoIl: body.fattoIl ?? r.fattoIl,
      voce: body.voce ?? r.voce,
      litri: 'litri' in body ? body.litri : r.litri,
      importo: body.importo ?? r.importo,
      lettura: 'lettura' in body ? body.lettura : (lettura?.valore ?? null),
    };
    valida(dati, ctx.oggi);
    r.set({ fattoIl: dati.fattoIl!, voce: dati.voce!, litri: dati.litri ?? null, importo: dati.importo! });
    const idFornitore = await fornitoreDa(ctx, body.fornitore, transaction);
    if (idFornitore !== undefined) r.idFornitore = idFornitore;
    if ('riferimento' in body) r.riferimento = body.riferimento || null;
    if ('note' in body) r.note = body.note || null;
    await r.save({ transaction });
    // la lettura si riscrive se cambia il valore o il giorno
    if ('lettura' in body || (lettura && body.fattoIl && body.fattoIl !== lettura.lettoIl)) await scriviLettura(ctx, r, dati.lettura ?? null, transaction);
    traccia(ctx, 'vigilo.rifornimento.modificato', `${NOMI_VOCI[r.voce]} modificato`, prima, r);
  });
  return leggiRifornimento(ctx, uuid);
}

/** DELETE /rifornimenti/:id: con la lettura e gli scontrini */
export async function eliminaRifornimento(ctx: Contesto, uuid: string): Promise<void> {
  await sequelize.transaction(async transaction => {
    const r = await modificabile(ctx, uuid, transaction);
    const prima = snapshot(r);
    await scriviLettura(ctx, r, null, transaction);
    await eliminaAllegatiDi(ctx.idTenant, [{ entita: 'rifornimento', idEntita: [r.idRifornimento] }], transaction);
    await r.destroy({ transaction });
    traccia(ctx, 'vigilo.rifornimento.eliminato', `${NOMI_VOCI[r.voce]} eliminato`, prima, null);
  });
}
