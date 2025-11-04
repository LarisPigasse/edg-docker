// src/core/components/ui/card/Card.showcase.tsx
import React from "react";
import Card from "./Card";
import { TitledSurface } from "../../layout";
import { ThemedText } from "../../atomic";
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
          <ThemedText variant="label" className="font-medium" block>
            Le 4 varianti principali definiscono l'aspetto di base del card.
          </ThemedText>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card variant="default" padding="md">
              <ThemedText>Default</ThemedText>
              <ThemedText variant="secondary" className="text-sm mt-1">
                Bordo e ombra leggera
              </ThemedText>
            </Card>
            <Card variant="elevated" padding="md">
              <ThemedText>Elevated</ThemedText>
              <ThemedText variant="secondary" className="text-sm mt-1">
                Ombra più pronunciata
              </ThemedText>
            </Card>
            <Card variant="outlined" padding="md">
              <ThemedText>Outlined</ThemedText>
              <ThemedText variant="secondary" className="text-sm mt-1">
                Bordo marcato, no ombra
              </ThemedText>
            </Card>
            <Card variant="flat" padding="md">
              <ThemedText>Flat</ThemedText>
              <ThemedText variant="secondary" className="text-sm mt-1">
                Superficie secondaria, senza bordi/ombra
              </ThemedText>
            </Card>
          </div>
        </div>
      </TitledSurface>

      {/* Interattività */}
      <TitledSurface title="Interattività e Hover" variant="secondary" padding="lg">
        <div className="space-y-4">
          <ThemedText variant="label" className="font-medium" block>
            I card possono essere resi interattivi con effetti hover e focus.
          </ThemedText>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card clickable padding="lg" onClick={handleCardClick}>
              <div className="flex justify-between items-center">
                <ThemedText>Card Cliccabile</ThemedText>
                <ArrowRight className="w-5 h-5 text-text-secondary" />
              </div>
            </Card>
            <Card hover padding="lg">
              <ThemedText>Card con Hover</ThemedText>
              <ThemedText variant="secondary" className="text-sm mt-1">
                Questo card ha solo l'effetto hover.
              </ThemedText>
            </Card>
          </div>
        </div>
      </TitledSurface>

      {/* Esempio Composto */}
      <TitledSurface title="Esempio Realistico" variant="modal" padding="lg">
        <Card variant="elevated" padding="lg" clickable>
          <div className="space-y-4">
            <ThemedText as="h3" variant="primary" className="font-bold text-lg">
              Piano Pro
            </ThemedText>
            <ThemedText variant="secondary">
              Accesso a tutte le funzionalità avanzate, supporto prioritario e reportistica dettagliata.
            </ThemedText>
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
