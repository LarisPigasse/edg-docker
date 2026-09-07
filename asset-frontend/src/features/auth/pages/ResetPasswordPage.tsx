// src/features/auth/pages/ResetPasswordPage.tsx

/**
 * ORCHESTRATION LAYER - Modulo Auth
 *
 * Pagina per reimpostare la password usando il token ricevuto via email.
 * URL: /reset-password?token=xxx
 */

import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Logo } from '../../../core/components/info';
import { PasswordInput } from '../../../core/components/form';
import { Button } from '../../../core/components/ui';
import { authApi } from '../api';
import { ROUTES } from '../../../config';

// ============================================================================
// TYPES
// ============================================================================

type PageState = 'form' | 'success' | 'error';

interface FormState {
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  password?: string;
  confirmPassword?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [pageState, setPageState] = useState<PageState>(token ? 'form' : 'error');
  const [formData, setFormData] = useState<FormState>({
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleChange = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));

    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
    if (error) {
      setError(null);
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    // Password obbligatoria e minimo 6 caratteri
    if (!formData.password) {
      errors.password = 'Password obbligatoria';
    } else if (formData.password.length < 6) {
      errors.password = 'La password deve essere di almeno 6 caratteri';
    }

    // Conferma password
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Conferma la password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Le password non corrispondono';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !token) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await authApi.confirmPasswordReset({
        token,
        newPassword: formData.password,
      });

      if (response.success) {
        setPageState('success');
      } else {
        setError(response.error || 'Errore durante il reset della password');
      }
    } catch {
      setError('Errore di connessione. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigate(ROUTES.LOGIN);
  };

  // ============================================================================
  // RENDER - Error State (no token)
  // ============================================================================

  if (pageState === 'error' && !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-secondary p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <Logo className="text-4xl" />
            </div>
          </div>

          <div className="bg-bg-primary rounded-xl shadow-lg border border-border-default p-6 sm:p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            </div>

            <h1 className="text-xl font-semibold text-text-primary mb-2">
              Link non valido
            </h1>

            <p className="text-text-secondary mb-6">
              Il link per reimpostare la password non è valido o è scaduto.
              Richiedi un nuovo link di reset.
            </p>

            <div className="space-y-3">
              <Link
                to={ROUTES.FORGOT_PASSWORD}
                className="block w-full"
              >
                <Button variant="primary" fullWidth>
                  Richiedi nuovo link
                </Button>
              </Link>

              <Link
                to={ROUTES.LOGIN}
                className="inline-flex items-center justify-center gap-2 text-text-link hover:text-text-link-hover transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Torna al login
              </Link>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-text-tertiary">
            © {new Date().getFullYear()} Express Delivery Group. Tutti i diritti riservati.
          </p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER - Success State
  // ============================================================================

  if (pageState === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-secondary p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <Logo className="text-4xl" />
            </div>
          </div>

          <div className="bg-bg-primary rounded-xl shadow-lg border border-border-default p-6 sm:p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>

            <h1 className="text-xl font-semibold text-text-primary mb-2">
              Password reimpostata!
            </h1>

            <p className="text-text-secondary mb-6">
              La tua password è stata reimpostata con successo.
              Ora puoi accedere con la nuova password.
            </p>

            <Button variant="primary" fullWidth onClick={handleGoToLogin}>
              Vai al login
            </Button>
          </div>

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
            Reimposta password
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Inserisci la tua nuova password
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

            {/* Campo Nuova Password */}
            <PasswordInput
              label="Nuova password"
              value={formData.password}
              onChange={handleChange('password')}
              error={formErrors.password}
              required
              disabled={loading}
              autoComplete="new-password"
              autoFocus
            />

            {/* Campo Conferma Password */}
            <PasswordInput
              label="Conferma password"
              value={formData.confirmPassword}
              onChange={handleChange('confirmPassword')}
              error={formErrors.confirmPassword}
              required
              disabled={loading}
              autoComplete="new-password"
            />

            {/* Pulsante Submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={loading}
              loadingText="Salvataggio..."
            >
              Reimposta password
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

export default ResetPasswordPage;
