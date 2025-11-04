// src/core/components/ui/card/Card.data.ts
import type { ComponentData } from "../../../types/ComponentData";

export const cardData: ComponentData = {
  id: "card",
  title: "Card",
  description:
    "Componente contenitore versatile e tematico per raggruppare contenuti correlati, con varianti visive e stati interattivi.",
  category: "layout",
  importPath: 'import { Card } from "../core/components/ui";',
  origin: "custom component",
  dependence: "",
  props: [
    {
      name: "variant",
      type: '"default" | "elevated" | "outlined" | "flat"',
      required: false,
      defaultValue: '"default"',
      description: "Variante visiva del card che ne definisce bordi e ombra.",
    },
    {
      name: "padding",
      type: '"none" | "sm" | "md" | "lg"',
      required: false,
      defaultValue: '"md"',
      description: "Padding interno del contenitore.",
    },
    {
      name: "hover",
      type: "boolean",
      required: false,
      defaultValue: "false",
      description: "Forza l'attivazione degli effetti al passaggio del mouse.",
    },
    {
      name: "clickable",
      type: "boolean",
      required: false,
      defaultValue: "false",
      description: "Rende il card cliccabile, aggiungendo semantica e stili (focus, active).",
    },
    {
      name: "onClick",
      type: "() => void",
      required: false,
      description: "Funzione callback eseguita al click. Abilita automaticamente 'clickable'.",
    },
    {
      name: "className",
      type: "string",
      required: false,
      description: "Classi CSS personalizzate da aggiungere al componente.",
    },
    {
      name: "children",
      type: "React.ReactNode",
      required: true,
      description: "Il contenuto da visualizzare all'interno del card.",
    },
  ],
  examples: [
    {
      title: "Varianti Principali",
      description: "Le quattro varianti visive disponibili per il componente Card.",
      code: `<div className="grid md:grid-cols-2 gap-4">
  <Card variant="default" padding="md">Default Card</Card>
  <Card variant="elevated" padding="md">Elevated Card</Card>
  <Card variant="outlined" padding="md">Outlined Card</Card>
  <Card variant="flat" padding="md">Flat Card</Card>
</div>`,
    },
    {
      title: "Interattività",
      description: "Esempi di card cliccabili e con effetti hover. L'interattività aggiunge stili per focus, hover e active.",
      code: `<div className="grid md:grid-cols-2 gap-4">
  <Card clickable padding="lg">
    <ThemedText>Card Cliccabile</ThemedText>
  </Card>
  <Card hover padding="lg">
    <ThemedText>Card con Hover</ThemedText>
  </Card>
</div>`,
    },
    {
      title: "Card Composto",
      description: "Un esempio realistico di un card che contiene altri componenti tematici come titoli, testi e pulsanti.",
      code: `import { ThemedText, Button } from "../.."; // Assicurati di importare i componenti necessari

<Card variant="elevated" padding="lg">
  <div className="space-y-4">
    <ThemedText as="h3" variant="primary" className="font-bold text-lg">
      Titolo della Card
    </ThemedText>
    <ThemedText variant="secondary">
      Questa è una descrizione del contenuto della card. Può contenere informazioni utili e contestuali.
    </ThemedText>
    <div className="flex justify-end pt-2">
      <Button variant="primary" size="sm">Azione</Button>
    </div>
  </div>
</Card>`,
    },
  ],
  notes:
    "Il Card è un wrapper attorno a ThemedSurface, ereditandone la flessibilità. Se viene fornita una prop 'onClick', il card diventa automaticamente 'clickable'. Gli stili di focus sono gestiti con un bordo colorato anziché un anello per un look più integrato.",
};
