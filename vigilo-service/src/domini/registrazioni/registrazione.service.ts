// =============================================================================
// Registrazioni — cosa e' successo a una scadenza (01-dominio 1.3)
// =============================================================================
//   esecuzione positiva  chiude la scadenza e apre la successiva dalla cadenza
//                        (data proposta, correggibile con `prossima`)
//   esecuzione negativa  la scadenza resta aperta, con nuova data se serve
//   rinvio               sposta la data con un motivo, senza chiudere
//   rinnovo tacito       il processo notturno rinnova da solo (controlli con
//                        rinnovo tacito, es. abbonamenti, rate domiciliate)
// La lettura del contatore registrata insieme diventa una lettura vera.
// =============================================================================
import { Op, type Transaction } from 'sequelize';
import { sequelize } from '../../config/database';
import { contestoDiProcesso, type Contesto } from '../../core/contesto';
import { trovaNelTenant } from '../../core/db/tenant';
import { snapshot } from '../../core/services/logger';
import { traccia } from '../../core/services/traccia';
import { ConflictError, ValidationError } from '../../core/utils/errors';
import type { Pagina } from '../../core/utils/lista';
import { confronta, parti, prossimaScadenza, type Giorno, type ImpostazioniEffettive } from '../../regole';
import { registraLettura } from '../contatori/contatore.service';
import { Contatore, Controllo, Fornitore, Registrazione, Scadenza, Soggetto } from '../modelli';
import { effettiveDi, predefinitiDi, ricalcolaScadenze } from '../scadenze/ricalcolo.service';
import type { DatoRegistrazione, Richiesta } from '../valori';

const CON = [
  { model: Controllo, as: 'controllo' },
  { model: Contatore, as: 'contatore' },
  { model: Soggetto, as: 'soggetto' },
];

async function scadenzaAperta(ctx: Contesto, uuid: string, transaction: Transaction): Promise<Scadenza> {
  const s = await trovaNelTenant(Scadenza, 'uuidScadenza', uuid, ctx.idTenant, 'Scadenza', { include: CON, transaction });
  if (s.chiusaIl) throw new ConflictError('La scadenza è già chiusa');
  return s;
}

async function effettive(s: Scadenza, transaction: Transaction): Promise<ImpostazioniEffettive> {
  const predefiniti = await predefinitiDi([s.idTenant], transaction);
  return effettiveDi(s, s.controllo, predefiniti.get(s.idTenant)!);
}

/** Che cosa chiede la registrazione: dal controllo, con la lettura obbligatoria se la cadenza e' a uso */
export function richiesteDi(s: Scadenza, eff: ImpostazioniEffettive): Record<DatoRegistrazione, Richiesta> {
  return {
    importo: 'facoltativo',
    fornitore: 'facoltativo',
    riferimento: 'facoltativo',
    allegato: 'facoltativo',
    lettura: eff.cadenza.uso ? 'obbligatorio' : 'facoltativo',
    ...(s.controllo?.registrazione ?? {}),
  };
}

/**
 * Chiude la scadenza e, se la serie continua, apre la successiva. Restituisce
 * la successiva (null se la serie e' finita).
 */
async function chiudiERinnova(
  s: Scadenza,
  eff: ImpostazioniEffettive,
  esec: { eseguitaIl: Giorno; lettura: number | null },
  correzione: { scadeIl?: Giorno; sogliaUso?: number } | undefined,
  reg: Registrazione,
  oggi: Giorno,
  transaction: Transaction
): Promise<Scadenza | null> {
  const p = prossimaScadenza(
    eff.cadenza,
    { scadeIl: s.scadeIl ?? null, sogliaUso: s.sogliaUso ?? null },
    esec,
    { fineIl: s.fineIl, ripetizioniRimaste: s.ripetizioniRimaste },
    s.giornoAncora ?? null,
    (s.soggetto?.dati ?? {}) as Record<string, unknown>
  );
  const haCadenza = !!(eff.cadenza.tempo || eff.cadenza.uso);
  await s.update({ chiusaIl: new Date(), motivoChiusura: p.finita ? (haCadenza ? 'fine-ricorrenza' : 'completata') : 'rinnovata' }, { transaction });
  if (p.finita) return null;

  const scadeIl = correzione?.scadeIl ?? p.scadeIl;
  const nuova = await Scadenza.create(
    {
      idTenant: s.idTenant,
      idSoggetto: s.idSoggetto,
      idControllo: s.idControllo,
      titolo: s.titolo,
      scadeIl,
      idContatore: s.idContatore,
      sogliaUso: correzione?.sogliaUso ?? p.sogliaUso,
      cadenza: s.cadenza,
      preavvisi: s.preavvisi,
      tolleranza: s.tolleranza,
      destinatari: s.destinatari,
      fineIl: s.fineIl,
      ripetizioniRimaste: p.ripetizioniRimaste,
      // la data corretta a mano diventa il nuovo giorno della serie (ADR071)
      giornoAncora: correzione?.scadeIl ? parti(correzione.scadeIl)[2] : (s.giornoAncora ?? (scadeIl ? parti(scadeIl)[2] : null)),
    },
    { transaction }
  );
  await nuova.reload({ transaction });
  await reg.update({ idScadenzaSuccessiva: nuova.idScadenza, dataNuova: nuova.scadeIl ?? null }, { transaction });
  await ricalcolaScadenze({ idScadenza: nuova.idScadenza }, oggi, transaction);
  return nuova.reload({ transaction });
}

