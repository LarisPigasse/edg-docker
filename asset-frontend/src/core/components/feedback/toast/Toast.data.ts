// src/core/components/ui/toast/Toast.data.ts
import type { ComponentData } from "../../../../core/types";

export const toastData: ComponentData = {
  id: "toast",
  title: "Toast",
  description:
    "Un sistema di notifiche non invadente per fornire feedback temporanei all'utente, con posizione e stile semplificati.",
  category: "feedback",
  importPath: 'import { useToast, ToastProvider, Toaster } from "../core/components/ui";',
  origin: "Radix UI + Custom Component",
  dependence: "@radix-ui/react-toast",
  props: [
    { name: "title", type: "string", description: "Il titolo principale della notifica." },
    { name: "description", type: "string", description: "Un testo descrittivo aggiuntivo." },
    {
      name: "severity",
      type: '"default" | "danger"',
      defaultValue: '"default"',
      description: "Cambia l'icona e il colore del titolo per indicare un errore.",
    },
    {
      name: "action",
      type: "{ label: string; onClick: () => void }",
      description: "Un'azione opzionale (es. 'Annulla') che l'utente può compiere.",
    },
  ],
  examples: [
    {
      title: "Uso Base dell'Hook `useToast`",
      description: "Per mostrare una notifica, importa l'hook e chiama la funzione `toast`.",
      code: `import { useToast, Button } from "../..";

const MyComponent = () => {
  const { toast } = useToast();

  return (
    <Button 
      onClick={() => toast({ 
        title: "Operazione Completata",
        description: "Il tuo profilo è stato aggiornato."
      })}
    >
      Mostra Notifica
    </Button>
  );
};`,
    },
    {
      title: "Notifica di Errore",
      description: "Usa la scorciatoia `toast.danger()` per le notifiche critiche.",
      code: `const { toast } = useToast();

<Button 
  variant="danger"
  onClick={() => toast.danger({ 
    title: "Errore di Connessione",
    description: "Impossibile salvare i dati. Controlla la tua connessione.",
    action: { label: 'Riprova', onClick: () => console.log('Riprova...') }
  })}
>
  Mostra Errore
</Button>`,
    },
    {
      title: "Configurazione del Provider",
      description:
        "L'applicazione deve essere avvolta da `ToastProvider` e includere il `Toaster` per renderizzare le notifiche.",
      code: `// In App.tsx o nel tuo layout principale
import { ToastProvider, Toaster } from "../core/components/ui";

function App() {
  return (
    <ToastProvider>
      {/* ...tutta la tua app... */}

      {/* Puoi scegliere la posizione qui */}
      <Toaster position="bottom-right" />
    </ToastProvider>
  );
}`,
    },
  ],
  notes:
    "Il nuovo sistema Toast è stato semplificato per avere uno stile unico e coerente con il tema. La prop 'severity' modifica solo l'icona e il colore del titolo, non lo sfondo, per un design più minimale.",
};
