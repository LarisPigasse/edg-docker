// src/core/components/ui/input/Input.data.ts
import type { ComponentData } from "../../../types/ComponentData";

export const inputData: ComponentData = {
  id: "input",
  title: "Input",
  description:
    "Un campo di testo versatile con una 'floating label' dinamica e un underline semantico che ne indica lo stato (default, focus, errore).",
  category: "form",
  importPath: 'import { Input } from "../core/components/ui";',
  origin: "Custom Component",
  dependence: "",
  props: [
    { name: "label", type: "string", required: true, description: "L'etichetta del campo, che agisce anche da placeholder." },
    {
      name: "error",
      type: "string",
      description: "Se presente, visualizza il campo in stato di errore e mostra il messaggio fornito.",
    },
    {
      name: "helperText",
      type: "string",
      description: "Testo di aiuto visualizzato sotto il campo (solo se non c'è un errore).",
    },
    {
      name: "fullWidth",
      type: "boolean",
      defaultValue: "true",
      description: "Se true, il componente occupa tutta la larghezza disponibile.",
    },
    {
      name: "required",
      type: "boolean",
      defaultValue: "false",
      description: "Contrassegna il campo come obbligatorio con un asterisco.",
    },
    { name: "disabled", type: "boolean", defaultValue: "false", description: "Disabilita il campo." },
    {
      name: "type",
      type: "string",
      defaultValue: '"text"',
      description: "Il tipo di input HTML (es. 'text', 'password', 'email', 'number').",
    },
  ],
  examples: [
    {
      title: "Stati Principali",
      description:
        "Dimostrazione del comportamento della floating label e dell'underline al variare dello stato: default, con valore e in focus.",
      code: `<div class="space-y-6">
  <Input label="Email" />
  <Input label="Nome Utente" defaultValue="MarioRossi" />
  <Input label="Password" type="password" />
</div>`,
    },
    {
      title: "Validazione e Testi di Aiuto",
      description: "Esempi di come visualizzare messaggi di errore e testi di supporto.",
      code: `<div class="space-y-6">
  <Input label="Codice Fiscale" error="Il codice fiscale non è valido." defaultValue="RSSMRA" />
  <Input label="Partita IVA" helperText="Inserire 11 cifre numeriche." />
</div>`,
    },
    {
      title: "Stati Speciali",
      description: "Dimostrazione del campo in stato disabilitato.",
      code: `<Input label="Campo non modificabile" defaultValue="Valore Bloccato" disabled />`,
    },
  ],
  notes:
    "Il componente è progettato per non usare un placeholder HTML standard; la 'label' svolge questa funzione. L'override degli stili di autofill del browser è già integrato per un'esperienza visiva coerente.",
};
