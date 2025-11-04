// src/core/components/ui/skeleton/Skeleton.data.ts
import type { ComponentData } from "../../../../core/types";

export const skeletonData: ComponentData = {
  id: "skeleton",
  title: "Skeleton",
  description:
    "Un componente segnaposto animato per migliorare l'esperienza utente durante il caricamento dei dati, mimando la struttura del contenuto finale.",
  category: "feedback",
  importPath: 'import { Skeleton } from "../core/components/ui";',
  origin: "Custom Component",
  dependence: "N/A",
  props: [
    {
      name: "className",
      type: "string",
      description: "Classi Tailwind per definire dimensioni (h-*, w-*) e forma (rounded-*) dello skeleton.",
    },
  ],
  examples: [
    {
      title: "Uso Base",
      description: "Esempi di come creare diverse forme comuni per i segnaposto.",
      code: `<div className="space-y-3">
  {/* Per un avatar */}
  <Skeleton className="h-12 w-12 rounded-full" />
  
  {/* Per una riga di testo */}
  <Skeleton className="h-4 w-48 rounded" />

  {/* Per un blocco di contenuto */}
  <Skeleton className="h-24 w-full rounded-lg" />
</div>`,
    },
    {
      title: "Scheletro di una Card",
      description: "Combinando più skeleton, è possibile creare un segnaposto per un componente complesso come una card.",
      code: `<div className="rounded-lg border border-border-default p-4">
  <div className="flex items-center space-x-4">
    <Skeleton className="h-12 w-12 rounded-full" />
    <div className="space-y-2 flex-1">
      <Skeleton className="h-4 w-3/4 rounded" />
      <Skeleton className="h-4 w-1/2 rounded" />
    </div>
  </div>
</div>`,
    },
  ],
  notes:
    "L'efficacia dello Skeleton sta nella sua flessibilità. Combina più istanze con diverse classi per costruire un'anteprima fedele della tua UI in stato di caricamento.",
};