export interface DatiEsecuzione {
  eseguitaIl: Giorno;
  esito: 'positivo' | 'negativo';
  lettura?: number | null;
  importo?: number | null;
  fornitore?: string | null;
  riferimento?: string | null;
  note?: string | null;
  /** Correzione della prossima scadenza proposta (esito positivo) */
  prossima?: { scadeIl?: Giorno; sogliaUso?: number };
  /** Nuova data della stessa scadenza (esito negativo) */
  dataNuova?: Giorno | null;
}

export async function registraEsecuzione(ctx: Contesto, uuid: string, d: DatiEsecuzione) {
  return sequelize.transaction(async transaction => {
    const s = await scadenzaAperta(ctx, uuid, transaction);
    if (confronta(d.eseguitaIl, ctx.oggi) > 0) throw new ValidationError('La data di esecuzione non può essere nel futuro');
    const eff = await effettive(s, transaction);
    const richieste = richiesteDi(s, eff);

    // solo i dati che il controllo prevede; gli obbligatori devono esserci
    const valori: Partial<Record<DatoRegistrazione, unknown>> = { importo: d.importo, fornitore: d.fornitore, riferimento: d.riferimento, lettura: d.lettura };
    const mancanti = (Object.keys(valori) as DatoRegistrazione[]).filter(k => richieste[k] === 'obbligatorio' && (valori[k] === undefined || valori[k] === null || valori[k] === ''));
    if (d.esito === 'positivo' && mancanti.length) throw new ValidationError(`Mancano: ${mancanti.join(', ')}`);
    const visibile = (k: DatoRegistrazione) => richieste[k] !== 'nascosto';
    const lettura = visibile('lettura') ? (d.lettura ?? null) : null;
    if (lettura !== null && !s.contatore) throw new ValidationError('La scadenza non ha un contatore a cui riferire la lettura');
    const fornitore =
      visibile('fornitore') && d.fornitore ? await trovaNelTenant(Fornitore, 'uuidFornitore', d.fornitore, ctx.idTenant, 'Fornitore', { transaction }) : null;

    const reg = await Registrazione.create(
      {
        idTenant: ctx.idTenant,
        idScadenza: s.idScadenza,
        tipo: 'esecuzione',
        eseguitaIl: d.eseguitaIl,
        esito: d.esito,
        dataPrecedente: s.scadeIl ?? null,
        idContatore: lettura !== null ? s.idContatore : null,
        lettura,
        importo: visibile('importo') ? (d.importo ?? null) : null,
        idFornitore: fornitore?.idFornitore ?? null,
        riferimento: visibile('riferimento') ? d.riferimento || null : null,
        note: d.note || null,
      },
      { transaction }
    );
    if (lettura !== null) await registraLettura(ctx, s.contatore!, { valore: lettura, lettoIl: d.eseguitaIl, fonte: 'registrazione', idRegistrazione: reg.idRegistrazione }, transaction);

    let successiva: Scadenza | null = null;
    if (d.esito === 'positivo') {
      successiva = await chiudiERinnova(s, eff, { eseguitaIl: d.eseguitaIl, lettura }, d.prossima, reg, ctx.oggi, transaction);
    } else if (d.dataNuova) {
      await s.update({ scadeIl: d.dataNuova }, { transaction });
      await reg.update({ dataNuova: d.dataNuova }, { transaction });
      await ricalcolaScadenze({ idScadenza: s.idScadenza }, ctx.oggi, transaction);
    }
    traccia(ctx, 'vigilo.registrazione.esecuzione', `Esecuzione ${d.esito} registrata`, null, reg, { scadenza: s.uuidScadenza });
    return { registrazione: await reg.reload({ transaction }), scadenza: await s.reload({ transaction }), successiva };
  });
}

