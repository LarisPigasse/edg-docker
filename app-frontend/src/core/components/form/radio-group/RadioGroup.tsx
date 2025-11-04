import React, { useId } from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "../../../utils";

/**
 * Tipi esportati per una maggiore riusabilità e chiarezza.
 */
export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export type RadioGroupOrientation = "vertical" | "horizontal";
export type RadioGroupSize = "sm" | "md" | "lg";

interface RadioGroupProps extends Omit<RadioGroupPrimitive.RadioGroupProps, "size"> {
  label?: string;
  options: RadioOption[];
  error?: string;
  helperText?: string;
  orientation?: RadioGroupOrientation;
  size?: RadioGroupSize;
}

export const RadioGroup = React.forwardRef<React.ElementRef<typeof RadioGroupPrimitive.Root>, RadioGroupProps>(
  (
    {
      label,
      options,
      error,
      helperText,
      orientation = "vertical",
      size = "md",
      className,
      disabled = false,
      required = false,
      ...props
    },
    ref
  ) => {
    const groupId = useId();
    // ✨ Logica di errore semplificata: dipende solo dalla presenza della prop 'error'.
    const hasError = !!error;

    const sizeClasses = {
      sm: { radio: "h-4 w-4", indicator: "h-2 w-2", text: "text-sm", gap: "gap-2" },
      md: { radio: "h-5 w-5", indicator: "h-2.5 w-2.5", text: "text-base", gap: "gap-3" },
      lg: { radio: "h-6 w-6", indicator: "h-3 w-3", text: "text-lg", gap: "gap-3" },
    };
    const sizes = sizeClasses[size];

    const radioItemClasses = cn(
      "aspect-square rounded-full border-2 ring-offset-bg-primary",
      "focus:outline-none focus:ring-2 focus:ring-text-link focus:ring-offset-2",
      "transition-colors duration-200",
      sizes.radio,
      "border-border-default bg-bg-primary hover:border-border-strong",
      "data-[state=checked]:border-text-link",
      hasError && "border-text-error data-[state=checked]:border-text-error",
      "data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed data-[disabled]:hover:border-border-default"
    );

    const indicatorClasses = cn(
      "flex items-center justify-center w-full h-full relative after:content-[''] after:block after:rounded-full after:bg-text-link",
      sizes.indicator,
      hasError && "after:bg-text-error"
    );

    // ✨ Colore della label principale corretto: rimane standard anche in caso di errore per coerenza.
    const groupLabelClasses = cn("font-medium", sizes.text, "text-text-primary");

    return (
      <div className="space-y-2">
        {label && (
          <label className={groupLabelClasses}>
            {label}
            {required && <span className="text-text-error font-medium ml-1">*</span>}
          </label>
        )}

        <RadioGroupPrimitive.Root
          ref={ref}
          className={cn(
            "flex",
            orientation === "vertical" ? "flex-col space-y-3" : "flex-row flex-wrap gap-x-6 gap-y-3",
            className
          )}
          disabled={disabled}
          required={required}
          {...props}
        >
          {options.map((option) => (
            <div key={option.value} className={cn("flex items-start", sizes.gap)}>
              <RadioGroupPrimitive.Item
                value={option.value}
                id={`${groupId}-${option.value}`}
                disabled={option.disabled || disabled}
                className={radioItemClasses}
              >
                <RadioGroupPrimitive.Indicator className={indicatorClasses} />
              </RadioGroupPrimitive.Item>
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor={`${groupId}-${option.value}`}
                  className={cn(
                    "font-medium text-text-primary cursor-pointer",
                    sizes.text,
                    (option.disabled || disabled) && "cursor-not-allowed opacity-70"
                  )}
                >
                  {option.label}
                </label>
                {option.description && (
                  <p className={cn("text-text-secondary", size === "sm" ? "text-xs" : "text-sm")}>{option.description}</p>
                )}
              </div>
            </div>
          ))}
        </RadioGroupPrimitive.Root>

        {(helperText || error) && (
          <p className={cn("text-sm", hasError ? "text-text-error" : "text-text-secondary")}>{error || helperText}</p>
        )}
      </div>
    );
  }
);

RadioGroup.displayName = "RadioGroup";

export default RadioGroup;
