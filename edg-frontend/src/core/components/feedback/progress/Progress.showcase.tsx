// src/core/components/ui/progress/Progress.showcase.tsx
import React, { useState, useEffect } from "react";
import Progress from "./Progress";
import { TitledSurface } from "../../layout";
import { ThemedText } from "../../atomic";
import { Button } from "../../ui/button/Button";

export const ProgressShowcase: React.FC = () => {
  const [progressValue, setProgressValue] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgressValue((prev) => (prev >= 95 ? 10 : prev + 5));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-8">
      <TitledSurface title="Avanzamento Determinato" padding="lg">
        <ThemedText variant="secondary" className="mb-6">
          La barra di avanzamento riflette un valore numerico. L'esempio sotto si aggiorna ogni secondo.
        </ThemedText>
        <div className="space-y-6">
          <Progress value={progressValue} showLabel />
          <Progress value={progressValue} variant="success" size="lg" showLabel />
          <Progress value={progressValue} variant="warning" size="sm" showLabel label={`Caricamento: ${progressValue}%`} />
        </div>
      </TitledSurface>

      <TitledSurface title="Modalità Indeterminata" variant="secondary" padding="lg">
        <ThemedText variant="secondary" className="mb-6">
          Ideale per caricamenti di durata sconosciuta. L'animazione 'shimmer' indica che un'operazione è in corso.
        </ThemedText>
        <div className="space-y-6">
          <Progress indeterminate />
          <Progress indeterminate variant="info" showLabel label="Sincronizzazione dati..." />
          <Progress indeterminate variant="danger" size="lg" />
        </div>
      </TitledSurface>
    </div>
  );
};

export default ProgressShowcase;
