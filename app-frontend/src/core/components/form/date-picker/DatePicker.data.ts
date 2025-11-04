// src/core/components/ui/date-picker/DatePicker.data.ts
import type { ComponentData } from "../../../types/ComponentData";

export const datePickerData: ComponentData = {
  id: "datePicker",
  title: "Date Picker",
  description: "Un componente avanzato per la selezione di date che combina un input di testo con un calendario a comparsa.",
  category: "form",
  importPath: 'import { DatePicker } from "../core/components/ui";',
  origin: "Custom Component + Radix UI",
  dependence: "@radix-ui/react-popover",
  props: [
    { name: "label", type: "string", required: true, description: "Etichetta flottante per il campo." },
    { name: "value", type: "Date", description: "La data attualmente selezionata (stato controllato)." },
    { name: "onChange", type: "(date?: Date) => void", description: "Callback eseguita quando la data viene modificata." },
    {
      name: "format",
      type: '"DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD"',
      defaultValue: '"DD/MM/YYYY"',
      description: "Formato di visualizzazione e parsing della data.",
    },
    { name: "minDate", type: "Date", description: "La data minima selezionabile dal calendario." },
    { name: "maxDate", type: "Date", description: "La data massima selezionabile dal calendario." },
    { name: "error", type: "string", description: "Visualizza il campo in stato di errore con il messaggio fornito." },
    { name: "helperText", type: "string", description: "Testo di aiuto visualizzato sotto il campo." },
    {
      name: "size",
      type: '"sm" | "md" | "lg"',
      defaultValue: '"md"',
      description: "Dimensione del componente (input e calendario).",
    },
    {
      name: "fullWidth",
      type: "boolean",
      defaultValue: "false",
      description: "Estende il componente a tutta la larghezza disponibile.",
    },
    { name: "disabled", type: "boolean", defaultValue: "false", description: "Disabilita l'intero componente." },
  ],
  examples: [
    {
      title: "Uso Base",
      description: "Un DatePicker standard con etichetta e placeholder.",
      code: `const [date, setDate] = useState<Date | undefined>();

<DatePicker
  label="Data Evento"
  value={date}
  onChange={setDate}
  placeholder="Seleziona una data"
/>`,
    },
    {
      title: "Validazione e Limiti",
      description: "Esempio con data minima, massima e stato di errore.",
      code: `const [promoDate, setPromoDate] = useState<Date | undefined>();
const min = new Date();
const max = new Date();
max.setDate(max.getDate() + 30);

<DatePicker
  label="Data Promozione"
  value={promoDate}
  onChange={setPromoDate}
  minDate={min}
  maxDate={max}
  error={!promoDate ? "La data è obbligatoria" : ""}
  required
/>`,
    },
    {
      title: "Formato e Dimensioni",
      description: "Un esempio con formato YYYY-MM-DD e dimensione 'lg'.",
      code: `<DatePicker
  label="Scadenza"
  format="YYYY-MM-DD"
  size="lg"
  fullWidth
/>`,
    },
  ],
  notes:
    "Il componente gestisce sia l'input manuale (con validazione basata sul formato) sia la selezione dal calendario. Utilizza Radix Popover per un posizionamento robusto e accessibile del calendario. La navigazione del calendario è possibile anche tramite tastiera.",
};
