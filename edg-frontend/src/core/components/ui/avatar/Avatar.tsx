// src/core/components/ui/avatar/Avatar.tsx
import React, { useState } from "react";
import { User } from "lucide-react";
import { cn } from "../../../utils";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type AvatarShape = "circle" | "square" | "rounded";
export type AvatarVariant = "primary" | "secondary" | "success" | "warning" | "danger" | "info";
export type AvatarStatus = "online" | "offline" | "busy" | "away";
export type AvatarStatusPosition = "top-right" | "bottom-right" | "top-left" | "bottom-left";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** URL dell'immagine avatar */
  src?: string;
  /** Testo alternativo per l'immagine */
  alt?: string;
  /** Iniziali da mostrare come fallback */
  initials?: string;
  /** Fallback personalizzato (icona o elemento) */
  fallback?: React.ReactNode;
  /** Dimensione dell'avatar */
  size?: AvatarSize;
  /** Forma dell'avatar */
  shape?: AvatarShape;
  /** Variante colore per initials/fallback */
  variant?: AvatarVariant;
  /** Indicatore di stato */
  status?: AvatarStatus;
  /** Posizione dell'indicatore di stato */
  statusPosition?: AvatarStatusPosition;
  /** Avatar cliccabile */
  clickable?: boolean;
  /** Callback per click */
  onClick?: () => void;
  /** Border personalizzato */
  bordered?: boolean;
  /** Classi CSS aggiuntive */
  className?: string;
}

/**
 * Avatar - Componente per avatar utenti con fallback intelligente.
 *
 * Features:
 * - Image con fallback automatico a initials o icon
 * - 5 dimensioni (xs, sm, md, lg, xl)
 * - 3 forme (circle, square, rounded)
 * - 6 varianti colore per initials/fallback
 * - Status indicators (online, offline, busy, away)
 * - Clickable con hover effects
 * - Border opzionale
 * - Theme integration completa
 * - Accessibility con alt text e keyboard nav
 *
 * @example
 * <Avatar src="/user.jpg" alt="John Doe" size="md" />
 * <Avatar initials="JD" variant="primary" status="online" />
 * <Avatar fallback={<UserIcon />} size="lg" clickable onClick={handleClick} />
 */
export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  initials,
  fallback,
  size = "md",
  shape = "circle",
  variant = "primary",
  status,
  statusPosition = "bottom-right",
  clickable = false,
  onClick,
  bordered = false,
  className = "",
  ...props
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Size configuration
  const sizeConfig = {
    xs: {
      container: "w-6 h-6",
      text: "text-xs",
      status: "w-2 h-2",
      statusOffset: "0.5",
      icon: "w-3 h-3",
    },
    sm: {
      container: "w-8 h-8",
      text: "text-sm",
      status: "w-2.5 h-2.5",
      statusOffset: "1",
      icon: "w-4 h-4",
    },
    md: {
      container: "w-10 h-10",
      text: "text-base",
      status: "w-3 h-3",
      statusOffset: "1",
      icon: "w-5 h-5",
    },
    lg: {
      container: "w-12 h-12",
      text: "text-lg",
      status: "w-3.5 h-3.5",
      statusOffset: "1.5",
      icon: "w-6 h-6",
    },
    xl: {
      container: "w-16 h-16",
      text: "text-xl",
      status: "w-4 h-4",
      statusOffset: "2",
      icon: "w-8 h-8",
    },
  };

  // Shape configuration
  const shapeConfig = {
    circle: "rounded-full",
    square: "rounded-none",
    rounded: "rounded-lg",
  };

  // Variant configuration for initials/fallback background
  const variantConfig = {
    primary: "bg-violet-500 text-white",
    secondary: "bg-gray-500 text-white",
    success: "bg-green-500 text-white",
    warning: "bg-amber-500 text-white",
    danger: "bg-red-500 text-white",
    info: "bg-blue-500 text-white",
  };

  // Status configuration
  const statusConfig = {
    online: "bg-green-500",
    offline: "bg-gray-400",
    busy: "bg-red-500",
    away: "bg-amber-500",
  };

  // Status position configuration
  const statusPositionConfig = {
    "top-right": "top-0 right-0",
    "bottom-right": "bottom-0 right-0",
    "top-left": "top-0 left-0",
    "bottom-left": "bottom-0 left-0",
  };

  const config = sizeConfig[size];
  const shapeClass = shapeConfig[shape];
  const variantClass = variantConfig[variant];
  const statusClass = status ? statusConfig[status] : "";
  const statusPositionClass = statusPositionConfig[statusPosition];

  // Handle image load error
  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

  // Handle image load success
  const handleImageLoad = () => {
    setImageError(false);
    setImageLoaded(true);
  };

  // Determine what to render
  const shouldShowImage = src && !imageError;
  const shouldShowInitials = !shouldShowImage && initials;
  const shouldShowFallback = !shouldShowImage && !shouldShowInitials;

  // Generate initials if needed
  const displayInitials = initials?.slice(0, 2).toUpperCase();

  // Click handler
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (clickable && onClick) {
      onClick();
    }
    props.onClick?.(e);
  };

  // Auto-enable clickable if onClick is provided
  const isClickable = clickable || Boolean(onClick);

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center flex-shrink-0 select-none",
        config.container,
        shapeClass,
        // Background for initials/fallback
        (shouldShowInitials || shouldShowFallback) && variantClass,
        // Clickable styles
        isClickable && [
          "cursor-pointer transition-all duration-200",
          "hover:scale-105 hover:shadow-md",
          "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2",
          "active:scale-95",
        ],
        // Border
        bordered && "ring-2 ring-white dark:ring-gray-800 shadow-md",
        // Disabled state
        props["aria-disabled"] && "opacity-50 cursor-not-allowed",
        className
      )}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (isClickable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick?.();
        }
      }}
      {...props}
    >
      {/* Image */}
      {shouldShowImage && (
        <img
          src={src}
          alt={alt || "Avatar"}
          className={cn(
            "w-full h-full object-cover",
            shapeClass,
            // Loading state
            !imageLoaded && "opacity-0",
            "transition-opacity duration-200"
          )}
          onError={handleImageError}
          onLoad={handleImageLoad}
          loading="lazy"
        />
      )}

      {/* Initials */}
      {shouldShowInitials && (
        <span className={cn("font-semibold select-none", config.text)} aria-label={`Avatar with initials ${displayInitials}`}>
          {displayInitials}
        </span>
      )}

      {/* Fallback */}
      {shouldShowFallback && (
        <div className="flex items-center justify-center w-full h-full" aria-label="Default avatar">
          {fallback || <User className={cn("text-current", config.icon)} />}
        </div>
      )}

      {/* Loading overlay for image */}
      {shouldShowImage && !imageLoaded && (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            "bg-gray-100 dark:bg-gray-800 animate-pulse",
            shapeClass
          )}
          aria-hidden="true"
        >
          <User className={cn("text-gray-400", config.icon)} />
        </div>
      )}

      {/* Status Indicator */}
      {status && (
        <div
          className={cn(
            "absolute rounded-full border-2 border-white dark:border-gray-800",
            config.status,
            statusClass,
            statusPositionClass
          )}
          style={{
            transform: `translate(${statusPosition.includes("right") ? "" : "-"}${config.statusOffset}px, ${
              statusPosition.includes("bottom") ? "" : "-"
            }${config.statusOffset}px)`,
          }}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
};

export default Avatar;

// Export dei tipi per uso esterno
export type { AvatarSize, AvatarShape, AvatarVariant, AvatarStatus, AvatarStatusPosition };
