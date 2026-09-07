// src/core/components/ui/accordion/Accordion.tsx
import React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";

import { cn } from "../../../utils";

export type AccordionType = "single" | "multiple";
export type AccordionVariant = "default" | "bordered" | "separated";
export type AccordionSize = "sm" | "md" | "lg";

export interface AccordionItem {
  value: string;
  title: string;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Modalità accordion - single (un item) o multiple (più items) */
  type?: AccordionType;
  /** Items dell'accordion */
  items: AccordionItem[];
  /** Valore/i di default aperti */
  defaultValue?: string | string[];
  /** Valore/i controllati */
  value?: string | string[];
  /** Se type="single", permette di chiudere tutti gli item */
  collapsible?: boolean;
  /** Variante visiva */
  variant?: AccordionVariant;
  /** Dimensione */
  size?: AccordionSize;
  /** Callback per cambi di stato */
  onValueChange?: (value: string | string[]) => void;
  /** Classi CSS aggiuntive */
  className?: string;
}

/**
 * Accordion - Componente per contenuti collassibili con Radix UI.
 *
 * Features:
 * - Single/Multiple mode per controllo apertura
 * - 3 varianti visive (default, bordered, separated)
 * - 3 dimensioni (sm, md, lg)
 * - Keyboard navigation completa
 * - Smooth collapse/expand animations
 * - Accessibility con ARIA attributes
 * - Chevron rotation automatica
 * - Theme integration completa
 * - Controlled/uncontrolled modes
 * - Item disabilitabili
 *
 * @example
 * <Accordion
 *   type="single"
 *   collapsible
 *   items={[
 *     { value: "item1", title: "Titolo 1", content: "Contenuto 1" },
 *     { value: "item2", title: "Titolo 2", content: "Contenuto 2" }
 *   ]}
 * />
 */
export const Accordion = ({
  type = "single",
  items,
  defaultValue,
  collapsible = true,
  variant = "default",
  size = "md",
  onValueChange,
  className = "",
  ...props
}: AccordionProps) => {
  // Configurazione dimensioni
  const sizeConfig = {
    sm: {
      trigger: "py-2 px-3 text-sm",
      content: "px-3 pb-2 text-sm",
      icon: "w-4 h-4",
    },
    md: {
      trigger: "py-3 px-4 text-base",
      content: "px-4 pb-3 text-base",
      icon: "w-5 h-5",
    },
    lg: {
      trigger: "py-4 px-5 text-lg",
      content: "px-5 pb-4 text-lg",
      icon: "w-6 h-6",
    },
  };

  // Configurazione varianti
  const variantConfig = {
    default: {
      container: "space-y-1",
      item: "border-b border-border-default last:border-b-0",
      trigger: "hover:bg-bg-hover",
      content: "",
    },
    bordered: {
      container: "space-y-2",
      item: "border border-border-default rounded-lg overflow-hidden",
      trigger: "hover:bg-bg-hover",
      content: "border-t border-border-default",
    },
    separated: {
      container: "space-y-3",
      item: "bg-bg-secondary rounded-lg overflow-hidden",
      trigger: "hover:bg-bg-hover",
      content: "bg-bg-primary",
    },
  };

  const config = sizeConfig[size];
  const variantStyles = variantConfig[variant];

  // Props per Radix Accordion Root (Type-safe)
  const rootProps =
    type === "single"
      ? {
          type: "single" as const,
          defaultValue: defaultValue as string,
          value: props.value as string,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onValueChange: onValueChange as any,
          collapsible,
        }
      : {
          type: "multiple" as const,
          defaultValue: defaultValue as string[],
          value: props.value as string[],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onValueChange: onValueChange as any,
        } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  return (
    <div className={cn("w-full bg-bg-primary", className)} {...props}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <AccordionPrimitive.Root className={cn("w-full", variantStyles.container)} {...(rootProps as any)}>
        {items.map((item) => (
          <AccordionPrimitive.Item
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            className={cn("transition-all duration-200", variantStyles.item, item.disabled && "opacity-50 cursor-not-allowed")}
          >
            {/* Trigger */}
            <AccordionPrimitive.Header className="flex">
              <AccordionPrimitive.Trigger
                className={cn(
                  "flex flex-1 items-center justify-between font-medium text-left",
                  "transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2",
                  "disabled:pointer-events-none disabled:opacity-50",
                  config.trigger,
                  variantStyles.trigger
                )}
              >
                <span className="text-text-primary font-medium">
                  {item.title}
                </span>

                <ChevronDown
                  className={cn(
                    "shrink-0 transition-transform duration-200",
                    "data-[state=open]:rotate-180",
                    config.icon,
                    "text-text-secondary"
                  )}
                />
              </AccordionPrimitive.Trigger>
            </AccordionPrimitive.Header>

            {/* Content */}
            <AccordionPrimitive.Content
              className={cn(
                "overflow-hidden transition-all duration-200",
                "data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
                variantStyles.content
              )}
            >
              <div className={cn(config.content)}>
                <p className="text-text-secondary leading-relaxed">
                  {item.content}
                </p>
              </div>
            </AccordionPrimitive.Content>
          </AccordionPrimitive.Item>
        ))}
      </AccordionPrimitive.Root>
    </div>
  );
};

export default Accordion;

// Export dei tipi per uso esterno

