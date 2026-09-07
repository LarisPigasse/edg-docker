// src/core/components/form/floating-field-shell/FloatingFieldShell.tsx
import React from 'react';
import { cn } from '../../../utils';

export type FloatingFieldShellSize = 'sm' | 'md' | 'lg';

interface FloatingFieldShellProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'value'> {
  label: string;
  value: string;
  required?: boolean;
  size?: FloatingFieldShellSize;
  error?: string;
  helperText?: string;
  isFocused: boolean;
  /** Componente icona Lucide (non istanziato) — dimensionata e colorata automaticamente in base a "size" */
  icon?: React.ComponentType<{ className?: string }>;
  fullWidth?: boolean;
}

interface SizeConfigEntry {
  minH: string;
  vPad: string;
  rPad: string;
  textSize: string;
  floatingTextSize: string;
  iconSize: string;
  iconRight: string;
}

const SIZE_CONFIG: Record<FloatingFieldShellSize, SizeConfigEntry> = {
  sm: {
    minH: 'min-h-[44px]',
    vPad: 'pt-4 pb-1',
    rPad: 'pr-8',
    textSize: 'text-sm',
    floatingTextSize: 'text-xs',
    iconSize: 'w-4 h-4',
    iconRight: 'right-2',
  },
  md: {
    minH: 'min-h-[56px]',
    vPad: 'pt-5 pb-2',
    rPad: 'pr-10',
    textSize: 'text-base',
    floatingTextSize: 'text-sm',
    iconSize: 'w-5 h-5',
    iconRight: 'right-3',
  },
  lg: {
    minH: 'min-h-[64px]',
    vPad: 'pt-6 pb-2',
    rPad: 'pr-12',
    textSize: 'text-lg',
    floatingTextSize: 'text-base',
    iconSize: 'w-6 h-6',
    iconRight: 'right-3.5',
  },
};

/**
 * Shell condivisa per campi custom con floating label e popup Portal (DatePicker,
 * TimePicker, e futuri componenti simili). Calibrata per essere visivamente identica
 * a Input.tsx nella variante "md": stesso padding verticale asimmetrico (pt-5 pb-2),
 * stessa sottolineatura da 1px, stessa animazione della label (spostamento + cambio
 * font-size, MAI transform: scale — è proprio la scala a causare la sovrapposizione
 * osservata in produzione).
 *
 * Puramente presentazionale: non gestisce apertura/chiusura di popup, solo l'aspetto
 * del campo (contenitore, input, label, icona opzionale, sottolineatura, helper/errore).
 */
export const FloatingFieldShell = React.forwardRef<HTMLInputElement, FloatingFieldShellProps>(
  (
    {
      label,
      value,
      required = false,
      size = 'md',
      error,
      helperText,
      isFocused,
      icon: Icon,
      fullWidth = true,
      disabled,
      className,
      ...inputProps
    },
    ref
  ) => {
    const config = SIZE_CONFIG[size];
    const hasValue = Boolean(value);
    const isFloating = isFocused || hasValue;
    const hasError = Boolean(error);

    const getUnderlineClass = () => {
      if (disabled) return 'bg-border-thin';
      if (hasError) return 'bg-underline-error';
      if (isFocused) return 'bg-underline-focus';
      if (hasValue) return 'bg-underline-primary';
      return 'bg-underline-default';
    };

    return (
      <div className={cn('relative', fullWidth && 'w-full')}>
        <div className={cn('relative', config.minH, disabled && 'opacity-60')}>
          <input
            ref={ref}
            value={value}
            disabled={disabled}
            className={cn(
              'w-full bg-transparent border-0 outline-none',
              'text-text-primary placeholder-text-placeholder',
              config.textSize,
              config.vPad,
              config.rPad,
              'pl-0',
              disabled && 'cursor-not-allowed',
              className
            )}
            {...inputProps}
          />

          <label
            className={cn(
              'absolute left-0 pointer-events-none select-none transition-all duration-200 ease-out',
              isFloating
                ? cn(
                    'top-0 font-medium',
                    config.floatingTextSize,
                    isFocused && !hasError && 'text-violet-600 dark:text-violet-400',
                    !isFocused && !hasError && 'text-text-secondary',
                    hasError && 'text-text-error'
                  )
                : cn('top-1/2 -translate-y-1/2', config.textSize, 'text-text-placeholder'),
              disabled && 'text-text-disabled'
            )}
          >
            {label}
            {required && <span className='text-text-error font-medium ml-1'>*</span>}
          </label>

          {Icon && (
            <div className={cn('absolute top-1/2 -translate-y-1/2 pointer-events-none', config.iconRight)}>
              <Icon className={cn(config.iconSize, 'text-text-secondary')} />
            </div>
          )}

          <div
            className={cn('absolute bottom-0 left-0 right-0 h-px transition-all duration-200 ease-out', getUnderlineClass())}
          />
        </div>

        {(error || helperText) && (
          <div className='mt-1 px-0'>
            <span className={cn('text-xs', error ? 'text-text-error' : 'text-text-secondary')}>{error || helperText}</span>
          </div>
        )}
      </div>
    );
  }
);

FloatingFieldShell.displayName = 'FloatingFieldShell';

export default FloatingFieldShell;
