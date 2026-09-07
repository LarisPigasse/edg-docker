// src/features/auth/utils/passwordValidation.ts

/**
 * UTILITIES - Password Validation
 *
 * Funzioni per validare password con regole di complessità.
 * Usate in LoginForm e ChangePasswordForm.
 */

// ============================================================================
// COSTANTI
// ============================================================================

export const PASSWORD_RULES = {
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL: true,
  SPECIAL_CHARS: '!@#$%^&*()_+-=[]{}|;:,.<>?',
} as const;

// ============================================================================
// TYPES
// ============================================================================

/**
 * Risultato della validazione password
 */
export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

// ============================================================================
// FUNZIONI
// ============================================================================

/**
 * Valida una password secondo le regole di complessità.
 *
 * Requisiti:
 * - Minimo 8 caratteri
 * - Almeno una maiuscola (A-Z)
 * - Almeno una minuscola (a-z)
 * - Almeno un numero (0-9)
 * - Almeno un carattere speciale (!@#$%^&*...)
 *
 * @param password - Password da validare
 * @returns Risultato dettagliato della validazione
 *
 * @example
 * const result = validatePassword('MyPassword123!');
 * if (result.valid) {
 *   console.log('Password valida');
 * } else {
 *   console.log(result.errors); // ['Deve contenere almeno una maiuscola', ...]
 * }
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  // Controllo lunghezza minima
  const hasMinLength = password.length >= PASSWORD_RULES.MIN_LENGTH;
  if (!hasMinLength) {
    errors.push(`Almeno ${PASSWORD_RULES.MIN_LENGTH} caratteri`);
  }

  // Controllo maiuscola
  const hasUppercase = /[A-Z]/.test(password);
  if (!hasUppercase) {
    errors.push('Almeno una lettera maiuscola (A-Z)');
  }

  // Controllo minuscola
  const hasLowercase = /[a-z]/.test(password);
  if (!hasLowercase) {
    errors.push('Almeno una lettera minuscola (a-z)');
  }

  // Controllo numero
  const hasNumber = /[0-9]/.test(password);
  if (!hasNumber) {
    errors.push('Almeno un numero (0-9)');
  }

  // Controllo carattere speciale
  const hasSpecial = new RegExp(`[${PASSWORD_RULES.SPECIAL_CHARS.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`).test(password);
  if (!hasSpecial) {
    errors.push(`Almeno un carattere speciale (${PASSWORD_RULES.SPECIAL_CHARS})`);
  }

  return {
    valid: errors.length === 0,
    errors,
    requirements: {
      minLength: hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecial,
    },
  };
}

/**
 * Valida che due password siano identiche.
 *
 * @param password1 - Prima password
 * @param password2 - Seconda password (conferma)
 * @returns true se sono uguali, false altrimenti
 */
export function passwordsMatch(password1: string, password2: string): boolean {
  return password1 === password2 && password1.length > 0;
}

/**
 * Genera un messaggio di errore user-friendly per la validazione password.
 * Utile per mostrare all'utente cosa manca.
 *
 * @param result - Risultato della validazione
 * @returns Stringa con gli errori formattati (one-liner per UI compatta)
 */
export function getPasswordErrorMessage(result: PasswordValidationResult): string {
  if (result.valid) return '';

  return result.errors.join(' • ');
}

/**
 * Genera un feedback dettagliato per la validazione password.
 * Utile per form con validazione in tempo reale.
 *
 * @param result - Risultato della validazione
 * @returns Array di oggetti con descrizione e stato di ogni requisito
 */
export function getPasswordRequirementsFeedback(result: PasswordValidationResult) {
  return [
    {
      label: `Almeno ${PASSWORD_RULES.MIN_LENGTH} caratteri`,
      met: result.requirements.minLength,
    },
    {
      label: 'Una lettera maiuscola (A-Z)',
      met: result.requirements.hasUppercase,
    },
    {
      label: 'Una lettera minuscola (a-z)',
      met: result.requirements.hasLowercase,
    },
    {
      label: 'Un numero (0-9)',
      met: result.requirements.hasNumber,
    },
    {
      label: `Un carattere speciale (${PASSWORD_RULES.SPECIAL_CHARS})`,
      met: result.requirements.hasSpecial,
    },
  ];
}
