// src/core/components/ui/Progress.tsx
import React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { ThemedText } from "../../atomic";
import { cn } from "../../../utils";

export type ProgressVariant = "default" | "success" | "warning" | "danger" | "info";
export type ProgressSize = "sm" | "md" | "lg";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Valore corrente (0-100) */
  value?: number;
  /** Valore massimo */
  max?: number;
  /** Variante colore */
  variant?: ProgressVariant;
  /** Dimensione della progress bar */
  size?: ProgressSize;
  /** Mostra label con testo o percentuale */
  showLabel?: boolean;
  /** Testo label personalizzato (default: percentuale) */
  label?: string;
  /** Modalità indeterminata per loading infinito */
  indeterminate?: boolean;
  /** Classi CSS aggiuntive */
  className?: string;
}

/**
 * Progress - Progress Bar con Radix UI per stati di avanzamento.
 *
 * Features:
 * - 5 varianti colore semantiche
 * - 3 dimensioni (sm, md, lg)
 * - Label sopra con percentuale o testo custom
 * - Indeterminate mode con shimmer animation
 * - Smooth value transitions
 * - Accessibility completa con ARIA
 * - Theme integration
 *
 * @example
 * <Progress value={75} variant="success" showLabel />
 * <Progress indeterminate variant="info" label="Caricamento..." />
 */
export const Progress: React.FC<ProgressProps> = ({
  value = 0,
  max = 100,
  variant = "default",
  size = "md",
  showLabel = false,
  label,
  indeterminate = false,
  className = "",
  ...props
}) => {
  // Calcola percentuale
  const percentage = indeterminate ? 0 : Math.min(Math.max((value / max) * 100, 0), 100);

  // Configurazione dimensioni
  const sizeConfig = {
    sm: {
      height: "h-1",
      text: "text-xs",
    },
    md: {
      height: "h-2",
      text: "text-sm",
    },
    lg: {
      height: "h-3",
      text: "text-base",
    },
  };

  // Configurazione varianti colore
  const variantConfig = {
    default: {
      bg: "bg-violet-600",
      shimmer: "bg-gradient-to-r from-transparent via-violet-400 to-transparent",
    },
    success: {
      bg: "bg-green-600",
      shimmer: "bg-gradient-to-r from-transparent via-green-400 to-transparent",
    },
    warning: {
      bg: "bg-amber-600",
      shimmer: "bg-gradient-to-r from-transparent via-amber-400 to-transparent",
    },
    danger: {
      bg: "bg-red-600",
      shimmer: "bg-gradient-to-r from-transparent via-red-400 to-transparent",
    },
    info: {
      bg: "bg-blue-600",
      shimmer: "bg-gradient-to-r from-transparent via-blue-400 to-transparent",
    },
  };

  const config = sizeConfig[size];
  const variantStyles = variantConfig[variant];

  // Label text
  const displayLabel = label || `${Math.round(percentage)}%`;

  return (
    <div className={cn("w-full", className)} {...props}>
      {/* Label */}
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <ThemedText variant="primary" className={cn("font-medium", config.text)}>
            {displayLabel}
          </ThemedText>
          {!label && (
            <ThemedText variant="secondary" className={cn(config.text)}>
              {indeterminate ? "..." : `${Math.round(percentage)}%`}
            </ThemedText>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <ProgressPrimitive.Root
        value={indeterminate ? undefined : value}
        max={max}
        className={cn("relative overflow-hidden rounded-full bg-bg-secondary", config.height, "transition-all duration-300")}
      >
        {indeterminate ? (
          /* Indeterminate Animation */
          <div className={cn("h-full w-full relative overflow-hidden", variantStyles.bg)}>
            <div
              className={cn("absolute inset-0 w-full h-full", variantStyles.shimmer, "animate-shimmer")}
              style={{
                animation: "shimmer 2s infinite linear",
              }}
            />
          </div>
        ) : (
          /* Determinate Progress */
          <ProgressPrimitive.Indicator
            className={cn(
              "h-full transition-all duration-500 ease-out",
              variantStyles.bg,
              "data-[state=complete]:bg-opacity-100",
              "data-[state=loading]:bg-opacity-90"
            )}
            style={{
              transform: `translateX(-${100 - percentage}%)`,
            }}
          />
        )}
      </ProgressPrimitive.Root>
    </div>
  );
};

export default Progress;
export type { ProgressVariant, ProgressSize };
