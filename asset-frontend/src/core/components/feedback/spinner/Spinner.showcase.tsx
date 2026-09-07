// src/core/components/ui/spinner/Spinner.showcase.tsx
import React, { useState, useEffect } from "react";
import Spinner from "./Spinner";
import { TitledSurface } from "../../layout";

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
          <span className="text-sm font-medium mb-3 block text-text-secondary">
            Dimensioni, spinner in pulsanti e inline
          </span>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <Spinner size="xs" />
              <span className="text-xs mt-2 block text-text-secondary">
                XS (16px)
              </span>
            </div>

            <div className="text-center">
              <Spinner size="sm" />
              <span className="text-xs mt-2 block text-text-secondary">
                SM (20px)
              </span>
            </div>

            <div className="text-center">
              <Spinner size="md" />
              <span className="text-xs mt-2 block text-text-secondary">
                MD (24px)
              </span>
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
          <span className="text-sm font-medium mb-3 block text-text-secondary">
            Spinner su Sfondi Diversi
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-bg-primary border border-border-default rounded-lg p-6 text-center">
              <Spinner size="md" />
              <span className="mt-2 text-xs ms-3 text-text-secondary">
                Sfondo Primary
              </span>
            </div>

            <div className="bg-bg-secondary border border-border-default rounded-lg p-6 text-center">
              <Spinner size="md" />
              <span className="mt-2 text-xs ms-3 text-text-secondary">
                Sfondo Secondary
              </span>
            </div>

            <div className="bg-bg-contrast rounded-lg p-6 text-center">
              <Spinner size="md" />
              <span className="mt-2 text-xs ms-3 text-text-contrast">
                Sfondo Contrast
              </span>
            </div>
          </div>
        </div>
      </div>
    </TitledSurface>
  );
};

export default SpinnerShowcase;
