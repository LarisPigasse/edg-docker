// =============================================================================
// Email degli avvisi (ADR092-ADR093)
// =============================================================================
// Un giro ogni VIGILO_GIRO_EMAIL_MINUTI (predefinito 16, da 4 a 64):
//   1. le email da mandare subito rimaste in coda (anche per un errore o per
//      il silenzio notturno) — partono anche subito dopo ogni generazione;
//   2. i riepiloghi dei tenant il cui orario è passato (vigilo.riepilogo-avvisi,
//      processo atteso in log-service). Nei giorni senza riepiloghi dovuti il
//      processo si registra comunque una volta, dopo l'ultimo orario
//      possibile (12:00), con "nessun riepilogo": così sabato e domenica non
//      risultano mancati.
// =============================================================================
import { PARAMETRI } from '../core/parametri';
import { runJob } from '../core/services/jobRunner';
import { minutiInItalia, oggiInItalia } from '../core/utils/oggi';
import { minutiDi, LIMITI_AVVISI } from '../domini/impostazioni/limiti';
import { segnalaInvio } from '../domini/avvisi/invio.service';
import { inviaRiepiloghi, tenantDaRiepilogare } from '../domini/avvisi/riepilogo.service';

export const ID_RIEPILOGO = 'vigilo.riepilogo-avvisi';

/** Giorno dell'ultima registrazione del processo (in memoria: dopo un riavvio al più una in più) */
let registratoIl: string | null = null;
let riepilogoInCorso = false;

async function riepiloghi(): Promise<void> {
  if (riepilogoInCorso) return;
  riepilogoInCorso = true;
  try {
    const adesso = new Date();
    const oggi = oggiInItalia(adesso);
    const dovuti = await tenantDaRiepilogare(adesso);
    const dopoUltimoOrario = minutiInItalia(adesso) >= minutiDi(LIMITI_AVVISI.orarioRiepilogo.max)!;
    if (!dovuti.length && (registratoIl === oggi || !dopoUltimoOrario)) return;
    registratoIl = oggi;
    await runJob(ID_RIEPILOGO, 'Riepilogo degli avvisi', async () => {
      if (!dovuti.length) return 'nessun riepilogo dovuto oggi';
      const e = await inviaRiepiloghi(adesso);
      const voci = (n: number) => `${n} ${n === 1 ? 'voce' : 'voci'}`;
      const resto = [e.fallite ? `${voci(e.fallite)} non riuscite` : '', e.rimandate ? `${voci(e.rimandate)} da riprovare` : ''].filter(Boolean).join(', ');
      return `${e.tenant} tenant, ${e.email} email con ${voci(e.voci)}${resto ? `, ${resto}` : ''}`;
    });
  } catch (err) {
    console.error('[Processi] riepilogo degli avvisi:', err);
  } finally {
    riepilogoInCorso = false;
  }
}

function giro(): void {
  segnalaInvio();
  void riepiloghi();
}

export function pianificaEmailAvvisi(): void {
  const minuti = PARAMETRI.giroEmailMinuti;
  setInterval(giro, minuti * 60_000);
  console.log(`[Processi] email e riepiloghi degli avvisi ogni ${minuti} minuti`);
  // anche all'avvio: dopo un fermo, ciò che era in coda parte subito
  giro();
}