export async function registraRinvio(ctx: Contesto, uuid: string, d: { dataNuova: Giorno; motivo: string; note?: string | null }) {
  return sequelize.transaction(async transaction => {
    const s = await scadenzaAperta(ctx, uuid, transaction);
    if (s.controllo && !s.controllo.rinviabile) throw new ConflictError('Questo controllo non si può rinviare');
    if (s.scadeIl && d.dataNuova === s.scadeIl) throw new ValidationError('La nuova data è uguale a quella attuale');
    const reg = await Registrazione.create(
      {
        idTenant: ctx.idTenant,
        idScadenza: s.idScadenza,
        tipo: 'rinvio',
        eseguitaIl: ctx.oggi,
        dataPrecedente: s.scadeIl ?? null,
        dataNuova: d.dataNuova,
        motivo: d.motivo,
        note: d.note || null,
      },
      { transaction }
    );
    const prima = snapshot(s);
    await s.update({ scadeIl: d.dataNuova }, { transaction });
    await ricalcolaScadenze({ idScadenza: s.idScadenza }, ctx.oggi, transaction);
    traccia(ctx, 'vigilo.registrazione.rinvio', `Scadenza rinviata al ${d.dataNuova}: ${d.motivo}`, prima, s);
    return { registrazione: await reg.reload({ transaction }), scadenza: await s.reload({ transaction }) };
  });
}

/**
 * Processo notturno: le scadenze aperte di controlli a rinnovo tacito gia'
 * passate si rinnovano da sole (una registrazione "rinnovo tacito" ciascuna).
 */
/**
 * Lo storico di un soggetto: le registrazioni di tutte le sue scadenze
 * (aperte e chiuse), le più recenti per prime, con il titolo della scadenza.
 */
export async function elencaRegistrazioni(ctx: Contesto, query: Record<string, unknown>, p: Pagina) {
  const soggetto = await trovaNelTenant(Soggetto, 'uuidSoggetto', String(query.soggetto), ctx.idTenant, 'Soggetto');
  const { rows, count } = await Registrazione.findAndCountAll({
    where: { idTenant: ctx.idTenant },
    include: [
      {
        model: Scadenza,
        as: 'scadenza',
        where: { idSoggetto: soggetto.idSoggetto },
        required: true,
        attributes: ['uuidScadenza', 'titolo', 'idControllo'],
        include: [{ model: Controllo, as: 'controllo', attributes: ['nome'] }],
      },
      { model: Fornitore, as: 'fornitore' },
    ],
    order: [
      ['eseguitaIl', p.verso],
      ['idRegistrazione', p.verso],
    ],
    limit: p.righe,
    offset: p.offset,
    distinct: true,
  });
  return { righe: rows, totale: count };
}

export async function rinnoviTaciti(oggi: Giorno): Promise<number> {
  let fatti = 0;
  // un giro rinnova un periodo per scadenza: si ripete per quelle rimaste
  // indietro di piu' periodi (es. una rata inserita mesi dopo)
  for (let giro = 0; giro < 64; giro++) {
    const dovute = await Scadenza.findAll({
      where: { chiusaIl: null, scadeIl: { [Op.lt]: oggi } },
      include: [{ model: Controllo, as: 'controllo', where: { rinnovo: 'tacito', attivo: true } }],
      attributes: ['idScadenza', 'idTenant', 'uuidScadenza'],
    });
    if (!dovute.length) break;
    for (const d of dovute) {
      await sequelize.transaction(async transaction => {
        const ctx = { ...contestoDiProcesso(d.idTenant), oggi };
        const s = await scadenzaAperta(ctx, d.uuidScadenza, transaction);
        const eff = await effettive(s, transaction);
        const reg = await Registrazione.create(
          { idTenant: s.idTenant, idScadenza: s.idScadenza, tipo: 'rinnovo-tacito', eseguitaIl: s.scadeIl!, dataPrecedente: s.scadeIl ?? null },
          { transaction }
        );
        await chiudiERinnova(s, eff, { eseguitaIl: s.scadeIl!, lettura: null }, undefined, reg, oggi, transaction);
        fatti++;
      });
    }
  }
  return fatti;
}
