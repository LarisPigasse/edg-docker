// src/core/components/ui/sheet/Sheet.data.ts
import type { ComponentData } from "../../../types";

export const sheetData: ComponentData = {
  id: "sheet",
  title: "Sheet (Drawer)",
  description:
    "Un pannello contestuale che scivola da uno dei lati dello schermo, ideale per form, filtri o menu di navigazione secondari.",
  category: "layout",
  importPath: 'import { Sheet, type SheetSide } from "../core/components/ui";',
  origin: "Radix UI + Custom",
  dependence: "@radix-ui/react-dialog",
  props: [
    { name: "isOpen", type: "boolean", required: true, description: "Stato (controllato) di apertura dello sheet." },
    {
      name: "onOpenChange",
      type: "(open: boolean) => void",
      required: true,
      description: "Callback per sincronizzare lo stato di apertura.",
    },
    { name: "children", type: "React.ReactNode", required: true, description: "Il contenuto principale dello sheet." },
    {
      name: "side",
      type: '"top" | "bottom" | "left" | "right"',
      defaultValue: '"right"',
      description: "Il lato dello schermo da cui appare lo sheet.",
    },
    { name: "title", type: "string", description: "Titolo opzionale per l'header." },
    { name: "description", type: "string", description: "Descrizione opzionale per l'header." },
    {
      name: "footer",
      type: "React.ReactNode",
      description: "Contenuto opzionale per il footer, tipicamente per pulsanti di azione.",
    },
  ],
  examples: [
    {
      title: "Uso Base",
      description: "Un esempio di sheet che appare da destra, con header e footer.",
      code: `const [isOpen, setIsOpen] = useState(false);

<Button onClick={() => setIsOpen(true)}>Apri Sheet</Button>

<Sheet isOpen={isOpen} onOpenChange={setIsOpen} side="right" title="Modifica Profilo">
  <p>Contenuto dello sheet qui...</p>
</Sheet>`,
    },
  ],
  notes:
    "Il componente è basato su Radix UI Dialog, ereditandone tutte le feature di accessibilità. La differenza principale rispetto a un Modal è puramente stilistica e di animazione.",
};
