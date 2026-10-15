// =============================================================================
// Coerenza delle impostazioni con i dati del cliente
// =============================================================================
// Joi controlla la forma; qui il significato: le date usate da `prima` e
// `fasce` esistono per il tipo di soggetto, una cadenza a uso trova il
// contatore nelle categorie. Stesse regole della libreria (valida.ts).
// =============================================================================
import { ValidationError } from '../core/utils/errors';
import type { Cadenza, UnitaUso } from '../regole';
import { DATE_SOGGETTO, type TipoSoggetto } from './valori';

export function controllaCadenza(cadenza: Cadenza, tipo: TipoSoggetto, contatoriCategorie: UnitaUso[][] | null): void {
  const date = DATE_SOGGETTO[tipo].map(d => d.chiave);
  const nomi = DATE_SOGGETTO[tipo].map(d => d.etichetta.toLowerCase()).join(', ') || 'nessuna';
  if (cadenza.prima && !date.includes(cadenza.prima.da))
    throw new ValidationError(`La prima scadenza può partire solo da una data del soggetto (${nomi})`);
  if (cadenza.fasce && !date.includes(cadenza.fasce.da))
    throw new ValidationError(`Le fasce d'età possono partire solo da una data del soggetto (${nomi})`);
  if (cadenza.fasce && !cadenza.tempo) throw new ValidationError("Le fasce d'età servono solo con una cadenza a tempo");
  if (cadenza.ancoraggio !== 'finestra' && cadenza.finestra) throw new ValidationError('La finestra vale solo contando dalla scadenza entro la finestra');
  if (cadenza.uso && contatoriCategorie) {
    const senza = contatoriCategorie.filter(c => !c.includes(cadenza.uso!.unita));
    if (!contatoriCategorie.length || senza.length)
      throw new ValidationError(`Una cadenza a ${cadenza.uso.unita} vuole categorie con il contatore ${cadenza.uso.unita}`);
  }
}
