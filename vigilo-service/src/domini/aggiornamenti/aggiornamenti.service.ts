// =============================================================================
// Aggiornamenti della libreria — servizio (03-libreria-avvio 3.6, ADR074, B10b)
// =============================================================================
//   elencaAggiornamenti  le voci del cliente con una nuova versione o ritirate,
//                        con i campi da decidere (regole in aggiornamenti.ts)
//   segnaVisto           prima apertura delle differenze (visto il, da chi)
//   decidi               applica le scelte campo per campo (o tieni/disattiva
//                        una voce ritirata): nuova fotografia e versione,
//                        registro delle decisioni, scadenze allineate con la
//                        stessa logica del PATCH, traccia
//   storicoLibreria      le righe del registro di una voce
// Le categorie di un controllo si confrontano come chiavi della libreria, solo
// fra quelle che il cliente ha; le sue categorie senza chiave restano sempre.
// =============================================================================
import { Op, type Transaction } from 'sequelize';
import { sequelize } from '../../config/database';
import type { Contesto } from '../../core/contesto';
import { trovaNelTenant } from '../../core/db/tenant';
import { snapshot } from '../../core/services/logger';
import { traccia } from '../../core/services/traccia';
import { ConflictError, ValidationError } from '../../core/utils/errors';
import { CAMPI_CATEGORIA, CAMPI_CONTROLLO, origineCategoria, origineControllo } from '../avvio/copia';
import { applicaAllaCategoria } from '../categorie/categoria.service';
import { applicaAlControllo, type EsitoScadenze } from '../controlli/controllo.service';
import { descriviCadenza, descriviPreavvisi, descriviTolleranza, type Cadenza, type Preavvisi, type Tolleranza, type UnitaUso } from '../../regole';
import { Categoria, Controllo, DecisioneLibreria, LibreriaCategoria, LibreriaControllo } from '../modelli';
import { TIPI_SOGGETTO, etichetteDate, type CampoDecisione, type EntitaDecisione, type Origine, type TipoSoggetto } from '../valori';
import {
  categorieComparabili,
  confronta,
  daApplicare,
  daProporre,
  decisioneRitiro,
  esitoDi,
  insieme,
  scelteComplete,
  type CampoProposto,
  type SceltaRitiro,
  type TipoProposta,
} from './aggiornamenti';
import { registraDecisioni } from './registro';

type Valori = Record<string, unknown>;
type Voce = Categoria | Controllo;
type Lib = LibreriaCategoria | LibreriaControllo;

const CAMPI: Record<EntitaDecisione, readonly string[]> = {
  categoria: CAMPI_CATEGORIA,
  controllo: [...CAMPI_CONTROLLO, 'categorie'],
};
const CON_CATEGORIE = { association: 'categorie', through: { attributes: [] } };
const scegli = (v: Valori, campi: readonly string[]): Valori => Object.fromEntries(campi.map(k => [k, v[k] ?? null]));

const attiva = (v: Voce) => (v instanceof Controllo ? v.attivo : v.attiva);
const uuidDi = (v: Voce) => (v instanceof Controllo ? v.uuidControllo : v.uuidCategoria);
const idDi = (v: Voce) => (v instanceof Controllo ? v.idControllo : v.idCategoria);
const libRitirata = (l: Lib) => (l instanceof LibreriaControllo ? !!l.ritirato : !!(l as LibreriaCategoria).ritirata);

/** Le categorie del cliente che vengono dalla libreria: chiave → categoria */
async function categorieDiLibreria(idTenant: number, transaction?: Transaction): Promise<Map<string, Categoria>> {
  const righe = await Categoria.findAll({ where: { idTenant, chiaveLibreria: { [Op.ne]: null } }, transaction });
  return new Map(righe.map(c => [c.chiaveLibreria as string, c]));
}

/** I tre lati del confronto per una voce (le categorie solo fra quelle del cliente) */
function lati(entita: EntitaDecisione, voce: Voce, lib: Lib, delCliente: Map<string, Categoria>) {
  const campi = CAMPI[entita];
  if (entita === 'categoria') {
    return { campi, origine: voce.origine ?? null, mio: scegli(voce.get() as Valori, campi), libreria: origineCategoria(lib as LibreriaCategoria) as Valori };
  }
  const c = voce as Controllo;
  const chiavi = new Set(delCliente.keys());
  const origine = c.origine ? { ...c.origine, categorie: categorieComparabili(c.origine.categorie as string[] | undefined, chiavi) } : null;
  const mio = { ...scegli(c.get() as Valori, campi), categorie: insieme((c.categorie ?? []).map(k => k.chiaveLibreria).filter((k): k is string => !!k)) };
  const nuova = origineControllo(lib as LibreriaControllo) as Valori;
  return { campi, origine: origine as Origine | null, mio, libreria: { ...nuova, categorie: categorieComparabili(nuova.categorie as string[], chiavi) } };
}

