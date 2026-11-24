// =============================================================================
// Analisi — servizio (2026-11-23, fase B)
// =============================================================================
// GET /analisi: mette insieme i dati che Vigilo ha (parametri e costi
// aziendali della stima, costo dei mezzi negli ultimi 12 mesi, stime salvate,
// costo orario delle persone) e li passa alle regole pure di indicatori.ts.
// Ciò che manca diventa un avviso con il rimedio: nessun numero inventato.
// =============================================================================
import { Op, QueryTypes } from 'sequelize';
import { sequelize } from '../../config/database';
import { aggiungiGiorni, differenzaGiorni } from '../../regole';
import type { Contesto } from '../../core/contesto';
import { ValidationError } from '../../core/utils/errors';
import { traccia } from '../../core/services/traccia';
import { ANALISI_INIZIALI, LIMITI_ANALISI, analisiEffettiva, erroriAnalisi, type RegoleAnalisi } from '../impostazioni/limiti';
import { ImpostazioniTenant, Soggetto } from '../modelli';
import { segnali } from './segnali';
import { costoMezzi, type FiltriMezzi } from '../resoconti/mezzi.service';
import { leggiParametri } from '../stima/parametri.service';
import { StimaCosti } from '../stima/stima.model';
import { righe } from '../resoconti/resoconti.service';
import { consumo, consumoPerCategoria, disponibilita, giorniFermo, quotaGuasti, variazione } from './operativita';
import { affidabilitaStime, confrontoStruttura, costoPieno, costoPienoPerCategoria, flotta, margineAnno, mezziPerCostoPieno } from './indicatori';

export interface AvvisoAnalisi {
  chiave: 'anno' | 'oreServizio' | 'conducente' | 'flotta' | 'possesso' | 'ricavi' | 'precedente' | 'stimeReali' | 'prezzi' | 'consumi';
  testo: string;
}

const alCentesimo = (n: number) => Math.round(n * 100) / 100;

