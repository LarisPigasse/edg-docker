import React from "react";
import { cn } from "../../utils/";

interface ThemedSurfaceProps extends React.HTMLAttributes<HTMLElement> {
  /** Variante della superficie */
  variant?: "base" | "primary" | "secondary" | "modal" | "info" | "contrast" | "hover" | "selected";
  /** Variante del testo (se diversa dalla superficie) */
  textVariant?: "primary" | "secondary" | "contrast" | "label" | "placeholder" | "disabled" | "link" | "linkHover";
  /** Variante del bordo */
  borderVariant?: "none" | "thin" | "default" | "strong";
  /** Elemento HTML da renderizzare */
  as?: keyof JSX.IntrinsicElements;
  /** Contenuto */
  children?: React.ReactNode;
}

/**
 * Componente atomico che gestisce sfondo, testo e bordi per le "superfici" dell'UI.
 * Incapsula completamente la logica del tema senza logica applicativa.
 */
const ThemedSurface = React.forwardRef<HTMLElement, ThemedSurfaceProps>(
  (
    {
      variant = "primary",
      textVariant = "primary",
      borderVariant = "none",
      as: Component = "div",
      className,
      children,
      ...restProps
    },
    ref
  ) => {
    // Mapping delle varianti agli stili Tailwind
    const surfaceStyles = {
      base: "bg-bg-base",
      primary: "bg-bg-primary",
      secondary: "bg-bg-secondary",
      modal: "bg-bg-modal",
      info: "bg-bg-info",
      contrast: "bg-bg-contrast",
      hover: "bg-bg-hover",
      selected: "bg-bg-selected",
    };

    const textStyles = {
      primary: "text-text-primary",
      secondary: "text-text-secondary",
      contrast: "text-text-contrast",
      label: "text-text-label",
      placeholder: "text-text-placeholder",
      disabled: "text-text-disabled",
      link: "text-text-link",
      linkHover: "text-text-link-hover",
    };

    const borderStyles = {
      none: "",
      thin: "border border-border-thin",
      default: "border border-border-default",
      strong: "border border-border-strong",
    };

    const combinedClassName = cn(surfaceStyles[variant], textStyles[textVariant], borderStyles[borderVariant], className);

    return (
      <Component ref={ref} className={combinedClassName} {...restProps}>
        {children}
      </Component>
    );
  }
);

ThemedSurface.displayName = "ThemedSurface";

export default ThemedSurface;
