// src/core/components/ui/multi-select/MultiSelect.tsx
import React, { useState, useId } from "react";
import * as Popover from "@radix-ui/react-popover";
import { ChevronDown, X } from "lucide-react";
import { cn } from "../../../utils";
import { Checkbox } from "../checkbox/Checkbox";
import { Badge } from "../../ui";
import { ThemedText } from "../../atomic";

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface MultiSelectProps {
  label: string;
  options: MultiSelectOption[];
  value: string[]; // Array di valori selezionati
  onChange: (selected: string[]) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const id = useId();
  const hasValue = value.length > 0;
  const isFloating = open || hasValue || !!placeholder;
  const hasError = !!error;

  const handleSelect = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((item) => item !== optionValue)); // Deseleziona
    } else {
      onChange([...value, optionValue]); // Seleziona
    }
  };

  const getUnderlineClass = () => {
    if (hasError) return "bg-underline-error";
    if (open) return "bg-underline-focus";
    if (hasValue) return "bg-underline-primary";
    return "bg-underline-default";
  };

  return (
    <div className={cn("relative w-full", className)}>
      <Popover.Root open={open} onOpenChange={setOpen}>
        {/* 1. Il Trigger: un finto Input che mostra i tag */}
        <Popover.Trigger asChild disabled={disabled}>
          <div
            className={cn(
              "relative w-full min-h-[3rem] pt-5 pb-1 px-0 bg-transparent text-left cursor-pointer",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            <div className="flex flex-wrap items-center gap-1">
              {hasValue
                ? value.map((val) => {
                    const option = options.find((opt) => opt.value === val);
                    return (
                      <Badge key={val} variant="info" size="md" className="flex items-center gap-1">
                        {option?.label || val}
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Evita che il click apra/chiuda il popover
                            handleSelect(val);
                          }}
                          className="rounded-full hover:bg-black/10"
                          aria-label={`Rimuovi ${option?.label}`}
                        >
                          <X size={12} />
                        </button>
                      </Badge>
                    );
                  })
                : isFloating && (
                    <ThemedText variant="placeholder" className="ml-1">
                      {placeholder}
                    </ThemedText>
                  )}
            </div>

            <label
              className={cn(
                "absolute left-0 pointer-events-none select-none transition-all duration-200 ease-out",
                isFloating ? "top-0 text-sm font-medium" : "top-1/2 -translate-y-1/2 text-base",
                open && !hasError ? "text-text-primary" : "text-text-label",
                hasError && "text-text-error"
              )}
            >
              {label}
              {required && <span className="text-text-error font-medium ml-1">*</span>}
            </label>
            <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary" />
            <div className={cn("absolute bottom-0 left-0 right-0 h-px", getUnderlineClass())} />
          </div>
        </Popover.Trigger>

        {/* 2. Il Contenuto: una tendina con i nostri Checkbox */}
        <Popover.Portal>
          <Popover.Content
            sideOffset={4}
            align="start"
            className="z-50 w-[var(--radix-popover-trigger-width)] bg-bg-primary rounded-lg border border-border-default shadow-lg p-2"
          >
            <div className="max-h-60 overflow-y-auto space-y-1">
              {options.map((option) => (
                <div key={option.value} className="flex items-center p-2 rounded hover:bg-bg-hover">
                  <Checkbox
                    id={`${id}-${option.value}`}
                    checked={value.includes(option.value)}
                    onCheckedChange={() => handleSelect(option.value)}
                    disabled={option.disabled}
                    label={option.label}
                  />
                </div>
              ))}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      {(helperText || error) && (
        <p className={cn("text-sm mt-1", hasError ? "text-text-error" : "text-text-secondary")}>{error || helperText}</p>
      )}
    </div>
  );
};

export default MultiSelect;
export type { MultiSelectOption };
