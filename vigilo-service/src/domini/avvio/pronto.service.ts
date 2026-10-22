// =============================================================================
// Vigilo è pronto: le email a primo avvio riuscito (ADR089)
// =============================================================================
// Parte dopo la risposta e non blocca mai l'avvio: ogni passo che non riesce
// si salta e si scrive nel log.
//   1. auth-service: il cliente collegato al tenant
//   2. system-service: referente, email e operatore che lo segue
//   3. email-service: "Vigilo è pronto" al cliente (se l'ha preparato EDG) e
//      "Vigilo pronto per …" all'operatore EDG
// =============================================================================
import type { Contesto } from '../../core/contesto';
import { configModulo, nomiAccount } from '../../core/clients/authClient';
import { contattiAnagrafica, type ContattiAnagrafica } from '../../core/clients/systemClient';
import { inviaEmail } from '../../core/clients/emailClient';
import { logger } from '../../core/services/logger';
import { ModelloSettore } from '../modelli';
import { destinatariPronto, nomeProprio } from './pronto';

const APP_FRONTEND_URL = (process.env.APP_FRONTEND_URL || 'http://localhost:5174').replace(/\/$/, '');

const QUANDO = new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Rome' });

export interface DatiPronto {
  modelli: string[];
  categorie: number;
  controlli: number;
  scadenze: number;
}

async function chiHaAvviato(ctx: Contesto): Promise<string> {
  if (ctx.utente.assistenza) return ctx.utente.assistenza.operatore.nome;
  const nome = await nomiAccount([ctx.utente.id])
    .then(r => r[0]?.nome)
    .catch(() => undefined);
  return nome ?? ctx.utente.email;
}

export async function notificaVigiloPronto(ctx: Contesto, dati: DatiPronto): Promise<void> {
  const meta: Record<string, unknown> = { idTenant: ctx.idTenant };
  try {
    const daEdg = !!ctx.utente.assistenza;
    const attivazione = await configModulo(ctx.idTenant);
    const clienteUuid = attivazione.tenant?.clienteUuid ?? null;
    let contatti: ContattiAnagrafica | null = null;
    if (clienteUuid) contatti = await contattiAnagrafica(clienteUuid);

    const dest = destinatariPronto(contatti, daEdg);
    const ragioneSociale = contatti?.ragioneSociale ?? attivazione.tenant?.nome ?? `tenant ${ctx.idTenant}`;
    Object.assign(meta, { clienteUuid, daEdg, cliente: dest.cliente, operatore: dest.operatore?.email ?? null });

    const [settori, chi] = await Promise.all([
      ModelloSettore.findAll({ where: { chiave: dati.modelli }, order: [['ordine', 'ASC']], attributes: ['nome'] }),
      chiHaAvviato(ctx),
    ]);

    const esiti: string[] = [];
    let emailCliente: string | null = null;

    if (dest.cliente) {
      try {
        await inviaEmail({
          to: dest.cliente,
          subject: 'Vigilo è pronto',
          template: 'vigilo/pronto-cliente',
          replyTo: dest.operatore?.email,
          data: {
            oggetto: 'Vigilo è pronto',
            referente: contatti?.referente ?? null,
            ragioneSociale,
            categorie: dati.categorie,
            controlli: dati.controlli,
            // 0 subito dopo l'avvio: le scadenze nascono con i soggetti (il testo cambia)
            scadenze: dati.scadenze,
            urlVigilo: `${APP_FRONTEND_URL}/vigilo`,
            operatore: dest.operatore?.nome ?? null,
          },
        });
        emailCliente = dest.cliente;
        esiti.push(`cliente: inviata a ${dest.cliente}`);
      } catch (err) {
        esiti.push(`cliente: non inviata (${String(err)})`);
      }
    } else if (daEdg) {
      esiti.push('cliente: nessun indirizzo in anagrafica');
    }

    if (dest.operatore) {
      const oggetto = `Vigilo pronto per ${ragioneSociale}`;
      try {
        await inviaEmail({
          to: dest.operatore.email,
          subject: oggetto,
          template: 'vigilo/pronto-edg',
          data: {
            oggetto,
            nome: nomeProprio(dest.operatore.nome),
            ragioneSociale,
            quando: QUANDO.format(new Date()),
            chiHaAvviato: chi,
            daEdg,
            settori: settori.length ? settori.map(s => s.nome).join(', ') : 'nessuno (parto da zero)',
            categorie: dati.categorie,
            controlli: dati.controlli,
            scadenze: dati.scadenze,
            emailCliente,
          },
        });
        esiti.push(`operatore: inviata a ${dest.operatore.email}`);
      } catch (err) {
        esiti.push(`operatore: non inviata (${String(err)})`);
      }
    } else {
      esiti.push('operatore: nessun operatore con email che segue il cliente');
    }

    logger.info('vigilo.pronto_email', `Vigilo pronto per ${ragioneSociale}: ${esiti.join('; ')}`, meta);
  } catch (err) {
    logger.warn('vigilo.pronto_email', `Email "Vigilo è pronto" non inviate: ${String(err)}`, meta);
  }
}
