// src/core/components/layout/TitledSurface.tsx
import React from "react";


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

  // Border mapping
  const borderClasses = {
    none: "border-0",
    thin: "border",
    default: "border",
    strong: "border-2",
  };

  return (
    <div className={`relative mt-3 ${className}`}>
      {/* Titolo posizionato sul bordo */}
      <div className="absolute -top-3 left-4 z-10">
        <div className={`px-2 bg-bg-${variant}`}>
          <span className={`text-text-primary ${titleSizeClasses[titleSize]}`}>
            {title}
          </span>
        </div>
      </div>

      {/* Contenuto principale */}
      <div className={`rounded-lg ${borderClasses[borderVariant]} border-border-default bg-bg-${variant} ${paddingClasses[padding]}`}>
        {children}
      </div>
    </div>
  );
};

export default TitledSurface;
