// src/core/components/ui/Card.tsx
import React from "react";
import { ThemedSurface } from "../../atomic";
import { cn } from "../../../utils";

export type CardVariant = "default" | "elevated" | "outlined" | "flat";
export type CardPadding = "none" | "sm" | "md" | "lg";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Contenuto del card */
  children: React.ReactNode;
  /** Variante visiva del card */
  variant?: CardVariant;
  /** Padding interno */
  padding?: CardPadding;
  /** Abilita hover effects */
  hover?: boolean;
  /** Card cliccabile */
  clickable?: boolean;
  /** Callback per click */
  onClick?: () => void;
  /** Classi CSS aggiuntive */
  className?: string;
}

/**
 * Card - Componente contenitore versatile per raggruppare contenuti.
 *
 * Features:
 * - Integrazione completa con ThemedSurface
 * - 4 varianti visive (default, elevated, outlined, flat)
 * - Hover effects eleganti con border highlighting
 * - Clickable behavior con keyboard support
 * - Padding responsive e configurabile
 * - Focus styling con border (no ring)
 *
 * @example
 * <Card variant="elevated" padding="lg" clickable onClick={handleClick}>
 *   <h3>Titolo Card</h3>
 *   <p>Contenuto della card...</p>
 * </Card>
 */
export const Card: React.FC<CardProps> = ({
  children,
  variant = "default",
  padding = "md",
  hover,
  clickable = false,
  onClick,
  className = "",
  ...props
}) => {
  // Auto-enable hover se è clickable
  const enableHover = hover ?? (clickable || !!onClick);

  // Auto-enable clickable se c'è onClick
  const isClickable = clickable || !!onClick;

  // Configurazione varianti
  const variantConfig = {
    default: {
      surface: "primary" as const,
      border: "default" as const,
      shadow: "shadow-themed-sm",
    },
    elevated: {
      surface: "primary" as const,
      border: "thin" as const,
      shadow: "shadow-themed-md",
    },
    outlined: {
      surface: "primary" as const,
      border: "strong" as const,
      shadow: "shadow-none",
    },
    flat: {
      surface: "secondary" as const,
      border: "none" as const,
      shadow: "shadow-none",
    },
  };

  // Configurazione padding
  const paddingClasses = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  const config = variantConfig[variant];

  // Classi base
  const baseClasses = cn("rounded-lg transition-all duration-200 ease-in-out", config.shadow, paddingClasses[padding]);

  // Classi hover
  const hoverClasses = enableHover
    ? cn(
        "hover:shadow-themed-lg",
        variant === "outlined" ? "hover:border-violet-400 hover:shadow-themed-sm" : "hover:border-violet-300",
        variant === "flat" ? "hover:shadow-themed-sm" : ""
      )
    : "";

  // Classi clickable
  const clickableClasses = isClickable
    ? cn(
        "cursor-pointer",
        // Focus styles - border highlight instead of ring
        "focus:outline-none focus:border-violet-500",
        variant === "flat" ? "focus:shadow-themed-sm" : "focus:shadow-themed-lg",
        // Active state
        "active:scale-[0.98] active:shadow-themed-sm"
      )
    : "";

  // Classi finali
  const finalClasses = cn(baseClasses, hoverClasses, clickableClasses, className);

  // Props finali
  const finalProps = {
    ...props,
    ...(isClickable && {
      onClick,
      tabIndex: 0,
      role: "button",
      onKeyDown: (e: React.KeyboardEvent) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      },
    }),
  };

  return (
    <ThemedSurface variant={config.surface} borderVariant={config.border} className={finalClasses} {...finalProps}>
      {children}
    </ThemedSurface>
  );
};
export type { CardVariant, CardPadding };
export default Card;
