// src/core/components/ui/info-card/InfoCard.showcase.tsx
import React from "react";
import InfoCard from "./InfoCard";
import type { ComponentCategory } from "./InfoCard";
import { TitledSurface } from "../../layout";
import { ThemedText } from "../../atomic";

export const InfoCardShowcase: React.FC = () => {
  const categories: ComponentCategory[] = ["ui", "form", "navigation", "feedback", "data", "layout"];

  const handleClick = (title: string) => {
    alert(`Hai cliccato sulla card: ${title}`);
  };

  return (
    <div className="space-y-8">
      <TitledSurface title="Varianti per Categoria" padding="lg">
        <div className="mb-4">
          <ThemedText variant="secondary">
            La caratteristica principale della InfoCard è la sua capacità di cambiare colore in base alla categoria del
            componente che rappresenta.
          </ThemedText>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <InfoCard
              key={cat}
              title={cat.charAt(0).toUpperCase() + cat.slice(1)}
              description={`Un esempio di componente della categoria '${cat}'.`}
              category={cat}
              onClick={() => handleClick(cat)}
            />
          ))}
        </div>
      </TitledSurface>

      <TitledSurface title="Stati e Contenuti" variant="secondary" padding="lg">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <InfoCard
            title="Card con Descrizione"
            description="Questa è una descrizione più lunga per mostrare come il testo viene gestito e troncato se necessario per mantenere il layout pulito."
            category="ui"
            onClick={() => handleClick("Card con Descrizione")}
          />
          <InfoCard
            title="Card Disabilitata"
            description="Questa card è disabilitata e non è possibile interagire con essa."
            category="form"
            onClick={() => {}}
            disabled
          />
        </div>
      </TitledSurface>
    </div>
  );
};

export default InfoCardShowcase;
