// src/features/auth/pages/LoginPage.tsx

/**
 * ORCHESTRATION LAYER - Modulo Auth
 *
 * Pagina completa di login che assembla i componenti in un layout.
 * Gestisce redirect se già autenticato e "return to" dopo login.
 *
 * @example
 * ```tsx
 * // In App.tsx routing
 * <Route path="/login" element={<LoginPage />} />
 * ```
 */

import React, { useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Logo } from '../../../core/components/info';
import { LoginForm } from '../components';
import { useAuth } from '../hooks';
import { useUISettings } from '../../../app/hooks';
import { ROUTES } from '../../../config';

// ============================================================================
// TYPES
// ============================================================================

/** State passato via Navigate quando si viene reindirizzati al login */
interface LocationState {
  from?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, initializing } = useAuth();
  const { closeAllMenus } = useUISettings();

  // Recupera la pagina da cui l'utente è stato reindirizzato (se presente)
  const locationState = location.state as LocationState | null;
  const returnTo = locationState?.from || '/';

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Se l'utente è già autenticato, redirect alla home (o alla pagina originale).
   * Questo evita che un utente loggato veda la pagina di login.
   */
  useEffect(() => {
    if (!initializing && isAuthenticated) {
      navigate(returnTo, { replace: true });
    }
  }, [isAuthenticated, initializing, navigate, returnTo]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Callback chiamato dopo login riuscito.
   * Chiude tutti i menu aperti e naviga alla pagina originale o alla home.
   */
  const handleLoginSuccess = () => {
    // Chiude tutti i menu (user menu, settings menu, mobile menu, ecc.)
    closeAllMenus();

    // Naviga alla pagina originale o alla home
    navigate(returnTo, { replace: true });
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  // Durante l'inizializzazione, mostra schermata vuota per evitare flash
  if (initializing) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-bg-secondary'>
        <div className='w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin' />
      </div>
    );
  }

  // Se già autenticato, non mostrare nulla (useEffect farà redirect)
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-bg-secondary p-4'>
      {/* Card centrale */}
      <div className='w-full max-w-md'>
        {/* Header con logo */}
        <div className='text-center mb-8'>
          {/* Logo centrato - versione grande */}
          <div className='flex justify-center mb-6'>
            <Logo className='text-4xl' />
          </div>

          {/* Titolo */}
          <h1 className='text-2xl font-semibold text-text-primary'>Accedi al tuo account</h1>
          <p className='mt-2 text-sm text-text-secondary'>Inserisci le tue credenziali per continuare</p>
        </div>

        {/* Card form */}
        <div className='bg-bg-primary rounded-xl shadow-lg border border-border-default p-6 sm:p-8'>
          <LoginForm onSuccess={handleLoginSuccess} />

          {/* Link password dimenticata */}
          <div className='mt-6 text-center'>
            <Link to={ROUTES.FORGOT_PASSWORD} className='text-sm text-text-link hover:text-text-link-hover transition-colors'>
              Password dimenticata?
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className='mt-8 text-center text-xs text-text-secondary'>
          © {new Date().getFullYear()} Express Delivery Group. Tutti i diritti riservati.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
