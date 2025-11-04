// src/core/components/ui/tooltip/Tooltip.data.ts
import type { ComponentData } from "../../../../core/types";

export const tooltipData: ComponentData = {
  id: "tooltip",
  title: "Tooltip",
  description:
    "Una piccola finestra a comparsa che mostra informazioni contestuali quando l'utente passa il mouse o si focalizza su un elemento.",
  category: "feedback",
  importPath: 'import { Tooltip } from "../core/components/ui";',
  origin: "Radix UI + Custom Component",
  dependence: "@radix-ui/react-tooltip",
  props: [
    { name: "content", type: "string", required: true, description: "Il testo da visualizzare all'interno del tooltip." },
    {
      name: "children",
      type: "React.ReactNode",
      required: true,
      description: "L'elemento che funge da trigger per il tooltip.",
    },
    {
      name: "side",
      type: '"top" | "right" | "bottom" | "left"',
      defaultValue: '"top"',
      description: "Il lato preferito su cui visualizzare il tooltip.",
    },
    {
      name: "align",
      type: '"start" | "center" | "end"',
      defaultValue: '"center"',
      description: "L'allineamento del tooltip rispetto al trigger.",
    },
    {
      name: "delayDuration",
      type: "number",
      defaultValue: "300",
      description: "Il ritardo in millisecondi prima che il tooltip appaia.",
    },
    {
      name: "size",
      type: '"sm" | "md" | "lg"',
      defaultValue: '"md"',
      description: "La dimensione del tooltip (padding e max-width).",
    },
    { name: "disabled", type: "boolean", defaultValue: "false", description: "Disabilita la visualizzazione del tooltip." },
  ],
  examples: [
    {
      title: "Tooltip Base",
      description: "Un esempio di tooltip su un pulsante.",
      code: `<Tooltip content="Salva le modifiche al documento.">
  <Button>Salva</Button>
</Tooltip>`,
    },
    {
      title: "Posizionamento",
      description: "Il tooltip può essere posizionato su tutti e quattro i lati dell'elemento trigger.",
      code: `<div className="flex gap-2">
  <Tooltip content="Tooltip in alto" side="top"><Button>Top</Button></Tooltip>
  <Tooltip content="Tooltip a destra" side="right"><Button>Right</Button></Tooltip>
  <Tooltip content="Tooltip in basso" side="bottom"><Button>Bottom</Button></Tooltip>
  <Tooltip content="Tooltip a sinistra" side="left"><Button>Left</Button></Tooltip>
</div>`,
    },
    {
      title: "Su un'Icona",
      description: "Un caso d'uso molto comune è quello di fornire contesto per pulsanti contenenti solo icone.",
      code: `import { Settings } from "lucide-react";

<Tooltip content="Impostazioni Account">
  <Button variant="ghost" size="sm" className="px-2">
    <Settings className="h-5 w-5" />
  </Button>
</Tooltip>`,
    },
  ],
  notes:
    "Basato su Radix UI, il tooltip gestisce automaticamente il posizionamento per evitare che esca dallo schermo (collision detection). È completamente accessibile e supporta la navigazione da tastiera.",
};
