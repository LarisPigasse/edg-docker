// src/core/components/ui/separator/Separator.tsx
import React from "react";
import { cn } from "../../../utils";

export type SeparatorOrientation = "horizontal" | "vertical";
export type SeparatorVariant = "default" | "subtle";

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: SeparatorOrientation;
  variant?: SeparatorVariant;
  children?: React.ReactNode;
  className?: string;
}

export const Separator: React.FC<SeparatorProps> = ({
  orientation = "horizontal",
  variant = "default",
  children,
  className = "",
  ...props
}) => {
  const variantClasses = {
    default: "border-border-default",
    subtle: "border-border-thin",
  };
  const finalOrientation = children ? "horizontal" : orientation;

  if (children && finalOrientation === "horizontal") {
    return (
      <div className={cn("relative flex items-center", className)} role="separator" {...props}>
        <div className={cn("flex-1 border-t", variantClasses[variant])} />
        <div className="px-3 text-xs font-medium text-text-secondary">{children}</div>
        <div className={cn("flex-1 border-t", variantClasses[variant])} />
      </div>
    );
  }

  if (finalOrientation === "vertical") {
    return (
      <div
        className={cn("border-l", variantClasses[variant], className)}
        role="separator"
        aria-orientation="vertical"
        {...props}
      />
    );
  }

  return (
    <hr
      className={cn("border-t", variantClasses[variant], className)}
      role="separator"
      aria-orientation="horizontal"
      {...props}
    />
  );
};

export default Separator;
export type { SeparatorOrientation, SeparatorVariant };
