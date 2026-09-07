// src/features/auth/pages/ForgotPasswordPage.tsx

/**
 * ORCHESTRATION LAYER - Modulo Auth
 *
 * Pagina per richiedere il reset della password.
 * L'utente inserisce la sua email e riceve un link per reimpostare la password.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { Logo } from '../../../core/components/info';
import { Input } from '../../../core/components/form';
import { Button } from '../../../core/components/ui';
import { authApi } from '../api';
import { ROUTES } from '../../../config';

// ============================================================================
// TYPES
// ============================================================================

type PageState = 'form' | 'success';

interface FormErrors {
  email?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ForgotPasswordPage: React.FC = () => {
  const [pageState, setPageState] = useState<PageState>('form');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (formErrors.email) {
      setFormErrors({});
    }
    if (error) {
      setError(null);
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!email.trim()) {
      errors.email = 'Email obbligatoria';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Formato email non valido';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await authApi.requestPasswordReset({ email: email.trim() });

      if (response.success) {
        setPageState('success');
      } else {
        setError(response.error || 'Errore durante la richiesta');
      }
    } catch {
      setError('Errore di connessione. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // RENDER - Success State
  // ============================================================================

  if (pageState === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-secondary p-4">
        <div className="w-full max-w-md">
          {/* Header con logo */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <Logo className="text-4xl" />
            </div>
          </div>

          {/* Card successo */}
          <div className="bg-bg-primary rounded-xl shadow-lg border border-border-default p-6 sm:p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>

            <h1 className="text-xl font-semibold text-text-primary mb-2">
              Controlla la tua email
            </h1>

            <p className="text-text-secondary mb-6">
              Se esiste un account associato a <strong>{email}</strong>, riceverai un'email con le istruzioni per reimpostare la password.
            </p>

            <Link
              to={ROUTES.LOGIN}
              className="inline-flex items-center justify-center gap-2 text-text-link hover:text-text-link-hover transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Torna al login
            </Link>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-text-tertiary">
            © {new Date().getFullYear()} Express Delivery Group. Tutti i diritti riservati.
          </p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER - Form State
  // ============================================================================

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-secondary p-4">
      <div className="w-full max-w-md">
        {/* Header con logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Logo className="text-4xl" />
          </div>

          <h1 className="text-2xl font-semibold text-text-primary">
            Password dimenticata?
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Inserisci la tua email e ti invieremo le istruzioni per reimpostarla
          </p>
        </div>

        {/* Card form */}
        <div className="bg-bg-primary rounded-xl shadow-lg border border-border-default p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Errore API */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Campo Email */}
            <Input
              type="email"
              label="Email"
              value={email}
              onChange={handleEmailChange}
              error={formErrors.email}
              required
              disabled={loading}
              autoComplete="email"
              autoFocus
            />

            {/* Pulsante Submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={loading}
              loadingText="Invio in corso..."
              leftIcon={<Mail className="w-5 h-5" />}
            >
              Invia istruzioni
            </Button>
          </form>

          {/* Link torna al login */}
          <div className="mt-6 text-center">
            <Link
              to={ROUTES.LOGIN}
              className="inline-flex items-center gap-2 text-sm text-text-link hover:text-text-link-hover transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Torna al login
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-text-tertiary">
          © {new Date().getFullYear()} Express Delivery Group. Tutti i diritti riservati.
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
