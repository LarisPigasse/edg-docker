// src/core/components/ui/checkbox/Checkbox.data.ts
import type { ComponentData } from "../../../types/ComponentData";

export const checkboxData: ComponentData = {
  id: "checkbox",
  title: "Checkbox",
  description:
    "Un controllo che permette all'utente di selezionare una o più opzioni da un set, con supporto per stati 'indeterminate'.",
  category: "form",
  importPath: 'import { Checkbox } from "../core/components/ui";',
  origin: "Radix UI",
  dependence: "@radix-ui/react-checkbox",
  props: [
    { name: "label", type: "string", description: "Etichetta visualizzata accanto al checkbox." },
    { name: "description", type: "string", description: "Testo descrittivo aggiuntivo sotto la label." },
    { name: "checked", type: "boolean", description: "Stato controllato del checkbox (selezionato o meno)." },
    {
      name: "indeterminate",
      type: "boolean",
      defaultValue: "false",
      description: "Imposta lo stato visuale a indeterminato (trattino).",
    },
    { name: "disabled", type: "boolean", defaultValue: "false", description: "Disabilita il checkbox." },
    { name: "required", type: "boolean", defaultValue: "false", description: "Contrassegna il campo come obbligatorio." },
    { name: "error", type: "string", description: "Mostra il checkbox in stato di errore e visualizza il messaggio fornito." },
    {
      name: "size",
      type: '"sm" | "md" | "lg"',
      defaultValue: '"md"',
      description: "Dimensione del checkbox e del testo associato.",
    },
    {
      name: "onCheckedChange",
      type: "(checked: boolean) => void",
      description: "Callback eseguita quando lo stato del checkbox cambia.",
    },
  ],
  examples: [
    {
      title: "Uso Base",
      description: "Un semplice checkbox con etichetta e descrizione.",
      code: `<Checkbox 
  id="terms" 
  label="Accetto i termini e le condizioni"
  description="Leggi attentamente prima di procedere."
/>`,
    },
    {
      title: "Stati Speciali",
      description: "Esempi degli stati indeterminato e disabilitato.",
      code: `<div className="space-y-4">
  <Checkbox id="indeterminate" label="Stato Indeterminato" indeterminate />
  <Checkbox id="disabled" label="Checkbox Disabilitato" disabled />
  <Checkbox id="disabled-checked" label="Disabilitato e Selezionato" disabled checked />
</div>`,
    },
    {
      title: "Stato di Errore",
      description: "Come visualizzare un errore di validazione associato al checkbox.",
      code: `<Checkbox 
  id="error" 
  label="Devi accettare per continuare" 
  error="Questo campo è obbligatorio." 
  required
/>`,
    },
    {
      title: "Dimensioni Multiple",
      description: "Il checkbox è disponibile in diverse dimensioni per adattarsi a vari contesti.",
      code: `<div className="flex flex-col gap-4">
  <Checkbox id="size-sm" label="Dimensione Small" size="sm" />
  <Checkbox id="size-md" label="Dimensione Medium" size="md" />
  <Checkbox id="size-lg" label="Dimensione Large" size="lg" />
</div>`,
    },
  ],
  notes:
    "Il componente è basato su Radix UI per garantire massima accessibilità. Lo stato 'indeterminate' è puramente visuale e deve essere gestito via JavaScript. Per gruppi di checkbox, è consigliabile gestire lo stato a livello del componente genitore.",
};
