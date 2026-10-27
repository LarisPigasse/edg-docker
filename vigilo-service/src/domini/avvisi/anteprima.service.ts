// =============================================================================
// Anteprima dei destinatari di una scadenza (B8d-3)
// =============================================================================
// Chi riceverebbe oggi gli avvisi di una scadenza, con i nomi: le stesse
// regole della generazione (anteprimaDestinatari, puro) sulle stesse persone
// (persone.ts). L'ufficio si dice come numero di persone, chiesto ad
// auth-service; se non risponde, il numero manca e il resto c'è. I filtri e
// le preferenze personali non c'entrano: decidono come, non a chi. Chi ha
// chiesto di non ricevere più le email si vede come "escluso" (B8d-4).
// =============================================================================
import type { Contesto } from '../../core/contesto';
import { accountTenant } from '../../core/clients/authClient';
import { trovaNelTenant } from '../../core/db/tenant';
import { capacitaDi } from '../../core/middleware/permessi';
import { logger } from '../../core/services/logger';
import type { Destinatario, Origine } from '../../regole';
import { Assegnazione, Controllo, Scadenza, Soggetto } from '../modelli';
import { effettiveDi, predefinitiDi } from '../scadenze/ricalcolo.service';
import { anteprimaDestinatari, ufficioDa, type Anteprima, type PersonaNominata } from './destinatari';
import { inCorso, personaNominata } from './persone';
import { escluseDelTenant } from './recapiti.service';

export interface AnteprimaScadenza extends Anteprima {
  destinatari: Destinatario[];
  /** Da dove vengono: dal controllo o ridefiniti sulla scadenza */
  origine: Origine;
  /** Persone dell'ufficio; null se auth-service non risponde */
  ufficioPersone: number | null;
}

async function personeUfficio(idTenant: number): Promise<number | null> {
  try {
    const account = await accountTenant(idTenant);
    return ufficioDa(account.map(a => ({ id: a.id, capacita: capacitaDi(a.permissions) }))).length;
  } catch (err) {
    logger.warn('vigilo.avvisi', `Ufficio del tenant ${idTenant} non letto per l'anteprima: ${String(err)}`, { idTenant });
    return null;
  }
}

export async function anteprimaScadenza(ctx: Contesto, uuid: string): Promise<AnteprimaScadenza> {
  const s = await trovaNelTenant(Scadenza, 'uuidScadenza', uuid, ctx.idTenant, 'Scadenza', {
    include: [
      { model: Controllo, as: 'controllo' },
      {
        model: Soggetto,
        as: 'soggetto',
        include: [
          { model: Soggetto, as: 'referente' },
          { model: Assegnazione, as: 'assegnazioni', required: false, include: [{ model: Soggetto, as: 'persona' }] },
        ],
      },
    ],
  });
  const predefiniti = (await predefinitiDi([ctx.idTenant])).get(ctx.idTenant)!;
  const eff = effettiveDi(s, s.controllo, predefiniti);
  const sog = s.soggetto ?? null;

  const anteprima = anteprimaDestinatari({
    destinatari: eff.destinatari,
    soggettoFermo: sog?.stato === 'fermo',
    avvisaAncheSeFermo: !!s.controllo?.avvisaAncheSeFermo,
    referente: personaNominata(sog?.referente),
    assegnatari: (sog?.assegnazioni ?? [])
      .filter(a => inCorso(a, ctx.oggi))
      .map(a => personaNominata(a.persona))
      .filter((p): p is PersonaNominata => !!p),
    interessato: sog?.tipo === 'persona' ? personaNominata(sog) : null,
    soggettoPersona: sog?.tipo === 'persona',
    escluse: await escluseDelTenant(ctx.idTenant),
  });
  return {
    ...anteprima,
    destinatari: eff.destinatari,
    origine: eff.origine.destinatari,
    ufficioPersone: anteprima.ufficio ? await personeUfficio(ctx.idTenant) : null,
  };
}
