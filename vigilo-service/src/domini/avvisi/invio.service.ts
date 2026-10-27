// =============================================================================
// Email degli avvisi da mandare subito (04-avvisi 4.4, ADR092-ADR093)
// =============================================================================
// Prende le consegne email in coda che devono partire subito (urgenti per chi
// le vuole subito, tutto per chi ha scelto "subito") e le manda una per una
// con il modello vigilo/avviso. Le altre restano in coda per il riepilogo.
//   - indirizzo e nome degli account letti da auth-service al momento
//     dell'invio (vale l'email di oggi); se auth non risponde, si riprova al
//     giro dopo senza contare tentativi;
//   - invio non riuscito: si riprova ai giri successivi, al limite dei
//     tentativi (parametro della piattaforma) la consegna passa a "fallito";
//   - nel silenzio notturno del tenant non parte niente;
//   - chi non ha account trova in fondo "Non ricevere più questi avvisi";
//     se l'ha già chiesto, la consegna si risolve senza email (B8d-4).
// Gira a ogni giro delle email e subito dopo una generazione con email nuove,
// un giro alla volta (segnalaInvio).
// =============================================================================
import { Op } from 'sequelize';
import type { NomeAccount } from '../../core/clients/authClient';
import { inviaEmail } from '../../core/clients/emailClient';
import { PARAMETRI } from '../../core/parametri';
import { logger } from '../../core/services/logger';
import { minutiInItalia } from '../../core/utils/oggi';
import { nomeProprio } from '../avvio/pronto';
import { avvisiEffettivi, inSilenzio } from '../impostazioni/limiti';
import { Consegna, ImpostazioniTenant } from '../modelli';
import { INCLUDE_AVVISO, esitoInvio, indirizziDi, linkNonRicevere, nomiTenant, preferenzeDella, preferenzeDi, voceDi } from './email';
import { invioEmail } from './invio';
import { chiaveRecapito } from './recapiti';
import { recapitiDi } from './recapiti.service';

export interface EsitoInvio {
  inviate: number;
  fallite: number;
  /** Da riprovare al giro dopo */
  rimandate: number;
}

export async function inviaEmailSubito(adesso: Date = new Date()): Promise<EsitoInvio> {
  const esito: EsitoInvio = { inviate: 0, fallite: 0, rimandate: 0 };
  const minuti = minutiInItalia(adesso);
  const nomeTenant = nomiTenant();
  /** Tenant in silenzio adesso (impostazioni lette una volta per giro) */
  const silenzio = new Map<number, boolean>();
  const zitto = async (idTenant: number) => {
    if (!silenzio.has(idTenant)) {
      const imp = await ImpostazioniTenant.findByPk(idTenant, { attributes: ['idTenant', 'avvisi'] });
      silenzio.set(idTenant, inSilenzio(minuti, avvisiEffettivi(imp?.avvisi).silenzio));
    }
    return silenzio.get(idTenant)!;
  };

  let ultimo = 0;
  for (;;) {
    const lotto = await Consegna.findAll({
      where: { canale: 'email', stato: 'in-coda', idConsegna: { [Op.gt]: ultimo } },
      include: [INCLUDE_AVVISO],
      order: [['idConsegna', 'ASC']],
      limit: PARAMETRI.lotto,
    });
    if (!lotto.length) break;
    ultimo = lotto[lotto.length - 1].idConsegna;

    const preferenze = await preferenzeDi(lotto);
    const subito: Consegna[] = [];
    for (const c of lotto) {
      if (invioEmail(preferenzeDella(c, preferenze), c.avviso!.urgente) !== 'subito') continue;
      if (await zitto(c.idTenant)) esito.rimandate++;
      else subito.push(c);
    }

    let account: Map<number, NomeAccount> | null = null;
    try {
      account = await indirizziDi(subito.filter(c => c.idAccount != null).map(c => c.idAccount!));
    } catch (err) {
      logger.warn('vigilo.avvisi_email', `Indirizzi degli account non letti, si riprova al giro dopo: ${String(err)}`);
    }
    const recapiti = await recapitiDi(subito);

    for (const c of subito) {
      if (c.idAccount != null && !account) {
        esito.rimandate++;
        continue;
      }
      const persona = c.idAccount != null ? account!.get(c.idAccount) : null;
      const to = c.idAccount != null ? persona?.email?.trim() : c.email;
      if (!to) {
        await c.update({ stato: 'fallito', errore: 'Account non trovato o senza email' });
        esito.fallite++;
        continue;
      }
      const recapito = c.idAccount == null ? recapiti.get(chiaveRecapito(c.idTenant, to)) : undefined;
      if (recapito?.esclusoIl) {
        await c.update({ stato: 'risolto', errore: 'Ha chiesto di non ricevere più le email' });
        continue;
      }
      const a = c.avviso!;
      const v = voceDi(a, c.idAccount != null);
      let errore: unknown = null;
      try {
        await inviaEmail({
          to,
          subject: `Vigilo · ${a.testo}`.slice(0, 256),
          template: 'vigilo/avviso',
          data: {
            oggetto: a.urgente ? 'Una scadenza da sistemare subito' : 'Una scadenza da tenere d’occhio',
            nome: persona?.nome ? nomeProprio(persona.nome) : null,
            tenant: await nomeTenant(c.idTenant),
            ...v,
            nonRicevere: recapito ? linkNonRicevere(recapito.codice) : null,
          },
        });
      } catch (err) {
        errore = err;
      }
      const fallita = await esitoInvio([c], errore);
      if (errore === null) esito.inviate++;
      else if (fallita) esito.fallite++;
      else esito.rimandate++;
    }
    if (lotto.length < PARAMETRI.lotto) break;
  }
  return esito;
}

// --- un giro alla volta: chi lo chiede durante un giro ne ottiene un altro subito dopo ---

let inCorso: Promise<void> | null = null;
let ancora = false;

async function giro(): Promise<void> {
  try {
    const e = await inviaEmailSubito();
    if (e.inviate || e.fallite) {
      logger.info('vigilo.avvisi_email', `Email degli avvisi: ${e.inviate} inviate, ${e.fallite} non riuscite, ${e.rimandate} da riprovare`, { ...e });
    }
  } catch (err) {
    logger.warn('vigilo.avvisi_email', `Email degli avvisi non inviate: ${String(err)}`);
  }
}

export function segnalaInvio(): void {
  if (inCorso) {
    ancora = true;
    return;
  }
  inCorso = (async () => {
    do {
      ancora = false;
      await giro();
    } while (ancora);
  })().finally(() => {
    inCorso = null;
  });
}