export async function leggiAnalisi(ctx: Contesto) {
  const parametri = await leggiParametri(ctx);
  const imp = await ImpostazioniTenant.findByPk(ctx.idTenant, { attributes: ['idTenant', 'analisi'] });
  const soglie = analisiEffettiva(imp?.analisi);
  const g = parametri.generali;
  const anno = parametri.anni.find(a => a.anno === parametri.annoDiRiferimento) ?? null;
  const precedente = anno ? (parametri.anni.find(a => a.anno === anno.anno - 1) ?? null) : null;

  // la flotta negli ultimi 12 mesi, dal costo dei mezzi
  const costi = await costoMezzi(ctx, { periodo: '12m' } as FiltriMezzi);
  const mezzi = costi.mezzi.map(m => ({
    tipo: m.tipo as string,
    categoria: m.categoria?.nome ?? null,
    quota: m.possesso.quota,
    fissi: m.possesso.totale + m.manutenzione.totale,
    oreImpiego: m.componenti.oreImpiego,
    rifornimenti: m.rifornimenti.totale,
    km: m.uso?.unita === 'km' ? m.uso.valore : null,
    totale: m.totale,
  }));
  // per il costo pieno dei servizi: i veicoli, la parte fissa da quelli con il costo di possesso
  const scelti = mezziPerCostoPieno(mezzi);
  const tutta = flotta(mezzi);
  const fl = {
    mezzi: tutta.mezzi,
    veicoli: scelti.veicoli.length,
    conPossesso: scelti.perFissa.length,
    senzaPossesso: scelti.senzaPossesso,
    fissoOra: flotta(scelti.perFissa).fissoOra,
    variabileKm: flotta(scelti.veicoli).variabileKm,
    /** Il costo di tutti i mezzi (anche macchine e attrezzature): va nel conto dell'anno */
    costoTotale: tutta.costoTotale,
  };

  // il costo orario del conducente: il parametro, altrimenti la media delle persone che lo hanno
  const persone = await Soggetto.findAll({
    where: { idTenant: ctx.idTenant, tipo: 'persona', stato: { [Op.ne]: 'dismesso' }, costoOrario: { [Op.ne]: null } },
    attributes: ['idSoggetto', 'costoOrario'],
  });
  const mediaPersone = persone.length ? alCentesimo(persone.reduce((s, p) => s + Number(p.costoOrario), 0) / persone.length) : null;
  const costoOrario = g.costoOrarioConducente ?? mediaPersone;
  const fonteConducente = g.costoOrarioConducente != null ? 'parametro' : mediaPersone != null ? 'persone' : null;

  const pieno = costoPieno({
    mezzoOra: fl.fissoOra,
    mezzoKm: fl.variabileKm,
    conducenteOra: costoOrario,
    aziendaliOra: anno?.costoPerOra ?? null,
    velocitaMedia: g.velocitaMedia,
  });

  // lo stesso costo pieno, dentro ogni categoria di veicoli: il camion non lo abbassano le auto
  const categorie = costoPienoPerCategoria(mezzi, { conducenteOra: costoOrario, aziendaliOra: anno?.costoPerOra ?? null, velocitaMedia: g.velocitaMedia });

  const stime = await StimaCosti.findAll({ where: { idTenant: ctx.idTenant }, attributes: ['idStima', 'totale', 'costoReale', 'prezzo'] });
  const affidabilita = affidabilitaStime(
    stime.map(s => ({ totale: Number(s.totale), costoReale: s.costoReale === null ? null : Number(s.costoReale), prezzo: s.prezzo === null ? null : Number(s.prezzo) }))
  );

  const struttura = anno && precedente ? confrontoStruttura(parametri.voci, precedente.voci, anno.voci) : null;
  const conducentiAnno = anno?.oreServizio && costoOrario ? anno.oreServizio * costoOrario : 0;
  const margine = anno && anno.ricavi != null ? margineAnno(Number(anno.ricavi), anno.totale, fl.costoTotale, conducentiAnno) : null;

  // ciò che manca, con il rimedio
  const avvisi: AvvisoAnalisi[] = [];
  if (!anno) avvisi.push({ chiave: 'anno', testo: 'Nessun anno con i costi aziendali: il costo pieno non comprende la struttura. Inseriscili in Stima costi › Parametri.' });
  else if (!anno.oreServizio) avvisi.push({ chiave: 'oreServizio', testo: `Il ${anno.anno} non ha le ore di servizio annue: senza, i costi aziendali per ora non si calcolano.` });
  if (!costoOrario) avvisi.push({ chiave: 'conducente', testo: 'Nessun costo orario del conducente (né nei parametri né nelle persone): il costo pieno non lo comprende.' });
  if (!fl.veicoli || (fl.fissoOra === null && fl.variabileKm === null))
    avvisi.push({ chiave: 'flotta', testo: 'Nessun veicolo con costi negli ultimi 12 mesi: il costo pieno non comprende i mezzi.' });
  if (fl.senzaPossesso)
    avvisi.push({
      chiave: 'possesso',
      testo: `${fl.senzaPossesso} ${fl.senzaPossesso === 1 ? 'veicolo senza' : 'veicoli senza'} costo di possesso: la parte fissa del mezzo ${fl.senzaPossesso === 1 ? 'lo esclude. Inseriscilo nella sua scheda' : 'li esclude. Inseriscilo nelle loro schede'} per un numero più preciso.`,
    });
  if (anno && anno.ricavi == null)
    avvisi.push({ chiave: 'ricavi', testo: `Senza i ricavi del ${anno.anno} non si calcolano margine e redditività: inseriscili in Stima costi › Parametri, nell'anno.` });
  if (anno && !precedente) avvisi.push({ chiave: 'precedente', testo: `Senza i costi del ${anno.anno - 1} non c'è il confronto con l'anno prima.` });
  if (!affidabilita.conReale)
    avvisi.push({ chiave: 'stimeReali', testo: 'Nessuna stima salvata con il costo reale: l’affidabilità delle stime non si misura ancora. Scrivi il costo reale dopo i servizi.' });
  if (!affidabilita.conPrezzo) avvisi.push({ chiave: 'prezzi', testo: 'Nessuna stima con il prezzo applicato: il margine dei servizi non si calcola.' });

  const operativita = await flottaAlLavoro(ctx, costi, soglie.kmMeseMinimi);
  if (operativita.veicoli && operativita.consumo.l100 === null)
    avvisi.push({ chiave: 'consumi', testo: 'Nessun rifornimento con i litri sui veicoli con i km: i consumi non si calcolano.' });

  // ciò che conviene guardare, dalle soglie del tenant
  const daValutare = segnali(
    {
      perVeicolo: operativita.perVeicolo,
      tendenzaConsumo: operativita.consumo.tendenza,
      quotaGuasti: operativita.manutenzione.quotaGuasti,
      struttura: struttura && anno && precedente ? { anno: anno.anno, precedente: precedente.anno, voci: struttura.voci } : null,
      stime: affidabilita,
      margine: margine && anno ? { anno: anno.anno, percentuale: margine.percentuale } : null,
    },
    soglie
  );

  return {
    oggi: ctx.oggi,
    anno: anno && { anno: anno.anno, stato: anno.stato, ricavi: anno.ricavi, oreServizio: anno.oreServizio, costoPerOra: anno.costoPerOra, quotaMezzi: anno.quotaMezzi },
    precedente: precedente && { anno: precedente.anno, stato: precedente.stato },
    /** Il periodo del costo dei mezzi: gli ultimi 12 mesi */
    periodoMezzi: { dal: costi.periodo.dal, al: costi.periodo.al },
    flotta: fl,
    conducente: { costoOrario, fonte: fonteConducente, persone: persone.length },
    velocitaMedia: g.velocitaMedia,
    costoPieno: pieno,
    /** Il costo pieno per categoria di veicoli, dal più caro */
    categorie,
    stime: affidabilita,
    struttura,
    /** Ricavi − costi aziendali − mezzi (12 mesi) − conducenti (ore di servizio × costo orario): una stima */
    margine,
    /** La flotta al lavoro negli ultimi 12 mesi (fase C) */
    operativita,
    /** I segnali da valutare, dal più grave (fase D) */
    segnali: daValutare,
    soglie,
    sogliePredefinite: ANALISI_INIZIALI,
    limitiSoglie: LIMITI_ANALISI,
    /** Le soglie si cambiano con vigilo.config */
    soglieModificabili: ctx.capacita.config,
    avvisi,
  };
}

