// =============================================================================
// Processo notturno vigilo.ricalcolo (06-servizio-api 6.5)
// =============================================================================
// Ogni notte alle 00:16 (ora italiana): rinnovi taciti delle scadenze passate,
// poi ricalcolo degli stati di tutte le scadenze aperte (una scadenza diventa
// "in scadenza" o "scaduta" con il passare dei giorni, senza modifiche).
// Registrato in log-service (job.completed / job.failed); log-service lo
// conosce fra i processi attesi e segnala se non gira.
// Poi gli avvisi del giorno (ADR090), che a loro volta avviano le email urgenti.
// =============================================================================
import cron from 'node-cron';
import { runJob } from '../core/services/jobRunner';
import { oggiInItalia } from '../core/utils/oggi';
import { rinnoviTaciti } from '../domini/registrazioni/registrazione.service';
import { ricalcolaScadenze } from '../domini/scadenze/ricalcolo.service';
import { generaAvvisiTutti } from '../domini/avvisi/generazione.service';

export const ID_RICALCOLO = 'vigilo.ricalcolo';

export async function ricalcoloNotturno(): Promise<string> {
  const oggi = oggiInItalia();
  const taciti = await rinnoviTaciti(oggi);
  const cambiate = await ricalcolaScadenze({}, oggi);
  // ADR090: gli avvisi del giorno, dopo gli stati aggiornati
  const avvisi = await generaAvvisiTutti(oggi);
  const saltati = avvisi.saltati ? `, ${avvisi.saltati} tenant da riprovare` : '';
  return `${cambiate} stati cambiati, ${taciti} rinnovi taciti, ${avvisi.avvisi} avvisi (${avvisi.consegne} consegne, ${avvisi.risolte} risolte)${saltati}`;
}

const ricalcolo = () => runJob(ID_RICALCOLO, 'Ricalcolo notturno delle scadenze', ricalcoloNotturno);

export function pianificaRicalcolo(): void {
  cron.schedule('16 0 * * *', () => void ricalcolo(), { timezone: 'Europe/Rome' });
  console.log(`[Processi] ${ID_RICALCOLO} pianificato alle 00:16 (Europe/Rome)`);
  // Anche all'avvio: dopo un fermo del servizio gli stati tornano subito giusti
  void ricalcolo();
}
