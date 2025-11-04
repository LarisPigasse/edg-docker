// src/core/components/ui/label/Label.tsx
import React from "react";
import { cn } from "../../../utils";
import { Badge } from "../../ui";

export type LabelVariant = "default" | "error" | "disabled" | "info";
export type LabelSize = "xs" | "sm" | "md" | "lg";
export type LabelWeight = "normal" | "medium" | "semibold" | "bold";

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  variant?: LabelVariant;
  size?: LabelSize;
  weight?: LabelWeight;
  required?: boolean;
  optional?: boolean;
  className?: string;
}

export const Label: React.FC<LabelProps> = ({
  children,
  variant = "default",
  size = "md",
  weight = "medium",
  required = false,
  optional = false,
  className,
  ...props
}) => {
  const variantClasses: Record<LabelVariant, string> = {
    default: "text-text-label",
    error: "text-text-error",
    disabled: "text-text-disabled cursor-not-allowed",
    info: "text-blue-600 dark:text-blue-400",
  };

  const sizeClasses: Record<LabelSize, string> = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const weightClasses: Record<LabelWeight, string> = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
  };

  const finalClasses = cn(
    "inline-flex items-center gap-2",
    variantClasses[variant],
    sizeClasses[size],
    weightClasses[weight],
    className
  );

  return (
    <label className={finalClasses} {...props}>
      {children}
      {required && (
        <span className="text-text-error font-medium" aria-label="richiesto">
          *
        </span>
      )}
      {optional && (
        <Badge variant="default" size="xs">
          opzionale
        </Badge>
      )}
    </label>
  );
};

export default Label;
export type { LabelVariant, LabelSize, LabelWeight };
