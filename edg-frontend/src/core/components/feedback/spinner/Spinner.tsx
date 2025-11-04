// src/core/components/ui/spinner/Spinner.tsx
import React from "react";
import { cn } from "../../../utils";

export type SpinnerSize = "xs" | "sm" | "md";

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
  "aria-label"?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = "md",
  className = "",
  "aria-label": ariaLabel = "Caricamento in corso",
}) => {
  const sizeConfig = {
    xs: { container: "w-4 h-4", dot: "w-1 h-1", gap: "gap-0.5" },
    sm: { container: "w-5 h-5", dot: "w-1.5 h-1.5", gap: "gap-0.5" },
    md: { container: "w-6 h-6", dot: "w-2 h-2", gap: "gap-1" },
  };
  const config = sizeConfig[size];

  return (
    <div
      className={cn("inline-flex items-center justify-center", config.container, className)}
      role="status"
      aria-label={ariaLabel}
    >
      <div className={cn("flex items-center", config.gap)}>
        <div className={cn(config.dot, "bg-violet-600 rounded-full animate-spinner-pulse")} />
        <div className={cn(config.dot, "bg-violet-600 rounded-full animate-spinner-pulse [animation-delay:0.16s]")} />
        <div className={cn(config.dot, "bg-violet-600 rounded-full animate-spinner-pulse [animation-delay:0.32s]")} />
      </div>
    </div>
  );
};

export default Spinner;
export type { SpinnerSize };
