// src/core/components/layout/TitledSurface.tsx
import React from "react";
import { ThemedSurface, ThemedText } from "../../atomic";

interface TitledSurfaceProps {
  title: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "modal" | "info" | "contrast" | "hover" | "selected";
  borderVariant?: "none" | "thin" | "default" | "strong";
  titleSize?: "sm" | "md" | "lg";
  padding?: "sm" | "md" | "lg";
  className?: string;
}

const TitledSurface: React.FC<TitledSurfaceProps> = ({
  title,
  children,
  variant = "primary",
  borderVariant = "default",
  titleSize = "lg",
  padding = "md",
  className = "",
}) => {
  // Size mapping per il titolo
  const titleSizeClasses = {
    sm: "text-sm font-medium",
    md: "text-base font-semibold",
    lg: "text-lg font-semibold",
  };

  // Padding mapping
  const paddingClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div className={`relative mt-3 ${className}`}>
      {/* Titolo posizionato sul bordo */}
      <div className="absolute -top-3 left-4 z-10">
        <ThemedSurface variant={variant} className="px-2">
          <ThemedText variant="primary" className={titleSizeClasses[titleSize]}>
            {title}
          </ThemedText>
        </ThemedSurface>
      </div>

      {/* Contenuto principale */}
      <ThemedSurface variant={variant} borderVariant={borderVariant} className={`rounded-lg border ${paddingClasses[padding]}`}>
        {children}
      </ThemedSurface>
    </div>
  );
};

export default TitledSurface;
