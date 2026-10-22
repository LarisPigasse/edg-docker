// =============================================================================
// Procedura di avvio — servizio (03-libreria-avvio 3.5, ADR074)
// =============================================================================
//   statoAvvio  passo 1: i modelli di settore, cio' che contengono, quali
//               sono gia' stati applicati
//   avvia       passi 3-4: copia le voci scelte, registra ogni decisione
//               (incluso/escluso), genera le scadenze, segna l'avvio.
// La stessa operazione serve a "Parto da zero" (nessun modello) e ad
// "Aggiungi dalla libreria" (ripetibile: le voci gia' presenti si saltano).
// =============================================================================
import { Op, type Transaction } from 'sequelize';
import { sequelize } from '../../config/database';
import type { Contesto } from '../../core/contesto';
import { traccia } from '../../core/services/traccia';
import { ConflictError, ForbiddenError, UnprocessableError, ValidationError } from '../../core/utils/errors';
import { registraDecisioni, type NuovaDecisione } from '../aggiornamenti/registro';
import { generaPer } from '../controlli/controllo.service';
import { PREDEFINITI_INIZIALI, type ModelloApplicato, type Predefiniti } from '../impostazioni/impostazioni.model';
import {
  Categoria,
  ImpostazioniTenant,
  LibreriaControllo,
  ModelloSettore,
  ModelloVoce,
  type LibreriaCategoria,
} from '../modelli';
import { TIPI_SOGGETTO, type EntitaDecisione, type EsitoDecisione, type TipoSoggetto } from '../valori';
import type { RiassuntoModello } from './avvio.presenta';
import { copiaCategoria, copiaControllo } from './copia';
import { pianoAvvio, type PianoAvvio } from './piano';
import { puoAvviare } from './preparazione';
import { preparazioneDelTenant } from './preparazione.service';
import { notificaVigiloPronto } from './pronto.service';
import { costruisciProposta, type Proposta } from './proposta';

// --- passo 1 ------------------------------------------------------------------

export async function statoAvvio(ctx: Contesto) {
  const [imp, modelli, voci, controlli, preparazione] = await Promise.all([
    ImpostazioniTenant.findByPk(ctx.idTenant),
    ModelloSettore.findAll({ order: [['ordine', 'ASC']] }),
    ModelloVoce.findAll(),
    LibreriaControllo.findAll({ where: { ritirato: false }, attributes: ['chiave', 'tipoSoggetto'] }),
    preparazioneDelTenant(ctx.idTenant),
  ]);
  const tipoDi = new Map(controlli.map(c => [c.chiave, c.tipoSoggetto]));
  const applicati = new Set((imp?.modelliApplicati ?? []).map(m => m.chiave));

  const riquadri: RiassuntoModello[] = modelli.map(modello => {
    const proprie = voci.filter(v => v.chiaveModello === modello.chiave);
    const tipi = proprie.filter(v => v.tipoVoce === 'controllo').map(v => tipoDi.get(v.chiaveVoce));
    const perTipo: Partial<Record<TipoSoggetto, number>> = {};
    for (const t of TIPI_SOGGETTO) {
      const n = tipi.filter(x => x === t).length;
      if (n) perTipo[t] = n;
    }
    return {
      modello,
      categorie: proprie.filter(v => v.tipoVoce === 'categoria').length,
      controlli: perTipo,
      applicato: applicati.has(modello.chiave),
    };
  });

  return {
    avviatoIl: imp?.avviatoIl ?? null,
    modelliApplicati: imp?.modelliApplicati ?? [],
    predefiniti: imp?.predefiniti ?? PREDEFINITI_INIZIALI,
    riquadri,
    // ADR088: chi prepara (scelta di EDG all'attivazione), se l'utente può avviare, settori suggeriti
    preparazione: preparazione.chi,
    puoAvviare: puoAvviare(preparazione, !!imp?.avviatoIl, ctx.utente.assistenza, ctx.idTenant),
    modelliSuggeriti: preparazione.modelli,
  };
}

// --- passo 2 ------------------------------------------------------------------

export const proposta = (ctx: Contesto, modelli: string[]): Promise<Proposta> => costruisciProposta(ctx, modelli);

// --- passi 3-4 ----------------------------------------------------------------

export interface SceltaAvvio {
  modelli: string[];
  categorie: string[];
  controlli: string[];
  predefiniti?: Predefiniti;
}

export interface EsitoAvvio {
  primoAvvio: boolean;
  avviatoIl: Date;
  categorieCreate: number;
  controlliCreati: number;
  giaPresenti: { categorie: number; controlli: number };
  decisioni: { incluse: number; escluse: number };
  scadenzeCreate: number;
}

function verificaPiano(piano: PianoAvvio, p: Proposta): void {
  const { nonProposte, senzaCategoria } = piano.errori;
  if (nonProposte.length) throw new ValidationError(`Voci non proposte dai modelli scelti: ${nonProposte.join(', ')}`);
  if (senzaCategoria.length) {
    const nomi = senzaCategoria.map(k => p.controlli.find(v => v.lib.chiave === k)!.lib.nome);
    throw new UnprocessableError(`Includi almeno una delle categorie di: ${nomi.join(', ')}`);
  }
}

/** Una categoria del cliente con lo stesso nome bloccherebbe la copia (uq_categorie_nome) */
async function controllaNomi(ctx: Contesto, daCreare: LibreriaCategoria[], transaction: Transaction): Promise<void> {
  if (!daCreare.length) return;
  const omonime = await Categoria.findAll({
    where: { idTenant: ctx.idTenant, [Op.or]: daCreare.map(c => ({ tipoSoggetto: c.tipoSoggetto, nome: c.nome })) },
    attributes: ['nome'],
    transaction,
  });
  if (omonime.length)
    throw new ConflictError(
      `Esiste già una categoria con lo stesso nome: ${omonime.map(c => c.nome).join(', ')}. Rinominala per includere quella della libreria`
    );
}

