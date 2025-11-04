// src/core/components/ui/select/Select.tsx
import React, { useState, useId } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "../../../utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<SelectPrimitive.SelectProps, "size"> {
  label: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const Select = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Root>, SelectProps>(
  (
    {
      label,
      options,
      placeholder,
      error,
      helperText,
      fullWidth = true,
      className,
      disabled,
      required,
      value,
      defaultValue,
      onValueChange,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [open, setOpen] = useState(false);
    const id = useId();
    const hasValue = !!(value || defaultValue);
    const isFloating = open || hasValue || !!placeholder;
    const hasError = !!error; // ✨ Logica Semplificata

    const getUnderlineClass = () => {
      if (hasError) return "bg-underline-error";
      if (isFocused || open) return "bg-underline-focus";
      if (hasValue) return "bg-underline-primary";
      return "bg-underline-default";
    };

    return (
      <div className={cn("relative", fullWidth && "w-full", className)}>
        <SelectPrimitive.Root
          value={value}
          defaultValue={defaultValue}
          onValueChange={onValueChange}
          onOpenChange={setOpen}
          disabled={disabled}
          required={required}
          {...props}
        >
          <div className="relative">
            <SelectPrimitive.Trigger
              ref={ref}
              className={cn(
                "relative w-full h-12 pt-6 pb-2 px-0 bg-transparent text-left",
                "focus:outline-none",
                disabled && "cursor-not-allowed opacity-50"
              )}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            >
              <SelectPrimitive.Value placeholder={isFloating ? placeholder : undefined} />
              <label
                className={cn(
                  "absolute left-0 pointer-events-none select-none transition-all duration-200 ease-out",
                  isFloating ? "top-1 text-sm font-medium" : "top-1/2 -translate-y-1/2 text-base text-text-placeholder",
                  (isFocused || open) && !hasError ? "text-text-primary" : "text-text-label",
                  hasError && "text-text-error"
                )}
              >
                {label}
                {required && <span className="text-text-error font-medium ml-1">*</span>}
              </label>
              <SelectPrimitive.Icon className="absolute right-0 top-1/2 -translate-y-1/2">
                <ChevronDown className="h-5 w-5 text-text-secondary" />
              </SelectPrimitive.Icon>
            </SelectPrimitive.Trigger>
            <div className={cn("absolute bottom-0 left-0 right-0 h-px", getUnderlineClass())} />
          </div>

          <SelectPrimitive.Portal>
            <SelectPrimitive.Content
              position="popper"
              sideOffset={4}
              className="z-50 w-[var(--radix-select-trigger-width)] bg-bg-primary rounded-lg border border-border-default shadow-lg"
            >
              <SelectPrimitive.Viewport className="p-1">
                {options.map((option) => (
                  <SelectPrimitive.Item
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className={cn(
                      "relative flex items-center px-3 py-2 text-base rounded-md cursor-pointer",
                      "focus:bg-bg-hover focus:outline-none",
                      "data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed"
                    )}
                  >
                    <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                    <SelectPrimitive.ItemIndicator className="absolute right-3">
                      <Check className="h-4 w-4" />
                    </SelectPrimitive.ItemIndicator>
                  </SelectPrimitive.Item>
                ))}
              </SelectPrimitive.Viewport>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
        {(helperText || error) && (
          <p className={cn("text-sm mt-1", hasError ? "text-text-error" : "text-text-secondary")}>{error || helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;
export type { SelectOption };
