// src/core/components/actions/CreateAction.tsx
import React, { ReactNode } from "react";
import { Plus } from "lucide-react";
import { Button } from "../ui";
import type { ButtonVariant, ButtonSize } from "../ui/Button";

interface CreateActionProps {
  onClick: () => void;
  label?: string;
  icon?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
  loadingText?: string;
}

/**
 * CreateAction component per creare nuovi elementi.
 * Wrapper specializzato del Button component per azioni di creazione.
 */
const CreateAction: React.FC<CreateActionProps> = ({
  onClick,
  label = "Nuovo",
  icon = <Plus className="h-4 w-4" />,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  isLoading = false,
  loadingText = "Creazione in corso...",
}) => {
  return (
    <Button
      variant={variant}
      size={size}
      leftIcon={icon}
      onClick={onClick}
      className={className}
      disabled={disabled}
      isLoading={isLoading}
      loadingText={loadingText}
    >
      {label}
    </Button>
  );
};

export default CreateAction;
