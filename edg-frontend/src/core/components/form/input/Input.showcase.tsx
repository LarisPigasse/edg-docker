// src/core/components/ui/input/Input.showcase.tsx
import React, { useState } from "react";
import Input from "./Input";
import { TitledSurface } from "../../layout";
import { ThemedText } from "../../atomic";
import { Button } from "../../ui";

export const InputShowcase: React.FC = () => {
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | undefined>();

  const handleValidate = () => {
    if (name.length < 3) {
      setNameError("Il nome deve contenere almeno 3 caratteri.");
    } else {
      setNameError(undefined);
      alert("Il campo è valido!");
    }
  };

  return (
    <div className="space-y-8">
      <TitledSurface title="Stati e Interazione" padding="lg">
        <ThemedText variant="secondary" className="mb-6">
          La floating label e l'underline cambiano aspetto in base allo stato dell'input.
        </ThemedText>
        <div className="grid md:grid-cols-2 gap-8">
          <Input label="Campo vuoto" />
          <Input label="Campo con valore" defaultValue="Testo inserito" />
          <Input label="Campo con helper text" helperText="Questo è un testo di aiuto." />
          <Input label="Campo disabilitato" disabled defaultValue="Non editabile" />
        </div>
      </TitledSurface>
      <TitledSurface title="Validazione e Errori" variant="secondary" padding="lg">
        <ThemedText variant="secondary" className="mb-6">
          Un esempio interattivo per mostrare come l'input gestisce gli errori di validazione.
        </ThemedText>
        <div className="max-w-sm space-y-4">
          <Input label="Il tuo Nome" value={name} onChange={(e) => setName(e.target.value)} error={nameError} required />
          <Button onClick={handleValidate}>Valida Nome</Button>
        </div>
      </TitledSurface>

      <TitledSurface title="Tipi di Input" padding="lg">
        <div className="grid md:grid-cols-2 gap-8">
          <Input label="Email" type="email" />
          <Input label="Password" type="password" />
          <Input label="Numero di Telefono" type="tel" />
          <Input label="Quantità" type="number" />
        </div>
      </TitledSurface>
    </div>
  ); // <-- Corretto: il punto e virgola va dopo la parentesi di chiusura.
};

export default InputShowcase;
