// src/core/components/form/input/PasswordInput.tsx

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from './Input';
import { cn } from '../../../utils';

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'placeholder' | 'type'> {
  label: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  required?: boolean;
}

/**
 * Input specializzato per password con toggle visibilità.
 * Mostra un'icona occhio per alternare tra password nascosta e visibile.
 */
export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const toggleVisibility = () => {
      setShowPassword(prev => !prev);
    };

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          className={cn('pr-10', className)}
          {...props}
        />
        {/* Toggle button */}
        <button
          type="button"
          onClick={toggleVisibility}
          className={cn(
            'absolute right-0 top-1/2 -translate-y-1/2',
            'p-2 text-text-secondary hover:text-text-primary',
            'transition-colors duration-200',
            'focus:outline-none focus:text-text-primary',
            props.disabled && 'pointer-events-none opacity-50'
          )}
          tabIndex={-1}
          aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

export default PasswordInput;
