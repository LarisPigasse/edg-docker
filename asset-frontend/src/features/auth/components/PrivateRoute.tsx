// src/features/auth/components/PrivateRoute.tsx

/**
 * PRESENTATION LAYER - Modulo Auth
 *
 * Componente wrapper che protegge le route private.
 * Se l'utente non è autenticato, reindirizza alla pagina di login.
 *
 * Esempio di utilizzo:
 * // Protezione base
 * <PrivateRoute>
 *  <Dashboard />
 * </PrivateRoute>
 *
 * // Con permesso richiesto
 * <PrivateRoute requiredPermission="spedizioni.read">
 *  <SpedizioniPage />
 * </PrivateRoute>
 *
 * // Con più permessi
 * <PrivateRoute requiredPermissions={['sistema.read', 'sistema.update']}>
 *   <AdminPanel />
 * </PrivateRoute>
 * ```
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks';

// ============================================================================
// TYPES
// ============================================================================

interface PrivateRouteProps {
  /** Il contenuto da renderizzare se l'utente è autorizzato */
  children: React.ReactNode;

  /** Permesso richiesto per accedere (opzionale) */
  requiredPermission?: string;

  /** Lista di permessi richiesti - deve averli tutti (opzionale) */
  requiredPermissions?: string[];

  /** Path dove reindirizzare se non autenticato (default: /login) */
  redirectTo?: string;

  /** Path dove reindirizzare se non ha i permessi (default: /unauthorized o /) */
  unauthorizedRedirectTo?: string;
}

// ============================================================================
// LOADING COMPONENT
// ============================================================================

/**
 * Spinner mostrato durante il check iniziale dell'autenticazione.
 * Evita flash di contenuto non autorizzato.
 */
const LoadingSpinner: React.FC = () => (
  <div className='min-h-screen flex items-center justify-center bg-bg-primary'>
    <div className='text-center space-y-4'>
      {/* Spinner animato */}
      <div className='inline-flex items-center justify-center'>
        <div className='w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin' />
      </div>
      {/* Testo */}
      <p className='text-text-secondary text-sm'>Verifica autenticazione...</p>
    </div>
  </div>
);

// ============================================================================
// COMPONENT
// ============================================================================

export const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
  requiredPermission,
  requiredPermissions,
  redirectTo = '/login',
  unauthorizedRedirectTo = '/',
}) => {
  const { isAuthenticated, initializing, hasPermission, hasAllPermissions } = useAuth();
  const location = useLocation();

  // 1. Durante l'inizializzazione, mostra spinner
  //    Questo evita redirect a login mentre stiamo verificando il token
  if (initializing) {
    return <LoadingSpinner />;
  }

  // 2. Se non autenticato, redirect a login
  //    Salviamo la location corrente per tornare qui dopo il login
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }

  // 3. Se richiesto un permesso singolo, verificalo
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to={unauthorizedRedirectTo} replace />;
  }

  // 4. Se richiesti più permessi, verificali tutti
  if (requiredPermissions && requiredPermissions.length > 0) {
    if (!hasAllPermissions(requiredPermissions)) {
      return <Navigate to={unauthorizedRedirectTo} replace />;
    }
  }

  // 5. Tutto ok, renderizza il contenuto protetto
  return <>{children}</>;
};

export default PrivateRoute;
