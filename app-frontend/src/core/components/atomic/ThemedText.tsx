// src/core/components/atomic/ThemedText.tsx
import { ReactNode, HTMLAttributes } from "react";

export type ThemedTextVariant = "primary" | "secondary" | "muted" | "contrast";

interface ThemedTextProps extends HTMLAttributes<HTMLElement> {
  variant?: ThemedTextVariant;
  children: ReactNode;
  block?: boolean;
  as?: "span" | "p" | "div" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

const ThemedText: React.FC<ThemedTextProps> = ({
  variant = "primary",
  children,
  block = false,
  as = "span",
  className = "",
  ...props
}) => {
  // Varianti di colore per il testo
  const variantClasses = {
    primary: "text-text-primary",
    secondary: "text-text-secondary",
    muted: "text-text-muted",
    contrast: "text-text-contrast",
  };

  // Se block è true, forziamo tag block-level
  const Component = block ? (as === "span" ? "div" : as) : as;

  // Se block è true, aggiungiamo display block
  const blockClass = block ? "block" : "";

  const finalClassName = [variantClasses[variant], blockClass, className].filter(Boolean).join(" ");

  return (
    <Component className={finalClassName} {...props}>
      {children}
    </Component>
  );
};

export default ThemedText;
