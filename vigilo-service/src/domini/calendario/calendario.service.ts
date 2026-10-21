// =============================================================================
// Calendario — GET /api/vigilo/calendario (07-interfaccia 7.11, ADR083)
// =============================================================================
// Le scadenze aperte che arrivano nel periodo (urgenzaIl), ciascuna con il suo
// giorno e il testo dello stato pronto, piu' l'arretrato: le aperte con la
// data prima del mese corrente (come in "I prossimi 12 mesi" della dashboard).
// Stessi filtri dell'elenco e della dashboard.
// =============================================================================
import { literal, Op, type Order, type WhereOptions } from 'sequelize';
import type { Contesto } from '../../core/contesto';
import { ValidationError } from '../../core/utils/errors';
import { Scadenza } from '../modelli';
import { predefinitiDi, situazioneDi } from '../scadenze/ricalcolo.service';
import { presentaScadenza } from '../scadenze/scadenza.presenta';
import { filtri, GRAVITA } from '../scadenze/scadenza.service';
import { giornoDelCalendario, verificaPeriodo, VOCI_MASSIME } from './periodo';

export async function calendario(ctx: Contesto, q: Record<string, unknown>) {
  const dal = String(q.dal);
  const al = String(q.al);
  const errore = verificaPeriodo(dal, al);
  if (errore) throw new ValidationError(errore);

  const { where, include } = await filtri(ctx, q);
  const righe = await Scadenza.findAll({
    where: { ...where, chiusaIl: null, urgenzaIl: { [Op.gte]: dal, [Op.lte]: al } } as WhereOptions<Scadenza>,
    include,
    order: [literal(`"Scadenza"."urgenza_il" ASC`), literal(`${GRAVITA} DESC`), ['idScadenza', 'ASC']] as Order,
    limit: VOCI_MASSIME + 1,
  });
  const arretrato = await Scadenza.count({
    where: { ...where, chiusaIl: null, scadeIl: { [Op.lt]: `${ctx.oggi.slice(0, 7)}-01` } } as WhereOptions<Scadenza>,
    include,
  });

  const predefiniti = (await predefinitiDi([ctx.idTenant])).get(ctx.idTenant)!;
  const voci = righe.slice(0, VOCI_MASSIME).flatMap(s => {
    const g = giornoDelCalendario(s);
    if (!g) return [];
    const { sit } = situazioneDi(s, s.controllo, s.contatore, predefiniti, ctx.oggi);
    return [{ ...presentaScadenza(s, sit, ctx), ...g }];
  });

  return { oggi: ctx.oggi, dal, al, arretrato, voci, troncato: righe.length > VOCI_MASSIME };
}
