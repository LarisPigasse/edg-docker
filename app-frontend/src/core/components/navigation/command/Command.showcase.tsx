// src/core/components/ui/command/Command.showcase.tsx
import React, { useState } from "react";
import { Command, type CommandItem } from "./Command";
import { TitledSurface } from "../../layout";
import { ThemedText } from "../../atomic";
import { Button } from "../../ui";
import { Home, Settings, LogOut, UserPlus } from "lucide-react";

export const CommandShowcase: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const commands: CommandItem[] = [
    {
      id: "dashboard",
      label: "Vai alla Dashboard",
      icon: <Home size={16} />,
      onSelect: () => alert("Navigazione verso la Dashboard..."),
    },
    {
      id: "settings",
      label: "Apri Impostazioni",
      icon: <Settings size={16} />,
      onSelect: () => alert("Apertura Impostazioni..."),
    },
    {
      id: "addUser",
      label: "Aggiungi Nuovo Utente",
      icon: <UserPlus size={16} />,
      onSelect: () => alert("Apertura modale 'Nuovo Utente'..."),
    },
    {
      id: "logout",
      label: "Esegui Logout",
      icon: <LogOut size={16} />,
      onSelect: () => alert("Logout in corso..."),
    },
  ];

  return (
    <>
      <TitledSurface title="Command Palette Interattiva" padding="lg">
        <ThemedText variant="secondary" className="mb-4">
          Clicca il pulsante qui sotto o premi `Cmd + K` (su Mac) o `Ctrl + K` (su Windows/Linux) per aprire la palette dei
          comandi.
        </ThemedText>
        <Button onClick={() => setIsOpen(true)}>Apri Command Palette</Button>
      </TitledSurface>

      <Command items={commands} isOpen={isOpen} onOpenChange={setIsOpen} />
    </>
  );
};

export default CommandShowcase;