/** L'unita' dei contatori della cadenza (per preavvisi e tolleranza a km/ore) */
const unitaDi = (v: Valori): UnitaUso | null => (v.cadenza as Cadenza | undefined)?.uso?.unita ?? null;

/**
 * Un campo in parole, per quelli che le regole sanno scrivere (cadenza,
 * preavvisi, tolleranza) e per le categorie (nomi del cliente); undefined per
 * gli altri, che scrive l'interfaccia. Serve alle proposte e allo storico.
 */
function testoCampo(campo: string, valore: unknown, tipoSoggetto: TipoSoggetto, unita: UnitaUso | null, delCliente: Map<string, Categoria>): string | undefined {
  if (valore == null) return undefined;
  try {
    switch (campo) {
      case 'cadenza':
        return descriviCadenza(valore as Cadenza, etichetteDate(tipoSoggetto));
      case 'preavvisi':
        return descriviPreavvisi(valore as Preavvisi, unita);
      case 'tolleranza':
        return descriviTolleranza(valore as Tolleranza, unita);
      case 'categorie':
        return (valore as string[]).map(k => delCliente.get(k)?.nome ?? k).join(', ') || 'nessuna';
      default:
        return undefined;
    }
  } catch {
    return undefined; // un valore malformato nel registro non deve impedire di leggerlo
  }
}

/** I testi dei due lati di un campo, se il campo li ha */
function testiDi(c: { campo: string; mio: unknown; libreria: unknown }, tipoSoggetto: TipoSoggetto, unitaMio: UnitaUso | null, unitaLib: UnitaUso | null, delCliente: Map<string, Categoria>) {
  const testoMio = testoCampo(c.campo, c.mio, tipoSoggetto, unitaMio, delCliente);
  const testoLibreria = testoCampo(c.campo, c.libreria, tipoSoggetto, unitaLib, delCliente);
  return testoMio !== undefined || testoLibreria !== undefined ? { testoMio: testoMio ?? '—', testoLibreria: testoLibreria ?? '—' } : {};
}

interface Proposta {
  entita: EntitaDecisione;
  voce: Voce;
  lib: Lib;
  tipo: TipoProposta;
  campi: CampoProposto[];
  mio: Valori;
  libreria: Valori;
}

function proposta(entita: EntitaDecisione, voce: Voce, lib: Lib, delCliente: Map<string, Categoria>): Proposta | null {
  const tipo = daProporre(
    { versioneLibreria: voce.versioneLibreria ?? null, versioneIgnorata: voce.versioneIgnorata ?? null, attiva: attiva(voce) },
    { versione: lib.versione, ritirata: libRitirata(lib) }
  );
  if (!tipo) return null;
  const l = lati(entita, voce, lib, delCliente);
  return { entita, voce, lib, tipo, campi: tipo === 'ritiro' ? [] : confronta(l.campi, l.origine, l.mio, l.libreria), mio: l.mio, libreria: l.libreria };
}

function presenta(p: Proposta, delCliente: Map<string, Categoria>) {
  const tipoSoggetto = p.voce.tipoSoggetto;
  return {
    entita: p.entita,
    uuid: uuidDi(p.voce),
    nome: p.voce.nome,
    tipoSoggetto,
    chiave: p.lib.chiave,
    tipo: p.tipo,
    attiva: attiva(p.voce),
    versioneDa: p.voce.versioneLibreria ?? null,
    versioneA: p.lib.versione,
    novita: p.lib.novita ?? null,
    disponibileDal: p.lib.updatedAt ?? null,
    vistoIl: p.voce.aggiornamentoVistoIl ?? null,
    campi: p.campi.map(c => ({ ...c, ...testiDi(c, tipoSoggetto, unitaDi(p.mio), unitaDi(p.libreria), delCliente) })),
  };
}

/** Tutte le proposte del tenant (anche per l'avviso della libreria, senza utente) */
export async function proposteDelTenant(idTenant: number) {
  const delCliente = await categorieDiLibreria(idTenant);
  const controlli = await Controllo.findAll({ where: { idTenant, chiaveLibreria: { [Op.ne]: null } }, include: [CON_CATEGORIE] });
  const categorie = [...delCliente.values()];
  const libCat = new Map((await LibreriaCategoria.findAll({ where: { chiave: categorie.map(c => c.chiaveLibreria as string) } })).map(l => [l.chiave, l]));
  const libCtr = new Map((await LibreriaControllo.findAll({ where: { chiave: controlli.map(c => c.chiaveLibreria as string) } })).map(l => [l.chiave, l]));
  const proposte: Proposta[] = [];
  for (const c of categorie) {
    const lib = libCat.get(c.chiaveLibreria as string);
    const p = lib && proposta('categoria', c, lib, delCliente);
    if (p) proposte.push(p);
  }
  for (const c of controlli) {
    const lib = libCtr.get(c.chiaveLibreria as string);
    const p = lib && proposta('controllo', c, lib, delCliente);
    if (p) proposte.push(p);
  }
  const posto = (t: TipoSoggetto) => TIPI_SOGGETTO.indexOf(t);
  proposte.sort(
    (a, b) =>
      posto(a.voce.tipoSoggetto) - posto(b.voce.tipoSoggetto) ||
      (a.entita === b.entita ? 0 : a.entita === 'categoria' ? -1 : 1) ||
      a.voce.nome.localeCompare(b.voce.nome, 'it')
  );
  return { proposte, delCliente };
}

