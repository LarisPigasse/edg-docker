// src/core/components/ui/DatePicker.tsx
import React, { useState, useRef, useEffect } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { ThemedSurface, ThemedText } from "../../atomic";
import { cn } from "../../../utils";

export type DatePickerFormat = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
export type DatePickerSize = "sm" | "md" | "lg";

interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  /** Etichetta del campo (floating label) */
  label: string;
  /** Valore della data selezionata */
  value?: Date;
  /** Callback quando cambia la data */
  onChange?: (date: Date | undefined) => void;
  /** Formato di visualizzazione */
  format?: DatePickerFormat;
  /** Data minima selezionabile */
  minDate?: Date;
  /** Data massima selezionabile */
  maxDate?: Date;
  /** Date disabilitate */
  disabledDates?: Date[];
  /** Messaggio di errore */
  error?: string;
  /** Testo di aiuto */
  helperText?: string;
  /** Campo obbligatorio */
  required?: boolean;
  /** Dimensione del componente */
  size?: DatePickerSize;
  /** Larghezza completa */
  fullWidth?: boolean;
  /** Placeholder personalizzato */
  placeholder?: string;
}

/**
 * DatePicker - Componente per selezione date con calendario popup.
 *
 * Features:
 * - Floating label consistente con Input/Select
 * - Popup calendar con Radix Popover per positioning
 * - Input text per digitare date + validazione
 * - Navigazione mese/anno con keyboard support
 * - Formati multipli (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
 * - Min/max dates e disabled dates
 * - Error states integrati con theme system
 * - Theme integration completa
 */
