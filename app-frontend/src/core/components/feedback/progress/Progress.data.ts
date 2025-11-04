// src/core/components/ui/progress/Progress.data.ts
import type { ComponentData } from "../../../types/ComponentData";

export const progressData: ComponentData = {
  id: "progress",
  title: "Progress",
  description:
    "Una barra di avanzamento per visualizzare il completamento di un'operazione, con supporto per stati determinati e indeterminati.",
  category: "feedback",
  importPath: 'import { Progress } from "../core/components/ui";',
  origin: "Radix UI + Custom Component",
  dependence: "@radix-ui/react-progress",
  props: [
    {
      name: "value",
      type: "number",
      defaultValue: "0",
      description: "Il valore corrente della barra (da 0 al valore di 'max').",
    },
    {
      name: "max",
      type: "number",
      defaultValue: "100",
      description: "Il valore massimo che rappresenta il completamento (100%).",
    },
    {
      name: "variant",
      type: '"default" | "success" | "warning" | "danger" | "info"',
      defaultValue: '"default"',
      description: "La variante semantica che ne definisce il colore.",
    },
    { name: "size", type: '"sm" | "md" | "lg"', defaultValue: '"md"', description: "L'altezza della barra di avanzamento." },
    { name: "showLabel", type: "boolean", defaultValue: "false", description: "Se true, mostra un'etichetta sopra la barra." },
    {
      name: "label",
      type: "string",
      description: "Testo personalizzato per l'etichetta. Se non fornito, mostra la percentuale.",
    },
    {
      name: "indeterminate",
      type: "boolean",
      defaultValue: "false",
      description: "Attiva la modalità indeterminata, ideale per caricamenti di durata sconosciuta.",
    },
  ],
  examples: [
    {
      title: "Barra di Avanzamento Base",
      description: "Un esempio di progress bar con un valore definito.",
      code: `<Progress value={60} />`,
    },
    {
      title: "Varianti e Label",
      description: "Le barre di avanzamento possono avere colori semantici e mostrare un'etichetta con la percentuale.",
      code: `<div className="space-y-4">
  <Progress value={75} variant="success" showLabel />
  <Progress value={50} variant="warning" showLabel label="Controllo file..." />
  <Progress value={90} variant="info" showLabel />
</div>`,
    },
    {
      title: "Modalità Indeterminata",
      description: "Utile per indicare un'attività in corso senza un progresso numerico, come un caricamento iniziale.",
      code: `<div className="space-y-4">
  <Progress indeterminate />
  <Progress indeterminate variant="danger" showLabel label="Connessione al server..." />
</div>`,
    },
  ],
  notes:
    "Il componente è basato su Radix UI Progress per una corretta gestione dell'accessibilità (ARIA value attributes). L'animazione 'shimmer' nella modalità indeterminata è realizzata con CSS puro.",
};
