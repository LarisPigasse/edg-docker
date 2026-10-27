// =============================================================================
// Documenti (allegati) di soggetti, scadenze e registrazioni (B9a, ADR099)
// =============================================================================
//   elencaAllegati       i documenti di un soggetto (con quelli delle sue
//                        scadenze e registrazioni), di una scadenza (con le sue
//                        registrazioni) o di una registrazione
//   caricaAllegato       multipart a flusso (busboy): il file va su disco senza
//                        passare dalla memoria e si ferma oltre il limite; il
//                        tipo si riconosce dai primi byte (allegati.ts)
//   leggiFile            per scaricarlo o aprirlo
//   eliminaAllegato      la riga e poi il file
//   eliminaAllegatiDi    quando si elimina ciò a cui appartengono (soggetto o
//                        scadenza senza storico): i file dopo il commit
//   collegaAllaRegistrazione  i documenti caricati sulla scadenza dal modulo
//                        Registra passano alla registrazione
// Sul disco: <cartella>/<idTenant>/<uuid>, senza nome né estensione; i file in
// arrivo stanno in <cartella>/.in-arrivo (stesso volume: lo spostamento è
// atomico). La cartella è VIGILO_ALLEGATI_DIR (nel container /app/uploads,
// volume vigilo-uploads, nel backup).
// =============================================================================
import { randomUUID } from 'crypto';
import fs from 'fs';
import { mkdir, rename, rm } from 'fs/promises';
import path from 'path';
import busboy from 'busboy';
import type { Request } from 'express';
import Joi from 'joi';
import { Op, type Transaction } from 'sequelize';
import type { Contesto } from '../../core/contesto';
import { trovaNelTenant } from '../../core/db/tenant';
import { PARAMETRI } from '../../core/parametri';
import { logger, snapshot } from '../../core/services/logger';
import { traccia } from '../../core/services/traccia';
import { ConflictError, ValidationError } from '../../core/utils/errors';
import { indirizziDi } from '../avvisi/email';
import { Allegato, Controllo, Registrazione, Scadenza, Soggetto } from '../modelli';
import { ENTITA_ALLEGATO, type EntitaAllegato } from '../valori';
import { LIMITI_ALLEGATI, TIPI_ALLEGATO, byteMassimi, nomePulito, tipoDaFirma, type TipoAllegato } from './allegati';

const CARTELLA = path.resolve(process.env.VIGILO_ALLEGATI_DIR || '/app/uploads');
const IN_ARRIVO = path.join(CARTELLA, '.in-arrivo');

const ETICHETTA: Record<EntitaAllegato, string> = { soggetto: 'soggetto', scadenza: 'scadenza', registrazione: 'registrazione' };

/** Il percorso sul disco; mai fuori dalla cartella degli allegati */
function assoluto(relativo: string): string {
  const p = path.resolve(CARTELLA, relativo);
  if (!p.startsWith(CARTELLA + path.sep)) throw new Error(`Percorso fuori dalla cartella degli allegati: ${relativo}`);
  return p;
}

/** Toglie i file dal disco; un file che non c'è non è un errore */
function rimuoviFile(percorsi: string[]): void {
  for (const p of percorsi)
    rm(assoluto(p), { force: true }).catch(err => logger.warn('vigilo.allegati', `File non rimosso (${p}): ${String(err)}`));
}

/** L'id nel tenant della cosa a cui appartiene un documento (404 se non è del tenant) */
async function idEntitaDi(ctx: Contesto, entita: EntitaAllegato, uuid: string, transaction?: Transaction): Promise<number> {
  if (entita === 'soggetto') return (await trovaNelTenant(Soggetto, 'uuidSoggetto', uuid, ctx.idTenant, 'Soggetto', { transaction })).idSoggetto;
  if (entita === 'scadenza') return (await trovaNelTenant(Scadenza, 'uuidScadenza', uuid, ctx.idTenant, 'Scadenza', { transaction })).idScadenza;
  return (await trovaNelTenant(Registrazione, 'uuidRegistrazione', uuid, ctx.idTenant, 'Registrazione', { transaction })).idRegistrazione;
}

// --- presentazione ---

/** A che cosa appartiene: per raggruppare nella scheda del soggetto */
export interface AppartenenzaAllegato {
  entita: EntitaAllegato;
  uuid: string;
  /** Titolo della scadenza (anche per una registrazione); null per il soggetto */
  titolo: string | null;
  /** Solo per una registrazione */
  eseguitaIl: string | null;
}

