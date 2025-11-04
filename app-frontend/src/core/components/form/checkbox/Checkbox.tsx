// src/core/components/ui/checkbox/Checkbox.tsx
import React, { useId } from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import { cn } from "../../../utils";

// ✨ NUOVO: Tipi esportati per size
export type CheckboxSize = "sm" | "md" | "lg";

interface CheckboxProps extends Omit<CheckboxPrimitive.CheckboxProps, "asChild"> {
  label?: string;
  description?: string;
  indeterminate?: boolean;
  error?: string;
  size?: CheckboxSize;
  className?: string;
}

export const Checkbox = React.forwardRef<React.ElementRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
  (
    {
      label,
      description,
      checked,
      indeterminate = false,
      disabled = false,
      required = false,
      error,
      size = "md",
      onCheckedChange,
      className,
      id: providedId,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const hasError = !!error; // ✨ Logica Semplificata

    const sizeClasses = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-6 w-6" };
    const iconSizes = { sm: "h-3 w-3", md: "h-4 w-4", lg: "h-5 w-5" };
    const textSizes = { sm: "text-sm", md: "text-base", lg: "text-lg" };

    const checkboxClasses = cn(
      "shrink-0 rounded border-2 ring-offset-bg-primary",
      "focus:outline-none focus:ring-2 focus:ring-text-link focus:ring-offset-2",
      "transition-all duration-200 ease-in-out",
      sizeClasses[size],
      "border-border-strong bg-bg-primary hover:border-border-strong",
      "data-[state=checked]:bg-text-link data-[state=checked]:border-text-link",
      "data-[state=indeterminate]:bg-text-link data-[state=indeterminate]:border-text-link",
      hasError && [
        "border-text-error",
        "data-[state=checked]:bg-text-error data-[state=checked]:border-text-error",
        "data-[state=indeterminate]:bg-text-error data-[state=indeterminate]:border-text-error",
      ],
      disabled && "opacity-50 cursor-not-allowed hover:border-border-default",
      className
    );

    const containerClasses = cn("flex items-start gap-3", disabled && "cursor-not-allowed");

    // ✨ FIX: Colore label sempre primary
    const labelClasses = cn(
      "leading-none font-medium text-text-primary",
      "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      textSizes[size]
    );

    const descriptionClasses = cn("text-text-secondary mt-1", size === "sm" ? "text-xs" : "text-sm");

    return (
      <div className="space-y-2">
        <div className={containerClasses}>
          <CheckboxPrimitive.Root
            ref={ref}
            id={id}
            className={checkboxClasses}
            checked={indeterminate ? "indeterminate" : checked}
            disabled={disabled}
            required={required}
            onCheckedChange={onCheckedChange}
            {...props}
          >
            <CheckboxPrimitive.Indicator className="flex items-center justify-center text-white">
              {indeterminate ? <Minus className={iconSizes[size]} /> : <Check className={iconSizes[size]} />}
            </CheckboxPrimitive.Indicator>
          </CheckboxPrimitive.Root>

          {(label || description || error) && (
            <div className="grid gap-1.5 leading-none">
              {label && (
                <label htmlFor={id} className={labelClasses}>
                  {label}
                  {required && (
                    <span className="text-text-error font-medium ml-1" aria-label="richiesto">
                      *
                    </span>
                  )}
                </label>
              )}
              {description && <p className={descriptionClasses}>{description}</p>}
              {error && <p className="text-sm text-text-error">{error}</p>}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
export type { CheckboxSize };
export default Checkbox;
