// src/features/auth/components/ChangePasswordForm.tsx

/**
 * PRESENTATION LAYER - Modulo Auth
 *
 * Form per cambiare la password dell'utente loggato.
 * Gestisce validazione password con complessità, conferma, e feedback.
 *
 * @example
 * ```tsx
 * <ChangePasswordForm onSuccess={() => navigate('/login')} />
 * ```
 */

import React, { useState } from 'react';
import { PasswordInput } from '../../../core/components/form';
import { Button } from '../../../core/components/ui';
import { useAuth } from '../hooks';
import {
  validatePassword,
  passwordsMatch,
  getPasswordErrorMessage,
  getPasswordRequirementsFeedback,
} from '../utils/passwordValidation';

// ============================================================================
// TYPES
// ============================================================================

interface FormState {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface FormErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

interface ChangePasswordFormProps {
  /** Callback chiamato dopo cambio password riuscito */
  onSuccess?: () => void;
}

export const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ onSuccess }) => {
  // Hook per cambio password
  const { changePassword, changePasswordLoading, changePasswordError, clearChangePasswordError } = useAuth();

  // Stato del form
  const [formData, setFormData] = useState<FormState>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Stato per feedback validazione password in tempo reale
  const [passwordFeedback, setPasswordFeedback] = useState<ReturnType<typeof getPasswordRequirementsFeedback> | null>(null);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Aggiorna un campo password
   */
  const handleInputChange =
    (field: 'currentPassword' | 'newPassword' | 'confirmPassword') => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setFormData(prev => ({ ...prev, [field]: value }));

      // Pulisce errore del campo
      if (formErrors[field]) {
        setFormErrors(prev => ({ ...prev, [field]: undefined }));
      }

      // Pulisce messaggio di successo
      if (successMessage) {
        setSuccessMessage(null);
      }

      // Pulisce errore di changePassword
      if (changePasswordError) {
        clearChangePasswordError();
      }

      // Aggiorna feedback validazione per la nuova password
      if (field === 'newPassword') {
        const validationResult = validatePassword(value);
        setPasswordFeedback(getPasswordRequirementsFeedback(validationResult));
      }
    };

  /**
   * Validazione del form
   */
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    // Password attuale obbligatoria
    if (!formData.currentPassword) {
      errors.currentPassword = 'Password attuale obbligatoria';
    }

    // Nuova password obbligatoria
    if (!formData.newPassword) {
      errors.newPassword = 'Nuova password obbligatoria';
    } else {
      // Validazione complessità
      const validationResult = validatePassword(formData.newPassword);
      if (!validationResult.valid) {
        errors.newPassword = getPasswordErrorMessage(validationResult);
      }
    }

    // Conferma password obbligatoria
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Conferma password obbligatoria';
    } else if (!passwordsMatch(formData.newPassword, formData.confirmPassword)) {
      errors.confirmPassword = 'Le password non corrispondono';
    }

    // Le due password devono essere diverse
    if (formData.currentPassword && formData.newPassword && formData.currentPassword === formData.newPassword) {
      errors.newPassword = 'La nuova password deve essere diversa da quella attuale';
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

    try {
      // Chiama changePassword dal hook
      const success = await changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      if (success) {
        // Se riuscito, mostra messaggio di successo
        setSuccessMessage('Password cambiata con successo! Accedi di nuovo con la nuova password.');

        // Reset form
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setPasswordFeedback(null);

        // Chiama callback dopo un delay per mostrare il messaggio
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          }
        }, 2000);
      }
    } catch (err) {
      // Errore gestito dal hook changePassword
      console.error('Errore durante cambio password:', err);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {/* Messaggio di successo */}
      {successMessage && (
        <div className='p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'>
          <p className='text-sm text-green-600 dark:text-green-400'>{successMessage}</p>
        </div>
      )}

      {/* Messaggio di errore changePassword */}
      {changePasswordError && (
        <div className='p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'>
          <p className='text-sm text-red-600 dark:text-red-400'>{changePasswordError}</p>
        </div>
      )}

      {/* Password attuale */}
      <PasswordInput
        label='Password attuale'
        value={formData.currentPassword}
        onChange={handleInputChange('currentPassword')}
        error={formErrors.currentPassword}
        required
        disabled={changePasswordLoading}
        autoComplete='current-password'
      />

      {/* Nuova password */}
      <div className='space-y-2'>
        <PasswordInput
          label='Nuova password'
          value={formData.newPassword}
          onChange={handleInputChange('newPassword')}
          error={formErrors.newPassword}
          required
          disabled={changePasswordLoading}
          autoComplete='new-password'
        />

        {/* Feedback validazione password in tempo reale */}
        {formData.newPassword && passwordFeedback && (
          <div className='p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'>
            <p className='text-xs font-semibold text-blue-900 dark:text-blue-300 mb-2'>Requisiti password:</p>
            <ul className='space-y-1'>
              {passwordFeedback.map((req, idx) => (
                <li key={idx} className='flex items-center text-xs'>
                  <span
                    className={`w-4 h-4 rounded-full mr-2 flex items-center justify-center text-white text-xs ${
                      req.met ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    {req.met ? '✓' : '○'}
                  </span>
                  <span className={req.met ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
                    {req.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Conferma password */}
      <PasswordInput
        label='Conferma nuova password'
        value={formData.confirmPassword}
        onChange={handleInputChange('confirmPassword')}
        error={formErrors.confirmPassword}
        required
        disabled={changePasswordLoading}
        autoComplete='new-password'
      />

      {/* Pulsante Submit */}
      <Button
        type='submit'
        variant='primary'
        size='lg'
        fullWidth
        isLoading={changePasswordLoading}
        loadingText='Cambio in corso...'
      >
        Cambia password
      </Button>
    </form>
  );
};

export default ChangePasswordForm;
