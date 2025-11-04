/**
 * CenteredSection Component
 *
 * Container for sections that need vertical centering within a page
 *
 * Features:
 * - Flexible height with centered content
 * - Responsive spacing and constraints
 * - Optional background and borders
 * - Icon support for empty states
 * - Various padding configurations
 */

import React from "react";
import { ThemedSurface } from "../../atomic";
import { iconMap } from "../../../utils";

interface CenteredSectionProps {
  /**
   * Section content
   */
  children: React.ReactNode;

  /**
   * Background surface variant
   */
  variant?: "base" | "primary" | "secondary" | "modal" | "info";

  /**
   * Border variant
   */
  borderVariant?: "none" | "thin" | "default" | "strong";

  /**
   * Height constraint
   */
  height?: "auto" | "screen" | "half" | "tall" | string;

  /**
   * Maximum width constraint
   */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "none";

  /**
   * Padding configuration
   */
  padding?: "none" | "sm" | "md" | "lg" | "xl";

  /**
   * Vertical alignment
   */
  align?: "start" | "center" | "end";

  /**
   * Icon to display (for empty states)
   */
  icon?: keyof typeof iconMap;

  /**
   * Icon size when displayed
   */
  iconSize?: "sm" | "md" | "lg" | "xl";

  /**
   * Enable rounded corners
   */
  rounded?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

export const CenteredSection: React.FC<CenteredSectionProps> = ({
  children,
  variant = "primary",
  borderVariant = "default",
  height = "auto",
  maxWidth = "lg",
  padding = "md",
  align = "center",
  icon,
  iconSize = "lg",
  rounded = true,
  className = "",
}) => {
  // Height configurations
  const heightClasses = {
    auto: "min-h-fit",
    screen: "min-h-screen",
    half: "min-h-[50vh]",
    tall: "min-h-[75vh]",
  };

  // Use provided height string or get from config
  const heightClass =
    typeof height === "string" && !heightClasses[height as keyof typeof heightClasses]
      ? height
      : heightClasses[height as keyof typeof heightClasses];

  // Max width configurations
  const maxWidthClasses = {
    sm: "max-w-sm", // 384px
    md: "max-w-md", // 448px
    lg: "max-w-lg", // 512px
    xl: "max-w-xl", // 576px
    "2xl": "max-w-2xl", // 672px
    none: "max-w-none",
  };

  // Padding configurations
  const paddingClasses = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
    xl: "p-12",
  };

  // Alignment configurations
  const alignClasses = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
  };

  // Icon size configurations
  const iconSizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  // Get icon component
  const IconComponent = icon ? iconMap[icon] : null;

  return (
    <ThemedSurface
      variant={variant}
      borderVariant={borderVariant}
      className={`
        ${heightClass} 
        flex ${alignClasses[align]} justify-center 
        ${paddingClasses[padding]}
        ${rounded ? "rounded-lg" : ""}
        ${className}
      `}
    >
      <div className={`w-full ${maxWidthClasses[maxWidth]} text-center`}>
        {/* Optional icon */}
        {IconComponent && (
          <div className="flex justify-center mb-6">
            <IconComponent className={`${iconSizeClasses[iconSize]} text-text-secondary`} />
          </div>
        )}

        {/* Content */}
        {children}
      </div>
    </ThemedSurface>
  );
};

export default CenteredSection;
