// =============================================================================
// Ricalcolo degli stati delle scadenze (02-modello-dati, 06 6.5)
// =============================================================================
// stato, limiteIl, stimataIl e urgenzaIl sono copie dei calcoli delle regole
// (regole/stato.ts), salvate per la dashboard. Si ricalcolano dopo ogni
// modifica che li tocca e ogni notte (processo vigilo.ricalcolo). Le
// scritture del ricalcolo non toccano modificatoDa (hooks: false): non e'
// una modifica di qualcuno.
// =============================================================================
import { Op, type Transaction, type WhereOptions } from 'sequelize';
import {
  calcolaSituazione,
  impostazioniEffettive,
  impostazioniPredefinite,
  type Giorno,
  type ImpostazioniEffettive,
  type Situazione,
} from '../../regole';
import { PREDEFINITI_INIZIALI } from '../impostazioni/impostazioni.model';
import { Contatore, Controllo, ImpostazioniTenant, Scadenza } from '../modelli';
import { segnalaModifica } from '../avvisi/generazione.service';
import { PARAMETRI } from '../../core/parametri';

/** Le impostazioni effettive di una scadenza: controllo (o predefiniti) + ridefinizioni */
export function effettiveDi(s: Scadenza, controllo: Controllo | null | undefined, preavvisiPredefiniti: number[]): ImpostazioniEffettive {
  const base = controllo
    ? { cadenza: controllo.cadenza, preavvisi: controllo.preavvisi, tolleranza: controllo.tolleranza, destinatari: controllo.destinatari }
    : impostazioniPredefinite(preavvisiPredefiniti);
  return impostazioniEffettive(
    base,
    { cadenza: s.cadenza, preavvisi: s.preavvisi, tolleranza: s.tolleranza, destinatari: s.destinatari },
    !!controllo
  );
}

export interface Calcoli {
  stato: Scadenza['stato'];
  limiteIl: Giorno | null;
  stimataIl: Giorno | null;
  urgenzaIl: Giorno | null;
}

/** Impostazioni effettive e situazione completa (per i testi) di una scadenza a una data */
export function situazioneDi(
  s: Scadenza,
  controllo: Controllo | null | undefined,
  contatore: Contatore | null | undefined,
  preavvisiPredefiniti: number[],
  oggi: Giorno
): { eff: ImpostazioniEffettive; sit: Situazione } {
  const eff = effettiveDi(s, controllo, preavvisiPredefiniti);
  const sit = calcolaSituazione(
    {
      scadeIl: s.scadeIl ?? null,
      sogliaUso: s.sogliaUso ?? null,
      valoreContatore: contatore?.valore ?? null,
      usoGiornaliero: contatore?.usoGiornaliero ?? null,
      preavvisi: eff.preavvisi,
      tolleranza: eff.tolleranza,
    },
    oggi
  );
  return { eff, sit };
}

/** I valori calcolati di una scadenza a una data */
export function calcoliDi(
  s: Scadenza,
  controllo: Controllo | null | undefined,
  contatore: Contatore | null | undefined,
  preavvisiPredefiniti: number[],
  oggi: Giorno
): Calcoli {
  const { sit } = situazioneDi(s, controllo, contatore, preavvisiPredefiniti, oggi);
  return { stato: sit.stato, limiteIl: sit.limiteIl, stimataIl: sit.stimataIl, urgenzaIl: sit.urgenzaIl };
}

/** Preavvisi predefiniti dei tenant (per i promemoria senza controllo) */
export async function predefinitiDi(idTenants: number[], transaction?: Transaction): Promise<Map<number, number[]>> {
  const righe = await ImpostazioniTenant.findAll({ where: { idTenant: idTenants }, attributes: ['idTenant', 'predefiniti'], transaction });
  const mappa = new Map(righe.map(r => [r.idTenant, r.predefiniti?.preavvisi?.giorni ?? PREDEFINITI_INIZIALI.preavvisi.giorni]));
  for (const t of idTenants) if (!mappa.has(t)) mappa.set(t, PREDEFINITI_INIZIALI.preavvisi.giorni);
  return mappa;
}


/**
 * Ricalcola e salva le scadenze APERTE che rispondono al filtro (sempre con
 * idTenant, tranne il processo notturno). Restituisce quante sono cambiate.
 */
export async function ricalcolaScadenze(where: WhereOptions<Scadenza>, oggi: Giorno, transaction?: Transaction): Promise<number> {
  let cambiate = 0;
  let ultimo = 0;
  /** I tenant toccati da un ricalcolo mirato (una scadenza, un contatore, un soggetto...) */
  const toccati = new Set<number>();
  const mirato = Object.keys(where as object).length > 0;
  for (;;) {
    const lotto = await Scadenza.findAll({
      where: { ...(where as object), chiusaIl: null, idScadenza: { [Op.gt]: ultimo } } as WhereOptions<Scadenza>,
      include: [
        { model: Controllo, as: 'controllo' },
        { model: Contatore, as: 'contatore' },
      ],
      order: [['idScadenza', 'ASC']],
      limit: PARAMETRI.lotto,
      transaction,
    });
    if (!lotto.length) break;
    const predefiniti = await predefinitiDi([...new Set(lotto.map(s => s.idTenant))], transaction);
    for (const s of lotto) {
      if (mirato) toccati.add(s.idTenant);
      const c = calcoliDi(s, s.controllo, s.contatore, predefiniti.get(s.idTenant)!, oggi);
      const diverso = c.stato !== s.stato || c.limiteIl !== s.limiteIl || c.stimataIl !== s.stimataIl || c.urgenzaIl !== s.urgenzaIl;
      if (diverso) {
        await s.update({ ...c, calcolatoIl: new Date() }, { transaction, hooks: false });
        cambiate++;
      }
    }
    ultimo = lotto[lotto.length - 1].idScadenza;
    if (lotto.length < PARAMETRI.lotto) break;
  }
  // ADR090: dopo una modifica di un tenant, gli avvisi che ne derivano (poco dopo,
  // a transazione chiusa); il processo notturno ({} = tutti) li genera da sé.
  // Vale anche per i ricalcoli mirati (una scadenza, un contatore): prima
  // partivano solo con idTenant nel filtro, cioè quasi mai (B10a)
  const idTenant = (where as { idTenant?: unknown }).idTenant;
  if (typeof idTenant === 'number') toccati.add(idTenant);
  for (const t of toccati) segnalaModifica(t);
  return cambiate;
}
