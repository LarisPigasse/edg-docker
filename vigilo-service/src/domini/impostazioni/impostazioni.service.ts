// =============================================================================
// Le regole degli avvisi del tenant (04-avvisi 4.5, ADR093, B8d-2)
// =============================================================================
// Orario del riepilogo, giorni lavorativi, richiamo delle scadute e silenzio
// notturno. I limiti stanno in limiti.ts (uno solo per servizio e interfaccia);
// qui si leggono, si cambiano e si tracciano. invio, riepilogo e generazione
// rileggono le regole a ogni giro: una modifica vale dal giro successivo.
// =============================================================================
import type { Contesto } from '../../core/contesto';
import { traccia } from '../../core/services/traccia';
import { ValidationError } from '../../core/utils/errors';
import { ImpostazioniTenant } from '../modelli';
import { AVVISI_INIZIALI, LIMITI_AVVISI, avvisiEffettivi, erroriAvvisi, stesseRegole, uniscilRegole, type RegoleAvvisi } from './limiti';

export interface SchedaRegoleAvvisi {
  /** Le regole in vigore */
  regole: RegoleAvvisi;
  predefinite: RegoleAvvisi;
  limiti: typeof LIMITI_AVVISI;
  /** Diverse dalle predefinite */
  modificate: boolean;
  /** L'utente può cambiarle (vigilo.config) */
  modificabili: boolean;
}

const scheda = (ctx: Contesto, regole: RegoleAvvisi): SchedaRegoleAvvisi => ({
  regole,
  predefinite: AVVISI_INIZIALI,
  limiti: LIMITI_AVVISI,
  modificate: !stesseRegole(regole, AVVISI_INIZIALI),
  modificabili: ctx.capacita.config,
});

const impostazioniDi = async (ctx: Contesto) => {
  const imp = await ImpostazioniTenant.findByPk(ctx.idTenant);
  if (!imp?.avviatoIl) throw new ValidationError('Vigilo non è ancora avviato per la tua azienda');
  return imp;
};

export async function leggiRegole(ctx: Contesto): Promise<SchedaRegoleAvvisi> {
  const imp = await ImpostazioniTenant.findByPk(ctx.idTenant, { attributes: ['idTenant', 'avvisi'] });
  return scheda(ctx, avvisiEffettivi(imp?.avvisi));
}

async function salva(ctx: Contesto, calcola: (salvate: Partial<RegoleAvvisi>) => RegoleAvvisi, azione: string, messaggio: string) {
  const imp = await impostazioniDi(ctx);
  const prima = avvisiEffettivi(imp.avvisi);
  const dopo = calcola(imp.avvisi);
  if (!stesseRegole(prima, dopo)) {
    await imp.update({ avvisi: dopo });
    traccia(ctx, azione, messaggio, prima, dopo);
  }
  return scheda(ctx, dopo);
}

/** Modifica parziale: solo i campi che arrivano, dentro i limiti */
export async function cambiaRegole(ctx: Contesto, modifica: Partial<RegoleAvvisi>): Promise<SchedaRegoleAvvisi> {
  const errori = erroriAvvisi(modifica);
  if (errori.length) throw new ValidationError(errori.join('. '));
  return salva(ctx, salvate => uniscilRegole(salvate, modifica), 'vigilo.impostazioni.avvisi', 'Regole degli avvisi aggiornate');
}

export async function ripristinaRegole(ctx: Contesto): Promise<SchedaRegoleAvvisi> {
  return salva(ctx, () => ({ ...AVVISI_INIZIALI, silenzio: { ...AVVISI_INIZIALI.silenzio } }), 'vigilo.impostazioni.avvisi-ripristinate', 'Regole degli avvisi riportate ai predefiniti');
}
