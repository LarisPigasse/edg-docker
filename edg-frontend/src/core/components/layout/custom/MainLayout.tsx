import React from "react";
import { ThemedSurface } from "../../atomic";
import { Header, Footer, Sidebar } from "..";
import { SettingsMenu } from "../../navigation";
import { UserMenu } from "../../navigation";
import { useUISettings } from "../../../../app/hooks";
import { useIsMobile } from "../../../hooks";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { footerVisible, sidebarVisible } = useUISettings();
  const isMobile = useIsMobile();

  // Logica per Header - semplificata
  const shouldShowLogo = !isMobile && !sidebarVisible;
  const shouldShowNavigation = !isMobile && !sidebarVisible;

  // Layout Mobile - semplice, nessuna sidebar
  if (isMobile) {
    return (
      <ThemedSurface variant="base" className="min-h-screen">
        <Header showLogo={shouldShowLogo} showNavigation={shouldShowNavigation} />
        <ThemedSurface variant="base" as="main" className="min-h-screen">
          <div className="w-full px-4 sm:px-6 py-8">{children}</div>
        </ThemedSurface>
        {footerVisible && <Footer showVersionInfo={true} />}
        {/* ✨ MENU COMPONENTS - Renderizzati sempre */}
        <SettingsMenu />
        {/* <UserMenu /> */} {/* Uncomment quando UserMenu sarà pronto */}
      </ThemedSurface>
    );
  }

  // Layout Desktop - GRID con Header e Sidebar Sticky
  return (
    <ThemedSurface variant="base" className="min-h-screen">
      <div className="grid grid-cols-1 grid-rows-[auto_1fr_auto] min-h-screen">
        {/* Header Sticky - sempre in cima */}
        <header className="sticky top-0 z-40 col-span-full">
          <Header showLogo={shouldShowLogo} showNavigation={shouldShowNavigation} />
        </header>

        {/* Content Area - con sidebar e main */}
        <div className="flex min-h-0">
          {/* Sidebar Sticky - sempre visibile a sinistra */}
          {sidebarVisible && (
            <div
              className="sticky top-12"
              style={{
                height: footerVisible
                  ? "calc(100vh - 3.125rem - 2.375rem)" // header + footer compatto
                  : "calc(100vh - 3.125rem)", // solo header
              }}
            >
              <Sidebar />
            </div>
          )}

          {/* Main Content - solo questo scrolla */}
          <ThemedSurface variant="base" as="main" className="flex-1 min-w-0 overflow-y-auto flex flex-col">
            <div className="w-full px-4 sm:px-6 py-8 flex-1">{children}</div>
          </ThemedSurface>
        </div>

        {/* Footer - sempre in fondo */}
        {footerVisible && (
          <footer className="sticky bottom-0 z-40 col-span-full">
            <Footer showVersionInfo={true} />
          </footer>
        )}
      </div>
      {/* MENU COMPONENTS - Renderizzati sempre alla fine */}
      <SettingsMenu />
      <UserMenu />
    </ThemedSurface>
  );
};

export default MainLayout;
