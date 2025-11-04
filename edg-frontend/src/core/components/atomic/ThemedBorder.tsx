import React from "react";
import { cn } from "../../utils";

interface ThemedBorderProps extends React.HTMLAttributes<HTMLElement> {
  /** Variante del bordo */
  variant?: "none" | "thin" | "default" | "strong";
  /** Lati del bordo da applicare */
  sides?: "all" | "top" | "bottom" | "left" | "right" | "x" | "y" | "top-bottom" | "left-right";
  /** Stile del bordo */
  style?: "solid" | "dashed" | "dotted";
  /** Raggio del bordo */
  radius?: "none" | "sm" | "md" | "lg" | "xl" | "full";
  /** Elemento HTML da renderizzare */
  as?: keyof JSX.IntrinsicElements;
  /** Contenuto */
  children?: React.ReactNode;
}

/**
 * Componente atomico che gestisce solo i bordi.
 * Perfetto per wrapper che necessitano solo di bordi tematici.
 */
const ThemedBorder = React.forwardRef<HTMLElement, ThemedBorderProps>(
  (
    {
      variant = "default",
      sides = "all",
      style = "solid",
      radius = "none",
      as: Component = "div",
      className,
      children,
      ...restProps
    },
    ref
  ) => {
    // Mapping delle varianti ai colori
    const borderColors = {
      none: "",
      thin: "border-border-thin",
      default: "border-border-default",
      strong: "border-border-strong",
    };

    // Mapping dei lati del bordo
    const borderSides = {
      all: "border",
      top: "border-t",
      bottom: "border-b",
      left: "border-l",
      right: "border-r",
      x: "border-x",
      y: "border-y",
      "top-bottom": "border-y",
      "left-right": "border-x",
    };

    // Mapping degli stili del bordo
    const borderStyles = {
      solid: "border-solid",
      dashed: "border-dashed",
      dotted: "border-dotted",
    };

    // Mapping del raggio
    const borderRadius = {
      none: "",
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg",
      xl: "rounded-xl",
      full: "rounded-full",
    };

    const combinedClassName = cn(
      variant !== "none" && borderSides[sides],
      variant !== "none" && borderColors[variant],
      variant !== "none" && borderStyles[style],
      borderRadius[radius],
      className
    );

    return (
      <Component ref={ref} className={combinedClassName} {...restProps}>
        {children}
      </Component>
    );
  }
);

ThemedBorder.displayName = "ThemedBorder";

export default ThemedBorder;
