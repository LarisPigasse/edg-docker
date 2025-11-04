// src/core/components/navigation/SettingsMenu.tsx
import React, { useEffect } from "react";
import { useUISettings } from "../../../../app/hooks";
import { ThemedSurface, ThemedText } from "../../atomic";
import { X } from "lucide-react";

interface SettingsMenuProps {
  className?: string;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ className = "" }) => {
  const {
    settingsMenuOpen,
    closeSettingsMenu,
    darkMode,
    sidebarVisible,
    footerVisible,
    toggleDarkMode,
    toggleSidebar,
    toggleFooter,
  } = useUISettings();

  // Chiudi menu con ESC key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && settingsMenuOpen) {
        closeSettingsMenu();
      }
    };

    if (settingsMenuOpen) {
      document.addEventListener("keydown", handleEscKey);
      // Blocca scroll del body quando menu è aperto
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "unset";
    };
  }, [settingsMenuOpen, closeSettingsMenu]);

  // Handler per click su backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeSettingsMenu();
    }
  };

  if (!settingsMenuOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 bg-black/70 z-40 
          transition-all duration-300 ease-out
          ${settingsMenuOpen ? "opacity-100" : "opacity-0"}
        `}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal Container - Posizionata in alto a destra */}
      <div className="fixed inset-0 z-50 pointer-events-none">
        <div className="flex justify-end pt-16 pr-4 sm:pr-6">
          {/* Modal Panel */}
          <ThemedSurface
            variant="primary"
            borderVariant="default"
            className={`
              pointer-events-auto w-80 max-w-[90vw] shadow-2xl rounded-xl border
              transform transition-all duration-300 ease-out
              ${settingsMenuOpen ? "translate-y-0 scale-100 opacity-100" : "-translate-y-4 scale-95 opacity-0"}
              ${className}
            `}
            style={{
              transformOrigin: "top right",
              transitionTimingFunction: settingsMenuOpen
                ? "cubic-bezier(0.25, 0.46, 0.45, 0.94)"
                : "cubic-bezier(0.55, 0.055, 0.675, 0.19)",
            }}
          >
            {/* Header */}
            <ThemedSurface
              variant="secondary"
              borderVariant="default"
              className={`
                flex items-center justify-between p-4 border-b rounded-t-xl
                transform transition-all duration-400 ease-out
                ${settingsMenuOpen ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"}
              `}
              style={{ transitionDelay: settingsMenuOpen ? "100ms" : "0ms" }}
            >
              <ThemedText variant="primary" className="text-lg font-semibold">
                Impostazioni
              </ThemedText>
              <button
                onClick={closeSettingsMenu}
                className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors"
                aria-label="Chiudi menu"
              >
                <X className="w-4 h-4" />
              </button>
            </ThemedSurface>

            {/* Content */}
            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <div
                className={`
                  space-y-4 transform transition-all duration-500 ease-out
                  ${settingsMenuOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}
                `}
                style={{ transitionDelay: settingsMenuOpen ? "200ms" : "0ms" }}
              >
                {/* Dark Mode Toggle */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex-1">
                    <ThemedText variant="primary" className="font-medium" block>
                      Dark Mode
                    </ThemedText>
                    <ThemedText variant="secondary" className="text-sm mt-0.5">
                      Attiva/disattiva tema scuro
                    </ThemedText>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <ToggleSwitch checked={darkMode} onChange={toggleDarkMode} id="darkMode" />
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-border-default" />

                {/* Sidebar Toggle */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex-1">
                    <ThemedText variant="primary" className="font-medium" block>
                      Sidebar
                    </ThemedText>
                    <ThemedText variant="secondary" className="text-sm mt-0.5">
                      Mostra/nascondi barra laterale
                    </ThemedText>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <ToggleSwitch checked={sidebarVisible} onChange={toggleSidebar} id="sidebar" />
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-border-default" />

                {/* Footer Toggle */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex-1">
                    <ThemedText variant="primary" className="font-medium" block>
                      Footer
                    </ThemedText>
                    <ThemedText variant="secondary" className="text-sm mt-0.5">
                      Mostra/nascondi footer
                    </ThemedText>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <ToggleSwitch checked={footerVisible} onChange={toggleFooter} id="footer" />
                  </div>
                </div>
              </div>
            </div>

            {/* Optional Footer Actions */}
            <div
              className={`
                px-4 py-3 border-t border-border-default rounded-b-xl
                transform transition-all duration-500 ease-out
                ${settingsMenuOpen ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}
              `}
              style={{ transitionDelay: settingsMenuOpen ? "300ms" : "0ms" }}
            >
              <ThemedText variant="secondary" className="text-xs text-center">
                Le impostazioni vengono salvate automaticamente
              </ThemedText>
            </div>
          </ThemedSurface>
        </div>
      </div>
    </>
  );
};

// Componente ToggleSwitch riutilizzabile - Migliorato
interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  id: string;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, id, disabled = false }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={`${id}-label`}
      onClick={onChange}
      disabled={disabled}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full 
        transition-all duration-200 ease-out transform hover:scale-105
        focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2
        dark:focus:ring-offset-bg-primary focus:scale-105
        ${
          checked
            ? "bg-violet-600 dark:bg-violet-500 shadow-lg shadow-violet-600/25"
            : "bg-gray-300 dark:bg-gray-600 shadow-inner border border-border-default"
        }
        ${disabled ? "opacity-50 cursor-not-allowed transform-none hover:scale-100" : "cursor-pointer active:scale-95"}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white 
          transition-transform duration-200 ease-out shadow-sm
          ${checked ? "translate-x-6 shadow-md" : "translate-x-1"}
        `}
      />
    </button>
  );
};

export default SettingsMenu;
