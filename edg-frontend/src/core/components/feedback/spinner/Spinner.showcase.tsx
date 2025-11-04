// src/core/components/ui/spinner/Spinner.showcase.tsx
import React, { useState, useEffect } from "react";
import Spinner from "./Spinner";
import { TitledSurface } from "../../layout";
import { ThemedText } from "../../atomic";
import { Button } from "../../ui";

export const SpinnerShowcase: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setIsLoading(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  return (
    <TitledSurface title="Spinner Components" padding="lg">
      <div className="space-y-6">
        {/* Spinner Dimensioni */}
        <div>
          <ThemedText variant="label" className="text-sm font-medium mb-3 block">
            Dimensioni, spinner in pulsanti e inline
          </ThemedText>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <Spinner size="xs" />
              <ThemedText variant="secondary" className="text-xs mt-2 block">
                XS (16px)
              </ThemedText>
            </div>

            <div className="text-center">
              <Spinner size="sm" />
              <ThemedText variant="secondary" className="text-xs mt-2 block">
                SM (20px)
              </ThemedText>
            </div>

            <div className="text-center">
              <Spinner size="md" />
              <ThemedText variant="secondary" className="text-xs mt-2 block">
                MD (24px)
              </ThemedText>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <Button variant="info" disabled leftIcon={<Spinner size="sm" />}>
                Caricamento...
              </Button>

              <Button variant="secondary" disabled leftIcon={<Spinner size="sm" />}>
                Elaborazione...
              </Button>
            </div>
          </div>
        </div>

        {/* Spinner con Background */}
        <div>
          <ThemedText variant="label" className="text-sm font-medium mb-3 block">
            Spinner su Sfondi Diversi
          </ThemedText>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-bg-primary border border-border-default rounded-lg p-6 text-center">
              <Spinner size="md" />
              <ThemedText variant="secondary" className="mt-2 text-xs ms-3">
                Sfondo Primary
              </ThemedText>
            </div>

            <div className="bg-bg-secondary border border-border-default rounded-lg p-6 text-center">
              <Spinner size="md" />
              <ThemedText variant="secondary" className="mt-2 text-xs ms-3">
                Sfondo Secondary
              </ThemedText>
            </div>

            <div className="bg-bg-contrast rounded-lg p-6 text-center">
              <Spinner size="md" />
              <ThemedText variant="contrast" className="mt-2 text-xs ms-3">
                Sfondo Contrast
              </ThemedText>
            </div>
          </div>
        </div>
      </div>
    </TitledSurface>
  );
};

export default SpinnerShowcase;
