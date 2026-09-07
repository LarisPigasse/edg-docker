// src/core/components/ui/textarea/TextArea.data.ts
import type { ComponentData } from "../../../../core/types";

export const textAreaData: ComponentData = {
  id: "textArea",
  title: "Text Area",
  description:
    "Un campo di testo multi-riga con funzionalità avanzate come l'auto-ridimensionamento in base al contenuto e un contatore di caratteri opzionale.",
  category: "form",
  importPath: 'import { TextArea } from "../core/components/ui";',
  origin: "Custom Component",
  dependence: "N/A",
  props: [
    { name: "label", type: "string", required: true, description: "L'etichetta flottante per il campo." },
    {
      name: "autoResize",
      type: "boolean",
      defaultValue: "true",
      description: "Se true, l'altezza del campo si adatta al contenuto.",
    },
    { name: "minRows", type: "number", defaultValue: "3", description: "Numero minimo di righe visibili." },
    { name: "maxRows", type: "number", defaultValue: "8", description: "Numero massimo di righe prima che appaia lo scroll." },
    { name: "showCharCount", type: "boolean", defaultValue: "false", description: "Mostra il contatore dei caratteri." },
    { name: "maxLength", type: "number", description: "Numero massimo di caratteri consentiti." },
    { name: "error", type: "string", description: "Visualizza il campo in stato di errore con il messaggio fornito." },
  ],
  examples: [
    {
      title: "TextArea con Auto-Resize",
      description: "Di default, il campo si espande e si restringe per adattarsi al testo inserito.",
      code: `<TextArea label="Il tuo commento" helperText="Scrivi liberamente, il campo si adatterà." />`,
    },
    {
      title: "Con Contatore Caratteri",
      description: "Utile per dare un feedback all'utente quando c'è un limite di lunghezza.",
      code: `<TextArea 
  label="Bio"
  showCharCount
  maxLength={250}
  minRows={4}
/>`,
    },
    {
      title: "Dimensioni Fisse",
      description: "Disabilitando 'autoResize', il campo mantiene le dimensioni definite da 'rows' (o 'minRows').",
      code: `<TextArea 
  label="Note Aggiuntive"
  autoResize={false}
  rows={5}
  helperText="Quest'area di testo non si ridimensiona."
/>`,
    },
  ],
  notes:
    "L'aspetto (floating label, underline) è identico al componente Input per garantire coerenza visiva. Il contatore di caratteri cambia colore quando ci si avvicina o si supera il limite.",
};
