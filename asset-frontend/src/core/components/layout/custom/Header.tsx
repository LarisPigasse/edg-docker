// src/core/components/layout/custom/Header.tsx
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Settings, Bell, ArrowLeft, ChevronRight } from 'lucide-react';

import { UserAvatar, Logo } from '../../info';
import { useUISettings } from '../../../../app/hooks';
import { useIsMobile } from '../../../hooks';
import { MODULES, getActiveModule, ROUTES } from '../../../../config';
import type { SubMenuItem } from '../../../../config';

interface HeaderProps {
  userInitials?: string;
  userName?: string;
}

const Header: React.FC<HeaderProps> = ({ userInitials = 'AD', userName = 'Admin Demo' }) => {
  const { toggleSettingsMenu, toggleUserMenu, toggleMobileMenu } = useUISettings();
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();

  const activeModule = getActiveModule(location.pathname);

  // Determina se siamo sulla Home
  const isHome = location.pathname === '/' || location.pathname === ROUTES.HOME;

  const isActiveLink = (href: string) => location.pathname === href;

  const isModuleActive = (moduleHref: string, moduleId: string) => {
    if (moduleId === 'home') {
      return location.pathname === '/' || location.pathname === moduleHref;
    }
    return location.pathname.startsWith(moduleHref);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const renderDesktopNav = () => {
    return (
      <nav className='hidden md:flex items-center'>
        {/* Pulsante Torna Indietro - Prima di HOME */}
        <button
          onClick={handleGoBack}
          disabled={isHome}
          className={`p-2 rounded-lg transition-colors mr-2 ${
            isHome
              ? 'text-text-disabled cursor-not-allowed opacity-40'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
          }`}
          title={isHome ? 'Torna indietro (disabilitato sulla home)' : 'Torna alla pagina precedente'}
          aria-label='Torna indietro'
        >
          <ArrowLeft className='w-4 h-4' />
        </button>

        {MODULES.map((module, index) => {
          const isActive = isModuleActive(module.href, module.id);
          const isCurrentModule = activeModule?.id === module.id;
          const hasChildren = module.children && module.children.length > 0;
          const showChildren = isCurrentModule && hasChildren;

          return (
            <React.Fragment key={module.id}>
              {index > 0 && <span className='mx-3 text-text-secondary'>|</span>}

              {showChildren ? (
                <>
                  <Link to={module.href} className='text-sm font-bold text-text-menu-active whitespace-nowrap'>
                    {module.label}
                  </Link>

                  <span className='text-text-secondary mx-2'>
                    <ChevronRight className='w-4 h-4' />
                  </span>

                  <div className='flex items-center space-x-4'>
                    {module.children!.map((child: SubMenuItem) => (
                      <Link
                        key={child.id}
                        to={child.href}
                        className={`text-sm font-medium transition-colors whitespace-nowrap ${
                          isActiveLink(child.href) ? 'text-violet-600' : 'text-text-primary hover:text-violet-500'
                        }`}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <Link
                  to={module.href}
                  className={`text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive ? 'text-violet-600' : 'text-text-menu hover:text-violet-500'
                  }`}
                >
                  {module.label}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </nav>
    );
  };

  return (
    <header className='bg-bg-primary border-b border-border-default'>
      <div className='w-full px-2 sm:px-4'>
        <div className='flex items-center h-10'>
          {/* LEFT AREA - Logo (FISSO) */}
          <div className='flex-shrink-0'>
            <Logo />
          </div>

          {/* NAVIGATION - Centr dopo logo */}
          <div className='ml-6'>
            {isMobile ? (
              <button
                onClick={toggleMobileMenu}
                className='p-2 rounded-lg hover:bg-bg-hover transition-colors md:hidden'
                title='Apri menu navigazione'
                aria-label='Menu navigazione'
              >
                <Menu className='w-5 h-5' />
              </button>
            ) : (
              renderDesktopNav()
            )}
          </div>

          {/* SPACER */}
          <div className='flex-1' />

          {/* RIGHT AREA - User Name + Actions */}
          <div className='flex items-center space-x-3'>
            {!isMobile && (
              <>
                <span className='text-sm font-semibold text-text-secondary'>{userName}</span>
                <button
                  className='p-2 rounded-lg hover:bg-bg-hover transition-colors relative'
                  title='Notifiche'
                  aria-label='Notifiche'
                >
                  <Bell className='w-5 h-5 text-text-primary' />
                </button>
              </>
            )}

            <UserAvatar initials={userInitials} size='md' onClick={toggleUserMenu} />

            <button
              onClick={toggleSettingsMenu}
              className='p-2 rounded-lg hover:bg-bg-hover transition-colors text-text-primary'
              title='Impostazioni app'
              aria-label='Menu impostazioni'
            >
              <Settings className='w-5 h-5' />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
