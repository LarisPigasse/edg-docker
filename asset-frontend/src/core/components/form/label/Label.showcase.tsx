// src/core/components/ui/label/Label.showcase.tsx
import React from "react";
import Label from "./Label";
import { TitledSurface } from "../../layout";

export const LabelShowcase: React.FC = () => {
  return (
    <div className="space-y-8">
      <TitledSurface title="Varianti di Stile" padding="lg">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col items-start space-y-3">
            <Label>Label Standard</Label>
            <Label required>Label Obbligatorio</Label>
            <Label optional>Label Opzionale</Label>
            <Label variant="error">Label con Errore</Label>
            <Label variant="disabled">Label Disabilitato</Label>
            <Label variant="info">Label Informativa</Label>
          </div>
        </div>
      </TitledSurface>

      <TitledSurface title="Dimensioni e Pesi" variant="secondary" padding="lg">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Dimensioni */}
          <div className="space-y-4">
            <Label weight="semibold" className="block mb-3">
              DIMENSIONI
            </Label>
            <div className="flex flex-col items-start space-y-3">
              <Label size="xs">Extra Small (xs)</Label>
              <Label size="sm">Small (sm)</Label>
              <Label size="md">Medium (md)</Label>
              <Label size="lg">Large (lg)</Label>
            </div>
          </div>
          {/* Pesi */}
          <div className="space-y-4">
            <Label weight="semibold" className="block mb-3">
              PESI DEL FONT
            </Label>
            <div className="flex flex-col items-start space-y-3">
              <Label weight="normal">Normale</Label>
              <Label weight="medium">Medio</Label>
              <Label weight="semibold">Semi-Bold</Label>
              <Label weight="bold">Bold</Label>
            </div>
          </div>
        </div>
      </TitledSurface>
    </div>
  );
};

export default LabelShowcase;