/** Cambia le soglie dei segnali (vigilo.config); quelle non indicate restano */
export async function cambiaSoglie(ctx: Contesto, modifica: Partial<RegoleAnalisi>) {
  const errori = erroriAnalisi(modifica);
  if (errori.length) throw new ValidationError(errori.join('. '));
  const imp = await ImpostazioniTenant.findByPk(ctx.idTenant);
  if (!imp?.avviatoIl) throw new ValidationError('Vigilo non è ancora avviato per la tua azienda');
  const prima = analisiEffettiva(imp.analisi);
  const dopo = analisiEffettiva({ ...prima, ...modifica });
  if (JSON.stringify(prima) !== JSON.stringify(dopo)) {
    await imp.update({ analisi: dopo });
    traccia(ctx, 'vigilo.analisi.soglie', 'Soglie dei segnali dell’Analisi aggiornate', prima, dopo);
  }
  return leggiAnalisi(ctx);
}

type CostiMezzi = Awaited<ReturnType<typeof costoMezzi>>;

/**
 * La flotta al lavoro (2026-11-23, fase C): disponibilità dai guasti che
 * bloccano l'uso, consumo e sua tendenza (ultimi 3 mesi contro i 9 prima),
 * km al mese, peso delle riparazioni; per la flotta e per ogni veicolo.
 */
