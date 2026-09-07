// src/core/components/navigation/custom/SettingsMenu.tsx
import React, { useEffect } from 'react';
import { useUISettings } from '../../../../app/hooks';
import { X } from 'lucide-react';

interface SettingsMenuProps {
  className?: string;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ className = '' }) => {
  const { settingsMenuOpen, closeSettingsMenu, darkMode, footerVisible, toggleDarkMode, toggleFooter } = useUISettings();

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && settingsMenuOpen) {
        closeSettingsMenu();
      }
    };

    if (settingsMenuOpen) {
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [settingsMenuOpen, closeSettingsMenu]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeSettingsMenu();
    }
  };

  if (!settingsMenuOpen) return null;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/70 z-40 transition-all duration-300 ease-out ${
          settingsMenuOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleBackdropClick}
        aria-hidden='true'
      />

      <div className='fixed inset-0 z-50 pointer-events-none'>
        <div className='flex justify-end pt-16 pr-4 sm:pr-6'>
          <div
            className={`pointer-events-auto w-80 max-w-[90vw] shadow-2xl rounded-xl border border-border-default bg-bg-primary transform transition-all duration-300 ease-out ${
              settingsMenuOpen ? 'translate-y-0 scale-100 opacity-100' : '-translate-y-4 scale-95 opacity-0'
            } ${className}`}
            style={{ transformOrigin: 'top right' }}
          >
            <div className='flex items-center justify-between p-4 border-b border-border-default rounded-t-xl bg-bg-secondary'>
              <span className='text-lg font-semibold text-text-primary'>Impostazioni</span>
              <button
                onClick={closeSettingsMenu}
                className='p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors'
                aria-label='Chiudi menu'
              >
                <X className='w-4 h-4' />
              </button>
            </div>

            <div className='p-4 space-y-4 max-h-[60vh] overflow-y-auto'>
              <div className='space-y-4'>
                <div className='flex items-center justify-between py-2'>
                  <div className='flex-1'>
                    <span className='text-text-primary font-medium block'>Dark Mode</span>
                    <span className='text-text-secondary text-sm mt-0.5 block'>Attiva/disattiva tema scuro</span>
                  </div>
                  <div className='flex-shrink-0 ml-4'>
                    <ToggleSwitch checked={darkMode} onChange={toggleDarkMode} id='darkMode' />
                  </div>
                </div>

                <div className='border-t border-border-default' />

                <div className='flex items-center justify-between py-2'>
                  <div className='flex-1'>
                    <span className='text-text-primary font-medium block'>Footer</span>
                    <span className='text-text-secondary text-sm mt-0.5 block'>Mostra/nascondi footer</span>
                  </div>
                  <div className='flex-shrink-0 ml-4'>
                    <ToggleSwitch checked={footerVisible} onChange={toggleFooter} id='footer' />
                  </div>
                </div>
              </div>
            </div>

            <div className='px-4 py-3 border-t border-border-default rounded-b-xl'>
              <span className='text-xs text-center text-text-secondary block'>
                Le impostazioni vengono salvate automaticamente
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  id: string;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, disabled = false }) => {
  return (
    <button
      type='button'
      role='switch'
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 ease-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 ${
        checked
          ? 'bg-violet-600 dark:bg-violet-500 shadow-lg shadow-violet-600/25'
          : 'bg-gray-300 dark:bg-gray-600 shadow-inner border border-border-default'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-out shadow-sm ${
          checked ? 'translate-x-6 shadow-md' : 'translate-x-1'
        }`}
      />
    </button>
  );
};

export default SettingsMenu;
