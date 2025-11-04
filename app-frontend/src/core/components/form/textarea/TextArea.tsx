// src/core/components/ui/textarea/TextArea.tsx
import React, { useState, useId, useRef, useEffect } from "react";
import { cn } from "../../../utils";

interface TextAreaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "placeholder"> {
  label: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  autoResize?: boolean;
  minRows?: number;
  maxRows?: number;
  showCharCount?: boolean;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = true,
      required = false,
      autoResize = true,
      minRows = 3,
      maxRows = 8,
      showCharCount = false,
      maxLength,
      className,
      disabled,
      value,
      defaultValue,
      onFocus,
      onBlur,
      onChange,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const id = useId();

    const hasValue = !!(typeof value === "string" && value.length > 0) || !!defaultValue;
    const isFloating = isFocused || hasValue;
    const hasError = !!error;

    useEffect(() => {
      const textarea = internalRef.current;
      if (textarea && autoResize) {
        textarea.style.height = "auto";
        const scrollHeight = textarea.scrollHeight;
        const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
        const minHeight = minRows * lineHeight;
        const maxHeight = maxRows * lineHeight;

        const targetHeight = Math.max(minHeight, scrollHeight);

        if (targetHeight > maxHeight) {
          textarea.style.overflowY = "auto";
          textarea.style.height = `${maxHeight}px`;
        } else {
          textarea.style.overflowY = "hidden";
          textarea.style.height = `${targetHeight}px`;
        }
      }
    }, [value, autoResize, minRows, maxRows]);

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    // ✨ CORREZIONE: Corpo della funzione completato
    const getUnderlineClass = () => {
      if (hasError) return "bg-underline-error";
      if (isFocused) return "bg-underline-focus";
      if (hasValue) return "bg-underline-primary";
      return "bg-underline-default";
    };

    // ✨ CORREZIONE: Classi completate
    const textareaClasses = cn(
      "w-full bg-transparent border-none outline-none resize-none",
      "pt-6 pb-2 px-0",
      "text-base leading-6",
      "text-text-primary",
      disabled && "text-text-disabled cursor-not-allowed",
      className
    );

    // ✨ CORREZIONE: Classi completate
    const labelClasses = cn(
      "absolute left-0 pointer-events-none select-none",
      "transition-all duration-200 ease-out",
      isFloating
        ? ["top-1 text-sm font-medium", isFocused && !hasError ? "text-text-primary" : "text-text-label"]
        : ["top-1/2 -translate-y-1/2 text-base", "text-text-placeholder"],
      hasError && "text-text-error",
      disabled && "text-text-disabled"
    );

    const charCount = typeof value === "string" ? value.length : defaultValue ? String(defaultValue).length : 0;
    const isNearLimit = maxLength && charCount > maxLength * 0.8;
    const isOverLimit = maxLength && charCount > maxLength;

    return (
      <div className={cn("relative", fullWidth && "w-full")}>
        <div className="relative">
          <textarea
            ref={(node) => {
              (internalRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
              if (typeof ref === "function") ref(node);
              else if (ref) ref.current = node;
            }}
            id={id}
            className={textareaClasses}
            disabled={disabled}
            value={value}
            defaultValue={defaultValue}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={onChange}
            required={required}
            maxLength={maxLength}
            rows={minRows}
            {...props}
          />
          <label htmlFor={id} className={labelClasses}>
            {label}
            {required && <span className="text-text-error font-medium ml-1">*</span>}
          </label>
          <div className={cn("absolute bottom-0 left-0 right-0 h-px", getUnderlineClass())} />
        </div>
        <div className="mt-1.5 flex justify-between items-start">
          <span className={cn("text-sm", hasError ? "text-text-error" : "text-text-secondary")}>{error || helperText}</span>
          {showCharCount && (
            <span
              className={cn(
                "text-sm ml-2 flex-shrink-0",
                isOverLimit ? "text-text-error" : isNearLimit ? "text-yellow-600" : "text-text-secondary"
              )}
            >
              {charCount}
              {maxLength && `/${maxLength}`}
            </span>
          )}
        </div>
      </div>
    );
  }
);

TextArea.displayName = "TextArea";
export default TextArea;
