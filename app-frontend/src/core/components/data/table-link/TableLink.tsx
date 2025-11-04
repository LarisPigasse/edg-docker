// src/core/components/ui/table-link/TableLink.tsx
import React, { ReactNode, forwardRef } from "react";
import { cn } from "../../../utils/";

// ✨ Aggiunte nuove varianti per coerenza
export type TableLinkVariant = "primary" | "secondary" | "danger" | "success" | "info" | "warning";

interface TableLinkProps {
  onClick: () => void;
  children: ReactNode;
  className?: string;
  variant?: TableLinkVariant;
  title?: string;
  disabled?: boolean;
  icon?: ReactNode;
}

const TableLink = forwardRef<HTMLButtonElement, TableLinkProps>(
  ({ onClick, children, className = "", variant = "primary", title, disabled = false, icon }, ref) => {
    const baseClasses =
      "inline-flex items-center gap-1.5 text-left focus:outline-none focus:ring-2 focus:ring-offset-1 rounded-sm transition-colors duration-200";

    const variantClasses: Record<TableLinkVariant, string> = {
      primary: "text-violet-600 hover:text-violet-800 focus:ring-violet-500",
      secondary: "text-text-secondary hover:text-text-primary focus:ring-gray-500",
      danger: "text-red-600 hover:text-red-800 focus:ring-red-500",
      success: "text-green-600 hover:text-green-800 focus:ring-green-500",
      // ✨ Nuove varianti
      info: "text-blue-600 hover:text-blue-800 focus:ring-blue-500",
      warning: "text-amber-600 hover:text-amber-800 focus:ring-amber-500",
    };

    const disabledClasses = "text-text-disabled opacity-60 cursor-not-allowed";

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation(); // Previene il trigger di onRowClick
      if (!disabled) {
        onClick();
      }
    };

    return (
      <button
        ref={ref}
        onClick={handleClick}
        className={cn(baseClasses, disabled ? disabledClasses : variantClasses[variant], className)}
        title={title}
        disabled={disabled}
        type="button"
      >
        {icon}
        <span>{children}</span>
      </button>
    );
  }
);

TableLink.displayName = "TableLink";
export default TableLink;
export type { TableLinkVariant };
