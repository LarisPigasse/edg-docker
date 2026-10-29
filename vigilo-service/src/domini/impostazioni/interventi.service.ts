// =============================================================================
// Regole degli interventi del tenant (passo 8, B10a)
// =============================================================================
// Costo orario predefinito (per le persone senza costo e le righe di
// manodopera senza persona) e giorni proposti per riparare un guasto. Il costo
// lo vede e lo cambia solo chi ha vigilo.costi; i giorni chi ha vigilo.config.
// I limiti stanno in limiti.ts (uno solo per servizio e interfaccia).
// =============================================================================
import type { Contesto } from '../../core/contesto';
import { traccia } from '../../core/services/traccia';
import { ForbiddenError, ValidationError } from '../../core/utils/errors';
import { ImpostazioniTenant } from '../modelli';
import { INTERVENTI_INIZIALI, LIMITI_INTERVENTI, erroriInterventi, interventiEffettivi, type RegoleInterventi } from './limiti';

export interface SchedaInterventi {
  giorniRiparazione: number;
  /** Solo a chi ha vigilo.costi */
  costoOrario?: number | null;
  predefinite: { giorniRiparazione: number };
  limiti: typeof LIMITI_INTERVENTI;
  /** Che cosa l'utente può cambiare */
  modificabili: { giorniRiparazione: boolean; costoOrario: boolean };
}

const scheda = (ctx: Contesto, r: RegoleInterventi): SchedaInterventi => ({
  giorniRiparazione: r.giorniRiparazione,
  ...(ctx.capacita.costi ? { costoOrario: r.costoOrario } : {}),
  predefinite: { giorniRiparazione: INTERVENTI_INIZIALI.giorniRiparazione },
  limiti: LIMITI_INTERVENTI,
  modificabili: { giorniRiparazione: ctx.capacita.config, costoOrario: ctx.capacita.config && ctx.capacita.costi },
});

export async function leggiInterventi(ctx: Contesto): Promise<SchedaInterventi> {
  const imp = await ImpostazioniTenant.findByPk(ctx.idTenant, { attributes: ['idTenant', 'interventi'] });
  return scheda(ctx, interventiEffettivi(imp?.interventi));
}

/** Modifica parziale: il costo orario chiede anche vigilo.costi */
export async function cambiaInterventi(ctx: Contesto, modifica: Partial<RegoleInterventi>): Promise<SchedaInterventi> {
  if ('costoOrario' in modifica && !ctx.capacita.costi) throw new ForbiddenError('Per il costo orario serve il permesso vigilo.costi');
  const errori = erroriInterventi(modifica);
  if (errori.length) throw new ValidationError(errori.join('. '));
  const imp = await ImpostazioniTenant.findByPk(ctx.idTenant);
  if (!imp?.avviatoIl) throw new ValidationError('Vigilo non è ancora avviato per la tua azienda');
  const prima = interventiEffettivi(imp.interventi);
  const dopo = interventiEffettivi({ ...prima, ...modifica });
  if (prima.costoOrario !== dopo.costoOrario || prima.giorniRiparazione !== dopo.giorniRiparazione) {
    await imp.update({ interventi: dopo });
    traccia(ctx, 'vigilo.impostazioni.interventi', 'Regole degli interventi aggiornate', prima, dopo);
  }
  return scheda(ctx, dopo);
}