export interface VoceAllegato {
  uuid: string;
  nome: string;
  tipo: string;
  dimensione: number;
  descrizione: string | null;
  /** Il browser lo mostra da sé; altrimenti si scarica */
  apribile: boolean;
  caricatoIl: Date;
  /** Nome di chi l'ha caricato; null se non si è potuto leggere */
  caricatoDa: string | null;
  di: AppartenenzaAllegato;
}

async function presenta(righe: Allegato[], di: (a: Allegato) => AppartenenzaAllegato): Promise<VoceAllegato[]> {
  let nomi = new Map<number, { nome: string }>();
  const ids = righe.map(a => a.creatoDa).filter((id): id is number => id != null);
  try {
    if (ids.length) nomi = await indirizziDi(ids);
  } catch (err) {
    logger.warn('vigilo.allegati', `Nomi di chi ha caricato non letti: ${String(err)}`);
  }
  return righe.map(a => ({
    uuid: a.uuidAllegato,
    nome: a.nomeFile,
    tipo: a.tipoMime,
    dimensione: a.dimensione,
    descrizione: a.descrizione ?? null,
    apribile: TIPI_ALLEGATO[a.tipoMime]?.apribile ?? false,
    caricatoIl: a.createdAt,
    caricatoDa: a.creatoDa != null ? (nomi.get(a.creatoDa)?.nome ?? null) : null,
    di: di(a),
  }));
}

// --- elenco ---

export async function elencaAllegati(ctx: Contesto, entita: EntitaAllegato, uuid: string): Promise<VoceAllegato[]> {
  const gruppi: { entita: EntitaAllegato; idEntita: number[] }[] = [];
  const appartenenza = new Map<string, AppartenenzaAllegato>();
  const segna = (e: EntitaAllegato, id: number, a: AppartenenzaAllegato) => appartenenza.set(`${e}:${id}`, a);

  const scadenzeE = async (scadenze: Scadenza[]) => {
    if (!scadenze.length) return;
    gruppi.push({ entita: 'scadenza', idEntita: scadenze.map(s => s.idScadenza) });
    const titolo = new Map(scadenze.map(s => [s.idScadenza, s.titolo || s.controllo?.nome || null]));
    for (const s of scadenze) segna('scadenza', s.idScadenza, { entita: 'scadenza', uuid: s.uuidScadenza, titolo: titolo.get(s.idScadenza) ?? null, eseguitaIl: null });
    const regs = await Registrazione.findAll({
      where: { idTenant: ctx.idTenant, idScadenza: scadenze.map(s => s.idScadenza) },
      attributes: ['idRegistrazione', 'uuidRegistrazione', 'idScadenza', 'eseguitaIl'],
    });
    if (!regs.length) return;
    gruppi.push({ entita: 'registrazione', idEntita: regs.map(r => r.idRegistrazione) });
    for (const r of regs)
      segna('registrazione', r.idRegistrazione, { entita: 'registrazione', uuid: r.uuidRegistrazione, titolo: titolo.get(r.idScadenza) ?? null, eseguitaIl: r.eseguitaIl });
  };
  const conControllo = { include: [{ model: Controllo, as: 'controllo', attributes: ['nome'] }], attributes: ['idScadenza', 'uuidScadenza', 'titolo'] };

  if (entita === 'soggetto') {
    const s = await trovaNelTenant(Soggetto, 'uuidSoggetto', uuid, ctx.idTenant, 'Soggetto');
    gruppi.push({ entita: 'soggetto', idEntita: [s.idSoggetto] });
    segna('soggetto', s.idSoggetto, { entita: 'soggetto', uuid: s.uuidSoggetto, titolo: null, eseguitaIl: null });
    await scadenzeE(await Scadenza.findAll({ where: { idTenant: ctx.idTenant, idSoggetto: s.idSoggetto }, ...conControllo }));
  } else if (entita === 'scadenza') {
    await scadenzeE([await trovaNelTenant(Scadenza, 'uuidScadenza', uuid, ctx.idTenant, 'Scadenza', conControllo)]);
  } else {
    const r = await trovaNelTenant(Registrazione, 'uuidRegistrazione', uuid, ctx.idTenant, 'Registrazione', {
      include: [{ model: Scadenza, as: 'scadenza', ...conControllo }],
    });
    gruppi.push({ entita: 'registrazione', idEntita: [r.idRegistrazione] });
    const s = r.scadenza;
    segna('registrazione', r.idRegistrazione, { entita: 'registrazione', uuid: r.uuidRegistrazione, titolo: s ? s.titolo || s.controllo?.nome || null : null, eseguitaIl: r.eseguitaIl });
  }

  const righe = await Allegato.findAll({
    where: { idTenant: ctx.idTenant, [Op.or]: gruppi.map(g => ({ entita: g.entita, idEntita: g.idEntita })) },
    order: [['createdAt', 'DESC']],
  });
  return presenta(righe, a => appartenenza.get(`${a.entita}:${a.idEntita}`)!);
}

