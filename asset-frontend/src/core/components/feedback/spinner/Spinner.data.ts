// src/core/components/ui/spinner/Spinner.data.ts
import type { ComponentData } from "../../../../core/types";

export const spinnerData: ComponentData = {
  id: "spinner",
  title: "Spinner",
  description:
    "Un indicatore di caricamento animato basato su CSS, utilizzato per fornire un feedback visivo durante le operazioni in background.",
  category: "feedback",
  importPath: 'import { Spinner } from "../core/components/ui";',
  origin: "Custom Component",
  dependence: "N/A",
  props: [
    { name: "size", type: '"xs" | "sm" | "md"', defaultValue: '"md"', description: "La dimensione dello spinner." },
    {
      name: "aria-label",
      type: "string",
      defaultValue: '"Caricamento in corso"',
      description: "Testo per screen reader per l'accessibilità.",
    },
  ],
  examples: [
    {
      title: "Dimensioni",
      description: "Lo spinner è disponibile in diverse dimensioni per adattarsi a vari contesti.",
      code: `<div className="flex items-center gap-4">
  <Spinner size="xs" />
  <Spinner size="sm" />
  <Spinner size="md" />
</div>`,
    },
    {
      title: "Integrazione con Button",
      description: "Lo spinner può essere facilmente inserito in un pulsante per indicare uno stato di caricamento.",
      code: `<Button variant="primary" disabled>
  <Spinner size="sm" />
  <span className="ml-2">Caricamento...</span>
</Button>`,
    },
  ],
  notes:
    "L'animazione è realizzata interamente in CSS per massime performance. Il colore è ereditato dal 'currentColor' o impostato su viola di default.",
};
