// src/core/components/ui/tooltip/Tooltip.tsx
import React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "../../../utils";

export type TooltipSide = "top" | "right" | "bottom" | "left";
export type TooltipAlign = "start" | "center" | "end";
export type TooltipSize = "sm" | "md" | "lg";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: TooltipSide;
  align?: TooltipAlign;
  delayDuration?: number;
  size?: TooltipSize;
  disabled?: boolean;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  side = "top",
  align = "center",
  delayDuration = 300,
  size = "md",
  disabled = false,
  className = "",
}) => {
  if (disabled || !content) {
    return <>{children}</>;
  }

  const sizeClasses = {
    sm: "px-2 py-1 text-xs max-w-48",
    md: "px-3 py-2 text-sm max-w-64",
    lg: "px-4 py-3 text-sm max-w-80",
  };

  const tooltipClasses = cn(
    "bg-bg-contrast text-text-contrast rounded-lg shadow-themed-lg",
    "z-50",
    "data-[state=delayed-open]:animate-in data-[state=closed]:animate-out",
    "data-[state=delayed-open]:fade-in-0 data-[state=closed]:fade-out-0",
    "data-[state=delayed-open]:zoom-in-95 data-[state=closed]:zoom-out-95",
    "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
    "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
    sizeClasses[size],
    className
  );

  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        {/* ✨ CORREZIONE: Rimuoviamo 'asChild' e avvolgiamo 'children' in uno span. */}
        {/* Questo rende il componente più robusto e compatibile. */}
        <TooltipPrimitive.Trigger className="inline-flex cursor-default">{children}</TooltipPrimitive.Trigger>

        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content className={tooltipClasses} side={side} align={align} sideOffset={8} collisionPadding={8}>
            {content}
            <TooltipPrimitive.Arrow className="fill-bg-contrast" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
};

export default Tooltip;
export type { TooltipSide, TooltipAlign, TooltipSize };
