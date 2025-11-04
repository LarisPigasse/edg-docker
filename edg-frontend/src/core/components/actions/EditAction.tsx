// src/core/components/actions/EditAction.tsx
import React from "react";
import { Edit } from "lucide-react";
import { Button } from "../ui";
import type { ButtonSize } from "../ui/Button";

interface EditActionProps<T> {
  item: T;
  onEdit: (item: T) => void;
  canEdit?: (item: T) => boolean;
  size?: ButtonSize;
  tooltip?: string;
  className?: string;
  showLabel?: boolean;
  label?: string;
}

/**
 * EditAction component per modificare elementi esistenti.
 * Supporta logica condizionale e type safety completa.
 */
function EditAction<T>({
  item,
  onEdit,
  canEdit = () => true,
  size = "xs",
  tooltip = "Modifica",
  className = "",
  showLabel = false,
  label = "Modifica",
}: EditActionProps<T>) {
  const isEditable = canEdit(item);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Ferma la propagazione dell'evento
    if (isEditable) {
      onEdit(item);
    }
  };

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleClick}
      disabled={!isEditable}
      className={className}
      title={tooltip}
      leftIcon={<Edit className="h-4 w-4 text-sky-600" />}
    >
      {showLabel ? label : null}
    </Button>
  );
}

export default EditAction;
