// src/core/components/ui/select/Select.data.ts
import type { ComponentData } from "../../../types/ComponentData";

export const selectData: ComponentData = {
  id: "select",
  title: "Select",
  description:
    "Un controllo che permette all'utente di selezionare un'opzione da un elenco a tendina, con supporto per floating label e validazione.",
  category: "form",
  importPath: 'import { Select, type SelectOption } from "../core/components/ui";',
  origin: "Radix UI + Custom Component",
  dependence: "@radix-ui/react-select",
  props: [
    {
      name: "options",
      type: "SelectOption[]",
      required: true,
      description: "Un array di oggetti che definisce le opzioni disponibili.",
    },
    { name: "label", type: "string", required: true, description: "L'etichetta flottante per il campo." },
    { name: "value", type: "string", description: "Il valore dell'opzione attualmente selezionata (stato controllato)." },
    {
      name: "defaultValue",
      type: "string",
      description: "Il valore dell'opzione selezionata di default (stato non controllato).",
    },
    { name: "onValueChange", type: "(value: string) => void", description: "Callback eseguita quando la selezione cambia." },
    { name: "placeholder", type: "string", description: "Testo segnaposto visualizzato quando nessuna opzione è selezionata." },
    {
      name: "error",
      type: "string",
      description: "Se presente, visualizza il campo in stato di errore con il messaggio fornito.",
    },
    { name: "disabled", type: "boolean", defaultValue: "false", description: "Disabilita il campo." },
  ],
  examples: [
    {
      title: "Select Base",
      description: "Un esempio di select con placeholder e opzioni.",
      code: `const options = [
  { value: 'it', label: 'Italia' },
  { value: 'fr', label: 'Francia' },
  { value: 'de', label: 'Germania', disabled: true }
];

<Select label="Paese" options={options} placeholder="Seleziona una nazione" />`,
    },
    {
      title: "Stato di Errore e Helper Text",
      description: "Come visualizzare un errore di validazione e un testo di aiuto.",
      code: `<div className="space-y-6">
  <Select 
    label="Categoria"
    options={[{ value: 'tech', label: 'Tecnologia' }]}
    error="La selezione è obbligatoria."
    required
  />
  <Select 
    label="Valuta"
    options={[{ value: 'eur', label: 'Euro' }]}
    helperText="La valuta verrà usata per tutte le transazioni."
  />
</div>`,
    },
  ],
  notes:
    "Il componente è basato su Radix UI Select per garantire la massima accessibilità. La floating label si attiva correttamente anche in presenza di un placeholder.",
};
