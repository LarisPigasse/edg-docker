// src/core/components/ui/switch/Switch.tsx
import React, { useId } from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "../../../utils";

export type SwitchSize = "sm" | "md" | "lg";

interface SwitchProps extends Omit<SwitchPrimitive.SwitchProps, "size"> {
  label?: string;
  description?: string;
  error?: string;
  size?: SwitchSize;
  id?: string;
}

export const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitive.Root>, SwitchProps>(
  (
    { label, description, error, size = "md", className, id: providedId, disabled = false, required = false, ...props },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const hasError = !!error; // ✨ Logica Semplificata

    const switchSizes = { sm: "h-5 w-9", md: "h-6 w-11", lg: "h-7 w-[3.25rem]" };
    const thumbSizes = {
      sm: "h-4 w-4 data-[state=checked]:translate-x-4",
      md: "h-5 w-5 data-[state=checked]:translate-x-5",
      lg: "h-6 w-6 data-[state=checked]:translate-x-6",
    };
    const textSizes = { sm: "text-sm", md: "text-base", lg: "text-lg" };

    const switchClasses = cn(
      "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
      "transition-colors duration-200 ease-in-out",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-link focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary",
      switchSizes[size],
      "data-[state=unchecked]:bg-border-strong hover:data-[state=unchecked]:bg-border-default",
      "data-[state=checked]:bg-text-link",
      hasError && "data-[state=unchecked]:bg-text-error/50 data-[state=checked]:bg-text-error",
      "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
    );

    const thumbClasses = cn(
      "pointer-events-none block rounded-full bg-white shadow-lg ring-0",
      "transition-transform duration-200 ease-in-out",
      "data-[state=unchecked]:translate-x-0",
      thumbSizes[size]
    );

    return (
      <div className={cn("flex items-center gap-3", className)}>
        <SwitchPrimitive.Root ref={ref} id={id} className={switchClasses} disabled={disabled} required={required} {...props}>
          <SwitchPrimitive.Thumb className={thumbClasses} />
        </SwitchPrimitive.Root>

        {(label || description || error) && (
          <div className="grid gap-1.5 leading-none">
            {label && (
              <label htmlFor={id} className={cn("font-medium text-text-primary cursor-pointer", textSizes[size])}>
                {label}
                {required && <span className="text-text-error font-medium ml-1">*</span>}
              </label>
            )}
            {description && <p className={cn("text-text-secondary", size === "sm" ? "text-xs" : "text-sm")}>{description}</p>}
            {error && <p className="text-sm text-text-error">{error}</p>}
          </div>
        )}
      </div>
    );
  }
);

Switch.displayName = "Switch";
export default Switch;
export type { SwitchSize };
