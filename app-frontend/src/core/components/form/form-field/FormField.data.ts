// src/core/components/ui/form-field/FormField.data.ts
import type { ComponentData } from "../../../types/ComponentData";

export const formFieldData: ComponentData = {
  id: "formField",
  title: "Form Field",
  description:
    "Un wrapper universale per i campi del form che gestisce in modo consistente label, descrizioni, testi di aiuto e messaggi di errore.",
  category: "form",
  importPath: 'import { FormField } from "../core/components/ui";',
  origin: "Custom Component",
  dependence: "N/A",
  props: [
    {
      name: "children",
      type: "React.ReactNode",
      required: true,
      description: "Il componente form da renderizzare (es. Input, Select, Checkbox).",
    },
    { name: "label", type: "string", description: "Etichetta del campo, visualizzata se 'hideLabel' è false." },
    {
      name: "hideLabel",
      type: "boolean",
      defaultValue: "false",
      description: "Nasconde la label. Utile per componenti con label interna (es. Input).",
    },
    {
      name: "error",
      type: "string",
      description: "Se presente, visualizza il messaggio di errore e imposta lo stato 'invalid'.",
    },
    {
      name: "helperText",
      type: "string",
      description: "Testo di aiuto visualizzato sotto il campo (solo se non c'è un errore).",
    },
    { name: "description", type: "string", description: "Testo descrittivo visualizzato sopra il campo." },
    {
      name: "required",
      type: "boolean",
      defaultValue: "false",
      description: "Aggiunge un asterisco alla label per indicare che il campo è obbligatorio.",
    },
    {
      name: "size",
      type: '"sm" | "md" | "lg"',
      defaultValue: '"md"',
      description: "Dimensione del testo per label, helper ed errore.",
    },
    {
      name: "spacing",
      type: '"tight" | "normal" | "loose"',
      defaultValue: '"normal"',
      description: "Spaziatura verticale tra gli elementi del campo.",
    },
  ],
  examples: [
    {
      title: "Uso con Label Esterna",
      description: "Esempio con un Checkbox, dove FormField fornisce la label principale.",
      code: `<FormField
  label="Impostazioni Newsletter"
  description="Scegli le tue preferenze di comunicazione."
>
  <Checkbox id="marketing" label="Ricevi email promozionali" />
</FormField>`,
    },
    {
      title: "Uso con Label Interna (hideLabel)",
      description: "Esempio con un Input, che ha già una sua floating label. FormField gestisce solo l'errore e l'helper text.",
      code: `<FormField
  hideLabel
  error="Il nome utente è già in uso."
>
  <Input id="username" label="Nome Utente" defaultValue="MarioRossi" />
</FormField>`,
    },
    {
      title: "Con Helper Text",
      description: "Il testo di aiuto fornisce un suggerimento utile all'utente.",
      code: `<FormField
  hideLabel
  helperText="La password deve contenere almeno 8 caratteri."
>
  <Input id="password" type="password" label="Password" />
</FormField>`,
    },
  ],
  notes:
    "FormField è un componente fondamentale per la coerenza dei form. Utilizza React.cloneElement per iniettare props di accessibilità (come aria-describedby) direttamente nel componente figlio, collegando semanticamente l'input ai suoi messaggi di errore o aiuto.",
};
