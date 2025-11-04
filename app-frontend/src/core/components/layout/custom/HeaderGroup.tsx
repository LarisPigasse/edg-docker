// src/core/components/layout/HeaderGroup.tsx
import React from "react";
import { ThemedText } from "../../atomic";

interface HeaderGroupProps {
  title: string;
  subtitle?: string;
  titleSize?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  spacing?: "tight" | "normal" | "loose";
  align?: "left" | "center" | "right";
  className?: string;
}

const HeaderGroup: React.FC<HeaderGroupProps> = ({
  title,
  subtitle,
  titleSize = "2xl",
  spacing = "tight",
  align = "left",
  className = "",
}) => {
  // Mapping delle dimensioni
  const titleSizeClasses = {
    sm: "text-sm font-semibold",
    md: "text-base font-semibold",
    lg: "text-lg font-bold",
    xl: "text-xl font-bold",
    "2xl": "text-2xl font-bold",
    "3xl": "text-3xl font-bold",
    "4xl": "text-4xl font-bold",
  };

  // Mapping dello spacing
  const spacingClasses = {
    tight: "space-y-0.5", // 2px
    normal: "space-y-1", // 4px
    loose: "space-y-2", // 8px
  };

  // Mapping dell'allineamento
  const alignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <div className={`${spacingClasses[spacing]} ${alignClasses[align]} ${className}`}>
      <ThemedText variant="primary" className={titleSizeClasses[titleSize]} block>
        {title}
      </ThemedText>

      {subtitle && (
        <ThemedText variant="secondary" className="text-sm" block>
          {subtitle}
        </ThemedText>
      )}
    </div>
  );
};

export default HeaderGroup;
