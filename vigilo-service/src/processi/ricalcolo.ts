// =============================================================================
// Processo notturno vigilo.ricalcolo (06-servizio-api 6.5)
// =============================================================================
// Ogni notte alle 00:16 (ora italiana): rinnovi taciti delle scadenze passate,
// poi ricalcolo degli stati di tutte le scadenze aperte (una scadenza diventa
// "in scadenza" o "scaduta" con il passare dei giorni, senza modifiche).
// Registrato in log-service (job.completed / job.failed); log-service lo
// conosce fra i processi attesi e segnala se non gira.
// Poi gli avvisi del giorno (ADR090), che a loro volta avviano le email urgenti,
// e il controllo dell'avviso della libreria (B10b: lo crea solo se manca).
//
// Recupero (2026-11-09): anche all'avvio e, ogni VIGILO_RECUPERO_MINUTI, se il
// ricalcolo di oggi manca (recupero.ts): node-cron non recupera le esecuzioni
// saltate quando il servizio non gira a mezzanotte. Un ricalcolo con tenant
// saltati (auth-service non ancora pronto, un errore) non conta come fatto e
// si ripete al giro dopo: tutto il giro e' idempotente (rinnovi gia' fatti,
// stati gia' giusti, avvisi unici per evento, avviso della libreria solo se manca).
// =============================================================================
import cron from 'node-cron';
import { PARAMETRI } from '../core/parametri';
import { runJob } from '../core/services/jobRunner';
import { minutiInItalia, oggiInItalia } from '../core/utils/oggi';
import { rinnoviTaciti } from '../domini/registrazioni/registrazione.service';
import { ricalcolaScadenze } from '../domini/scadenze/ricalcolo.service';
import { generaAvvisiTutti } from '../domini/avvisi/generazione.service';
import { avvisaLibreriaTutti } from '../domini/aggiornamenti/avviso.service';
import type { Giorno } from '../regole';
import { ORARIO_RICALCOLO, cronGiornaliero, ricalcoloDovuto } from './recupero';

export const ID_RICALCOLO = 'vigilo.ricalcolo';
const ETICHETTA = 'Ricalcolo notturno delle scadenze';

/** Giorno dell'ultimo ricalcolo completo (in memoria: all'avvio si ricalcola comunque) */
let fattoIl: Giorno | null = null;
let inCorso = false;

export async function ricalcoloNotturno(): Promise<string> {
  const oggi = oggiInItalia();
  const taciti = await rinnoviTaciti(oggi);
  const cambiate = await ricalcolaScadenze({}, oggi);
  // ADR090: gli avvisi del giorno, dopo gli stati aggiornati
  const avvisi = await generaAvvisiTutti(oggi);
  const lib = await avvisaLibreriaTutti('controllo');
  const daRiprovare = avvisi.saltati + lib.saltati;
  // completo solo se nessun tenant e' stato saltato: altrimenti il recupero lo ripete
  if (!daRiprovare) fattoIl = oggi;
  const libreria = lib.nuovo ? `, ${lib.nuovo === 1 ? '1 avviso' : `${lib.nuovo} avvisi`} della libreria` : '';
  const saltati = daRiprovare ? `, ${daRiprovare} tenant da riprovare al prossimo giro` : '';
  return `${cambiate} stati cambiati, ${taciti} rinnovi taciti, ${avvisi.avvisi} avvisi (${avvisi.consegne} consegne, ${avvisi.risolte} risolte)${libreria}${saltati}`;
}

/** Un ricalcolo alla volta: il processo notturno e il recupero non si sovrappongono */
async function ricalcolo(motivo?: string): Promise<void> {
  if (inCorso) return;
  inCorso = true;
  try {
    await runJob(ID_RICALCOLO, motivo ? `${ETICHETTA} (${motivo})` : ETICHETTA, ricalcoloNotturno);
  } finally {
    inCorso = false;
  }
}

/** Il giro di controllo: se il ricalcolo di oggi manca, lo fa adesso */
function recupera(): void {
  const adesso = new Date();
  if (ricalcoloDovuto(fattoIl, oggiInItalia(adesso), minutiInItalia(adesso))) void ricalcolo(fattoIl ? 'recupero' : 'nuovo tentativo');
}

export function pianificaRicalcolo(): void {
  cron.schedule(cronGiornaliero(ORARIO_RICALCOLO), () => void ricalcolo(), { timezone: 'Europe/Rome' });
  const minuti = PARAMETRI.recuperoMinuti;
  setInterval(recupera, minuti * 60_000);
  console.log(`[Processi] ${ID_RICALCOLO} pianificato alle 00:16 (Europe/Rome), recupero ogni ${minuti} minuti`);
  // Anche all'avvio: dopo un fermo del servizio gli stati tornano subito giusti
  void ricalcolo('avvio');
}
