// =============================================================================
// Libreria EDG — sincronizzazione dei file nelle tabelle (all'avvio)
// =============================================================================
// L'app legge SOLO le tabelle libreria_* e modelli_*: qui i file versionati
// le alimentano (03-libreria-avvio 3.2). Una libreria non valida non si
// sincronizza (i clienti restano sulla precedente); un contenuto cambiato
// senza nuova versione non sovrascrive (conflitto in log-service).
// Un lock di PostgreSQL evita due sincronizzazioni insieme se un giorno ci
// saranno piu' istanze. Query in sequenza nella transazione (L052).
// =============================================================================
import type { ModelStatic, Model, Transaction } from 'sequelize';
import { sequelize } from '../config/database';
import { logger } from '../core/services/logger';
import { LibreriaCategoria, LibreriaControllo, ModelloSettore, ModelloVoce } from '../domini/modelli';
import { LIBRERIA } from './index';
import { improntaCategoria, improntaControllo, improntaModello } from './impronta';
import { pianifica, type Azione, type StatoVoce } from './piano';
import type { ChiaveModello, Libreria } from './tipi';
import { validaLibreria } from './valida';

export interface EsitoSincronizzazione {
  ok: boolean;
  conteggi: Record<Azione['tipo'], number>;
  conflitti: string[];
  errori: string[];
}

interface DaAllineare {
  stato: StatoVoce;
  valori: Record<string, unknown>;
}

const vuoti = (): EsitoSincronizzazione['conteggi'] => ({ inserisci: 0, aggiorna: 0, riordina: 0, invariata: 0, ritira: 0, conflitto: 0 });

/** Allinea una tabella della libreria alle voci dei file */
async function allinea(
  nome: string,
  Modello: ModelStatic<Model>,
  voci: DaAllineare[],
  campoRitiro: 'ritirata' | 'ritirato' | null,
  t: Transaction,
  esito: EsitoSincronizzazione
): Promise<void> {
  const righe = await Modello.findAll({ transaction: t });
  const esistenti: StatoVoce[] = righe.map(r => ({
    chiave: r.get('chiave') as string,
    versione: r.get('versione') as number,
    impronta: (r.get('impronta') as string | null) ?? null,
    ordine: (r.get('ordine') as number | undefined) ?? 0,
    ritirata: campoRitiro ? Boolean(r.get(campoRitiro)) : null,
  }));
  const perChiave = new Map(righe.map(r => [r.get('chiave') as string, r]));
  const perVoce = new Map(voci.map(v => [v.stato.chiave, v]));

  for (const azione of pianifica(esistenti, voci.map(v => v.stato))) {
    esito.conteggi[azione.tipo]++;
    const voce = perVoce.get(azione.chiave);
    const riga = perChiave.get(azione.chiave);
    switch (azione.tipo) {
      case 'inserisci':
        await Modello.create(voce!.valori, { transaction: t });
        break;
      case 'aggiorna':
        await riga!.update(voce!.valori, { transaction: t });
        break;
      case 'riordina':
        await riga!.update(
          { ordine: voce!.stato.ordine, ...(campoRitiro ? { [campoRitiro]: voce!.stato.ritirata } : {}) },
          { transaction: t }
        );
        break;
      case 'ritira':
        await riga!.update({ [campoRitiro!]: true }, { transaction: t });
        break;
      case 'conflitto':
        esito.conflitti.push(`${nome} ${azione.chiave}: ${azione.motivo}`);
        break;
      default:
        break;
    }
  }
}

/** Le voci dei file nella forma delle tabelle */
function righeDa(lib: Libreria) {
  const modelli: DaAllineare[] = lib.modelli.map(m => {
    const impronta = improntaModello(m, lib);
    return {
      stato: { chiave: m.chiave, versione: m.versione, impronta, ordine: m.ordine, ritirata: null },
      valori: { ...m, impronta },
    };
  });
  const categorie: DaAllineare[] = lib.categorie.map((c, ordine) => {
    const impronta = improntaCategoria(c);
    const ritirata = c.ritirata ?? false;
    return {
      stato: { chiave: c.chiave, versione: c.versione, impronta, ordine, ritirata },
      valori: {
        chiave: c.chiave,
        tipoSoggetto: c.tipoSoggetto,
        nome: c.nome,
        descrizione: c.descrizione ?? null,
        icona: c.icona ?? null,
        campi: c.campi ?? [],
        contatori: c.contatori ?? [],
        versione: c.versione,
        ritirata,
        novita: c.novita ?? null,
        impronta,
        ordine,
      },
    };
  });
  const controlli: DaAllineare[] = lib.controlli.map((c, ordine) => {
    const impronta = improntaControllo(c);
    const ritirato = c.ritirato ?? false;
    return {
      stato: { chiave: c.chiave, versione: c.versione, impronta, ordine, ritirata: ritirato },
      valori: {
        chiave: c.chiave,
        codice: c.codice,
        nome: c.nome,
        descrizione: c.descrizione ?? null,
        natura: c.natura,
        tipoSoggetto: c.tipoSoggetto,
        categorie: c.categorie,
        automatico: c.automatico,
        cadenza: c.cadenza,
        preavvisi: c.preavvisi,
        tolleranza: c.tolleranza,
        destinatari: c.destinatari,
        rinnovo: c.rinnovo ?? 'conferma',
        rinviabile: c.rinviabile ?? true,
        registrazione: c.registrazione ?? {},
        riferimentoNormativo: c.riferimentoNormativo ?? null,
        note: c.note ?? null,
        versione: c.versione,
        ritirato,
        novita: c.novita ?? null,
        impronta,
        ordine,
      },
    };
  });
  return { modelli, categorie, controlli };
}

