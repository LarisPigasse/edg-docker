// src/core/components/ui/select/Select.showcase.tsx
import React, { useState } from "react";
import Select from "./Select";
import type { SelectOption } from "./Select";
import { TitledSurface } from "../../layout";
import { ThemedText } from "../../atomic";
import { Button } from "../../ui";

const countryOptions: SelectOption[] = [
  { value: "it", label: "Italia" },
  { value: "fr", label: "Francia" },
  { value: "de", label: "Germania" },
  { value: "es", label: "Spagna", disabled: true },
];

export const SelectShowcase: React.FC = () => {
  const [country, setCountry] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState<string | undefined>();

  const handleValidate = () => {
    if (!category) {
      setError("La categoria è un campo obbligatorio.");
    } else {
      setError(undefined);
      alert("Selezione valida!");
    }
  };

  return (
    <div className="space-y-8">
      <TitledSurface title="Interazione e Stati" padding="lg">
        <div className="grid md:grid-cols-2 gap-8">
          <Select
            label="Paese di Spedizione"
            options={countryOptions}
            value={country}
            onValueChange={setCountry}
            placeholder="Seleziona una nazione"
            helperText="Le opzioni di spedizione variano per paese."
          />
          <Select
            label="Select Disabilitato"
            options={[{ value: "disabled", label: "Opzione" }]}
            disabled
            defaultValue="disabled"
          />
        </div>
      </TitledSurface>

      <TitledSurface title="Validazione e Errori" variant="secondary" padding="lg">
        <div className="max-w-sm space-y-4">
          <ThemedText variant="secondary" className="mb-2">
            Un esempio interattivo per mostrare come il select gestisce gli errori di validazione.
          </ThemedText>
          <Select
            label="Categoria Prodotto"
            options={[
              { value: "tech", label: "Tecnologia" },
              { value: "books", label: "Libri" },
            ]}
            value={category}
            onValueChange={setCategory}
            error={error}
            required
          />
          <Button onClick={handleValidate}>Valida Categoria</Button>
        </div>
      </TitledSurface>
    </div>
  );
};

export default SelectShowcase;
