// =============================================================================
// Stima dei costi di un servizio — POST /stima/calcola (2026-11-17, fase 2)
// =============================================================================
// Mette insieme i dati del calcolo (calcolo.ts) dai dati del servizio:
//   costo del mezzo   le sue due componenti negli ultimi 12 mesi (scritte a
//                     mano o dal costo dei mezzi): variabile per km (trasporti)
//                     o per ora motore (macchine), se l'uso è di quella unità,
//                     e fissa per ora di impiego
//   costo orario      scritto a mano, oppure quello della persona scelta,
//                     oppure il costo medio dei parametri generali
//   parametri         quelli generali e il costo aziendale per ora dell'anno
//                     di riferimento (in corso o il più recente prima)
// Risponde con ciò che ha usato e da dove viene (la fotografia che la fase 3
// salverà con la stima) e con il risultato.
// =============================================================================
import type { Contesto } from '../../core/contesto';
import { ValidationError } from '../../core/utils/errors';
import { trovaNelTenant } from '../../core/db/tenant';
import { stimaEffettiva } from '../impostazioni/limiti';
import { ImpostazioniTenant, Soggetto } from '../modelli';
import { costoMezzi } from '../resoconti/mezzi.service';
import { calcolaStima, type TipoServizio, type VoceExtra } from './calcolo';
import { CostiAziendali } from './costiAziendali.model';
import { annoDiRiferimento, costiAttribuiti, costoPerKm, costoPerOra, totaleVoci } from './parametri';

export interface RichiestaCalcolo {
  tipo: TipoServizio;
  /** uuid del mezzo (veicolo, macchina o attrezzatura) */
  mezzo?: string | null;
  /** Parte variabile scritta a mano (€/km o €/h motore): vince su quella del mezzo */
  costoMezzo?: number | null;
  /** Parte fissa scritta a mano (€ per ora di impiego): vince su quella del mezzo */
  costoMezzoOra?: number | null;
  km?: number;
  ritornoAVuoto?: boolean;
  kmAutostrada?: number | null;
  oreLavoro?: number;
  oreAggiuntive?: number;
  /** uuid della persona (conducente o operatore) */
  persona?: string | null;
  /** €/h scritto a mano: vince su persona e costo medio */
  costoOrario?: number | null;
  pernottamenti?: number;
  pedaggi?: number | null;
  extra?: VoceExtra[];
  /** Anno dei costi aziendali; predefinito: quello in corso o il più recente prima */
  anno?: number | null;
}

export type Fonte = 'manuale' | 'mezzo' | 'persona' | 'media' | 'mancante';

