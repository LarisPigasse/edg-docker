// src/core/components/ui/modal/Modal.data.ts
import type { ComponentData } from "../../../types/ComponentData";

export const modalData: ComponentData = {
  id: "modal",
  title: "Modal",
  description:
    "Un componente finestra di dialogo che sovrappone il contenuto principale per focalizzare l'attenzione dell'utente su un'attività o un'informazione specifica.",
  category: "ui",
  importPath: 'import { Modal } from "../core/components/ui";',
  origin: "Radix UI + Custom Component",
  dependence: "@radix-ui/react-dialog",
  props: [
    { name: "isOpen", type: "boolean", required: true, description: "Controlla lo stato di apertura/chiusura del modal." },
    { name: "onClose", type: "() => void", required: true, description: "Callback eseguita quando il modal viene chiuso." },
    { name: "title", type: "string", description: "Titolo visualizzato nell'header del modal." },
    { name: "description", type: "string", description: "Descrizione opzionale mostrata sotto il titolo." },
    { name: "children", type: "React.ReactNode", required: true, description: "Il contenuto principale del modal." },
    {
      name: "size",
      type: '"sm" | "md" | "lg" | "xl" | "full"',
      defaultValue: '"md"',
      description: "Dimensione (larghezza massima) del modal.",
    },
    { name: "footer", type: "React.ReactNode", description: "Un nodo React da renderizzare nel footer del modal." },
    {
      name: "preventClose",
      type: "boolean",
      defaultValue: "false",
      description: "Se true, impedisce la chiusura del modal tramite tasto ESC o click sul backdrop.",
    },
    {
      name: "hideCloseButton",
      type: "boolean",
      defaultValue: "false",
      description: "Nasconde il pulsante di chiusura (X) nell'header.",
    },
  ],
  examples: [
    {
      title: "Modal Base",
      description: "Un esempio di modal standard con titolo, descrizione, contenuto e un footer con pulsanti di azione.",
      code: `const [isOpen, setIsOpen] = useState(false);

<Button onClick={() => setIsOpen(true)}>Apri Modal</Button>

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Titolo del Modal"
  description="Questa è una descrizione opzionale per il modal."
  footer={
    <div className="flex justify-end gap-2">
      <Button variant="outline" onClick={() => setIsOpen(false)}>Annulla</Button>
      <Button variant="primary" onClick={() => setIsOpen(false)}>Conferma</Button>
    </div>
  }
>
  <p>Questo è il contenuto principale del modal. Può contenere form, testi o altri componenti.</p>
</Modal>`,
    },
    {
      title: "Dimensioni Diverse",
      description: "Il modal supporta diverse dimensioni predefinite per adattarsi a vari casi d'uso.",
      code: `<div className="flex gap-2">
  <Button onClick={() => openModal('sm')}>Small</Button>
  <Button onClick={() => openModal('lg')}>Large</Button>
  <Button onClick={() => openModal('full')}>Full</Button>
</div>`,
    },
    {
      title: "Modal con Chiusura Impedita",
      description:
        "Utile per flussi di lavoro critici dove l'utente deve compiere un'azione prima di poter chiudere il modal (es. durante un caricamento).",
      code: `<Modal
  isOpen={isLoading}
  onClose={() => {}}
  preventClose={true}
  title="Caricamento in corso..."
>
  <div className="flex items-center justify-center p-8">
    <Spinner />
    <ThemedText className="ml-4">Attendi il completamento...</ThemedText>
  </div>
</Modal>`,
    },
  ],
  notes:
    "Il componente Modal è costruito sopra Radix UI Dialog per garantire massima accessibilità (gestione del focus, ARIA attributes, blocco dello scroll). La sua struttura interna è basata su ThemedSurface per una perfetta integrazione con il sistema di theming.",
};
