// src/core/components/ui/toast/Toast.showcase.tsx
import React from "react";
import { useToast } from "./useToast.hook"; // o dal barrel file
import { TitledSurface } from "../../layout";

import { Button } from "../../ui";

export const ToastShowcase: React.FC = () => {
  // ✨ CORREZIONE: Rimosse le parentesi graffe {} dalla destrutturazione
  const toast = useToast();

  if (!toast) return null;

  const showDefaultToast = () => {
    toast({
      title: "Notifica Standard",
      description: "Questo è un messaggio informativo per l'utente.",
    });
  };

  const showDangerToast = () => {
    toast.danger({
      title: "Azione Fallita",
      description: "Non è stato possibile completare l'operazione.",
    });
  };

  const showToastWithAction = () => {
    toast({
      title: "File Eliminato",
      description: "Il file è stato spostato nel cestino.",
      action: {
        label: "Annulla",
        onClick: () =>
          toast({
            title: "Annullato",
            description: "L'eliminazione è stata annullata.",
            severity: "default",
          }),
      },
    });
  };

  return (
    <div className="space-y-8">
      <TitledSurface title="Genera Notifiche Toast" padding="lg">
        <p className="mb-6 text-text-secondary">
          Clicca i pulsanti per visualizzare i diversi tipi di notifiche. I toast appariranno in base alla posizione definita
          nel `Toaster`.
        </p>
        <div className="flex flex-wrap gap-4">
          <Button onClick={showDefaultToast}>Mostra Toast Standard</Button>
          <Button variant="danger" onClick={showDangerToast}>
            Mostra Toast di Errore
          </Button>
          <Button variant="outline" onClick={showToastWithAction}>
            Mostra Toast con Azione
          </Button>
        </div>
      </TitledSurface>
    </div>
  );
};

export default ToastShowcase;
