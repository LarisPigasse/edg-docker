// src/core/components/ui/modal/Modal.showcase.tsx
import React, { useState } from "react";
import Modal from "./Modal";
import type { ModalSize } from "./Modal";
import { TitledSurface } from "../../layout";
import { Button } from "../";
import { ThemedText } from "../../atomic";
import { Input } from "../../form";
import { Spinner } from "../../feedback";

export const ModalShowcase: React.FC = () => {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    size: ModalSize;
    preventClose: boolean;
  }>({
    isOpen: false,
    size: "md",
    preventClose: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const openModal = (size: ModalSize, preventClose = false) => {
    setModalState({ isOpen: true, size, preventClose });
  };

  const handleClose = () => {
    if (isLoading) return;
    setModalState({ isOpen: false, size: "md", preventClose: false });
  };

  const handleConfirmAndLoad = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      handleClose();
    }, 2500);
  };

  const renderFooter = () => (
    <div className="flex justify-end gap-3">
      <Button variant="outline" onClick={handleClose} disabled={isLoading}>
        Annulla
      </Button>
      <Button variant="primary" onClick={handleConfirmAndLoad} isLoading={isLoading} loadingText="Salvataggio...">
        Salva Modifiche
      </Button>
    </div>
  );

  return (
    <div className="space-y-8">
      <TitledSurface title="Apri Modal" padding="lg">
        <div className="space-y-4">
          <ThemedText variant="secondary">Clicca sui pulsanti per aprire il modal con diverse configurazioni.</ThemedText>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => openModal("sm")}>Small</Button>
            <Button onClick={() => openModal("md")}>Medium (Default)</Button>
            <Button onClick={() => openModal("lg")}>Large</Button>
            <Button onClick={() => openModal("xl")}>Extra Large</Button>
            <Button onClick={() => openModal("full")}>Full Screen</Button>
          </div>
          <div className="pt-4">
            <Button variant="warning" onClick={() => openModal("md", true)}>
              Apri Modal con Chiusura Impedita
            </Button>
          </div>
        </div>
      </TitledSurface>

      <Modal
        isOpen={modalState.isOpen}
        onClose={handleClose}
        title="Modifica Profilo Utente"
        description="Apporta le modifiche necessarie e salva per applicarle."
        size={modalState.size}
        footer={renderFooter()}
        preventClose={modalState.preventClose || isLoading}
      >
        <div className="p-6 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-4">
              <Spinner />
              <ThemedText variant="secondary">Salvataggio in corso, attendere...</ThemedText>
            </div>
          ) : (
            <>
              <Input label="Nome" defaultValue="Laris" />
              <Input label="Cognome" defaultValue="Pigasse" />
              <Input label="Email" type="email" defaultValue="laris.pigasse@gmail.com" />
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ModalShowcase;
