// src/core/components/ui/form-field/FormField.tsx
import React, { useId } from "react";
import { cn } from "../../../utils";

// ✨ NUOVO: Tipi esportati
export type FormFieldSize = "sm" | "md" | "lg";
export type FormFieldSpacing = "tight" | "normal" | "loose";

interface FormFieldProps {
  children: React.ReactNode;
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  description?: string;
  size?: FormFieldSize; // ✨ Usa tipo custom
  spacing?: FormFieldSpacing; // ✨ Usa tipo custom
  className?: string;
  labelClassName?: string;
  errorClassName?: string;
  helperClassName?: string;
  hideLabel?: boolean;
}

export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  (
    {
      children,
      label,
      required = false,
      error,
      helperText,
      description,
      size = "md",
      spacing = "normal",
      className,
      labelClassName,
      hideLabel = false,
      ...props
    },
    ref
  ) => {
    const id = useId();
    const hasError = Boolean(error);
    const sizeClasses = {
      sm: { label: "text-sm", helper: "text-xs" },
      md: { label: "text-base", helper: "text-sm" },
      lg: { label: "text-lg", helper: "text-base" },
    };
    const spacingClasses = { tight: "space-y-1", normal: "space-y-2", loose: "space-y-3" };
    const sizes = sizeClasses[size];

    // ✨ FIX: Colore label sempre 'text-text-label'
    const finalLabelClasses = cn("block font-medium leading-none", sizes.label, "text-text-label", labelClassName);
    const descriptionClasses = cn("leading-relaxed", sizes.helper, "text-text-secondary");
    const errorClasses = cn("leading-relaxed", sizes.helper, "text-text-error"); // Le classi error/helper possono usare la stessa dimensione
    const helperClasses = cn("leading-relaxed", sizes.helper, "text-text-secondary");

    const childrenWithProps = React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, {
          id: child.props.id || id,
          "aria-describedby": error ? `${id}-error` : helperText ? `${id}-helper` : undefined,
          "aria-invalid": hasError ? "true" : undefined,
        } as React.HTMLAttributes<HTMLElement>);
      }
      return child;
    });

    return (
      <div ref={ref} className={cn("w-full", spacingClasses[spacing], className)} {...props}>
        {!hideLabel && label && (
          <label htmlFor={id} className={finalLabelClasses}>
            {label}
            {required && (
              <span className="text-text-error font-medium ml-1" aria-label="richiesto">
                *
              </span>
            )}
          </label>
        )}

        {description && <p className={descriptionClasses}>{description}</p>}

        <div>{childrenWithProps}</div>

        {error && (
          <p id={`${id}-error`} className={errorClasses} role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${id}-helper`} className={helperClasses}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";

export default FormField;
export type { FormFieldSize, FormFieldSpacing };
