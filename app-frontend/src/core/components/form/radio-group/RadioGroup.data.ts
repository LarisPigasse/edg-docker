// src/core/components/ui/radio-group/RadioGroup.data.ts
import type { ComponentData } from "../../../types/ComponentData";

export const radioGroupData: ComponentData = {
  id: "radioGroup",
  title: "Radio Group",
  description:
    "Un gruppo di pulsanti di opzione che permette all'utente di selezionare una singola scelta da un elenco di opzioni mutuamente esclusive.",
  category: "form",
  importPath: 'import { RadioGroup, type RadioOption } from "../core/components/ui";',
  origin: "Radix UI + Custom Component",
  dependence: "@radix-ui/react-radio-group",
  props: [
    {
      name: "options",
      type: "RadioOption[]",
      required: true,
      description: "Un array di oggetti che definisce le opzioni disponibili.",
    },
    { name: "label", type: "string", description: "L'etichetta principale per l'intero gruppo di opzioni." },
    { name: "value", type: "string", description: "Il valore dell'opzione attualmente selezionata (stato controllato)." },
    {
      name: "defaultValue",
      type: "string",
      description: "Il valore dell'opzione selezionata di default (stato non controllato).",
    },
    { name: "onValueChange", type: "(value: string) => void", description: "Callback eseguita quando la selezione cambia." },
    {
      name: "orientation",
      type: '"vertical" | "horizontal"',
      defaultValue: '"vertical"',
      description: "La direzione in cui disporre le opzioni.",
    },
    {
      name: "size",
      type: '"sm" | "md" | "lg"',
      defaultValue: '"md"',
      description: "La dimensione dei pulsanti di opzione e del testo associato.",
    },
    {
      name: "error",
      type: "string",
      description: "Se presente, visualizza il gruppo in stato di errore con il messaggio fornito.",
    },
    { name: "disabled", type: "boolean", defaultValue: "false", description: "Disabilita l'intero gruppo di opzioni." },
  ],
  examples: [
    {
      title: "Gruppo Verticale (Default)",
      description: "Un esempio base con opzioni disposte verticalmente e descrizioni aggiuntive.",
      code: `const options = [
  { value: 'email', label: 'Email', description: 'Ricevi notifiche via email.' },
  { value: 'sms', label: 'SMS', description: 'Ricevi notifiche via messaggio.' },
  { value: 'none', label: 'Nessuna', description: 'Disattiva tutte le notifiche.' }
];

<RadioGroup label="Metodo di Notifica" options={options} />`,
    },
    {
      title: "Gruppo Orizzontale",
      description: "Le opzioni possono essere disposte orizzontalmente per layout più compatti.",
      code: `<RadioGroup 
  label="Metodo di Pagamento" 
  orientation="horizontal"
  options={[
    { value: 'card', label: 'Carta' },
    { value: 'paypal', label: 'PayPal' },
    { value: 'bank', label: 'Bonifico', disabled: true }
  ]} 
/>`,
    },
    {
      title: "Stato di Errore e Dimensioni",
      description: "Come visualizzare un errore di validazione e come utilizzare le diverse dimensioni.",
      code: `<div className="space-y-6">
  <RadioGroup 
    label="Conferma Partecipazione" 
    options={[{ value: 'yes', label: 'Sì' }, { value: 'no', label: 'No' }]}
    error="La selezione è obbligatoria."
    required
  />
  <RadioGroup 
    label="Dimensione Large" 
    size="lg"
    options={[{ value: 'lg1', label: 'Opzione Larga 1' }, { value: 'lg2', label: 'Opzione Larga 2' }]}
  />
</div>`,
    },
  ],
  notes:
    "Basato su Radix UI per garantire la massima accessibilità, inclusa la navigazione da tastiera tra le opzioni. La prop 'options' è il modo principale per configurare il componente.",
};