/** I modelli applicati, con la versione di quelli appena scelti */
function applica(attuali: ModelloApplicato[], scelti: ModelloSettore[]): ModelloApplicato[] {
  const perChiave = new Map(attuali.map(m => [m.chiave, m]));
  for (const m of scelti) perChiave.set(m.chiave, { chiave: m.chiave, versione: m.versione });
  return [...perChiave.values()];
}

const decisione = (
  entita: EntitaDecisione,
  lib: { chiave: string; nome: string; versione: number },
  esito: EsitoDecisione,
  idEntita: number | null = null
): NuovaDecisione => ({ contesto: 'avvio', entita, chiaveLibreria: lib.chiave, nome: lib.nome, versioneA: lib.versione, esito, idEntita });

export async function avvia(ctx: Contesto, scelta: SceltaAvvio): Promise<EsitoAvvio> {
  // ADR088: chi prepara, letto prima della transazione (nessuna chiamata con il lucchetto preso)
  const preparazione = await preparazioneDelTenant(ctx.idTenant, true);
  const esito = await sequelize.transaction(async transaction => {
    // Una procedura per volta per cliente: la riga delle impostazioni fa da lucchetto
    await ImpostazioniTenant.findOrCreate({ where: { idTenant: ctx.idTenant }, transaction });
    const imp = (await ImpostazioniTenant.findByPk(ctx.idTenant, { transaction, lock: transaction.LOCK.UPDATE }))!;
    if (!puoAvviare(preparazione, !!imp.avviatoIl, ctx.utente.assistenza, ctx.idTenant)) {
      throw new ForbiddenError('EDG sta preparando Vigilo per te: lo troverai pronto a breve');
    }

    const p = await costruisciProposta(ctx, scelta.modelli, transaction);
    const piano = pianoAvvio({
      categorie: p.categorie.map(v => ({ chiave: v.lib.chiave })),
      controlli: p.controlli.map(v => ({ chiave: v.lib.chiave, categorie: v.lib.categorie })),
      categorieDelTenant: new Set(p.categorieDelTenant.keys()),
      controlliDelTenant: new Set(p.controlliDelTenant.keys()),
      scelte: scelta,
    });
    verificaPiano(piano, p);

    const libCat = new Map(p.categorie.map(v => [v.lib.chiave, v.lib]));
    const libCtrl = new Map(p.controlli.map(v => [v.lib.chiave, v.lib]));
    await controllaNomi(ctx, piano.categorie.crea.map(k => libCat.get(k)!), transaction);

    const categorie = new Map(p.categorieDelTenant);
    const decisioni: NuovaDecisione[] = [];

    for (const k of piano.categorie.crea) {
      const c = await copiaCategoria(ctx, libCat.get(k)!, transaction);
      categorie.set(k, c);
      decisioni.push(decisione('categoria', libCat.get(k)!, 'incluso', c.idCategoria));
    }
    for (const k of piano.categorie.escluse) decisioni.push(decisione('categoria', libCat.get(k)!, 'escluso'));

    let scadenzeCreate = 0;
    for (const { chiave, categorie: chiavi } of piano.controlli.crea) {
      const lib = libCtrl.get(chiave)!;
      const proprie = chiavi.map(k => categorie.get(k)!);
      const c = await copiaControllo(ctx, lib, proprie, transaction);
      scadenzeCreate += await generaPer(ctx, c, proprie, transaction);
      decisioni.push(decisione('controllo', lib, 'incluso', c.idControllo));
    }
    for (const k of piano.controlli.esclusi) decisioni.push(decisione('controllo', libCtrl.get(k)!, 'escluso'));

    await registraDecisioni(ctx, decisioni, transaction);

    const primoAvvio = !imp.avviatoIl;
    await imp.update(
      {
        avviatoIl: imp.avviatoIl ?? new Date(),
        modelliApplicati: applica(imp.modelliApplicati, p.modelli),
        ...(scelta.predefiniti ? { predefiniti: scelta.predefiniti } : {}),
      },
      { transaction }
    );

    const risultato: EsitoAvvio = {
      primoAvvio,
      avviatoIl: imp.avviatoIl!,
      categorieCreate: piano.categorie.crea.length,
      controlliCreati: piano.controlli.crea.length,
      giaPresenti: { categorie: piano.categorie.giaPresenti.length, controlli: piano.controlli.giaPresenti.length },
      decisioni: {
        incluse: decisioni.filter(d => d.esito === 'incluso').length,
        escluse: decisioni.filter(d => d.esito === 'escluso').length,
      },
      scadenzeCreate,
    };
    return risultato;
  });

  traccia(
    ctx,
    'vigilo.avvio.eseguito',
    esito.primoAvvio ? 'Procedura di avvio di Vigilo' : 'Voci aggiunte dalla libreria',
    null,
    null,
    { modelli: scelta.modelli, ...esito }
  );
  // ADR089: a primo avvio le email "Vigilo è pronto", senza attendere e senza mai bloccare
  if (esito.primoAvvio) {
    void notificaVigiloPronto(ctx, {
      modelli: scelta.modelli,
      categorie: esito.categorieCreate,
      controlli: esito.controlliCreati,
      scadenze: esito.scadenzeCreate,
    });
  }
  return esito;
}