export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  format = "DD/MM/YYYY",
  minDate,
  maxDate,
  disabledDates = [],
  error,
  helperText,
  required = false,
  size = "md",
  fullWidth = false,
  placeholder,
  disabled = false,
  className = "",
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [viewDate, setViewDate] = useState(value || new Date());
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Configuration for sizes
  const sizeConfig = {
    sm: {
      container: "h-10",
      input: "text-sm px-3 py-2",
      label: "text-xs px-3",
      icon: "w-4 h-4",
      calendar: "text-sm",
    },
    md: {
      container: "h-12",
      input: "text-base px-4 py-3",
      label: "text-sm px-4",
      icon: "w-5 h-5",
      calendar: "text-base",
    },
    lg: {
      container: "h-14",
      input: "text-lg px-5 py-4",
      label: "text-base px-5",
      icon: "w-6 h-6",
      calendar: "text-lg",
    },
  };

  const config = sizeConfig[size];

  // Format date to string
  const formatDate = (date: Date): string => {
    if (!date || isNaN(date.getTime())) return "";

    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear().toString();

    switch (format) {
      case "MM/DD/YYYY":
        return `${month}/${day}/${year}`;
      case "YYYY-MM-DD":
        return `${year}-${month}-${day}`;
      default: // DD/MM/YYYY
        return `${day}/${month}/${year}`;
    }
  };

  // Parse string to date
  const parseDate = (dateString: string): Date | null => {
    if (!dateString) return null;

    let day: number, month: number, year: number;

    switch (format) {
      case "MM/DD/YYYY": {
        const parts = dateString.split("/");
        if (parts.length !== 3) return null;
        month = parseInt(parts[0], 10);
        day = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);
        break;
      }
      case "YYYY-MM-DD": {
        const parts = dateString.split("-");
        if (parts.length !== 3) return null;
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
        break;
      }
      default: {
        // DD/MM/YYYY
        const parts = dateString.split("/");
        if (parts.length !== 3) return null;
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);
        break;
      }
    }

    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1000) return null;

    const date = new Date(year, month - 1, day);
    return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year ? date : null;
  };

  // Update input value when external value changes
  useEffect(() => {
    setInputValue(value ? formatDate(value) : "");
    if (value) {
      setViewDate(value);
    }
  }, [value, format]);

  // Check if date is disabled
  const isDateDisabled = (date: Date): boolean => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return disabledDates.some((disabledDate) => date.toDateString() === disabledDate.toDateString());
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    const parsedDate = parseDate(newValue);
    if (parsedDate && !isDateDisabled(parsedDate)) {
      onChange?.(parsedDate);
      setViewDate(parsedDate);
    } else if (!newValue) {
      onChange?.(undefined);
    }
  };

  // Handle date selection from calendar
  const handleDateSelect = (date: Date) => {
    if (isDateDisabled(date)) return;

    onChange?.(date);
    setInputValue(formatDate(date));
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Navigate month
  const navigateMonth = (direction: "prev" | "next") => {
    setViewDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1));
      return newDate;
    });
  };

  // Navigate year
  const navigateYear = (direction: "prev" | "next") => {
    setViewDate((prev) => {
      const newDate = new Date(prev);
      newDate.setFullYear(prev.getFullYear() + (direction === "next" ? 1 : -1));
      return newDate;
    });
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);

    // Start from Monday
    const dayOfWeek = (firstDay.getDay() + 6) % 7;
    startDate.setDate(startDate.getDate() - dayOfWeek);

    const days = [];
    const current = new Date(startDate);

    // Generate 6 weeks = 42 days
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  // Floating label logic
  const hasValue = Boolean(inputValue);
  const isFloating = isFocused || hasValue || Boolean(placeholder);

  // Error state
  const hasError = Boolean(error);

  // Underline classes
  const getUnderlineClass = () => {
    if (hasError) return "bg-underline-error";
    if (isFocused) return "bg-underline-focus";
    if (hasValue) return "bg-underline-primary";
    return "bg-underline-default";
  };

  const days = generateCalendarDays();
  const today = new Date();
  const monthNames = [
    "Gennaio",
    "Febbraio",
    "Marzo",
    "Aprile",
    "Maggio",
    "Giugno",
    "Luglio",
    "Agosto",
    "Settembre",
    "Ottobre",
    "Novembre",
    "Dicembre",
  ];
  const dayNames = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

  return (
    <div className={cn("relative", fullWidth ? "w-full" : "w-auto", className)}>
      <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
        <Popover.Trigger asChild>
          <div className={cn("relative cursor-text", fullWidth ? "w-full" : "w-auto", disabled && "cursor-not-allowed")}>
            {/* Input Container */}
            <ThemedSurface
              variant="primary"
              borderVariant="none"
              className={cn(
                "relative transition-all duration-200",
                config.container,
                fullWidth ? "w-full" : "min-w-[200px]",
                disabled && "opacity-60"
              )}
            >
              {/* Input */}
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onFocus={() => {
                  setIsFocused(true);
                  if (!disabled) setIsOpen(true);
                }}
                onBlur={() => setIsFocused(false)}
                placeholder={isFloating ? placeholder : undefined}
                disabled={disabled}
                className={cn(
                  "w-full bg-transparent border-0 outline-none resize-none",
                  "text-text-primary placeholder-text-placeholder",
                  config.input,
                  "pr-10" // Space for icon
                )}
                {...props}
              />

              {/* Floating Label */}
              <label
                className={cn(
                  "absolute left-0 transition-all duration-200 ease-out pointer-events-none",
                  "text-text-label select-none",
                  config.label,
                  isFloating ? "top-1 transform scale-90 origin-left" : "top-1/2 transform -translate-y-1/2 scale-100"
                )}
              >
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {/* Calendar Icon */}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <Calendar className={cn(config.icon, "text-text-secondary")} />
              </div>

              {/* Underline */}
              <div className={cn("absolute bottom-0 left-0 h-0.5 w-full transition-all duration-200", getUnderlineClass())} />
            </ThemedSurface>
          </div>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content className="z-50" sideOffset={4} align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
            <ThemedSurface
              variant="primary"
              borderVariant="default"
              className={cn("p-4 rounded-lg border shadow-lg min-w-[280px]", config.calendar)}
            >
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigateYear("prev")}
                    className="p-1 hover:bg-bg-hover rounded transition-colors"
                    disabled={disabled}
                  >
                    <ChevronLeft className={cn(config.icon, "text-text-secondary")} />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateMonth("prev")}
                    className="p-1 hover:bg-bg-hover rounded transition-colors"
                    disabled={disabled}
                  >
                    <ChevronLeft className={cn(config.icon, "text-text-secondary")} />
                  </button>
                </div>

                <ThemedText variant="primary" className="font-semibold text-center flex-1">
                  {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                </ThemedText>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigateMonth("next")}
                    className="p-1 hover:bg-bg-hover rounded transition-colors"
                    disabled={disabled}
                  >
                    <ChevronRight className={cn(config.icon, "text-text-secondary")} />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateYear("next")}
                    className="p-1 hover:bg-bg-hover rounded transition-colors"
                    disabled={disabled}
                  >
                    <ChevronRight className={cn(config.icon, "text-text-secondary")} />
                  </button>
                </div>
              </div>

              {/* Day Names */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map((day) => (
                  <div key={day} className="h-8 flex items-center justify-center">
                    <ThemedText variant="secondary" className="text-xs font-medium">
                      {day}
                    </ThemedText>
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => {
                  const isCurrentMonth = day.getMonth() === viewDate.getMonth();
                  const isToday = day.toDateString() === today.toDateString();
                  const isSelected = value && day.toDateString() === value.toDateString();
                  const isDisabled = isDateDisabled(day);

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleDateSelect(day)}
                      disabled={isDisabled || disabled}
                      className={cn(
                        "h-8 w-8 flex items-center justify-center rounded transition-all duration-150",
                        "text-sm font-medium",
                        // Base states
                        isCurrentMonth ? "text-text-primary" : "text-text-disabled",
                        // Interactive states
                        !isDisabled && !disabled && "hover:bg-bg-hover",
                        // Today
                        isToday && "bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-400",
                        // Selected
                        isSelected && "bg-violet-600 text-white hover:bg-violet-700",
                        // Disabled
                        isDisabled && "opacity-50 cursor-not-allowed",
                        // Focus
                        "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1"
                      )}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>

              {/* Footer with Today button */}
              <div className="flex justify-center mt-4 pt-3 border-t border-border-default">
                <button
                  type="button"
                  onClick={() => handleDateSelect(new Date())}
                  disabled={isDateDisabled(new Date()) || disabled}
                  className={cn(
                    "px-3 py-1 text-sm font-medium rounded transition-colors",
                    "text-violet-600 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-900/50",
                    "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1",
                    isDateDisabled(new Date()) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  Oggi
                </button>
              </div>
            </ThemedSurface>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {/* Helper Text / Error */}
      {(error || helperText) && (
        <div className="mt-1 px-1">
          <ThemedText
            variant={error ? "primary" : "secondary"}
            className={cn("text-xs", error && "text-red-500 dark:text-red-400")}
          >
            {error || helperText}
          </ThemedText>
        </div>
      )}
    </div>
  );
};

export type { DatePickerFormat, DatePickerSize };
export default DatePicker;
