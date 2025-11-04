// src/core/components/ui/input/Input.tsx
import React, { useState, useId } from "react";
import { cn } from "../../../utils";

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "placeholder"> {
  label: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  required?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = true,
      required = false,
      className,
      disabled,
      value,
      defaultValue,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(Boolean(value || defaultValue));
    const id = useId();

    const isFloating = isFocused || hasValue;
    const hasError = !!error; // ✨ Logica Semplificata

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(e.target.value !== "");
      props.onChange?.(e);
    };

    // ... (tutte le definizioni di `*Classes` rimangono invariate, usando 'hasError') ...
    const containerClasses = cn("relative", fullWidth && "w-full");
    const inputClasses = cn(
      "w-full bg-transparent border-none outline-none pt-6 pb-2 px-0 text-base leading-6 text-text-primary",
      disabled && "text-text-disabled cursor-not-allowed",
      "autofill:bg-transparent autofill:shadow-[inset_0_0_0px_1000px_rgb(255,255,255,0)] dark:autofill:shadow-[inset_0_0_0px_1000px_rgb(26,31,46,1)]",
      className
    );
    const labelClasses = cn(
      "absolute left-0 pointer-events-none select-none transition-all duration-200 ease-out text-text-label",
      isFloating
        ? ["top-1 text-sm font-medium", isFocused && !hasError && "text-text-primary", hasError && "text-text-error"]
        : ["top-1/2 -translate-y-1/2 text-base text-text-placeholder"],
      disabled && "text-text-disabled"
    );
    const underlineClasses = cn(
      "absolute bottom-0 left-0 right-0 h-px transition-all duration-200 ease-out",
      disabled
        ? "bg-border-thin"
        : hasError
        ? "bg-underline-error"
        : isFocused
        ? "bg-underline-focus"
        : hasValue
        ? "bg-underline-primary"
        : "bg-underline-default"
    );

    return (
      <div className={containerClasses}>
        <div className="relative rounded-t-lg">
          <input
            ref={ref}
            id={id}
            className={inputClasses}
            disabled={disabled}
            value={value}
            defaultValue={defaultValue}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            required={required}
            {...props}
          />
          <label htmlFor={id} className={labelClasses}>
            {label}
            {required && (
              <span className="text-text-error font-medium ml-1" aria-label="richiesto">
                *
              </span>
            )}
          </label>
          <div className={underlineClasses} />
        </div>
        {(helperText || error) && (
          <div className="mt-1 px-0">
            <span className={cn("text-sm", error ? "text-text-error" : "text-text-secondary")}>{error || helperText}</span>
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
