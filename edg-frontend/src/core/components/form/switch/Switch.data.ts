// src/core/components/ui/switch/Switch.data.ts
import type { ComponentData } from "../../../../core/types";

export const switchData: ComponentData = {
  id: "switch",
  title: "Switch",
  description:
    "Un controllo di tipo interruttore (toggle) per attivare o disattivare istantaneamente uno stato, ideale per le impostazioni.",
  category: "form",
  importPath: 'import { Switch } from "../core/components/ui";',
  origin: "Radix UI + Custom Component",
  dependence: "@radix-ui/react-switch",
  props: [
    { name: "label", type: "string", description: "Etichetta visualizzata accanto all'interruttore." },
    { name: "description", type: "string", description: "Testo descrittivo aggiuntivo sotto la label." },
    { name: "checked", type: "boolean", description: "Stato controllato (on/off) dello switch." },
    { name: "onCheckedChange", type: "(checked: boolean) => void", description: "Callback eseguita quando lo stato cambia." },
    { name: "size", type: '"sm" | "md" | "lg"', defaultValue: '"md"', description: "Dimensione dell'interruttore." },
    { name: "error", type: "string", description: "Se presente, visualizza lo switch in stato di errore." },
    { name: "disabled", type: "boolean", defaultValue: "false", description: "Disabilita l'interruttore." },
    { name: "required", type: "boolean", defaultValue: "false", description: "Contrassegna il campo come obbligatorio." },
  ],
  examples: [
    {
      title: "Switch Base",
      description: "Un interruttore semplice con etichetta e descrizione.",
      code: `<Switch 
  label="Notifiche Email" 
  description="Ricevi un'email per ogni nuovo messaggio." 
/>`,
    },
    {
      title: "Dimensioni Diverse",
      description: "Lo switch è disponibile in tre diverse dimensioni.",
      code: `<div className="flex flex-col items-start gap-4">
  <Switch label="Small" size="sm" />
  <Switch label="Medium (default)" size="md" />
  <Switch label="Large" size="lg" />
</div>`,
    },
    {
      title: "Stati Speciali",
      description: "Esempi dello switch in stato di errore e disabilitato.",
      code: `<div className="flex flex-col items-start gap-4">
  <Switch label="Impostazione Obbligatoria" error="Questa opzione deve essere attivata." required />
  <Switch label="Opzione Disabilitata" disabled />
  <Switch label="Opzione Disabilitata (On)" disabled checked />
</div>`,
    },
  ],
  notes:
    "Basato su Radix UI Switch per garantire la massima accessibilità. Il design è in stile iOS per una UX moderna e riconoscibile.",
};
