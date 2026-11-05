// =============================================================================
// Rifornimenti — regole pure (costo dei mezzi, tappa 2: blocco Uso)
// =============================================================================
// Una spesa d'uso di un mezzo senza scadenza: carburante, AdBlue, pedaggi o
// altro. Litri solo per carburante e AdBlue (servono al consumo medio).
// Non solo veicoli: anche macchine (trattori, gruppi elettrogeni) e
// attrezzature, con il consumo per ora quando il contatore è a ore.
// Limiti in impostazioni/limiti.ts (LIMITI_RIFORNIMENTI).
// =============================================================================
import { confronta, isGiorno, type Giorno } from '../../regole';
import { LIMITI_RIFORNIMENTI } from '../impostazioni/limiti';
import { VOCI_RIFORNIMENTO, type TipoSoggetto, type VoceRifornimento } from '../valori';

/** I tipi di soggetto che hanno rifornimenti (come il costo di possesso) */
export const TIPI_CON_RIFORNIMENTI: readonly TipoSoggetto[] = ['veicolo', 'macchina', 'attrezzatura'];

/** Le voci con i litri */
export const VOCI_CON_LITRI: readonly VoceRifornimento[] = ['carburante', 'adblue'];

export const NOMI_VOCI: Record<VoceRifornimento, string> = { carburante: 'Carburante', adblue: 'AdBlue', pedaggi: 'Pedaggi', altro: 'Altro' };

export interface DatiRifornimento {
  fattoIl: Giorno;
  voce: VoceRifornimento;
  litri?: number | null;
  importo: number;
  /** Km o ore letti: diventano una lettura del contatore */
  lettura?: number | null;
}

const alCentesimo = (n: number): boolean => Math.abs(Math.round(n * 100) - n * 100) < 1e-6;
const nei = (n: unknown, l: { min: number; max: number }): n is number => typeof n === 'number' && Number.isFinite(n) && n > l.min && n <= l.max;
const euro = (n: number): string => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} €`;

/** Gli errori di un rifornimento (vuoto = valido), con parole per l'utente */
export function erroriRifornimento(d: Partial<DatiRifornimento>, oggi: Giorno): string[] {
  const errori: string[] = [];
  const { importo, litri, lettura } = LIMITI_RIFORNIMENTI;
  if (!d.voce || !VOCI_RIFORNIMENTO.includes(d.voce)) errori.push('Scegli la voce: carburante, AdBlue, pedaggi o altro');
  if (!isGiorno(d.fattoIl)) errori.push('Scrivi la data');
  else if (confronta(d.fattoIl, oggi) > 0) errori.push('La data non può essere nel futuro');
  if (d.importo == null) errori.push("Scrivi l'importo");
  else if (!nei(d.importo, importo) || !alCentesimo(d.importo)) errori.push(`L'importo deve essere maggiore di 0 e al massimo ${euro(importo.max)}, al centesimo`);
  if (d.litri != null) {
    if (d.voce && !VOCI_CON_LITRI.includes(d.voce)) errori.push('I litri si scrivono solo per carburante e AdBlue');
    else if (!nei(d.litri, litri) || !alCentesimo(d.litri)) errori.push(`I litri devono essere più di 0 e al massimo ${litri.max.toLocaleString('it-IT')}, al centesimo`);
  }
  if (d.lettura != null && (!Number.isInteger(d.lettura) || d.lettura < lettura.min || d.lettura > lettura.max))
    errori.push(`Km o ore letti: un numero intero da ${lettura.min} a ${lettura.max.toLocaleString('it-IT')}`);
  return errori;
}

/** Prezzo al litro, con 3 decimali; null senza litri */
export const prezzoAlLitro = (importo: number, litri: number | null | undefined): number | null =>
  litri && litri > 0 ? Math.round((importo / litri) * 1000) / 1000 : null;
