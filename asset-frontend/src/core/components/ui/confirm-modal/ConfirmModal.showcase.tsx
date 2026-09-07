// src/core/components/ui/confirm-modal/ConfirmModal.showcase.tsx
import React, { useState } from "react";
import ConfirmModal from "./ConfirmModal";
import type { ConfirmVariant } from "./ConfirmModal";
import { TitledSurface } from "../../layout";
import { Button } from "..";

export const ConfirmModalShowcase: React.FC = () => {
  const [modalState, setModalState] = useState<{ isOpen: boolean; variant: ConfirmVariant }>({
    isOpen: false,
    variant: "default",
  });
  const [isLoading, setIsLoading] = useState(false);

  const openModal = (variant: ConfirmVariant) => {
    setModalState({ isOpen: true, variant });
  };

  const handleClose = () => {
    if (isLoading) return;
    setModalState({ isOpen: false, variant: "default" });
  };

  const handleConfirm = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      handleClose();
      console.log(`Azione confermata per la variante: ${modalState.variant}`);
    }, 2000);
  };

  const getModalContent = () => {
    switch (modalState.variant) {
      case "danger":
        return {
          title: "Conferma Eliminazione",
          message: "Sei assolutamente sicuro di voler eliminare questo record?",
          details: "Questa operazione è irreversibile.",
        };
      case "warning":
        return {
          title: "Attenzione",
          message: "Stai per rendere pubblici questi dati. Vuoi continuare?",
        };
      case "success":
        return {
          title: "Operazione Riuscita",
          message: "L'elemento è stato creato correttamente.",
          confirmText: "Ottimo!",
        };
      case "info":
        return {
          title: "Informazione",
          message: "Ricorda di salvare le modifiche prima di uscire.",
          confirmText: "Ho capito",
        };
      default:
        return {
          title: "Conferma Azione",
          message: "Sei sicuro di voler procedere con questa azione generica?",
        };
    }
  };

  return (
    <div className="space-y-8">
      <TitledSurface title="Apri Modal di Conferma" padding="lg">
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={() => openModal("default")}>
            Default
          </Button>
          <Button variant="danger" onClick={() => openModal("danger")}>
            Danger
          </Button>
          <Button variant="warning" onClick={() => openModal("warning")}>
            Warning
          </Button>
          <Button variant="success" onClick={() => openModal("success")}>
            Success
          </Button>
          <Button variant="info" onClick={() => openModal("info")}>
            Info
          </Button>
        </div>
      </TitledSurface>

      <ConfirmModal
        isOpen={modalState.isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        variant={modalState.variant}
        isLoading={isLoading}
        {...getModalContent()}
      />
    </div>
  );
};

export default ConfirmModalShowcase;
