// src/core/components/ui/checkbox/Checkbox.showcase.tsx
import React, { useState } from "react";
import Checkbox from "./Checkbox";
import { TitledSurface } from "../../layout";


export const CheckboxShowcase: React.FC = () => {
  const [agree, setAgree] = useState<boolean>(false);
  const [newsletter, setNewsletter] = useState<boolean>(true);

  const handleAgreeChange = (state: boolean | "indeterminate") => {
    if (state === "indeterminate") return;
    setAgree(state);
  };

  const handleNewsletterChange = (state: boolean | "indeterminate") => {
    if (state === "indeterminate") return;
    setNewsletter(state);
  };

  return (
    <div className="space-y-8">
      <TitledSurface title="Stati e Interazioni" padding="lg">
        <div className="space-y-4">
          <Checkbox
            id="interactive-1"
            label="Accetto i termini di servizio"
            description="Questa è una descrizione opzionale."
            checked={agree}
            onCheckedChange={handleAgreeChange}
          />
          <Checkbox 
            id="interactive-2" 
            label="Iscrivimi alla newsletter" 
            checked={newsletter} 
            onCheckedChange={handleNewsletterChange} 
          />
        </div>
      </TitledSurface>

      <TitledSurface title="Stati Speciali" variant="secondary" padding="lg">
        <div className="space-y-4">
          <Checkbox id="indeterminate-showcase" label="Stato Indeterminato (visuale)" indeterminate />
          <Checkbox id="disabled-showcase" label="Checkbox Disabilitato" disabled />
          <Checkbox id="disabled-checked-showcase" label="Disabilitato e Selezionato" disabled checked />
        </div>
      </TitledSurface>

      <TitledSurface title="Dimensioni" padding="lg">
        <div className="space-y-4">
          <p className="text-text-secondary">Il componente supporta più dimensioni.</p>
          <Checkbox id="size-sm-showcase" label="Dimensione Small" size="sm" />
          <Checkbox id="size-md-showcase" label="Dimensione Medium (default)" size="md" />
          <Checkbox id="size-lg-showcase" label="Dimensione Large" size="lg" />
        </div>
      </TitledSurface>

      <TitledSurface title="Validazione e Stato di Errore" variant="info" padding="lg">
        <div className="space-y-4">
          <Checkbox
            id="error-showcase"
            label="Devi accettare la privacy policy"
            error="L'accettazione è obbligatoria per registrarsi."
            required
          />
        </div>
      </TitledSurface>
    </div>
  );
};

export default CheckboxShowcase;
