// src/core/components/ui/label/Label.data.ts
import type { ComponentData } from "../../../types/ComponentData";

export const labelData: ComponentData = {
  id: "label",
  title: "Label",
  description:
    "Un componente per visualizzare etichette testuali con supporto per varianti semantiche, dimensioni e pesi del font.",
  category: "form",
  importPath: 'import { Label } from "../core/components/ui";',
  origin: "Custom Component",
  dependence: "Badge (opzionale)",
  props: [
    {
      name: "variant",
      type: '"default" | "error" | "disabled" | "info"',
      defaultValue: '"default"',
      description: "Variante semantica che ne definisce il colore.",
    },
    { name: "size", type: '"xs" | "sm" | "md" | "lg"', defaultValue: '"md"', description: "Dimensione del testo della label." },
    {
      name: "weight",
      type: '"normal" | "medium" | "semibold" | "bold"',
      defaultValue: '"medium"',
      description: "Peso del font della label.",
    },
    {
      name: "required",
      type: "boolean",
      defaultValue: "false",
      description: "Aggiunge un asterisco rosso per i campi obbligatori.",
    },
    { name: "optional", type: "boolean", defaultValue: "false", description: "Aggiunge un badge 'opzionale'." },
  ],
  examples: [
    {
      title: "Varianti di Stile",
      description: "Le label possono avere diversi stili per comunicare lo stato del campo associato.",
      code: `<div className="flex flex-col items-start gap-3">
  <Label>Label Standard</Label>
  <Label required>Label Obbligatorio</Label>
  <Label optional>Label Opzionale</Label>
  <Label variant="error">Label con Errore</Label>
  <Label variant="disabled">Label Disabilitato</Label>
  <Label variant="info">Label Informativa</Label>
</div>`,
    },
    {
      title: "Dimensioni",
      description: "Sono disponibili diverse dimensioni per adattarsi a vari layout e gerarchie visive.",
      code: `<div className="flex flex-col items-start gap-3">
  <Label size="xs">Label Extra Small (xs)</Label>
  <Label size="sm">Label Small (sm)</Label>
  <Label size="md">Label Medium (md)</Label>
  <Label size="lg">Label Large (lg)</Label>
</div>`,
    },
    {
      title: "Pesi del Font",
      description: "È possibile modificare il peso del font per dare diversa enfasi all'etichetta.",
      code: `<div className="flex flex-col items-start gap-3">
  <Label weight="normal">Peso Normale</Label>
  <Label weight="medium">Peso Medio</Label>
  <Label weight="semibold">Peso Semi-Bold</Label>
  <Label weight="bold">Peso Bold</Label>
</div>`,
    },
  ],
  notes:
    "Il componente Label è fondamentale per l'accessibilità dei form. Assicurati di associarlo a un campo tramite la prop 'htmlFor'. Le props 'required' e 'optional' sono scorciatoie per aggiungere indicatori visivi comuni.",
};
