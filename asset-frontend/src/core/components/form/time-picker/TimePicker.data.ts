// src/core/components/ui/time-picker/TimePicker.data.ts
import type { ComponentData } from "../../../../core/types";

export const timePickerData: ComponentData = {
  id: "timePicker",
  title: "Time Picker",
  description:
    "Un componente avanzato per la selezione di un orario, con una tendina scrollabile per ore e minuti, e supporto per formati 12h/24h.",
  category: "form",
  importPath: 'import { TimePicker, type TimeValue } from "../core/components/ui";',
  origin: "Radix UI + Custom Component",
  dependence: "@radix-ui/react-popover",
  props: [
    { name: "label", type: "string", required: true, description: "L'etichetta flottante per il campo." },
    {
      name: "value",
      type: "TimeValue ({ hours: number, minutes: number })",
      description: "L'orario selezionato (stato controllato).",
    },
    { name: "onChange", type: "(time?: TimeValue) => void", description: "Callback eseguita quando l'orario cambia." },
    { name: "format", type: '"12h" | "24h"', defaultValue: '"24h"', description: "Formato di visualizzazione dell'orario." },
    { name: "step", type: "5 | 10 | 15 | 30", defaultValue: "15", description: "L'intervallo in minuti tra le opzioni." },
    { name: "minTime", type: "TimeValue", description: "L'orario minimo selezionabile." },
    { name: "maxTime", type: "TimeValue", description: "L'orario massimo selezionabile." },
    { name: "error", type: "string", description: "Visualizza il campo in stato di errore con il messaggio fornito." },
  ],
  examples: [
    {
      title: "TimePicker 24h",
      description: "Un selettore standard con formato 24 ore e step di 30 minuti.",
      code: `<TimePicker 
  label="Orario di Inizio"
  format="24h"
  step={30}
/>`,
    },
    {
      title: "TimePicker 12h (AM/PM)",
      description: "Un selettore con formato 12 ore e selettore AM/PM.",
      code: `<TimePicker 
  label="Orario Sveglia"
  format="12h"
  step={15}
/>`,
    },
    {
      title: "Limitato a Orari Lavorativi",
      description: "Esempio con `minTime` e `maxTime` per permettere la selezione solo in un determinato intervallo.",
      code: `<TimePicker 
  label="Orario Riunione"
  minTime={{ hours: 9, minutes: 0 }}
  maxTime={{ hours: 17, minutes: 30 }}
  helperText="Selezionabile dalle 9:00 alle 17:30."
/>`,
    },
  ],
  notes:
    "Il componente combina un input testuale, che permette l'inserimento manuale, con un Popover di Radix contenente delle colonne scrollabili per una selezione rapida. La validazione dei limiti (min/max) viene applicata a entrambe le modalità di inserimento.",
};
