// src/core/components/ui/multi-select/MultiSelect.data.ts
import type { ComponentData } from "../../../types/ComponentData";

export const multiSelectData: ComponentData = {
  id: "multiSelect",
  title: "Multi Select",
  description:
    "Un controllo per selezionare opzioni multiple da un elenco, visualizzando le scelte come 'tag' all'interno del campo.",
  category: "form",
  importPath: 'import { MultiSelect, type MultiSelectOption } from "../core/components/ui";',
  origin: "Custom Component",
  dependence: "@radix-ui/react-popover, Checkbox, Badge",
  props: [
    { name: "label", type: "string", required: true, description: "L'etichetta flottante per il campo." },
    {
      name: "options",
      type: "MultiSelectOption[]",
      required: true,
      description: "Array di opzioni disponibili per la selezione.",
    },
    { name: "value", type: "string[]", required: true, description: "Array dei valori delle opzioni attualmente selezionate." },
    {
      name: "onChange",
      type: "(selected: string[]) => void",
      required: true,
      description: "Callback eseguita quando la selezione cambia.",
    },
    { name: "placeholder", type: "string", description: "Testo segnaposto quando nessuna opzione è selezionata." },
    { name: "error", type: "string", description: "Visualizza il campo in stato di errore con il messaggio fornito." },
  ],
  examples: [
    {
      title: "Uso Base",
      description: "Un MultiSelect per selezionare più tag o categorie.",
      code: `const [selected, setSelected] = useState(['react', 'typescript']);
const techOptions = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue.js' },
  { value: 'solid', label: 'Solid.js', disabled: true },
  { value: 'typescript', label: 'TypeScript' }
];

<MultiSelect 
  label="Tecnologie"
  options={techOptions}
  value={selected}
  onChange={setSelected}
  placeholder="Seleziona le tue tecnologie preferite"
/>`,
    },
  ],
  notes:
    "Questo componente non è basato su Radix Select, ma è una composizione custom di Radix Popover e dei nostri componenti Checkbox e Badge per ottenere la massima flessibilità.",
};
