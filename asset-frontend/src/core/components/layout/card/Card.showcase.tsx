// src/core/components/ui/card/Card.showcase.tsx
import React from "react";
import Card from "./Card";
import { TitledSurface } from "../../layout";

import { Button } from "../../ui";
import { ArrowRight } from "lucide-react";

export const CardShowcase: React.FC = () => {
  const handleCardClick = () => {
    alert("Card cliccata!");
  };

  return (
    <div className="space-y-8">
      {/* Varianti */}
      <TitledSurface title="Varianti Card" variant="primary" padding="lg">
        <div className="space-y-4">
          <p className="font-medium block text-text-secondary">
            Le 4 varianti principali definiscono l'aspetto di base del card.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card variant="default" padding="md">
              <span className="text-text-primary">Default</span>
              <p className="text-sm mt-1 text-text-secondary">
                Bordo e ombra leggera
              </p>
            </Card>
            <Card variant="elevated" padding="md">
              <span className="text-text-primary">Elevated</span>
              <p className="text-sm mt-1 text-text-secondary">
                Ombra più pronunciata
              </p>
            </Card>
            <Card variant="outlined" padding="md">
              <span className="text-text-primary">Outlined</span>
              <p className="text-sm mt-1 text-text-secondary">
                Bordo marcato, no ombra
              </p>
            </Card>
            <Card variant="flat" padding="md">
              <span className="text-text-primary">Flat</span>
              <p className="text-sm mt-1 text-text-secondary">
                Superficie secondaria, senza bordi/ombra
              </p>
            </Card>
          </div>
        </div>
      </TitledSurface>

      {/* Interattività */}
      <TitledSurface title="Interattività e Hover" variant="secondary" padding="lg">
        <div className="space-y-4">
          <p className="font-medium block text-text-secondary">
            I card possono essere resi interattivi con effetti hover e focus.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card clickable padding="lg" onClick={handleCardClick}>
              <div className="flex justify-between items-center">
                <span className="text-text-primary">Card Cliccabile</span>
                <ArrowRight className="w-5 h-5 text-text-secondary" />
              </div>
            </Card>
            <Card hover padding="lg">
              <span className="text-text-primary">Card con Hover</span>
              <p className="text-sm mt-1 text-text-secondary">
                Questo card ha solo l'effetto hover.
              </p>
            </Card>
          </div>
        </div>
      </TitledSurface>

      {/* Esempio Composto */}
      <TitledSurface title="Esempio Realistico" variant="modal" padding="lg">
        <Card variant="elevated" padding="lg" clickable>
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-text-primary">
              Piano Pro
            </h3>
            <p className="text-text-secondary">
              Accesso a tutte le funzionalità avanzate, supporto prioritario e reportistica dettagliata.
            </p>
            <div className="flex justify-between items-baseline pt-2">
              <div>
                <span className="text-3xl font-bold text-text-primary">29€</span>
                <span className="text-text-secondary">/mese</span>
              </div>
              <Button variant="primary" size="sm">
                Scegli Piano
              </Button>
            </div>
          </div>
        </Card>
      </TitledSurface>
    </div>
  );
};

export default CardShowcase;