/** Le voci di ogni modello (tabella derivata: si riscrive ogni volta) */
function vociDeiModelli(lib: Libreria) {
  const righe: { chiaveModello: ChiaveModello; tipoVoce: 'categoria' | 'controllo'; chiaveVoce: string; preselezionata: boolean }[] = [];
  for (const c of lib.categorie.filter(c => !c.ritirata)) {
    for (const [m, pre] of Object.entries(c.modelli)) righe.push({ chiaveModello: m as ChiaveModello, tipoVoce: 'categoria', chiaveVoce: c.chiave, preselezionata: !!pre });
  }
  for (const c of lib.controlli.filter(c => !c.ritirato)) {
    for (const [m, pre] of Object.entries(c.modelli)) righe.push({ chiaveModello: m as ChiaveModello, tipoVoce: 'controllo', chiaveVoce: c.chiave, preselezionata: !!pre });
  }
  return righe;
}

export async function sincronizzaLibreria(lib: Libreria = LIBRERIA): Promise<EsitoSincronizzazione> {
  const esito: EsitoSincronizzazione = { ok: false, conteggi: vuoti(), conflitti: [], errori: validaLibreria(lib) };
  if (esito.errori.length) return esito;

  const { modelli, categorie, controlli } = righeDa(lib);
  await sequelize.transaction(async t => {
    await sequelize.query("SELECT pg_advisory_xact_lock(hashtext('vigilo.libreria'))", { transaction: t });
    await allinea('modello', ModelloSettore as unknown as ModelStatic<Model>, modelli, null, t, esito);
    await allinea('categoria', LibreriaCategoria as unknown as ModelStatic<Model>, categorie, 'ritirata', t, esito);
    await allinea('controllo', LibreriaControllo as unknown as ModelStatic<Model>, controlli, 'ritirato', t, esito);
    await ModelloVoce.destroy({ where: {}, transaction: t });
    await ModelloVoce.bulkCreate(vociDeiModelli(lib), { transaction: t });
  });
  esito.ok = true;
  return esito;
}

/** All'avvio del servizio: non fa mai cadere il servizio, racconta a log-service */
export async function sincronizzaAllAvvio(): Promise<void> {
  try {
    const esito = await sincronizzaLibreria();
    if (esito.errori.length) {
      console.error('[Libreria] non valida, non sincronizzata:\n  ' + esito.errori.join('\n  '));
      logger.error('libreria.non-valida', `Libreria non valida: ${esito.errori.length} errori, resta la versione precedente`, { errori: esito.errori }, 'SYSTEM');
      return;
    }
    const c = esito.conteggi;
    const riepilogo = `${c.inserisci} nuove, ${c.aggiorna} aggiornate, ${c.ritira} ritirate, ${c.invariata + c.riordina} invariate`;
    console.log(`[Libreria] sincronizzata: ${riepilogo}`);
    if (esito.conflitti.length) {
      console.error('[Libreria] conflitti:\n  ' + esito.conflitti.join('\n  '));
      logger.error('libreria.conflitto', `Libreria: ${esito.conflitti.length} voci cambiate senza nuova versione`, { conflitti: esito.conflitti }, 'SYSTEM');
    }
    if (c.inserisci || c.aggiorna || c.ritira) logger.info('libreria.sincronizzata', `Libreria sincronizzata: ${riepilogo}`, { conteggi: c }, 'SYSTEM');
  } catch (err) {
    const errore = err instanceof Error ? err.message : String(err);
    // Colonna o tabella mancante: il servizio e' piu' nuovo dello schema
    const codice = (err as { parent?: { code?: string } }).parent?.code;
    if (codice === '42703' || codice === '42P01') {
      console.warn('[Libreria] schema non aggiornato: eseguire le migrazioni e riavviare il servizio —', errore);
      logger.warn('libreria.migrazioni-mancanti', `Libreria non sincronizzata: migrazioni da eseguire (${errore})`, { errore }, 'SYSTEM');
      return;
    }
    console.error('[Libreria] sincronizzazione fallita:', err);
    logger.error('libreria.errore', `Sincronizzazione della libreria fallita: ${errore}`, { errore }, 'SYSTEM');
  }
}
