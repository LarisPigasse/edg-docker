// src/core/components/ui/confirm-modal/ConfirmModal.data.ts
import type { ComponentData } from "../../../types/ComponentData";

export const confirmModalData: ComponentData = {
  id: "confirmModal",
  title: "Confirm Modal",
  description:
    "Un modal specializzato per richiedere la conferma dell'utente prima di eseguire un'azione critica, con varianti semantiche.",
  category: "ui",
  importPath: 'import { ConfirmModal } from "../core/components/ui";',
  origin: "Custom Component",
  dependence: "",
  props: [
    { name: "isOpen", type: "boolean", required: true, description: "Controlla la visibilità del modal." },
    { name: "onClose", type: "() => void", required: true, description: "Callback per chiudere il modal." },
    { name: "onConfirm", type: "() => void", required: true, description: "Callback eseguita alla conferma." },
    { name: "title", type: "string", required: true, description: "Il titolo visualizzato nell'header del modal." },
    { name: "message", type: "string", required: true, description: "Il messaggio principale di conferma." },
    {
      name: "variant",
      type: '"default" | "danger" | "warning" | "success" | "info"',
      defaultValue: '"default"',
      description: "Variante visiva e semantica del modal.",
    },
    { name: "confirmText", type: "string", description: "Testo personalizzato per il pulsante di conferma." },
    { name: "cancelText", type: "string", defaultValue: '"Annulla"', description: "Testo per il pulsante di annullamento." },
    {
      name: "isLoading",
      type: "boolean",
      defaultValue: "false",
      description: "Mostra lo stato di caricamento sul pulsante di conferma.",
    },
    {
      name: "loadingText",
      type: "string",
      defaultValue: '"Elaborazione..."',
      description: "Testo visualizzato durante il caricamento.",
    },
    { name: "details", type: "string", description: "Testo aggiuntivo per fornire maggiori dettagli o avvertenze." },
  ],
  examples: [
    {
      title: "Conferma di Eliminazione (Danger)",
      description:
        "L'uso più comune, per azioni distruttive. La variante 'danger' imposta automaticamente l'icona e il colore del pulsante.",
      code: `<ConfirmModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onConfirm={() => console.log('Confirmed!')}
  variant="danger"
  title="Conferma Eliminazione"
  message="Sei sicuro di voler eliminare questo elemento?"
  details="L'azione non potrà essere annullata."
/>`,
    },
    {
      title: "Avviso (Warning)",
      description: "Utile per avvisare l'utente di conseguenze importanti ma non necessariamente distruttive.",
      code: `<ConfirmModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onConfirm={() => console.log('Confirmed!')}
  variant="warning"
  title="Procedere con la Modifica?"
  message="Stai per modificare i permessi di un amministratore."
  confirmText="Sì, procedi"
/>`,
    },
    {
      title: "Stato di Caricamento",
      description:
        "Il modal gestisce uno stato 'isLoading' che disabilita i pulsanti e mostra uno spinner, prevenendo doppi click.",
      code: `<ConfirmModal
  isOpen={true}
  onClose={() => {}}
  onConfirm={() => {}}
  variant="default"
  title="Elaborazione Richiesta"
  message="Attendi il completamento dell'operazione."
  isLoading={true}
/>`,
    },
  ],
  notes:
    "Questo componente è un wrapper attorno al componente 'Modal' base, specializzato per le conferme. La prop 'variant' configura automaticamente l'icona, i colori e lo stile del pulsante di conferma per coerenza.",
};