export async function elencaAggiornamenti(ctx: Contesto) {
  const { proposte, delCliente } = await proposteDelTenant(ctx.idTenant);
  return {
    voci: proposte.map(p => presenta(p, delCliente)),
    aggiornamenti: proposte.filter(p => p.tipo === 'aggiornamento').length,
    ritiri: proposte.filter(p => p.tipo === 'ritiro').length,
  };
}

/** Una voce del cliente, bloccata per la decisione se c'e' una transazione */
async function voceDi(ctx: Contesto, entita: EntitaDecisione, uuid: string, transaction?: Transaction): Promise<Voce> {
  const lock = transaction ? { transaction, lock: transaction.LOCK.UPDATE } : {};
  if (entita === 'categoria') return trovaNelTenant(Categoria, 'uuidCategoria', uuid, ctx.idTenant, 'Categoria', lock);
  // prima il blocco della riga, poi le categorie (FOR UPDATE non va con le unioni esterne)
  const c = await trovaNelTenant(Controllo, 'uuidControllo', uuid, ctx.idTenant, 'Controllo', lock);
  return trovaNelTenant(Controllo, 'idControllo', c.idControllo, ctx.idTenant, 'Controllo', { include: [CON_CATEGORIE], transaction });
}

async function propostaDi(ctx: Contesto, entita: EntitaDecisione, uuid: string, transaction?: Transaction) {
  const voce = await voceDi(ctx, entita, uuid, transaction);
  if (!voce.chiaveLibreria) throw new ConflictError('Questa voce non viene dalla libreria');
  const lib = entita === 'categoria' ? await LibreriaCategoria.findByPk(voce.chiaveLibreria, { transaction }) : await LibreriaControllo.findByPk(voce.chiaveLibreria, { transaction });
  if (!lib) throw new ConflictError('La voce non è più nella libreria');
  const delCliente = await categorieDiLibreria(ctx.idTenant, transaction);
  return { voce, delCliente, p: proposta(entita, voce, lib, delCliente) };
}

/** Prima apertura delle differenze: si annota una volta per versione proposta */
export async function segnaVisto(ctx: Contesto, entita: EntitaDecisione, uuid: string) {
  const { p, delCliente } = await propostaDi(ctx, entita, uuid);
  if (!p) throw new ConflictError('Nessun aggiornamento da vedere: la voce è già allineata alla libreria');
  if (!p.voce.aggiornamentoVistoIl) {
    (p.voce as Controllo).set({ aggiornamentoVistoIl: new Date(), aggiornamentoVistoDa: ctx.utente.id || null });
    await p.voce.save();
  }
  return presenta(p, delCliente);
}

export interface Decisione {
  /** La versione che il cliente ha visto: se la libreria e' andata avanti, 409 */
  versione: number;
  scelte?: Record<string, unknown>;
  ritiro?: SceltaRitiro;
}

export interface EsitoDecisioneVoce extends EsitoScadenze {
  esito: ReturnType<typeof esitoDi>;
  campi: CampoDecisione[];
  entita: EntitaDecisione;
  uuid: string;
}

/** Le nuove categorie di un controllo se il cliente sceglie quelle della libreria */
function categorieScelte(c: Controllo, chiavi: string[], delCliente: Map<string, Categoria>): Categoria[] {
  const proprie = (c.categorie ?? []).filter(k => !k.chiaveLibreria);
  const daLibreria = chiavi.map(k => delCliente.get(k)).filter((k): k is Categoria => !!k && k.tipoSoggetto === c.tipoSoggetto);
  return [...proprie, ...daLibreria];
}

