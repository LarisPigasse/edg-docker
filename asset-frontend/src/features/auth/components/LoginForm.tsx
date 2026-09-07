// src/features/auth/components/LoginForm.tsx

/**
 * PRESENTATION LAYER - Modulo Auth
 *
 * Form di login riusabile che usa i componenti del Design System.
 * Gestisce stato locale del form e delega l'autenticazione a useAuth.
 *
 * @example
 * ```tsx
 * <LoginForm onSuccess={() => navigate('/')} />
 * ```
 */

import React, { useState } from 'react';
import { Input, PasswordInput, Checkbox } from '../../../core/components/form';
import { Button } from '../../../core/components/ui';
import { useAuth } from '../hooks';

// ============================================================================
// TYPES
// ============================================================================

interface LoginFormProps {
  /** Callback chiamato dopo login riuscito */
  onSuccess?: () => void;
}

interface FormState {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface FormErrors {
  email?: string;
  password?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  // Hook auth per login e stato
  const { login, loading, error, clearAuthError } = useAuth();

  // Stato locale del form
  const [formData, setFormData] = useState<FormState>({
    email: '',
    password: '',
    rememberMe: false, // ⚠️ SECURITY: Disattivato di default (opt-in)
  });

  // Errori di validazione locale
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Aggiorna un campo testuale del form
   */
  const handleInputChange = (field: 'email' | 'password') => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));

    // Pulisce errore del campo quando l'utente inizia a digitare
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // Pulisce errore API quando l'utente modifica il form
    if (error) {
      clearAuthError();
    }
  };

  /**
   * Aggiorna il checkbox rememberMe
   * Radix UI Checkbox usa onCheckedChange con valore boolean | 'indeterminate'
   */
  const handleRememberMeChange = (checked: boolean | 'indeterminate') => {
    // Ignora lo stato 'indeterminate', trattiamo solo boolean
    if (typeof checked === 'boolean') {
      setFormData(prev => ({ ...prev, rememberMe: checked }));
    }
  };

  /**
   * Validazione del form
   */
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    // Email obbligatoria e formato base
    if (!formData.email.trim()) {
      errors.email = 'Email obbligatoria';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Formato email non valido';
    }

    // Password obbligatoria
    if (!formData.password) {
      errors.password = 'Password obbligatoria';
    } else if (formData.password.length < 6) {
      errors.password = 'Password deve essere almeno 6 caratteri';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Submit del form
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Valida prima di procedere
    if (!validateForm()) {
      return;
    }

    // Tenta il login con flag rememberMe
    const success = await login(
      {
        email: formData.email.trim(),
        password: formData.password,
      },
      formData.rememberMe
    );

    // Se riuscito, chiama callback
    if (success && onSuccess) {
      onSuccess();
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {/* Errore API (es. credenziali errate) */}
      {error && (
        <div className='p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'>
          <p className='text-sm text-red-600 dark:text-red-400'>{error}</p>
        </div>
      )}

      {/* Campo Email */}
      <Input
        type='email'
        label='Email'
        value={formData.email}
        onChange={handleInputChange('email')}
        error={formErrors.email}
        required
        disabled={loading}
        autoComplete='email'
        autoFocus
      />

      {/* Campo Password con toggle visibilità */}
      <PasswordInput
        label='Password'
        value={formData.password}
        onChange={handleInputChange('password')}
        error={formErrors.password}
        required
        disabled={loading}
        autoComplete='current-password'
      />

      {/* Checkbox Ricordami */}
      <Checkbox
        label='Ricordami su questo dispositivo'
        checked={formData.rememberMe}
        onCheckedChange={handleRememberMeChange}
        disabled={loading}
        size='sm'
      />

      {/* Pulsante Submit */}
      <Button type='submit' variant='primary' size='lg' fullWidth isLoading={loading} loadingText='Accesso in corso...'>
        Accedi
      </Button>
    </form>
  );
};

export default LoginForm;
