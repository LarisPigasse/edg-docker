// src/core/components/ui/command/Command.data.ts
import type { ComponentData } from "../../../types";

export const commandData: ComponentData = {
  id: "command",
  title: "Command Palette",
  description:
    "Una finestra di dialogo per la ricerca e l'esecuzione rapida di comandi, attivabile tramite scorciatoia da tastiera (Cmd/Ctrl + K).",
  category: "navigation",
  importPath: 'import { Command, type CommandItem } from "../core/components/ui";',
  origin: "Radix UI + Custom",
  dependence: "@radix-ui/react-dialog",
  props: [
    {
      name: "items",
      type: "CommandItem[]",
      required: true,
      description: "L'array di comandi disponibili (id, label, icon, onSelect).",
    },
    { name: "isOpen", type: "boolean", required: true, description: "Stato (controllato) di apertura della palette." },
    {
      name: "onOpenChange",
      type: "(open: boolean) => void",
      required: true,
      description: "Callback per sincronizzare lo stato di apertura.",
    },
    { name: "placeholder", type: "string", description: "Testo segnaposto per il campo di ricerca." },
  ],
  examples: [
    {
      title: "Utilizzo Base",
      description: "Per usare il componente, gestisci lo stato di apertura e fornisci un elenco di comandi.",
      code: `const [isOpen, setIsOpen] = useState(false);

const commands: CommandItem[] = [
  { id: 'dashboard', label: 'Vai alla Dashboard', onSelect: () => console.log('Navigating to Dashboard...') },
  { id: 'settings', label: 'Apri Impostazioni', onSelect: () => console.log('Opening Settings...') },
  { id: 'logout', label: 'Esegui Logout', onSelect: () => console.log('Logging out...') },
];

// Nel tuo componente...
<>
  <Button onClick={() => setIsOpen(true)}>Apri Command Palette</Button>
  <p>Oppure premi Cmd/Ctrl + K</p>
  <Command items={commands} isOpen={isOpen} onOpenChange={setIsOpen} />
</>`,
    },
  ],
  notes:
    "Il componente imposta automaticamente un event listener globale per la scorciatoia da tastiera Cmd/Ctrl + K. La navigazione interna (frecce, Invio, Esc) è gestita in modo automatico.",
};
