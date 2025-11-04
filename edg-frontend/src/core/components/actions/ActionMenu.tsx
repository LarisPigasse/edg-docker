// src/core/components/actions/ActionMenu.tsx
import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MoreVertical, Edit, Trash2, Eye } from "lucide-react";
import { cn } from "../../utils/";

// Definizione del tipo per una singola azione
export interface Action {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "danger" | "success" | "warning";
  divider?: boolean; // Aggiunge un divisore dopo l'item
}

interface ActionMenuProps {
  actions: Action[];
  menuButton?: React.ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
}

/**
 * ActionMenu component con Radix UI per il theme system EDG.
 * Menu dropdown configurabile per azioni contestuali.
 */
const ActionMenu: React.FC<ActionMenuProps> = ({
  actions,
  menuButton,
  align = "end",
  side = "bottom",
  size = "md",
  className = "",
  disabled = false,
}) => {
  // Icone predefinite per azioni comuni
  const getDefaultIcon = (id: string) => {
    switch (id) {
      case "edit":
        return <Edit className="h-4 w-4" />;
      case "delete":
        return <Trash2 className="h-4 w-4" />;
      case "view":
        return <Eye className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // Classi per dimensioni trigger button
  const sizeClasses = {
    sm: "p-1",
    md: "p-1.5",
    lg: "p-2",
  };

  // Classi per varianti azioni
  const getActionClasses = (action: Action, isHighlighted: boolean) => {
    const baseClasses =
      "group flex w-full items-center px-3 py-2 text-sm transition-colors duration-200 cursor-pointer outline-none";

    const variantClasses = {
      default: "text-text-primary hover:bg-bg-hover",
      danger: "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20",
      success: "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20",
      warning: "text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20",
    };

    const disabledClasses = "opacity-50 cursor-not-allowed";
    const highlightClasses = isHighlighted ? "bg-bg-hover" : "";

    return cn(
      baseClasses,
      variantClasses[action.variant || "default"],
      action.disabled ? disabledClasses : "",
      highlightClasses
    );
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild disabled={disabled}>
        <button
          className={cn(
            "inline-flex items-center justify-center rounded-md transition-colors duration-200",
            "text-text-secondary hover:text-text-primary hover:bg-bg-hover",
            "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            sizeClasses[size],
            className
          )}
          disabled={disabled}
        >
          {menuButton || <MoreVertical className="h-5 w-5" />}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={cn(
            "z-50 min-w-[12rem] overflow-hidden rounded-md border border-border-default bg-bg-primary shadow-lg",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
            "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
          )}
          align={align}
          side={side}
          sideOffset={4}
        >
          <div className="py-1">
            {actions.map((action, index) => (
              <React.Fragment key={action.id}>
                <DropdownMenu.Item
                  className={getActionClasses(action, false)}
                  disabled={action.disabled}
                  onSelect={() => {
                    if (!action.disabled) {
                      action.onClick();
                    }
                  }}
                >
                  <span className="flex items-center">{action.icon || getDefaultIcon(action.id)}</span>
                  <span className="ml-2">{action.label}</span>
                </DropdownMenu.Item>

                {action.divider && index < actions.length - 1 && (
                  <DropdownMenu.Separator className="my-1 h-px bg-border-default" />
                )}
              </React.Fragment>
            ))}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export default ActionMenu;
export type { Action };
