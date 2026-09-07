// src/core/components/navigation/custom/MobileMenu.tsx
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';

import { useUISettings } from '../../../../app/hooks';
import { useIsMobile } from '../../../hooks';
import { Logo } from '../../info';
import { MODULES, getActiveModule, isHomeActive } from '../../../../config';
import type { ModuleConfig, SubMenuItem } from '../../../../config';

interface MobileMenuProps {
  className?: string;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ className = '' }) => {
  const { mobileMenuOpen, closeMobileMenu } = useUISettings();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();

  const activeModule = getActiveModule(location.pathname);
  const showAllModules = isHomeActive(location.pathname);

  // Chiudi menu quando non è più mobile
  useEffect(() => {
    if (!isMobile && mobileMenuOpen) {
      closeMobileMenu();
    }
  }, [isMobile, mobileMenuOpen, closeMobileMenu]);

  // Chiudi menu con ESC key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && mobileMenuOpen) {
        closeMobileMenu();
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
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
    closeMobileMenu();
  };

  // Determina se un link è attivo
  const isActiveLink = (href: string) => {
    return location.pathname === href;
  };

  // Determina se un modulo è quello attivo
  const isModuleActive = (module: ModuleConfig) => {
    if (module.id === 'home') {
      return location.pathname === '/' || location.pathname === module.href;
    }
    return location.pathname.startsWith(module.href);
  };

  // Render singolo modulo
  const renderModule = (module: ModuleConfig, showChildren: boolean = false) => {
    const Icon = module.icon;
    const isActive = isModuleActive(module);

    return (
      <div key={module.id}>
        <button
          onClick={() => handleNavigation(module.href)}
          className={`
            w-full flex items-center space-x-3 px-3 py-3 rounded-lg
            text-left transition-all duration-200
            ${
              isActiveLink(module.href)
                ? 'bg-bg-selected text-text-primary'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
            }
          `}
        >
          <Icon className='w-5 h-5 flex-shrink-0' />
          <span className={`font-medium ${isActiveLink(module.href) ? 'text-text-primary' : 'text-text-secondary'}`}>
            {module.label}
          </span>
        </button>

        {/* Children del modulo */}
        {showChildren && isActive && module.children && module.children.length > 0 && (
          <div className='mt-1 ml-4 pl-4 border-l border-border-default space-y-1'>
            {module.children.map((child: SubMenuItem) => (
              <button
                key={child.id}
                onClick={() => handleNavigation(child.href)}
                className={`
                  w-full flex items-center px-3 py-2 rounded-lg
                  text-left transition-all duration-200 text-sm
                  ${
                    isActiveLink(child.href)
                      ? 'bg-bg-selected text-text-primary font-medium'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                  }
                `}
              >
                {child.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render navigazione
  const renderNavigation = () => {
    // Home attiva: mostra tutti i moduli senza children
    if (showAllModules) {
      return MODULES.map(module => renderModule(module, false));
    }

    // Modulo attivo: mostra Home + Modulo attivo con children
    const homeModule = MODULES.find(m => m.id === 'home');

    return (
      <>
        {homeModule && renderModule(homeModule, false)}
        {activeModule && renderModule(activeModule, true)}
      </>
    );
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
          ${mobileMenuOpen ? 'opacity-100' : 'opacity-0'}
        `}
        onClick={handleBackdropClick}
        aria-hidden='true'
      />

      {/* Mobile Menu Panel */}
      <div className='fixed inset-0 z-50 pointer-events-none'>
        <div className='flex justify-start h-full'>
          {/* Panel */}
          <div
            className={`
              pointer-events-auto w-80 max-w-[85vw] h-full shadow-2xl bg-bg-primary
              transform transition-all duration-300 ease-out
              ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
              border-r border-border-default
              ${className}
            `}
          >
            {/* Header */}
            <div className='flex items-center justify-between p-4 border-b border-border-default bg-bg-secondary'>
              <Logo />
              <button
                onClick={closeMobileMenu}
                className='p-2 text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors'
                aria-label='Chiudi menu'
              >
                <X className='w-5 h-5' />
              </button>
            </div>

            {/* Navigation Items */}
            <div className='flex-1 overflow-y-auto py-4'>
              <nav className='px-4 space-y-1'>{renderNavigation()}</nav>
            </div>

            {/* Footer */}
            <div className='p-4 border-t border-border-default bg-bg-secondary'>
              <span className='text-xs text-center text-text-secondary block'>EDG Frontend Template</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileMenu;
