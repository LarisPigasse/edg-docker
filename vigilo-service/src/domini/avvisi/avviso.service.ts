// =============================================================================
// Avvisi dell'utente: la campanella (ADR090)
// =============================================================================
import type { Contesto } from '../../core/contesto';
import { Avviso, Consegna, Scadenza, Soggetto } from '../modelli';

export interface VoceAvviso {
  uuid: string;
  testo: string;
  tipo: string;
  urgente: boolean;
  /** inviato = da leggere · letto · risolto (non serve più) */
  stato: string;
  creatoIl: Date;
  scadenza: { uuid: string } | null;
  soggetto: { uuid: string; nome: string } | null;
}

const delUtente = (ctx: Contesto) => ({ idTenant: ctx.idTenant, idAccount: ctx.utente.id, canale: 'app' as const });
/** Update di massa: i validatori di riga non vanno applicati a metà riga (L054) */
const diMassa = { validate: false } as const;

export async function mieiAvvisi(ctx: Contesto, limit: number): Promise<{ nonLetti: number; voci: VoceAvviso[] }> {
  const [nonLetti, righe] = await Promise.all([
    Consegna.count({ where: { ...delUtente(ctx), stato: 'inviato' } }),
    Consegna.findAll({
      where: delUtente(ctx),
      include: [
        {
          model: Avviso,
          as: 'avviso',
          required: true,
          include: [
            {
              model: Scadenza,
              as: 'scadenza',
              attributes: ['uuidScadenza'],
              include: [{ model: Soggetto, as: 'soggetto', attributes: ['uuidSoggetto', 'nome'] }],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC'], ['idConsegna', 'DESC']],
      limit,
    }),
  ]);
  return {
    nonLetti,
    voci: righe.map(c => {
      const a = c.avviso!;
      const s = a.scadenza ?? null;
      return {
        uuid: a.uuidAvviso,
        testo: a.testo,
        tipo: a.tipo,
        urgente: a.urgente,
        stato: c.stato,
        creatoIl: a.createdAt,
        scadenza: s ? { uuid: s.uuidScadenza } : null,
        soggetto: s?.soggetto ? { uuid: s.soggetto.uuidSoggetto, nome: s.soggetto.nome } : null,
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
