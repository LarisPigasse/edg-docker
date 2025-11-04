// src/core/components/ui/TimePicker.tsx
import React, { useState, useRef, useEffect, useMemo } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Clock, ChevronUp, ChevronDown } from "lucide-react";
import { ThemedSurface, ThemedText } from "../../atomic";
import { cn } from "../../../utils";

export interface TimeValue {
  hours: number;
  minutes: number;
}

interface TimePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  /** Etichetta del campo (floating label) */
  label: string;
  /** Valore dell'orario selezionato */
  value?: TimeValue;
  /** Callback quando cambia l'orario */
  onChange?: (time: TimeValue | undefined) => void;
  /** Formato di visualizzazione */
  format?: "12h" | "24h";
  /** Step in minuti per l'incremento */
  step?: 5 | 10 | 15 | 30;
  /** Orario minimo selezionabile */
  minTime?: TimeValue;
  /** Orario massimo selezionabile */
  maxTime?: TimeValue;
  /** Messaggio di errore */
  error?: string;
  /** Testo di aiuto */
  helperText?: string;
  /** Campo obbligatorio */
  required?: boolean;
  /** Dimensione del componente */
  size?: "sm" | "md" | "lg";
  /** Larghezza completa */
  fullWidth?: boolean;
  /** Placeholder personalizzato */
  placeholder?: string;
}

/**
 * TimePicker - Componente per selezione orario con dropdown scrollabile.
 *
 * Features:
 * - Floating label consistente con DatePicker
 * - Dropdown con ore/minuti scrollabili
 * - Format 12h/24h con AM/PM selector
 * - Step intervals configurabili (5, 10, 15, 30 min)
 * - Min/max time per working hours
 * - Input editabile con parsing HH:MM
 * - Theme integration completa
 * - Keyboard navigation con arrows
 */
