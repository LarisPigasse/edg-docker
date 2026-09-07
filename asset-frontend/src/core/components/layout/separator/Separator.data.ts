// src/core/components/ui/separator/Separator.data.ts
import type { ComponentData } from "../../../../core/types";

export const separatorData: ComponentData = {
  id: "separator",
  title: "Separator",
  description:
    "Un divisore visivo per separare e organizzare contenuti, con supporto per orientamento verticale e testo decorativo.",
  category: "layout",
  importPath: 'import { Separator } from "../core/components/ui";',
  origin: "Custom Component",
  dependence: "",
  props: [
    {
      name: "orientation",
      type: '"horizontal" | "vertical"',
      defaultValue: '"horizontal"',
      description: "L'orientamento del separatore.",
    },
    {
      name: "variant",
      type: '"default" | "subtle"',
      defaultValue: '"default"',
      description: "La variante visiva, che ne definisce lo spessore e il colore.",
    },
    {
      name: "children",
      type: "React.ReactNode",
      description: "Testo o icona da visualizzare al centro del separatore (forza l'orientamento orizzontale).",
    },
  ],
  examples: [
    {
      title: "Separatore Orizzontale",
      description: "L'uso più comune per dividere sezioni di contenuto verticalmente.",
      code: `<div className="flex flex-col gap-2">
  <p>Contenuto A</p>
  <Separator />
  <p>Contenuto B</p>
  <Separator variant="subtle" />
  <p>Contenuto C</p>
</div>`,
    },
    {
      title: "Separatore con Testo",
      description: "Utile per moduli di login ('o') o per separare contenuti con un contesto.",
      code: `<Separator>OPPURE</Separator>`,
    },
    {
      title: "Separatore Verticale",
      description:
        "Usato per separare elementi disposti orizzontalmente. Richiede di specificare un'altezza tramite className.",
      code: `<div className="flex items-center gap-4">
  <span>Voce 1</span>
  <Separator orientation="vertical" className="h-6" />
  <span>Voce 2</span>
  <Separator orientation="vertical" className="h-6" />
  <span>Voce 3</span>
</div>`,
    },
  ],
  notes:
    "Quando si usa l'orientamento verticale, è necessario impostare un'altezza tramite `className` (es. `h-6`, `h-full`) per renderlo visibile. Se viene fornito un `children`, l'orientamento sarà sempre orizzontale.",
};
