// src/core/components/navigation/custom/UserMenu.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUISettings } from '../../../../app/hooks';
import { useAuth } from '../../../../features/auth';
import { UserAvatar } from '../../info';
import { X, User, Settings, LogOut, Mail, Shield, Lock } from 'lucide-react';
import { ROUTES } from '../../../../config';

interface UserMenuProps {
  className?: string;
}

const UserMenu: React.FC<UserMenuProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const { userMenuOpen, closeUserMenu } = useUISettings();
  const { logout, loading, account, getUserInitials, getDisplayName } = useAuth();

  // Chiudi menu con ESC key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && userMenuOpen) {
        closeUserMenu();
      }
    };

    if (userMenuOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [userMenuOpen, closeUserMenu]);

  // Handler per click su backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeUserMenu();
    }
  };

  // ============================================================================
  // HANDLER LOGOUT - Option B: Sicuro
  // Attende la risposta del backend prima di reindirizzare
  // ============================================================================
  const handleLogout = async () => {
    try {
      // Chiama logout (attende il backend)
      await logout();

      // Dopo logout, reindirizza a login
      navigate(ROUTES.LOGIN);
    } catch (error) {
      // Se logout fallisce, comunque reindirizza (per sicurezza)
      // Il backend potrebbe essere down, ma vogliamo logout l'utente
      console.error('Errore durante logout:', error);
      navigate(ROUTES.LOGIN);
    }
  };

  // ============================================================================
  // HANDLER CAMBIA PASSWORD
  // ============================================================================
  const handleChangePassword = () => {
    navigate(ROUTES.CHANGE_PASSWORD);
    closeUserMenu();
  };

  if (!userMenuOpen) return null;

  // Dati utente dall'auth state
  const userInitials = getUserInitials();
  const userName = getDisplayName();
  const userEmail = account?.email || '';
  const userRole = account?.roleName || 'Utente';

  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 bg-black/50 z-40 
          transition-opacity duration-300 ease-out
          ${userMenuOpen ? 'opacity-100' : 'opacity-0'}
        `}
        onClick={handleBackdropClick}
        aria-hidden='true'
      />

      {/* Dropdown Menu */}
      <div className='fixed top-14 right-4 z-50'>
        <div
          className={`
            w-72 shadow-xl rounded-lg border border-border-default bg-bg-primary transform transition-all duration-300 ease-out
            ${userMenuOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 -translate-y-2'}
            ${className}
          `}
        >
          {/* Header con Info Utente */}
          <div className='p-4 border-b border-border-default'>
            <div className='flex items-center space-x-3'>
              <UserAvatar initials={userInitials} size='lg' variant='primary' />
              <div className='flex-1 min-w-0'>
                <span className='text-text-primary font-semibold truncate block'>{userName}</span>
                <span className='text-text-secondary text-sm truncate flex items-center'>
                  <Mail className='w-3 h-3 mr-1' />
                  {userEmail}
                </span>
                <span className='text-text-secondary text-xs flex items-center mt-1'>
                  <Shield className='w-3 h-3 mr-1' />
                  {userRole}
                </span>
              </div>
              <button
                onClick={closeUserMenu}
                className='p-1 text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-md transition-colors'
                aria-label='Chiudi menu'
                disabled={loading}
              >
                <X className='w-4 h-4' />
              </button>
            </div>
          </div>

          {/* Menu Items */}
          <div className='py-2'>
            {/* Profilo */}
            <button
              className='w-full px-4 py-3 text-left hover:bg-bg-hover transition-colors flex items-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed'
              onClick={() => {
                // TODO: Navigate to profile
                console.log('Profile clicked');
                closeUserMenu();
              }}
              disabled={loading}
            >
              <User className='w-4 h-4 text-text-secondary' />
              <div>
                <span className='text-text-primary font-medium block'>Il mio profilo</span>
                <span className='text-text-secondary text-sm block'>Gestisci il tuo account</span>
              </div>
            </button>

            {/* Cambia password */}
            <button
              className='w-full px-4 py-3 text-left hover:bg-bg-hover transition-colors flex items-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed'
              onClick={handleChangePassword}
              disabled={loading}
            >
              <Lock className='w-4 h-4 text-text-secondary' />
              <div>
                <span className='text-text-primary font-medium block'>Cambia password</span>
                <span className='text-text-secondary text-sm block'>Aggiorna la tua password</span>
              </div>
            </button>

            {/* Preferenze */}
            <button
              className='w-full px-4 py-3 text-left hover:bg-bg-hover transition-colors flex items-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed'
              onClick={() => {
                // TODO: Navigate to preferences
                console.log('Preferences clicked');
                closeUserMenu();
              }}
              disabled={loading}
            >
              <Settings className='w-4 h-4 text-text-secondary' />
              <div>
                <span className='text-text-primary font-medium block'>Preferenze</span>
                <span className='text-text-secondary text-sm block'>Personalizza l'esperienza</span>
              </div>
            </button>

            {/* Separatore */}
            <div className='my-2 border-t border-border-default'></div>

            {/* Logout */}
            <button
              className='w-full px-4 py-3 text-left hover:bg-bg-selected dark:hover:bg-bg-selected transition-colors flex items-center space-x-3 text-red-600 dark:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed'
              onClick={handleLogout}
              disabled={loading}
            >
              <LogOut className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <div>
                <span className='font-medium text-red-600 dark:text-red-400 block'>
                  {loading ? 'Logout in corso...' : 'Logout'}
                </span>
                <span className='text-sm text-red-500 dark:text-red-500 block'>
                  {loading ? 'Attendi...' : "Esci dall'applicazione"}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserMenu;
