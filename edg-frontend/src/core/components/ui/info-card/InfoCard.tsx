// src/core/components/ui/InfoCard.tsx
import React from "react";
import { cn } from "../../../utils/";

export type ComponentCategory = "ui" | "form" | "navigation" | "feedback" | "data" | "layout";

interface InfoCardProps {
  /** Nome del componente */
  title: string;
  /** Breve descrizione opzionale */
  description?: string;
  /** Categoria del componente per il colore di sfondo */
  category: ComponentCategory;
  /** Callback quando la card viene cliccata */
  onClick: () => void;
  /** Classi CSS aggiuntive */
  className?: string;
  /** Stato disabilitato */
  disabled?: boolean;
}

/**
 * InfoCard component per Component Explorer.
 * Card cliccabile con categoria colorata per esplorare i componenti del design system.
 */
const InfoCard: React.FC<InfoCardProps> = ({ title, description, category, onClick, className = "", disabled = false }) => {
  // 🎨 Mapping categoria -> colore di sfondo
  const categoryBackgrounds = {
    ui: "bg-category-ui",
    form: "bg-category-form",
    navigation: "bg-category-navigation",
    feedback: "bg-category-feedback",
    data: "bg-category-data",
    layout: "bg-category-layout",
  };

  // 🎯 Handle click
  const handleClick = () => {
    if (!disabled) {
      onClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        // Base styles
        "relative overflow-hidden rounded-lg border border-border-default cursor-pointer transition-all duration-200",
        // Fixed dimensions
        "h-32 w-full",
        // Shadow and hover effects
        "shadow-sm hover:shadow-md",
        // Transform effects
        "hover:scale-[1.02] hover:-translate-y-0.5",
        // Border hover
        "hover:border-border-strong",
        // Focus styles
        "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2",
        // Disabled state
        disabled && "opacity-50 cursor-not-allowed hover:scale-100 hover:translate-y-0 hover:shadow-sm",
        className
      )}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`Esplora componente ${title}`}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !disabled) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Category Background Strip */}
      <div className={cn("absolute top-0 left-0 right-0 h-2", categoryBackgrounds[category])} />

      {/* Content */}
      <div
        className={cn(
          "p-4 h-full flex flex-col justify-between",
          categoryBackgrounds[category] // Background colorato sottile
        )}
      >
        {/* Header */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-text-primary mb-1 leading-tight">{title}</h3>

          {description && <p className="text-xs text-text-secondary leading-tight line-clamp-3">{description}</p>}
        </div>

        {/* Category Badge (Bottom Right) */}
        <div className="flex justify-end mt-2">
          <span
            className={cn(
              "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
              "border border-border-default",
              categoryBackgrounds[category],
              "text-text-secondary"
            )}
          >
            {category}
          </span>
        </div>
      </div>

      {/* Hover Overlay Effect */}
      <div className="absolute inset-0 bg-bg-hover opacity-0 hover:opacity-10 transition-opacity duration-200 pointer-events-none" />
    </div>
  );
};

export default InfoCard;
export type { ComponentCategory };
