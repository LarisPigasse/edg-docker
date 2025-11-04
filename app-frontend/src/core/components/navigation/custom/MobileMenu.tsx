// src/core/components/navigation/MobileMenu.tsx
import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUISettings } from "../../../../app/hooks";
import { useIsMobile } from "../../../hooks";
import { ThemedSurface, ThemedText } from "../../atomic";
import { Logo } from "../../info";
import { X } from "lucide-react";
import { NAVIGATION_ITEMS } from "../../../../config";
import { iconMap } from "../../../utils";

interface MobileMenuProps {
  className?: string;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ className = "" }) => {
  const { mobileMenuOpen, closeMobileMenu } = useUISettings();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();

  // Chiudi menu quando non è più mobile
  useEffect(() => {
    if (!isMobile && mobileMenuOpen) {
      closeMobileMenu();
    }
  }, [isMobile, mobileMenuOpen, closeMobileMenu]);

  // Chiudi menu con ESC key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && mobileMenuOpen) {
        closeMobileMenu();
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener("keydown", handleEscKey);
      // Blocca scroll del body quando menu è aperto
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen, closeMobileMenu]);

  // Handler per click su backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeMobileMenu();
    }
  };

  // Handler per navigazione
  const handleNavigation = (href: string) => {
    navigate(href);
    closeMobileMenu(); // ⭐ Auto-close dopo navigazione
  };

  // Non renderizzare se non mobile o menu non aperto
  if (!isMobile || !mobileMenuOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 bg-black/70 z-40 
          transition-all duration-300 ease-out
          ${mobileMenuOpen ? "opacity-100" : "opacity-0"}
        `}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Mobile Menu Panel */}
      <div className="fixed inset-0 z-50 pointer-events-none">
        <div className="flex justify-start h-full">
          {/* Panel */}
          <ThemedSurface
            variant="primary"
            borderVariant="default"
            className={`
              pointer-events-auto w-80 max-w-[85vw] h-full shadow-2xl 
              transform transition-all duration-300 ease-out
              ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
              border-r
              ${className}
            `}
          >
            {/* Header */}
            <ThemedSurface
              variant="secondary"
              borderVariant="default"
              className="flex items-center justify-between p-4 border-b"
            >
              {/* Logo */}
              <Logo variant="full" />

              {/* Close Button */}
              <button
                onClick={closeMobileMenu}
                className="p-2 text-content-secondary hover:text-content-primary hover:bg-surface-hover rounded-lg transition-colors"
                aria-label="Chiudi menu"
              >
                <X className="w-5 h-5" />
              </button>
            </ThemedSurface>

            {/* Navigation Items */}
            <div className="flex-1 overflow-y-auto py-4">
              <nav className="px-4 space-y-1">
                {NAVIGATION_ITEMS.map((item) => {
                  const Icon = iconMap[item.icon];
                  const isActive = location.pathname === item.href;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item.href)}
                      className={`
                        w-full flex items-center space-x-3 px-3 py-3 rounded-lg
                        text-left transition-all duration-200
                        ${
                          isActive
                            ? "bg-surface-selected text-content-primary"
                            : "text-content-secondary hover:text-content-primary hover:bg-surface-hover"
                        }
                      `}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <ThemedText variant={isActive ? "primary" : "secondary"} className="font-medium">
                          {item.label}
                        </ThemedText>
                        {item.description && (
                          <ThemedText variant="secondary" className="text-xs mt-0.5">
                            {item.description}
                          </ThemedText>
                        )}
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Footer */}
            <ThemedSurface variant="secondary" borderVariant="default" className="p-4 border-t">
              <ThemedText variant="secondary" className="text-xs text-center">
                EDG Frontend Template
              </ThemedText>
            </ThemedSurface>
          </ThemedSurface>
        </div>
      </div>
    </>
  );
};

export default MobileMenu;
