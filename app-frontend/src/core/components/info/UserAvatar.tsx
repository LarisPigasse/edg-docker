// src/core/components/atomic/UserAvatar.tsx
import React from "react";

interface UserAvatarProps {
  initials: string;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "secondary" | "success" | "warning" | "error";
}

const UserAvatar: React.FC<UserAvatarProps> = ({ initials, size = "md", onClick, className = "", variant = "primary" }) => {
  // Size mapping
  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
  };

  // Variant colors (stile Trello)
  const variantClasses = {
    primary: "bg-violet-600 text-white",
    secondary: "bg-blue-600 text-white",
    success: "bg-green-600 text-white",
    warning: "bg-amber-600 text-white",
    error: "bg-red-600 text-white",
  };

  // Interaction classes
  const interactionClasses = onClick
    ? "cursor-pointer hover:scale-105 hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
    : "";

  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${interactionClasses}
        rounded-full flex items-center justify-center font-semibold
        select-none shadow-sm
        ${className}
      `}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      title={onClick ? "Menu utente" : undefined}
      aria-label={onClick ? "Apri menu utente" : `Avatar ${initials}`}
    >
      {initials.toUpperCase()}
    </div>
  );
};

export default UserAvatar;
