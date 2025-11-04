import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ThemedSurface, ThemedText } from "../../atomic";
import { iconMap } from "../../../utils";
import { useUISettings } from "../../../../app/hooks";
import { NAVIGATION_ITEMS } from "../../../../config";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { IconName } from "../../../utils";

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className = "" }) => {
  const location = useLocation();
  const { sidebarExpanded, toggleSidebarExpanded } = useUISettings();

  // Determina se un link è attivo
  const isActiveLink = (href: string) => {
    return location.pathname === href;
  };

  // Genera le icone per i menu items
  const getMenuIcon = (iconType: IconName) => {
    const IconComponent = iconMap[iconType];
    return <IconComponent className="w-5 h-5 flex-shrink-0" />;
  };

  // Crea le classi per menu item - AGGIORNATE con nuovi nomi CSS
  const getMenuItemClasses = (isActive: boolean) => {
    const baseClasses = "flex items-center rounded-lg text-sm font-medium transition-colors duration-200";
    const paddingClasses = sidebarExpanded ? "px-3 py-3" : "px-2 py-2 justify-center";

    if (isActive) {
      return `${baseClasses} ${paddingClasses} bg-bg-selected text-text-primary`;
    } else {
      return `${baseClasses} ${paddingClasses} text-text-secondary hover:bg-bg-hover hover:text-text-primary`;
    }
  };

  return (
    <ThemedSurface
      variant="secondary"
      borderVariant="none"
      as="aside"
      className={`
        h-full flex flex-col transition-all duration-300 ease-in-out border-r border-border-default
        ${sidebarExpanded ? "w-64" : "w-12"}
        ${className}
      `}
    >
      {/* Navigation Menu - flex-1 con scroll interno se necessario */}
      <nav className="pt-6 flex-1 overflow-y-auto">
        <ul className={`space-y-2 ${sidebarExpanded ? "px-3" : "px-2"}`}>
          {NAVIGATION_ITEMS.map((item) => (
            <li key={item.id}>
              <Link
                to={item.href}
                className={getMenuItemClasses(isActiveLink(item.href))}
                title={sidebarExpanded ? undefined : item.label}
              >
                {getMenuIcon(item.icon)}
                {sidebarExpanded && (
                  <ThemedText variant="inherit" as="span" className="ml-3 transition-opacity duration-300">
                    {item.label}
                  </ThemedText>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer della Sidebar - Collapse Toggle - sempre in fondo */}
      <div className="p-4 border-t border-border-thin flex-shrink-0">
        <button
          onClick={toggleSidebarExpanded}
          className={`w-full flex items-center rounded-lg text-sm font-medium transition-colors duration-200 text-text-secondary hover:bg-bg-hover hover:text-text-primary ${
            sidebarExpanded ? "px-3 py-2" : "px-2 py-2 justify-center"
          }`}
          title={sidebarExpanded ? "Comprimi sidebar" : "Espandi sidebar"}
        >
          {sidebarExpanded ? (
            <>
              <ChevronLeft className="w-5 h-5 flex-shrink-0" />
              <ThemedText variant="inherit" as="span" className="ml-3">
                Comprimi
              </ThemedText>
            </>
          ) : (
            <ChevronRight className="w-5 h-5 flex-shrink-0" />
          )}
        </button>
      </div>
    </ThemedSurface>
  );
};

export default Sidebar;