// --- caricamento ---

interface Arrivo {
  campi: Record<string, string>;
  file: { tmp: string; nome: string; testa: Buffer; byte: number } | null;
  troppoGrande: boolean;
}

/** Legge il multipart: i campi in memoria, il file a flusso su disco (al massimo uno) */
function ricevi(req: Request, arrivo: Arrivo): Promise<void> {
  return new Promise((resolve, reject) => {
    let bb: busboy.Busboy;
    try {
      bb = busboy({
        headers: req.headers,
        limits: { files: 1, fields: 8, parts: 16, fieldSize: 1024, fileSize: byteMassimi(PARAMETRI.allegatoMb) },
      });
    } catch {
      reject(new ValidationError('Il documento va inviato come modulo multipart'));
      return;
    }
    let scrittura: Promise<void> = Promise.resolve();
    bb.on('field', (nome, valore) => {
      arrivo.campi[nome] = valore;
    });
    bb.on('file', (_nome, flusso, info) => {
      if (arrivo.file) {
        flusso.resume();
        return;
      }
      const file = { tmp: path.join(IN_ARRIVO, randomUUID()), nome: info.filename ?? '', testa: Buffer.alloc(0), byte: 0 };
      arrivo.file = file;
      const uscita = fs.createWriteStream(file.tmp);
      flusso.on('data', (pezzo: Buffer) => {
        if (file.testa.length < LIMITI_ALLEGATI.byteFirma) file.testa = Buffer.concat([file.testa, pezzo.subarray(0, LIMITI_ALLEGATI.byteFirma - file.testa.length)]);
        file.byte += pezzo.length;
      });
      flusso.on('limit', () => {
        arrivo.troppoGrande = true;
      });
      scrittura = new Promise((ok, ko) => {
        uscita.on('finish', ok);
        uscita.on('error', ko);
        flusso.on('error', ko);
      });
      flusso.pipe(uscita);
    });
    bb.on('error', err => reject(new ValidationError(`Caricamento non riuscito: ${String(err)}`)));
    bb.on('close', () => scrittura.then(resolve, reject));
    req.on('aborted', () => reject(new ValidationError('Caricamento interrotto')));
    req.pipe(bb);
  });
}

const CAMPI = Joi.object({
  entita: Joi.string()
    .valid(...ENTITA_ALLEGATO)
    .required(),
  id: Joi.string().guid({ version: 'uuidv4' }).required(),
  descrizione: Joi.string().trim().max(LIMITI_ALLEGATI.descrizione).allow(''),
});

