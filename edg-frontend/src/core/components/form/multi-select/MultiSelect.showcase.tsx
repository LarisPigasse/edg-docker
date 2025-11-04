// src/core/components/ui/multi-select/MultiSelect.showcase.tsx
import React, { useState } from "react";
import MultiSelect from "./MultiSelect";
import type { MultiSelectOption } from "./MultiSelect";
import { TitledSurface } from "../../layout";
import { ThemedText } from "../../atomic";

const techOptions: MultiSelectOption[] = [
  { value: "react", label: "React" },
  { value: "vue", label: "Vue.js" },
  { value: "angular", label: "Angular" },
  { value: "svelte", label: "Svelte" },
  { value: "solid", label: "Solid.js", disabled: true },
  { value: "typescript", label: "TypeScript" },
  { value: "tailwind", label: "Tailwind CSS" },
];

export const MultiSelectShowcase: React.FC = () => {
  const [selectedTechs, setSelectedTechs] = useState<string[]>(["react", "tailwind"]);

  return (
    <div className="space-y-8">
      <TitledSurface title="Multi Select Interattivo" padding="lg">
        <div className="max-w-md mx-auto space-y-8">
          <MultiSelect
            label="Tecnologie Frontend"
            options={techOptions}
            value={selectedTechs}
            onChange={setSelectedTechs}
            placeholder="Seleziona le tue tecnologie preferite"
            helperText="Puoi selezionare più di un'opzione."
          />
          <MultiSelect
            label="Seleziona Argomenti (Errore)"
            options={techOptions}
            value={[]}
            onChange={() => {}}
            error="Almeno un argomento deve essere selezionato."
            required
          />
          <MultiSelect label="Campo Disabilitato" options={techOptions} value={["react"]} onChange={() => {}} disabled />
        </div>
      </TitledSurface>

      <TitledSurface title="Stato Attuale" variant="secondary" padding="lg">
        <ThemedText variant="label" weight="semibold">
          Valori selezionati:
        </ThemedText>
        <pre className="mt-2 text-sm bg-bg-primary p-2 rounded">{JSON.stringify(selectedTechs, null, 2)}</pre>
      </TitledSurface>
    </div>
  );
};

export default MultiSelectShowcase;
