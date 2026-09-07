// src/core/components/form/input/Input.tsx
import React, { useState, useId, useEffect, useRef } from 'react';
import { cn } from '../../../utils';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'placeholder'> {
  label: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  required?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = true,
      required = false,
      className,
      disabled,
      value,
      defaultValue,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [internalValue, setInternalValue] = useState('');
    const [isAutofilled, setIsAutofilled] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const id = useId();

    // Combina ref esterno con ref interno
    const combinedRef = (node: HTMLInputElement | null) => {
      // Assegna al ref interno
      (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
      // Assegna al ref esterno se presente
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    // Usa il valore controllato dall'esterno o quello interno
    const currentValue = value !== undefined ? value : internalValue;
    const hasValue = Boolean(currentValue) || isAutofilled;

    const isFloating = isFocused || hasValue;
    const hasError = !!error;

    // =========================================================================
    // AUTOFILL DETECTION
    // Rileva quando il browser ha fatto autofill dei campi
    // =========================================================================
    useEffect(() => {
      const input = inputRef.current;
      if (!input) return;

      // Metodo 1: Check immediato per autofill già avvenuto
      const checkAutofill = () => {
        try {
          // Chrome/Safari aggiungono :-webkit-autofill pseudo-class
          if (input.matches(':-webkit-autofill')) {
            setIsAutofilled(true);
            return;
          }
        } catch {
          // Firefox non supporta :-webkit-autofill
        }

        // Metodo 2: Check se il campo ha un valore (per Firefox e altri browser)
        if (input.value && input.value.length > 0) {
          setIsAutofilled(true);
        }
      };

      // Check iniziale (dopo un breve delay per dare tempo al browser)
      const initialCheck = setTimeout(checkAutofill, 100);
      
      // Check periodico per i primi secondi (l'autofill può avvenire in ritardo)
      const periodicCheck = setInterval(checkAutofill, 500);
      setTimeout(() => clearInterval(periodicCheck), 3000);

      // Metodo 3: Listener per animationstart (Chrome usa un'animazione per autofill)
      const handleAnimationStart = (e: AnimationEvent) => {
        if (e.animationName === 'onAutoFillStart') {
          setIsAutofilled(true);
        } else if (e.animationName === 'onAutoFillCancel') {
          setIsAutofilled(false);
        }
      };

      input.addEventListener('animationstart', handleAnimationStart);

      return () => {
        clearTimeout(initialCheck);
        clearInterval(periodicCheck);
        input.removeEventListener('animationstart', handleAnimationStart);
      };
    }, []);

    // Reset autofill state quando il valore cambia manualmente
    useEffect(() => {
      if (currentValue) {
        setIsAutofilled(false); // Non serve più, abbiamo un valore reale
      }
    }, [currentValue]);

    // =========================================================================
    // EVENT HANDLERS
    // =========================================================================
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      // Check se c'è un valore dopo blur (potrebbe essere stato autofillato)
      if (e.target.value) {
        setIsAutofilled(true);
      }
      onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInternalValue(e.target.value);
      setIsAutofilled(false); // L'utente sta digitando, non è più autofill
      props.onChange?.(e);
    };

    // =========================================================================
    // STYLES
    // =========================================================================
    const containerClasses = cn('relative', fullWidth && 'w-full');

    const inputClasses = cn(
      // Layout e dimensioni
      'w-full bg-transparent border-none outline-none',
      'pt-5 pb-2 px-0',
      // Tipografia - dimensione normale per il testo inserito
      'text-base leading-6 text-text-primary',
      // Stati
      disabled && 'text-text-disabled cursor-not-allowed',
      // Autofill styling - rimuove sfondo giallo del browser
      'autofill:bg-transparent',
      'autofill:shadow-[inset_0_0_0px_1000px_rgb(255,255,255,0)]',
      'dark:autofill:shadow-[inset_0_0_0px_1000px_rgb(26,31,46,1)]',
      // Animazione per detection autofill
      '[&:-webkit-autofill]:animate-[onAutoFillStart_0.01s]',
      '[&:not(:-webkit-autofill)]:animate-[onAutoFillCancel_0.01s]',
      className
    );

    const labelClasses = cn(
      // Posizionamento base
      'absolute left-0 pointer-events-none select-none',
      // Transizione smooth
      'transition-all duration-200 ease-out',
      // Stati floating vs non-floating
      isFloating
        ? cn(
            // Label in alto quando c'è focus o valore
            'top-0 text-sm font-medium',
            isFocused && !hasError && 'text-violet-600 dark:text-violet-400',
            !isFocused && !hasError && 'text-text-secondary',
            hasError && 'text-text-error'
          )
        : cn(
            // Label centrata quando vuoto e non in focus
            'top-1/2 -translate-y-1/2 text-base text-text-placeholder'
          ),
      disabled && 'text-text-disabled'
    );

    const underlineClasses = cn(
      'absolute bottom-0 left-0 right-0 h-px transition-all duration-200 ease-out',
      disabled
        ? 'bg-border-thin'
        : hasError
          ? 'bg-underline-error'
          : isFocused
            ? 'bg-underline-focus'
            : hasValue
              ? 'bg-underline-primary'
              : 'bg-underline-default'
    );

    // =========================================================================
    // RENDER
    // =========================================================================
    return (
      <div className={containerClasses}>
        <div className='relative rounded-t-lg min-h-[56px]'>
          <input
            ref={combinedRef}
            id={id}
            className={inputClasses}
            disabled={disabled}
            value={value}
            defaultValue={defaultValue}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            required={required}
            {...props}
          />
          <label htmlFor={id} className={labelClasses}>
            {label}
            {required && (
              <span className='text-text-error font-medium ml-1' aria-label='richiesto'>
                *
              </span>
            )}
          </label>
          <div className={underlineClasses} />
        </div>
        {(helperText || error) && (
          <div className='mt-1 px-0'>
            <span className={cn('text-sm', error ? 'text-text-error' : 'text-text-secondary')}>
              {error || helperText}
            </span>
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
