// =============================================================================
// Avvisi dell'utente: la campanella (ADR090) e la pagina "I miei avvisi" (B8d-1)
// =============================================================================
import type { Includeable, WhereOptions } from 'sequelize';
import type { Contesto } from '../../core/contesto';
import { Avviso, Consegna, Controllo, Scadenza, Soggetto } from '../modelli';
import type { StatoConsegna, TipoSoggetto } from '../valori';
import { statoDelTesto, tonoAvviso, type TonoAvviso } from './testo';

/** Quali avvisi: tutti, solo da leggere, solo quelli che non servono più */
export const STATI_ELENCO = ['tutti', 'da-leggere', 'non-attuali'] as const;
export type StatoElenco = (typeof STATI_ELENCO)[number];

export interface RicercaAvvisi {
  limit: number;
  offset?: number;
  stato?: StatoElenco;
  /** Solo gli avvisi dei soggetti di questo tipo */
  tipo?: TipoSoggetto;
}

const CONSEGNA_DI: Record<StatoElenco, StatoConsegna | null> = { tutti: null, 'da-leggere': 'inviato', 'non-attuali': 'risolto' };

export interface VoceAvviso {
  uuid: string;
  /** Il testo intero, come nelle email */
  testo: string;
  /** Prima riga: il titolo della scadenza (o del controllo) di oggi */
  titolo: string;
  /** Lo stato alla nascita dell'avviso ("scade tra 2 giorni · 24 ott") */
  stato: string;
  tono: TonoAvviso;
  tipo: string;
  urgente: boolean;
  /** inviato = da leggere · letto · risolto (non serve più) */
  consegna: string;
  creatoIl: Date;
  scadenza: { uuid: string } | null;
  soggetto: { uuid: string; nome: string; identificativo: string | null; tipo: TipoSoggetto } | null;
}

const delUtente = (ctx: Contesto) => ({ idTenant: ctx.idTenant, idAccount: ctx.utente.id, canale: 'app' as const });
/** Update di massa: i validatori di riga non vanno applicati a metà riga (L054) */
const diMassa = { validate: false } as const;

/** Avviso → scadenza → soggetto; con un tipo, solo i soggetti di quel tipo (e niente promemoria) */
const inclusioni = (tipo: TipoSoggetto | undefined, completo: boolean): Includeable[] => [
  {
    model: Avviso,
    as: 'avviso',
    required: true,
    ...(completo ? {} : { attributes: [] }),
    include: [
      {
        model: Scadenza,
        as: 'scadenza',
        required: !!tipo,
        attributes: completo ? ['uuidScadenza', 'titolo'] : [],
        include: [
          {
            model: Soggetto,
            as: 'soggetto',
            attributes: completo ? ['uuidSoggetto', 'nome', 'identificativo', 'tipo'] : [],
            ...(tipo ? { required: true, where: { tipo } } : {}),
          },
          ...(completo ? [{ model: Controllo, as: 'controllo', attributes: ['nome'] }] : []),
        ],
      },
    ],
  },
];

export async function mieiAvvisi(ctx: Contesto, r: RicercaAvvisi): Promise<{ nonLetti: number; totale: number; voci: VoceAvviso[] }> {
  const consegna = CONSEGNA_DI[r.stato ?? 'tutti'];
  const where: WhereOptions<Consegna> = { ...delUtente(ctx), ...(consegna ? { stato: consegna } : {}) };
  const [nonLetti, totale, righe] = await Promise.all([
    Consegna.count({ where: { ...delUtente(ctx), stato: 'inviato' } }),
    Consegna.count({ where, ...(r.tipo ? { include: inclusioni(r.tipo, false) } : {}) }),
    Consegna.findAll({
      where,
      include: inclusioni(r.tipo, true),
      order: [['createdAt', 'DESC'], ['idConsegna', 'DESC']],
      limit: r.limit,
      offset: r.offset ?? 0,
    }),
  ]);
  return {
    nonLetti,
    totale,
    voci: righe.map(c => {
      const a = c.avviso!;
      const s = a.scadenza ?? null;
      const stato = statoDelTesto(a.testo);
      return {
        uuid: a.uuidAvviso,
        testo: a.testo,
        titolo: s?.titolo || s?.controllo?.nome || a.testo.slice(0, Math.max(0, a.testo.length - stato.length - 2)) || 'Avviso',
        stato,
        tono: tonoAvviso(a.evento, a.urgente),
        tipo: a.tipo,
        urgente: a.urgente,
        consegna: c.stato,
        creatoIl: a.createdAt,
        scadenza: s ? { uuid: s.uuidScadenza } : null,
        soggetto: s?.soggetto
          ? { uuid: s.soggetto.uuidSoggetto, nome: s.soggetto.nome, identificativo: s.soggetto.identificativo ?? null, tipo: s.soggetto.tipo }
          : null,
      };
    }),
  };
}

export async function segnaLetto(ctx: Contesto, uuidAvviso: string): Promise<boolean> {
  const avviso = await Avviso.findOne({ where: { uuidAvviso, idTenant: ctx.idTenant }, attributes: ['idAvviso'] });
  if (!avviso) return false;
  const [n] = await Consegna.update({ stato: 'letto', lettoIl: new Date() }, { ...diMassa, where: { ...delUtente(ctx), idAvviso: avviso.idAvviso, stato: 'inviato' } });
  return n > 0;
}

export async function segnaTuttiLetti(ctx: Contesto): Promise<number> {
  const [n] = await Consegna.update({ stato: 'letto', lettoIl: new Date() }, { ...diMassa, where: { ...delUtente(ctx), stato: 'inviato' } });
  return n;
}