export async function calcolaServizio(ctx: Contesto, q: RichiestaCalcolo) {
  const imp = await ImpostazioniTenant.findByPk(ctx.idTenant, { attributes: ['idTenant', 'stima'] });
  const generali = stimaEffettiva(imp?.stima);
  const avvisiDati: string[] = [];

  // Il mezzo e il suo costo per km o per ora
  let mezzo: { uuid: string; nome: string; identificativo: string | null; base: string; costo: number | null; fissoOra: number | null } | null = null;
  if (q.mezzo) {
    const s = await trovaNelTenant(Soggetto, 'uuidSoggetto', q.mezzo, ctx.idTenant, 'Mezzo');
    const c = (await costoMezzi(ctx, { periodo: '12m', soggetto: q.mezzo })).mezzi[0];
    const base = c?.componenti.unita ?? 'mese';
    const giusta = base === (q.tipo === 'km' ? 'km' : 'ore');
    mezzo = {
      uuid: s.uuidSoggetto,
      nome: s.nome,
      identificativo: s.identificativo ?? null,
      base,
      costo: giusta ? (c?.componenti.variabile ?? null) : null,
      fissoOra: c?.componenti.fissoOra ?? null,
    };
    if (!giusta && q.costoMezzo == null)
      avvisiDati.push(q.tipo === 'km' ? `${s.nome} non ha ancora un costo per km in movimento (nessun uso in km registrato): scrivilo a mano` : `${s.nome} non ha un costo per ora motore (nessun contaore con letture): scrivilo a mano`);
  }
  const costoMezzo = q.costoMezzo ?? mezzo?.costo ?? null;
  const fonteMezzo: Fonte = q.costoMezzo != null ? 'manuale' : mezzo?.costo != null ? 'mezzo' : 'mancante';
  const costoMezzoOra = q.costoMezzoOra ?? mezzo?.fissoOra ?? null;
  const fonteMezzoOra: Fonte = q.costoMezzoOra != null ? 'manuale' : mezzo?.fissoOra != null ? 'mezzo' : 'mancante';

  // Il costo orario del conducente o dell'operatore
  let persona: { uuid: string; nome: string; costoOrario: number | null } | null = null;
  if (q.persona) {
    const p = await trovaNelTenant(Soggetto, 'uuidSoggetto', q.persona, ctx.idTenant, 'Persona');
    if (p.tipo !== 'persona') throw new ValidationError('Il conducente dev\'essere una persona');
    persona = { uuid: p.uuidSoggetto, nome: p.nome, costoOrario: p.costoOrario ?? null };
  }
  const costoOrario = q.costoOrario ?? persona?.costoOrario ?? generali.costoOrarioConducente ?? null;
  const fonteCostoOrario: Fonte =
    q.costoOrario != null ? 'manuale' : persona?.costoOrario != null ? 'persona' : generali.costoOrarioConducente != null ? 'media' : 'mancante';

  // I costi aziendali dell'anno di riferimento
  const anni = await CostiAziendali.findAll({ where: { idTenant: ctx.idTenant } });
  const anno = q.anno ?? annoDiRiferimento(anni.map(a => a.anno), Number(ctx.oggi.slice(0, 4)));
  const riga = anni.find(a => a.anno === anno) ?? null;
  // solo la quota dei costi aziendali che spetta ai servizi con i mezzi
  const attribuiti = riga ? costiAttribuiti(totaleVoci(riga.voci), riga.quotaMezzi) : 0;
  const costoAziendalePerOra = riga ? costoPerOra(attribuiti, riga.oreServizio) : null;
  const costoAziendalePerKm = riga ? costoPerKm(attribuiti, riga.kmAnnui) : null;

  const parametri = {
    velocitaMedia: generali.velocitaMedia,
    oreGuidaGiorno: generali.oreGuidaGiorno,
    diaria: generali.diaria,
    pedaggioKm: generali.pedaggioKm,
    costoAziendalePerOra,
    costoAziendalePerKm,
    indennitaTrasferta: generali.indennitaTrasferta,
    sogliaOreTrasferta: generali.sogliaOreTrasferta,
    sogliaKmTrasferta: generali.sogliaKmTrasferta,
  };
  const risultato = calcolaStima({
    tipo: q.tipo,
    costoMezzo,
    costoMezzoOra,
    km: q.km ?? 0,
    ritornoAVuoto: !!q.ritornoAVuoto,
    kmAutostrada: q.kmAutostrada ?? null,
    oreLavoro: q.oreLavoro ?? 0,
    oreAggiuntive: q.oreAggiuntive ?? 0,
    costoOrario,
    pernottamenti: q.pernottamenti ?? 0,
    pedaggi: q.pedaggi ?? null,
    extra: q.extra ?? [],
    parametri,
  });
  return {
    /** Ciò che il calcolo ha usato e da dove viene (la fotografia della stima) */
    usati: {
      mezzo,
      costoMezzo,
      fonteMezzo,
      costoMezzoOra,
      fonteMezzoOra,
      persona,
      costoOrario,
      fonteCostoOrario,
      anno: riga ? { anno: riga.anno, stato: riga.stato, quotaMezzi: riga.quotaMezzi } : null,
      parametri,
    },
    risultato: { ...risultato, avvisi: [...avvisiDati, ...risultato.avvisi] },
  };
}