async function flottaAlLavoro(ctx: Contesto, costi: CostiMezzi, kmMeseMinimi: number) {
  const periodo = costi.periodo;
  const giorniPeriodo = differenzaGiorni(periodo.dal, periodo.al) + 1;
  const veicoli = costi.mezzi.filter(m => m.tipo === 'veicolo');
  const uuids = veicoli.map(v => v.uuid);

  // i guasti che bloccano l'uso, dal giorno in cui nascono a quello in cui si chiudono (oggi se aperti)
  const guasti = uuids.length
    ? await sequelize.query<{ uuid: string; dal: string; al: string }>(
        `SELECT so.uuid_soggetto AS uuid,
                to_char((sc.created_at AT TIME ZONE 'Europe/Rome')::date, 'YYYY-MM-DD') AS dal,
                to_char(COALESCE((sc.chiusa_il AT TIME ZONE 'Europe/Rome')::date, :oggi::date), 'YYYY-MM-DD') AS al
           FROM scadenze sc JOIN soggetti so ON so.id_soggetto = sc.id_soggetto
          WHERE sc.id_tenant = :t AND sc.natura = 'riparazione' AND sc.blocca_uso AND so.uuid_soggetto IN (:uuids)
            AND (sc.created_at AT TIME ZONE 'Europe/Rome')::date <= :al
            AND (sc.chiusa_il IS NULL OR (sc.chiusa_il AT TIME ZONE 'Europe/Rome')::date >= :dal)`,
        { replacements: { t: ctx.idTenant, uuids, oggi: ctx.oggi, dal: periodo.dal, al: periodo.al }, type: QueryTypes.SELECT }
      )
    : [];

  // il consumo degli ultimi 3 mesi (92 giorni) contro i 9 prima
  const recenteDal = aggiungiGiorni(ctx.oggi, -91);
  const [recente, prima] = uuids.length
    ? await Promise.all([
        costoMezzi(ctx, { periodo: 'personalizzato', dal: recenteDal, al: ctx.oggi } as FiltriMezzi),
        costoMezzi(ctx, { periodo: 'personalizzato', dal: periodo.dal, al: aggiungiGiorni(recenteDal, -1) } as FiltriMezzi),
      ])
    : [null, null];
  const consumoDi = (c: CostiMezzi | null) => {
    const v = (c?.mezzi ?? []).filter(m => m.tipo === 'veicolo' && m.uso?.unita === 'km' && (m.uso.valore ?? 0) > 0 && m.rifornimenti.litri > 0);
    return consumo(
      v.reduce((s, m) => s + m.rifornimenti.litri, 0),
      v.reduce((s, m) => s + (m.uso?.valore ?? 0), 0)
    );
  };

  // riparazioni contro manutenzione programmata, dei soli veicoli
  const spese = await righe(ctx, periodo, { sql: '', valori: {} });
  const sommaDi = (natura: string, uuid?: string) =>
    spese.filter(r => r.soggetto?.tipo === 'veicolo' && r.natura === natura && (!uuid || r.soggetto.uuid === uuid)).reduce((s, r) => s + r.importo + r.manodopera, 0);
  const riparazioni = sommaDi('riparazione');
  const manutenzione = sommaDi('manutenzione');

  const l100 = consumoDi(costi);
  // il consumo di ogni veicolo si confronta con la sua categoria, non con la flotta (camion e auto non si confrontano)
  const medie = consumoPerCategoria(veicoli.map(v => ({ categoria: v.categoria?.nome ?? null, litri: v.rifornimenti.litri, km: v.uso?.unita === 'km' ? v.uso.valore : null })));
  const perVeicolo = veicoli.map(v => {
    const fermo = giorniFermo(
      guasti.filter(g => g.uuid === v.uuid),
      periodo
    );
    const km = v.uso?.unita === 'km' ? v.uso.valore : null;
    const c = consumo(v.rifornimenti.litri, km);
    return {
      uuid: v.uuid,
      nome: v.nome,
      identificativo: v.identificativo,
      categoria: v.categoria?.nome ?? null,
      giorniFermo: fermo,
      disponibilita: disponibilita(1, giorniPeriodo, fermo),
      consumo: c,
      /** Rispetto alla media della sua categoria, in %; null se nella categoria non ce ne sono almeno 2 con i consumi */
      sullaCategoria: medie.has(v.categoria?.nome ?? null) ? variazione(medie.get(v.categoria?.nome ?? null)!, c) : null,
      kmMese: km !== null && v.mesi > 0 ? Math.round(km / v.mesi) : null,
      riparazioni: Math.round(sommaDi('riparazione', v.uuid) * 100) / 100,
    };
  });
  const fermoTotale = perVeicolo.reduce((s, v) => s + v.giorniFermo, 0);
  const conKm = perVeicolo.filter(v => v.kmMese !== null);
  const consumoRecente = consumoDi(recente);
  const consumoPrima = consumoDi(prima);
  return {
    periodo: { dal: periodo.dal, al: periodo.al },
    giorni: giorniPeriodo,
    veicoli: veicoli.length,
    disponibilita: { percentuale: disponibilita(veicoli.length, giorniPeriodo, fermoTotale), giorniFermo: fermoTotale, guasti: guasti.length },
    consumo: { l100, recente: consumoRecente, prima: consumoPrima, tendenza: variazione(consumoPrima, consumoRecente) },
    utilizzo: {
      kmMese: conKm.length ? Math.round(conKm.reduce((s, v) => s + (v.kmMese ?? 0), 0) / conKm.length) : null,
      sotto: conKm.filter(v => (v.kmMese ?? 0) < kmMeseMinimi).length,
      soglia: kmMeseMinimi,
    },
    manutenzione: { riparazioni: Math.round(riparazioni * 100) / 100, programmata: Math.round(manutenzione * 100) / 100, quotaGuasti: quotaGuasti(riparazioni, manutenzione) },
    perVeicolo,
  };
}