export const TimePicker: React.FC<TimePickerProps> = ({
  label,
  value,
  onChange,
  format = "24h",
  step = 15,
  minTime,
  maxTime,
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
  const [isFocused, setIsFocused] = useState(false);
  const [selectedHour, setSelectedHour] = useState(value?.hours ?? 9);
  const [selectedMinute, setSelectedMinute] = useState(value?.minutes ?? 0);
  const [amPm, setAmPm] = useState<"AM" | "PM">("AM");
  const inputRef = useRef<HTMLInputElement>(null);

  // Configuration for sizes
  const sizeConfig = {
    sm: {
      container: "h-10",
      input: "text-sm px-3 py-2",
      label: "text-xs px-3",
      icon: "w-4 h-4",
      dropdown: "text-sm",
    },
    md: {
      container: "h-12",
      input: "text-base px-4 py-3",
      label: "text-sm px-4",
      icon: "w-5 h-5",
      dropdown: "text-base",
    },
    lg: {
      container: "h-14",
      input: "text-lg px-5 py-4",
      label: "text-base px-5",
      icon: "w-6 h-6",
      dropdown: "text-lg",
    },
  };

  const config = sizeConfig[size];

  // Generate time options based on step
  const timeOptions = useMemo(() => {
    const options = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += step) {
        options.push({ hours: h, minutes: m });
      }
    }
    return options;
  }, [step]);

  // Generate hour options (12h or 24h)
  const hourOptions = useMemo(() => {
    if (format === "12h") {
      return Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i));
    }
    return Array.from({ length: 24 }, (_, i) => i);
  }, [format]);

  // Generate minute options based on step
  const minuteOptions = useMemo(() => {
    return Array.from({ length: 60 / step }, (_, i) => i * step);
  }, [step]);

  // Format time to string
  const formatTime = (time: TimeValue): string => {
    if (!time) return "";

    const { hours, minutes } = time;

    if (format === "12h") {
      const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      const period = hours >= 12 ? "PM" : "AM";
      return `${displayHour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${period}`;
    }

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  // Parse string to time
  const parseTime = (timeString: string): TimeValue | null => {
    if (!timeString) return null;

    const timeRegex = format === "12h" ? /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i : /^(\d{1,2}):(\d{2})$/;

    const match = timeString.match(timeRegex);
    if (!match) return null;

    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);

    if (format === "12h") {
      const period = match[3].toUpperCase();
      if (hours === 12 && period === "AM") hours = 0;
      if (hours !== 12 && period === "PM") hours += 12;
    }

    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

    return { hours, minutes };
  };

  // Check if time is in valid range
  const isTimeInRange = (time: TimeValue): boolean => {
    const timeInMinutes = time.hours * 60 + time.minutes;

    if (minTime) {
      const minInMinutes = minTime.hours * 60 + minTime.minutes;
      if (timeInMinutes < minInMinutes) return false;
    }

    if (maxTime) {
      const maxInMinutes = maxTime.hours * 60 + maxTime.minutes;
      if (timeInMinutes > maxInMinutes) return false;
    }

    return true;
  };

  // Update input value when external value changes
  useEffect(() => {
    if (value) {
      setInputValue(formatTime(value));
      setSelectedHour(
        format === "12h" ? (value.hours === 0 ? 12 : value.hours > 12 ? value.hours - 12 : value.hours) : value.hours
      );
      setSelectedMinute(value.minutes);
      setAmPm(value.hours >= 12 ? "PM" : "AM");
    } else {
      setInputValue("");
    }
  }, [value, format]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    const parsedTime = parseTime(newValue);
    if (parsedTime && isTimeInRange(parsedTime)) {
      onChange?.(parsedTime);
      setSelectedHour(
        format === "12h"
          ? parsedTime.hours === 0
            ? 12
            : parsedTime.hours > 12
            ? parsedTime.hours - 12
            : parsedTime.hours
          : parsedTime.hours
      );
      setSelectedMinute(parsedTime.minutes);
      setAmPm(parsedTime.hours >= 12 ? "PM" : "AM");
    } else if (!newValue) {
      onChange?.(undefined);
    }
  };

  // Handle time selection from dropdown
  const handleTimeSelect = () => {
    let finalHours = selectedHour;

    if (format === "12h") {
      if (selectedHour === 12 && amPm === "AM") finalHours = 0;
      else if (selectedHour !== 12 && amPm === "PM") finalHours = selectedHour + 12;
    }

    const newTime: TimeValue = { hours: finalHours, minutes: selectedMinute };

    if (isTimeInRange(newTime)) {
      onChange?.(newTime);
      setInputValue(formatTime(newTime));
      setIsOpen(false);
      inputRef.current?.focus();
    }
  };

  // Handle hour change
  const handleHourChange = (newHour: number) => {
    setSelectedHour(newHour);
    // Auto-apply time when both hour and minute are selected
    setTimeout(() => handleTimeSelect(), 100);
  };

  // Handle minute change
  const handleMinuteChange = (newMinute: number) => {
    setSelectedMinute(newMinute);
    // Auto-apply time when both hour and minute are selected
    setTimeout(() => handleTimeSelect(), 100);
  };

  // Handle AM/PM change
  const handleAmPmChange = (newAmPm: "AM" | "PM") => {
    setAmPm(newAmPm);
    setTimeout(() => handleTimeSelect(), 100);
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
                fullWidth ? "w-full" : "min-w-[150px]",
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
                placeholder={isFloating ? placeholder || (format === "12h" ? "HH:MM AM/PM" : "HH:MM") : undefined}
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

              {/* Clock Icon */}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <Clock className={cn(config.icon, "text-text-secondary")} />
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
              className={cn(
                "p-4 rounded-lg border shadow-lg",
                config.dropdown,
                format === "12h" ? "min-w-[240px]" : "min-w-[200px]"
              )}
            >
              <div className="flex gap-2">
                {/* Hours Column */}
                <div className="flex-1">
                  <ThemedText variant="secondary" className="text-xs font-medium mb-2 text-center" block>
                    Ore
                  </ThemedText>
                  <div className="max-h-32 overflow-y-auto border border-border-default rounded">
                    {hourOptions.map((hour) => (
                      <button
                        key={hour}
                        type="button"
                        onClick={() => handleHourChange(hour)}
                        className={cn(
                          "w-full px-3 py-1.5 text-center transition-colors",
                          "hover:bg-bg-hover",
                          selectedHour === hour && "bg-violet-600 text-white hover:bg-violet-700",
                          "focus:outline-none focus:ring-1 focus:ring-violet-500"
                        )}
                        disabled={disabled}
                      >
                        {hour.toString().padStart(2, "0")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Minutes Column */}
                <div className="flex-1">
                  <ThemedText variant="secondary" className="text-xs font-medium mb-2 text-center" block>
                    Minuti
                  </ThemedText>
                  <div className="max-h-32 overflow-y-auto border border-border-default rounded">
                    {minuteOptions.map((minute) => (
                      <button
                        key={minute}
                        type="button"
                        onClick={() => handleMinuteChange(minute)}
                        className={cn(
                          "w-full px-3 py-1.5 text-center transition-colors",
                          "hover:bg-bg-hover",
                          selectedMinute === minute && "bg-violet-600 text-white hover:bg-violet-700",
                          "focus:outline-none focus:ring-1 focus:ring-violet-500"
                        )}
                        disabled={disabled}
                      >
                        {minute.toString().padStart(2, "0")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* AM/PM Column (only for 12h format) */}
                {format === "12h" && (
                  <div className="flex-1">
                    <ThemedText variant="secondary" className="text-xs font-medium mb-2 text-center" block>
                      AM/PM
                    </ThemedText>
                    <div className="space-y-1">
                      {["AM", "PM"].map((period) => (
                        <button
                          key={period}
                          type="button"
                          onClick={() => handleAmPmChange(period as "AM" | "PM")}
                          className={cn(
                            "w-full px-3 py-1.5 text-center transition-colors border border-border-default rounded",
                            "hover:bg-bg-hover",
                            amPm === period && "bg-violet-600 text-white hover:bg-violet-700",
                            "focus:outline-none focus:ring-1 focus:ring-violet-500"
                          )}
                          disabled={disabled}
                        >
                          {period}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer with Now button */}
              <div className="flex justify-center mt-4 pt-3 border-t border-border-default">
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    const currentTime: TimeValue = { hours: now.getHours(), minutes: now.getMinutes() };
                    if (isTimeInRange(currentTime)) {
                      onChange?.(currentTime);
                      setInputValue(formatTime(currentTime));
                      setIsOpen(false);
                    }
                  }}
                  disabled={disabled}
                  className={cn(
                    "px-3 py-1 text-sm font-medium rounded transition-colors",
                    "text-violet-600 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-900/50",
                    "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1"
                  )}
                >
                  Adesso
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

export default TimePicker;
export type { TimeValue };
export type TimePickerFormat = "12h" | "24h";
export type TimePickerStep = 5 | 10 | 15 | 30;
export type TimePickerSize = "sm" | "md" | "lg";
