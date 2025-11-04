/**
 * CenteredPage Component
 *
 * Container for pages that need vertical centering (login, 404, etc.)
 *
 * Features:
 * - Full viewport height with centered content
 * - Responsive padding and constraints
 * - Optional background variant
 * - Loading state support
 * - Animated entrance
 */

import React from "react";
import { ThemedSurface } from "../../atomic";
import { Spinner } from "../../feedback";

interface CenteredPageProps {
  /**
   * Page content
   */
  children: React.ReactNode;

  /**
   * Background surface variant
   */
  variant?: "base" | "primary" | "secondary" | "modal";

  /**
   * Maximum width constraint
   */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "none";

  /**
   * Vertical padding
   */
  padding?: "sm" | "md" | "lg";

  /**
   * Show loading spinner
   */
  isLoading?: boolean;

  /**
   * Loading message
   */
  loadingMessage?: string;

  /**
   * Enable entrance animation
   */
  animate?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

export const CenteredPage: React.FC<CenteredPageProps> = ({
  children,
  variant = "base",
  maxWidth = "md",
  padding = "md",
  isLoading = false,
  loadingMessage = "Caricamento...",
  animate = true,
  className = "",
}) => {
  // Max width configurations
  const maxWidthClasses = {
    sm: "max-w-sm", // 384px
    md: "max-w-md", // 448px
    lg: "max-w-lg", // 512px
    xl: "max-w-xl", // 576px
    none: "max-w-none",
  };

  // Padding configurations
  const paddingClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  // Animation classes
  const animationClasses = animate ? "animate-in fade-in-0 slide-in-from-bottom-4 duration-500" : "";

  return (
    <ThemedSurface
      variant={variant}
      className={`min-h-screen flex items-center justify-center ${paddingClasses[padding]} ${className}`}
    >
      <div
        className={`
          w-full ${maxWidthClasses[maxWidth]} 
          ${animationClasses}
        `}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <Spinner size="lg" />
            <div className="text-center">
              <p className="text-text-secondary text-sm">{loadingMessage}</p>
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </ThemedSurface>
  );
};

export default CenteredPage;
