import React from "react";
import { cn } from "../../utils";

interface ThemedShadowProps extends React.HTMLAttributes<HTMLElement> {
  /** Variante dell'ombra */
  variant?: "none" | "sm" | "default" | "md" | "lg" | "xl" | "inner";
  /** Elemento HTML da renderizzare */
  as?: keyof JSX.IntrinsicElements;
  /** Contenuto */
  children?: React.ReactNode;
}

/**
 * Componente atomico che gestisce solo le ombre tematiche.
 * Le ombre cambiano automaticamente tra light e dark mode.
 */
const ThemedShadow = React.forwardRef<HTMLElement, ThemedShadowProps>(
  ({ variant = "default", as: Component = "div", className, children, ...restProps }, ref) => {
    // Mapping delle varianti agli stili shadow
    const shadowStyles = {
      none: "shadow-themed-none",
      sm: "shadow-themed-sm",
      default: "shadow-themed-default",
      md: "shadow-themed-md",
      lg: "shadow-themed-lg",
      xl: "shadow-themed-xl",
      inner: "shadow-themed-inner",
    };

    const combinedClassName = cn(shadowStyles[variant], className);

    return (
      <Component ref={ref} className={combinedClassName} {...restProps}>
        {children}
      </Component>
    );
  }
);

ThemedShadow.displayName = "ThemedShadow";

export default ThemedShadow;
