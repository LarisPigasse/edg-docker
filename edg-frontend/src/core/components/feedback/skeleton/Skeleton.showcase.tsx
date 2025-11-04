// src/core/components/ui/skeleton/Skeleton.showcase.tsx
import React from "react";
import Skeleton from "./Skeleton";
import { TitledSurface } from "../../layout";
import { ThemedText } from "../../atomic";

export const SkeletonShowcase: React.FC = () => {
  return (
    <div className="space-y-8">
      <TitledSurface title="Forme di Base" padding="lg">
        <ThemedText variant="secondary" className="mb-6">
          La forma e la dimensione dello Skeleton sono definite tramite `className`.
        </ThemedText>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-4 w-1/2 rounded" />
            </div>
          </div>
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-5/6 rounded" />
        </div>
      </TitledSurface>

      <TitledSurface title="Esempio: Scheletro di una Card" variant="secondary" padding="lg">
        <ThemedText variant="secondary" className="mb-6">
          Combinando diversi Skeleton si può creare un'anteprima di caricamento per componenti complessi.
        </ThemedText>
        <div className="max-w-sm rounded-xl border border-border-default p-4 bg-white">
          <Skeleton className="h-32 w-full rounded-lg mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-5 w-2/3 rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-4/5 rounded" />
          </div>
        </div>
      </TitledSurface>
    </div>
  );
};

export default SkeletonShowcase;