export async function caricaAllegato(ctx: Contesto, req: Request): Promise<VoceAllegato> {
  await mkdir(IN_ARRIVO, { recursive: true });
  const arrivo: Arrivo = { campi: {}, file: null, troppoGrande: false };
  let spostato: string | null = null;
  try {
    await ricevi(req, arrivo);
    const { value, error } = CAMPI.validate(arrivo.campi, { stripUnknown: true });
    if (error) throw new ValidationError(`Dati del documento non validi: ${error.details.map(d => d.path.join('.')).join(', ')}`);
    const { entita, id, descrizione } = value as { entita: EntitaAllegato; id: string; descrizione?: string };
    const file = arrivo.file;
    if (!file) throw new ValidationError('Manca il file');
    if (arrivo.troppoGrande) throw new ValidationError(`Il file supera ${PARAMETRI.allegatoMb} MB`);
    if (!file.byte) throw new ValidationError('Il file è vuoto');
    const tipo: TipoAllegato | null = tipoDaFirma(file.testa);
    if (!tipo) throw new ValidationError('Si possono caricare solo PDF e immagini (JPEG, PNG, WEBP, HEIC)');

    const idEntita = await idEntitaDi(ctx, entita, id);
    if ((await Allegato.count({ where: { idTenant: ctx.idTenant, entita, idEntita } })) >= LIMITI_ALLEGATI.perEntita)
      throw new ConflictError(`Al massimo ${LIMITI_ALLEGATI.perEntita} documenti per ${ETICHETTA[entita]}`);

    const uuidAllegato = randomUUID();
    const percorso = `${ctx.idTenant}/${uuidAllegato}`;
    await mkdir(path.dirname(assoluto(percorso)), { recursive: true });
    await rename(file.tmp, assoluto(percorso));
    spostato = percorso;
    const a = await Allegato.create({
      uuidAllegato,
      idTenant: ctx.idTenant,
      entita,
      idEntita,
      nomeFile: nomePulito(file.nome, tipo),
      percorso,
      tipoMime: tipo.mime,
      dimensione: file.byte,
      descrizione: descrizione || null,
    });
    spostato = null;
    traccia(ctx, 'vigilo.allegato.caricato', `Documento caricato: ${a.nomeFile}`, null, a, { entita, id });
    const di: AppartenenzaAllegato = { entita, uuid: id, titolo: null, eseguitaIl: null };
    return (await presenta([a], () => di))[0];
  } catch (err) {
    if (spostato) rimuoviFile([spostato]);
    throw err;
  } finally {
    if (arrivo.file) await rm(arrivo.file.tmp, { force: true });
  }
}

// --- lettura ed eliminazione ---

export async function leggiFile(ctx: Contesto, uuid: string): Promise<{ allegato: Allegato; percorso: string; tipo: TipoAllegato | null }> {
  const allegato = await trovaNelTenant(Allegato, 'uuidAllegato', uuid, ctx.idTenant, 'Documento');
  return { allegato, percorso: assoluto(allegato.percorso), tipo: TIPI_ALLEGATO[allegato.tipoMime] ?? null };
}

export async function eliminaAllegato(ctx: Contesto, uuid: string): Promise<void> {
  const a = await trovaNelTenant(Allegato, 'uuidAllegato', uuid, ctx.idTenant, 'Documento');
  const prima = snapshot(a);
  await a.destroy();
  rimuoviFile([a.percorso]);
  traccia(ctx, 'vigilo.allegato.eliminato', `Documento eliminato: ${a.nomeFile}`, prima, null);
}

/** I documenti di ciò che si sta eliminando: le righe nella transazione, i file dopo il commit */
export async function eliminaAllegatiDi(idTenant: number, gruppi: { entita: EntitaAllegato; idEntita: number[] }[], transaction: Transaction): Promise<number> {
  const validi = gruppi.filter(g => g.idEntita.length);
  if (!validi.length) return 0;
  const righe = await Allegato.findAll({ where: { idTenant, [Op.or]: validi.map(g => ({ entita: g.entita, idEntita: g.idEntita })) }, attributes: ['idAllegato', 'percorso'], transaction });
  if (!righe.length) return 0;
  await Allegato.destroy({ where: { idAllegato: righe.map(a => a.idAllegato) }, transaction });
  const percorsi = righe.map(a => a.percorso);
  transaction.afterCommit(() => rimuoviFile(percorsi));
  return righe.length;
}

/** I documenti caricati sulla scadenza dal modulo Registra passano alla registrazione */
export async function collegaAllaRegistrazione(idTenant: number, uuids: string[], idScadenza: number, idRegistrazione: number, transaction: Transaction): Promise<number> {
  const unici = [...new Set(uuids)];
  if (!unici.length) return 0;
  const righe = await Allegato.findAll({ where: { idTenant, uuidAllegato: unici, entita: 'scadenza', idEntita: idScadenza }, attributes: ['idAllegato'], transaction });
  if (righe.length !== unici.length) throw new ValidationError('Uno dei documenti non è più su questa scadenza: ricaricalo');
  await Allegato.update({ entita: 'registrazione', idEntita: idRegistrazione }, { where: { idAllegato: righe.map(a => a.idAllegato) }, transaction, validate: false }); // L054
  return righe.length;
}
