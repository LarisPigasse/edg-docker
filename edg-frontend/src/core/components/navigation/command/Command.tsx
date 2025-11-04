// src/core/components/ui/command/Command.tsx
import React, { useState, useEffect, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Search } from "lucide-react";
import { cn } from "../../../utils";
import { Input } from "../input/Input";
import { ThemedSurface } from "../../atomic";

export interface CommandItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onSelect: () => void;
}

interface CommandProps {
  items: CommandItem[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  placeholder?: string;
}

export const Command: React.FC<CommandProps> = ({
  items,
  isOpen,
  onOpenChange,
  placeholder = "Cerca un comando o una pagina...",
}) => {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filtra i comandi in base alla ricerca
  const filteredItems = items.filter((item) => item.label.toLowerCase().includes(search.toLowerCase()));

  // Gestione della scorciatoia da tastiera (Cmd/Ctrl + K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!isOpen);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isOpen, onOpenChange]);

  // Reset della ricerca e della selezione quando il modale si chiude
  useEffect(() => {
    if (!isOpen) {
      setSearch("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Gestione della navigazione con frecce e Invio
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selectedItem = filteredItems[selectedIndex];
      if (selectedItem) {
        selectedItem.onSelect();
        onOpenChange(false);
      }
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
          onKeyDown={handleKeyDown}
        >
          <ThemedSurface variant="modal" className="rounded-lg border border-border-default shadow-lg">
            <div className="flex items-center border-b border-border-default px-4">
              <Search className="h-5 w-5 text-text-secondary" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={placeholder}
                className="w-full h-12 bg-transparent border-0 pl-3 text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-0"
              />
            </div>
            <div className="p-2 max-h-[300px] overflow-y-auto">
              {filteredItems.length > 0 ? (
                filteredItems.map((item, index) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      item.onSelect();
                      onOpenChange(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-md text-sm cursor-pointer",
                      index === selectedIndex ? "bg-bg-selected" : "hover:bg-bg-hover"
                    )}
                  >
                    {item.icon && <span className="text-text-secondary">{item.icon}</span>}
                    <span className="text-text-primary">{item.label}</span>
                  </div>
                ))
              ) : (
                <p className="p-4 text-center text-sm text-text-secondary">Nessun risultato.</p>
              )}
            </div>
          </ThemedSurface>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default Command;
