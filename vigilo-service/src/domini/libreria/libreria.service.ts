// =============================================================================
// Libreria di EDG — letture fuori dalla procedura di avvio
// =============================================================================
// I settori della libreria servono a EDG Pro: all'attivazione di Vigilo per un
// cliente si scelgono i settori suggeriti (ADR087). La rotta sta fra quelle
// della piattaforma (/piattaforma/libreria/modelli): non è uso del modulo.
// =============================================================================
import { ModelloSettore } from './modelloSettore.model';

export interface SettoreLibreria {
  chiave: string;
  nome: string;
  descrizione: string | null;
  sempreProposto: boolean;
}

/** I settori della libreria, nell'ordine della libreria */
export async function settoriDellaLibreria(): Promise<SettoreLibreria[]> {
  const modelli = await ModelloSettore.findAll({ order: [['ordine', 'ASC']] });
  return modelli.map(m => ({
    chiave: m.chiave,
    nome: m.nome,
    descrizione: m.descrizione ?? null,
    sempreProposto: m.sempreProposto,
  }));
}
