// src/core/components/ui/table-link/TableLink.data.ts
import type { ComponentData } from "../../../../core/types";

export const tableLinkData: ComponentData = {
  id: "tableLink",
  title: "Table Link",
  description:
    "Un componente specializzato per elementi cliccabili all'interno delle celle di una tabella, con varianti semantiche e supporto per icone.",
  category: "data",
  importPath: 'import { TableLink } from "../core/components/ui";',
  origin: "Custom Component",
  dependence: "N/A",
  props: [
    { name: "onClick", type: "() => void", required: true, description: "La funzione callback eseguita al click." },
    { name: "children", type: "React.ReactNode", required: true, description: "Il testo o l'elemento da visualizzare." },
    {
      name: "variant",
      type: '"primary" | "secondary" | "danger" | "success" | "info" | "warning"',
      defaultValue: '"primary"',
      description: "La variante semantica che ne definisce il colore.",
    },
    { name: "icon", type: "React.ReactNode", description: "Un'icona opzionale da visualizzare prima del testo." },
    { name: "disabled", type: "boolean", defaultValue: "false", description: "Disabilita il link." },
  ],
  examples: [
    {
      title: "Varianti di Stile",
      description: "Il link può assumere diversi colori per comunicare il tipo di azione.",
      code: `<div className="flex flex-col items-start gap-2">
  <TableLink onClick={() => {}}>Link Primario (default)</TableLink>
  <TableLink variant="secondary" onClick={() => {}}>Link Secondario</TableLink>
  <TableLink variant="success" onClick={() => {}}>Azione Positiva</TableLink>
  <TableLink variant="danger" onClick={() => {}}>Azione Negativa</TableLink>
</div>`,
    },
    {
      title: "Con Icona e Stato Disabilitato",
      description: "È possibile aggiungere un'icona e disabilitare il link.",
      code: `import { Download } from "lucide-react";

<div className="flex flex-col items-start gap-2">
  <TableLink icon={<Download size={14} />} onClick={() => {}}>Scarica Report</TableLink>
  <TableLink onClick={() => {}} disabled>Azione Disabilitata</TableLink>
</div>`,
    },
  ],
  notes:
    "Questo componente è progettato per essere usato all'interno del componente Table per garantire coerenza, ma può essere usato anche in modo standalone. Applica stili di focus specifici per una migliore accessibilità.",
};
