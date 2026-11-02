// =============================================================================
// Avviso degli aggiornamenti della libreria — regole pure (ADR074, B10b)
// =============================================================================
// Un solo avviso per cliente, senza scadenza:
//   "Aggiornamenti della libreria: 3 voci da decidere (Revisione, Assicurazione
//    RCA e Autovetture)"
// Prima dei due punti il titolo della campanella, dopo lo stato (statoDelTesto):
// i nomi vanno nello stato, ripuliti dal separatore. Il riferimento e'
// l'impronta delle voci in attesa (entita', chiave, versione, tipo): stessa
// impronta = stesso avviso, non si ripete.
// =============================================================================
import { createHash } from 'crypto';

export const EVENTO_LIBRERIA = 'libreria';
export const TIPO_LIBRERIA = 'libreria';
export const TITOLO_LIBRERIA = 'Aggiornamenti della libreria';
/** Quanti nomi al massimo nel testo, poi "e altre N" */
export const NOMI_NEL_TESTO = 4;

export interface VoceInAttesa {
  entita: string;
  chiave: string;
  versione: number;
  tipo: string;
}

/** "A", "A e B", "A, B e C" */
const elenco = (nomi: string[]): string => (nomi.length < 2 ? nomi.join('') : `${nomi.slice(0, -1).join(', ')} e ${nomi[nomi.length - 1]}`);

export function testoAvvisoLibreria(nomi: string[]): string {
  const puliti = nomi.map(n => n.replace(/:\s/g, ' – ').trim()).filter(Boolean);
  const n = puliti.length;
  const visti = puliti.slice(0, NOMI_NEL_TESTO);
  const altri = n - visti.length;
  const quali = altri > 0 ? `${visti.join(', ')} e ${altri === 1 ? 'un’altra' : `altre ${altri}`}` : elenco(visti);
  return `${TITOLO_LIBRERIA}: ${n === 1 ? '1 voce' : `${n} voci`} da decidere (${quali})`.slice(0, 512);
}

/** L'impronta delle voci in attesa, indipendente dall'ordine (riferimento dell'avviso, 64 caratteri al massimo) */
export function improntaAttesa(voci: VoceInAttesa[]): string {
  const righe = voci.map(v => `${v.entita}:${v.chiave}:${v.versione}:${v.tipo}`).sort();
  return `lib:${createHash('sha256').update(righe.join('\n')).digest('hex').slice(0, 32)}`;
}
