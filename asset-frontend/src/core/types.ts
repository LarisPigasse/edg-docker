// src/core/types.ts

/** Definisce le categorie a cui un componente può appartenere. */
export type ComponentCategory = "ui" | "form" | "navigation" | "feedback" | "data" | "layout";

/** * Descrive la struttura di una singola prop di un componente,
 * usata per generare la documentazione nell'Explorer.
 */
export interface ComponentProp {
  name: string;
  type: string;
  required?: boolean;
  defaultValue?: string;
  description: string;
}

/** * Descrive un singolo esempio di codice per un componente,
 * completo di titolo e descrizione.
 */
export interface ComponentExample {
  title: string;
  description: string;
  code: string;
}

/** * Il modello completo che definisce la struttura dati per ogni componente
 * documentato nel Component Explorer.
 */
export interface ComponentData {
  id: string;
  title: string;
  description: string;
  category: ComponentCategory;
  importPath: string;
  origin: string;
  dependence: string;
  props: ComponentProp[];
  examples: ComponentExample[];
  notes?: string; // Note aggiuntive o best practices
}
