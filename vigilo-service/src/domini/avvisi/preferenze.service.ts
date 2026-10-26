// =============================================================================
// Le preferenze degli avvisi dell'utente (04-avvisi 4.4, B8d-1)
// =============================================================================
// Sempre e solo quelle dell'account del token. Nel database le sedi dei filtri
// sono id; all'interfaccia arrivano e tornano come uuid. Le regole del tenant
// (orario del riepilogo, giorni lavorativi, silenzio) si danno in sola lettura,
// perché l'interfaccia scriva frasi esatte ("alle 08:00, dal lunedì al
// venerdì"): si cambiano dalla Configurazione (B8d-2).
// =============================================================================
import { Op } from 'sequelize';
import type { Contesto } from '../../core/contesto';
import { snapshot } from '../../core/services/logger';
import { traccia } from '../../core/services/traccia';
import { ValidationError } from '../../core/utils/errors';
import { avvisiEffettivi, type RegoleAvvisi } from '../impostazioni/limiti';
import { ImpostazioniTenant, PreferenzeAvvisi, Soggetto } from '../modelli';
import type { FrequenzaAvvisi, TipoSoggetto } from '../valori';
import { PREFERENZE_INIZIALI } from './invio';
import { LIMITI_PREFERENZE, PREFERENZE_PREDEFINITE, erroriPreferenze, filtriEffettivi, preferenzeEffettive, type Preferenze } from './preferenze';

/** Le preferenze come le vede l'interfaccia: sedi per uuid */
export interface PreferenzeUtente {
  frequenza: FrequenzaAvvisi;
  urgentiSubito: boolean;
  filtri: { tipi: TipoSoggetto[]; sedi: string[] };
}

export interface SedeScelta {
  uuid: string;
  nome: string;
  archiviata: boolean;
}

export interface SchedaPreferenze {
  preferenze: PreferenzeUtente;
  /** false = mai salvate: valgono i predefiniti */
  salvate: boolean;
  predefinite: PreferenzeUtente;
  /** Riceve come ufficio (lettura o scrittura): solo allora i filtri contano */
  comeUfficio: boolean;
  /** Le regole del tenant che decidono quando partono le email (sola lettura) */
  regole: Pick<RegoleAvvisi, 'orarioRiepilogo' | 'giorniLavorativi' | 'silenzio'>;
  /** Le sedi del tenant, per nome */
  sedi: SedeScelta[];
  limiti: typeof LIMITI_PREFERENZE;
}

const sediDi = (idTenant: number) =>
  Soggetto.findAll({ where: { idTenant, tipo: 'sede' }, attributes: ['idSoggetto', 'uuidSoggetto', 'nome', 'stato'], order: [['nome', 'ASC']] });

const dellUtente = (ctx: Contesto) => ({ idTenant: ctx.idTenant, idAccount: ctx.utente.id });

/** Le preferenze effettive degli account del tenant che le hanno salvate (gli altri: predefinite) */
export async function preferenzeDelTenant(idTenant: number): Promise<Map<number, Preferenze>> {
  const righe = await PreferenzeAvvisi.findAll({ where: { idTenant } });
  if (!righe.length) return new Map();
  const sedi = new Set((await sediDi(idTenant)).map(s => s.idSoggetto));
  return new Map(righe.map(r => [r.idAccount, preferenzeEffettive(r, sedi)]));
}

const perUtente = (p: Preferenze, uuidDi: Map<number, string>): PreferenzeUtente => ({
  frequenza: p.frequenza,
  urgentiSubito: p.urgentiSubito,
  filtri: { tipi: [...p.filtri.tipi], sedi: p.filtri.sedi.map(id => uuidDi.get(id)).filter((u): u is string => !!u) },
});

export async function miePreferenze(ctx: Contesto): Promise<SchedaPreferenze> {
  const [riga, sedi, imp] = await Promise.all([
    PreferenzeAvvisi.findOne({ where: dellUtente(ctx) }),
    sediDi(ctx.idTenant),
    ImpostazioniTenant.findByPk(ctx.idTenant, { attributes: ['idTenant', 'avvisi'] }),
  ]);
  const uuidDi = new Map(sedi.map(s => [s.idSoggetto, s.uuidSoggetto]));
  const { orarioRiepilogo, giorniLavorativi, silenzio } = avvisiEffettivi(imp?.avvisi);
  return {
    preferenze: perUtente(preferenzeEffettive(riga, new Set(uuidDi.keys())), uuidDi),
    salvate: !!riga,
    predefinite: perUtente(PREFERENZE_PREDEFINITE, uuidDi),
    comeUfficio: ctx.capacita.read || ctx.capacita.write,
    regole: { orarioRiepilogo, giorniLavorativi, silenzio },
    sedi: sedi.map(s => ({ uuid: s.uuidSoggetto, nome: s.nome, archiviata: s.stato === 'dismesso' })),
    limiti: LIMITI_PREFERENZE,
  };
}

export async function salvaPreferenze(ctx: Contesto, dati: PreferenzeUtente): Promise<SchedaPreferenze> {
  const errori = erroriPreferenze(dati);
  if (errori.length) throw new ValidationError(errori.join('. '));

  const uuid = [...new Set(dati.filtri.sedi)];
  const sedi = uuid.length
    ? await Soggetto.findAll({ where: { idTenant: ctx.idTenant, tipo: 'sede', uuidSoggetto: { [Op.in]: uuid } }, attributes: ['idSoggetto'] })
    : [];
  if (sedi.length !== uuid.length) throw new ValidationError('Una delle sedi scelte non esiste più: ricarica la pagina');

  const valori = {
    frequenza: dati.frequenza,
    urgentiSubito: dati.urgentiSubito,
    filtri: filtriEffettivi({ tipi: dati.filtri.tipi, sedi: sedi.map(s => s.idSoggetto) }),
  };
  const riga = await PreferenzeAvvisi.findOne({ where: dellUtente(ctx) });
  const prima = riga ? snapshot(riga) : null;
  const dopo = riga ? await riga.update(valori) : await PreferenzeAvvisi.create({ ...dellUtente(ctx), ...valori, canali: [...PREFERENZE_INIZIALI.canali] });
  traccia(ctx, 'vigilo.preferenze.modificate', 'Preferenze degli avvisi aggiornate', prima, dopo.get({ plain: true }));
  return miePreferenze(ctx);
}

/** Torna ai predefiniti: la riga si toglie */
export async function ripristinaPreferenze(ctx: Contesto): Promise<SchedaPreferenze> {
  const riga = await PreferenzeAvvisi.findOne({ where: dellUtente(ctx) });
  if (riga) {
    const prima = snapshot(riga);
    await riga.destroy();
    traccia(ctx, 'vigilo.preferenze.ripristinate', 'Preferenze degli avvisi riportate ai predefiniti', prima, null);
  }
  return miePreferenze(ctx);
}
