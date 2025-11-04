// src/core/components/navigation/UserMenu.tsx
import React, { useEffect } from "react";
import { useUISettings } from "../../../../app/hooks";
import { ThemedSurface, ThemedText } from "../../atomic";
import { UserAvatar } from "../../info";
import { X, User, Settings, LogOut, Mail, Shield } from "lucide-react";

interface UserMenuProps {
  className?: string;
  userInitials?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
}

const UserMenu: React.FC<UserMenuProps> = ({
  className = "",
  userInitials = "AD",
  userName = "Admin Demo",
  userEmail = "admin@demo.com",
  userRole = "Administrator",
}) => {
  const { userMenuOpen, closeUserMenu } = useUISettings();

  // Chiudi menu con ESC key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && userMenuOpen) {
        closeUserMenu();
      }
    };

    if (userMenuOpen) {
      document.addEventListener("keydown", handleEscKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [userMenuOpen, closeUserMenu]);

  // Handler per click su backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeUserMenu();
    }
  };

  // Handler per logout
  const handleLogout = () => {
    // TODO: Implementare logout logic
    console.log("Logout clicked");
    closeUserMenu();
  };

  if (!userMenuOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 bg-black/50 z-40 
          transition-opacity duration-300 ease-out
          ${userMenuOpen ? "opacity-100" : "opacity-0"}
        `}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Dropdown Menu */}
      <div className="fixed top-14 right-4 z-50">
        <ThemedSurface
          variant="primary"
          borderVariant="default"
          className={`
            w-72 shadow-xl rounded-lg border transform transition-all duration-300 ease-out
            ${userMenuOpen ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 -translate-y-2"}
            ${className}
          `}
        >
          {/* Header con Info Utente */}
          <div className="p-4 border-b border-border-default">
            <div className="flex items-center space-x-3">
              <UserAvatar initials={userInitials} size="lg" variant="primary" />
              <div className="flex-1 min-w-0">
                <ThemedText variant="primary" className="font-semibold truncate">
                  {userName}
                </ThemedText>
                <ThemedText variant="secondary" className="text-sm truncate flex items-center">
                  <Mail className="w-3 h-3 mr-1" />
                  {userEmail}
                </ThemedText>
                <ThemedText variant="secondary" className="text-xs flex items-center mt-1">
                  <Shield className="w-3 h-3 mr-1" />
                  {userRole}
                </ThemedText>
              </div>
              <button
                onClick={closeUserMenu}
                className="p-1 text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-md transition-colors"
                aria-label="Chiudi menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {/* Profilo */}
            <button
              className="w-full px-4 py-3 text-left hover:bg-bg-hover transition-colors flex items-center space-x-3"
              onClick={() => {
                // TODO: Navigate to profile
                console.log("Profile clicked");
                closeUserMenu();
              }}
            >
              <User className="w-4 h-4 text-text-secondary" />
              <div>
                <ThemedText variant="primary" className="font-medium" block>
                  Il mio profilo
                </ThemedText>
                <ThemedText variant="secondary" className="text-sm">
                  Gestisci il tuo account
                </ThemedText>
              </div>
            </button>

            {/* Preferenze */}
            <button
              className="w-full px-4 py-3 text-left hover:bg-bg-hover transition-colors flex items-center space-x-3"
              onClick={() => {
                // TODO: Navigate to preferences
                console.log("Preferences clicked");
                closeUserMenu();
              }}
            >
              <Settings className="w-4 h-4 text-text-secondary" />
              <div>
                <ThemedText variant="primary" className="font-medium" block>
                  Preferenze
                </ThemedText>
                <ThemedText variant="secondary" className="text-sm">
                  Personalizza l'esperienza
                </ThemedText>
              </div>
            </button>

            {/* Separatore */}
            <div className="my-2 border-t border-border-default"></div>

            {/* Logout */}
            <button
              className="w-full px-4 py-3 text-left hover:bg-bg-selected dark:hover:bg-bg-selected transition-colors flex items-center space-x-3 text-red-600 dark:text-red-400"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              <div>
                <ThemedText className="font-medium text-red-600 dark:text-red-400" block>
                  Logout
                </ThemedText>
                <ThemedText className="text-sm text-red-500 dark:text-red-500">Esci dall'applicazione</ThemedText>
              </div>
            </button>
          </div>
        </ThemedSurface>
      </div>
    </>
  );
};

export default UserMenu;
