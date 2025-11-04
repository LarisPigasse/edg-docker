// src/core/components/actions/DeleteAction.tsx
import React from "react";
import { Trash2 } from "lucide-react";
import { Button } from "../ui";
import type { ButtonSize } from "../ui/Button";

interface DeleteActionProps<T> {
  item: T;
  onDelete: (item: T) => void;
  canDelete?: (item: T) => boolean;
  size?: ButtonSize;
  tooltip?: string;
  className?: string;
  showLabel?: boolean;
  label?: string;
  /** Richiede conferma prima di eliminare */
  requireConfirmation?: boolean;
  /** Messaggio di conferma personalizzato */
  confirmationMessage?: string;
  /** Funzione per ottenere il nome dell'elemento (usato nel messaggio di conferma) */
  getItemName?: (item: T) => string;
}

/**
 * DeleteAction component per eliminare elementi esistenti.
 * Supporta conferma opzionale e type safety completa.
 */
function DeleteAction<T>({
  item,
  onDelete,
  canDelete = () => true,
  size = "xs",
  tooltip = "Elimina",
  className = "",
  showLabel = false,
  label = "Elimina",
  requireConfirmation = false,
  confirmationMessage,
  getItemName,
}: DeleteActionProps<T>) {
  const isDeletable = canDelete(item);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Ferma la propagazione dell'evento

    if (!isDeletable) return;

    if (requireConfirmation) {
      const itemName = getItemName?.(item) || "questo elemento";
      const message = confirmationMessage || `Sei sicuro di voler eliminare ${itemName}?`;

      if (window.confirm(message)) {
        onDelete(item);
      }
    } else {
      onDelete(item);
    }
  };

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleClick}
      disabled={!isDeletable}
      className={className}
      title={tooltip}
      leftIcon={<Trash2 className="h-4 w-4 text-red-600" />}
    >
      {showLabel ? label : null}
    </Button>
  );
}

export default DeleteAction;
