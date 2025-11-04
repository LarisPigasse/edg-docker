// src/core/components/ui/Badge.tsx
import React from "react";
import { cn } from "../../../utils/";

export type BadgeVariant = "success" | "warning" | "danger" | "info" | "default";
export type BadgeSize = "xs" | "sm" | "md";

// Mappa degli stati alle varianti - MANTENUTA la tua logica intelligente
const statusVariantMap: Record<string, BadgeVariant> = {
  attivo: "success",
  inattivo: "warning",
  eliminato: "danger",
  completato: "success",
  pendente: "warning",
  errore: "danger",
  nuovo: "info",
  // Aggiunte utili
  bozza: "default",
  pubblicato: "success",
  scaduto: "danger",
  in_elaborazione: "warning",
  approvato: "success",
  rifiutato: "danger",
};

interface BadgeProps {
  /** Contenuto del badge */
  children?: React.ReactNode;
  /** Testo alternativo al children */
  text?: string;
  /** Variante colore del badge */
  variant?: BadgeVariant;
  /** Dimensione del badge */
  size?: BadgeSize;
  /** Status automatico - viene mappato alla variante corrispondente */
  status?: string;
  /** Classi CSS aggiuntive */
  className?: string;
}

/**
 * Badge component ottimizzato per il theme system EDG.
 * Supporta auto-mapping da status testuali e integrazione completa con CSS custom properties.
 */
const Badge: React.FC<BadgeProps> = ({ children, text, variant, size = "xs", status, className }) => {
  // Contenuto: children ha priorità su text
  const content = children || text;

  // Risoluzione variante: status ha priorità su variant
  const resolvedVariant = status ? statusVariantMap[status.toLowerCase()] || "default" : variant || "default";

  // 🎨 Base classes consistenti con il vostro design system
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-full transition-colors";

  // 📏 Size variants ottimizzate per readability
  const sizeClasses = {
    xs: "px-2 py-0.5 text-xs min-h-[20px]",
    sm: "px-2.5 py-0.5 text-sm min-h-[24px]",
    md: "px-3 py-1 text-sm min-h-[28px]",
  };

  // 🎨 Variant classes usando lo stesso sistema colore dei Button
  // Manteniamo coerenza con success/warning/danger/info già definiti
  const variantClasses = {
    success: `
      border border-transparent bg-green-100 text-green-800
      dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/30
    `
      .replace(/\s+/g, " ")
      .trim(),

    warning: `
      border border-transparent bg-yellow-100 text-yellow-800  
      dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800/30
    `
      .replace(/\s+/g, " ")
      .trim(),

    danger: `
      border border-transparent bg-red-100 text-red-800
      dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/30  
    `
      .replace(/\s+/g, " ")
      .trim(),

    info: `
      border border-transparent bg-sky-100 text-sky-800
      dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800/30
    `
      .replace(/\s+/g, " ")
      .trim(),

    default: `
      border border-border-default bg-bg-secondary text-text-secondary
      hover:bg-bg-hover
    `
      .replace(/\s+/g, " ")
      .trim(),
  };

  // 🔧 Computed final className
  const badgeClasses = cn(baseClasses, sizeClasses[size], variantClasses[resolvedVariant], className);

  // 🎯 Render con semantic HTML
  return (
    <span className={badgeClasses} role="status" aria-label={typeof content === "string" ? content : undefined}>
      {content}
    </span>
  );
};

// Export con types per uso esterno
export type { BadgeVariant, BadgeSize };
export default Badge;