export async function decidi(ctx: Contesto, entita: EntitaDecisione, uuid: string, d: Decisione): Promise<EsitoDecisioneVoce> {
  let risultato: EsitoDecisioneVoce | null = null;
  await sequelize.transaction(async transaction => {
    const { voce, delCliente, p } = await propostaDi(ctx, entita, uuid, transaction);
    if (!p) throw new ConflictError('Questa voce è già allineata alla libreria');
    if (p.lib.versione !== d.versione) throw new ConflictError('La libreria è cambiata nel frattempo: ricarica gli aggiornamenti');
    const prima = snapshot(voce);
    const nome = voce.nome;
    const versioneDa = voce.versioneLibreria ?? null;
    const vistoIl = voce.aggiornamentoVistoIl ?? null;
    const azzera = { aggiornamentoVistoIl: null, aggiornamentoVistoDa: null };

    let campi: CampoDecisione[];
    let esito: ReturnType<typeof esitoDi>;
    let valori: Valori;
    let categorie: Categoria[] | null = null;

    if (p.tipo === 'ritiro') {
      if (!d.ritiro) throw new ValidationError('Voce ritirata dalla libreria: scegli se tenerla o disattivarla');
      ({ esito, campi } = decisioneRitiro(d.ritiro));
      valori = { ...azzera, versioneIgnorata: p.lib.versione, ...(d.ritiro === 'disattiva' ? { [entita === 'controllo' ? 'attivo' : 'attiva']: false } : {}) };
    } else {
      if (d.ritiro) throw new ValidationError('La voce non è ritirata: si decide campo per campo');
      const scelte = scelteComplete(p.campi, d.scelte);
      if (scelte.errore) throw new ValidationError(scelte.errore);
      campi = scelte.campi;
      esito = esitoDi(campi);
      const { categorie: chiavi, ...applicati } = daApplicare(campi);
      if (chiavi !== undefined) categorie = categorieScelte(voce as Controllo, chiavi as string[], delCliente);
      // nuova fotografia = la versione della libreria: un campo tenuto resta "personalizzato"
      const origine = entita === 'categoria' ? origineCategoria(p.lib as LibreriaCategoria) : origineControllo(p.lib as LibreriaControllo);
      valori = { ...applicati, ...azzera, versioneLibreria: p.lib.versione, versioneIgnorata: null, origine };
    }

    let scadenze: EsitoScadenze = { scadenzeCreate: 0, scadenzeChiuse: 0, scadenzeRicalcolate: 0 };
    if (entita === 'controllo') scadenze = await applicaAlControllo(ctx, voce as Controllo, valori, categorie, transaction);
    else await applicaAllaCategoria(ctx, voce as Categoria, valori, transaction);

    await registraDecisioni(
      ctx,
      [
        {
          contesto: 'aggiornamento',
          entita,
          chiaveLibreria: p.lib.chiave,
          nome,
          idEntita: idDi(voce),
          versioneDa,
          versioneA: p.lib.versione,
          novita: p.lib.novita ?? null,
          disponibileDal: p.lib.updatedAt ?? null,
          vistoIl,
          esito,
          campi,
        },
      ],
      transaction
    );
    traccia(ctx, 'vigilo.libreria.decisione', `Libreria, ${p.tipo === 'ritiro' ? 'voce ritirata' : 'aggiornamento'} ${esito}: ${nome}`, prima, voce, {
      entita,
      chiave: p.lib.chiave,
      versioneA: p.lib.versione,
      esito,
      ...scadenze,
    });
    risultato = { esito, campi, entita, uuid, ...scadenze };
  });
  return risultato!;
}

/** Le decisioni sulla libreria di una voce, dalla piu' recente (all'avvio comprese) */
export async function storicoLibreria(ctx: Contesto, entita: EntitaDecisione, uuid: string) {
  const voce = await voceDi(ctx, entita, uuid);
  const delCliente = await categorieDiLibreria(ctx.idTenant);
  // l'unita' per preavvisi e tolleranza: quella della cadenza di oggi (nello storico non c'e' sempre la cadenza)
  const unita = voce instanceof Controllo ? (voce.cadenza?.uso?.unita ?? null) : null;
  const righe = await DecisioneLibreria.findAll({
    where: {
      idTenant: ctx.idTenant,
      entita,
      [Op.or]: [{ idEntita: idDi(voce) }, ...(voce.chiaveLibreria ? [{ chiaveLibreria: voce.chiaveLibreria, idEntita: null }] : [])],
    },
    order: [['decisoIl', 'DESC'], ['idDecisione', 'DESC']],
    limit: 64,
  });
  return righe.map(r => ({
    uuid: r.uuidDecisione,
    contesto: r.contesto,
    esito: r.esito,
    versioneDa: r.versioneDa ?? null,
    versioneA: r.versioneA,
    novita: r.novita ?? null,
    disponibileDal: r.disponibileDal ?? null,
    vistoIl: r.vistoIl ?? null,
    campi: (r.campi ?? []).map(c => ({ ...c, ...testiDi(c, voce.tipoSoggetto, unita, unita, delCliente) })),
    decisoIl: r.decisoIl,
    decisoDa: r.decisoDaNome ?? r.decisoDaEmail ?? null,
    decisoDaEmail: r.decisoDaEmail ?? null,
  }));
}
