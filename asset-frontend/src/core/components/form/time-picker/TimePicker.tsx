// src/core/components/form/time-picker/TimePicker.tsx
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Clock } from 'lucide-react';

import { cn } from '../../../utils';
import { useClickOutside } from '../../../hooks';
import { FloatingFieldShell } from '../floating-field-shell/FloatingFieldShell';

export interface TimeValue {
  hours: number;
  minutes: number;
}

export type TimePickerFormat = '12h' | '24h';
export type TimePickerStep = 5 | 10 | 15 | 30;
export type TimePickerSize = 'sm' | 'md' | 'lg';

interface TimePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'size'> {
  label: string;
  value?: TimeValue;
  onChange?: (time: TimeValue | undefined) => void;
  format?: TimePickerFormat;
  step?: TimePickerStep;
  minTime?: TimeValue;
  maxTime?: TimeValue;
  error?: string;
  helperText?: string;
  required?: boolean;
  size?: TimePickerSize;
  fullWidth?: boolean;
  placeholder?: string;
}

/**
 * TimePicker - Componente per selezione orario con dropdown scrollabile.
 * Aspetto del campo condiviso con DatePicker tramite FloatingFieldShell.
 * Apertura/chiusura gestite manualmente (nessuna dipendenza da Radix Popover) —
 * stessa architettura di DatePicker, per evitare i bug di race condition e di
 * conflitto con il focus-trap delle Modal già diagnosticati e risolti lì.
 */
export const TimePicker: React.FC<TimePickerProps> = ({
  label,
  value,
  onChange,
  format = '24h',
  step = 15,
  minTime,
  maxTime,
  error,
  helperText,
  required = false,
  size = 'md',
  fullWidth = false,
  placeholder,
  disabled = false,
  className = '',
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedHour, setSelectedHour] = useState(value?.hours ?? 9);
  const [selectedMinute, setSelectedMinute] = useState(value?.minutes ?? 0);
  const [amPm, setAmPm] = useState<'AM' | 'PM'>('AM');
  const [panelPosition, setPanelPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const dropdownTextSize = { sm: 'text-sm', md: 'text-base', lg: 'text-lg' }[size];

  const hourOptions = useMemo(() => {
    if (format === '12h') return Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i));
    return Array.from({ length: 24 }, (_, i) => i);
  }, [format]);

  const minuteOptions = useMemo(() => Array.from({ length: 60 / step }, (_, i) => i * step), [step]);

  const formatTime = React.useCallback(
    (time: TimeValue): string => {
      if (!time) return '';
      const { hours, minutes } = time;
      if (format === '12h') {
        const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        const period = hours >= 12 ? 'PM' : 'AM';
        return `${displayHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
      }
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    },
    [format]
  );

  const parseTime = React.useCallback(
    (timeString: string): TimeValue | null => {
      if (!timeString) return null;
      const timeRegex = format === '12h' ? /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i : /^(\d{1,2}):(\d{2})$/;
      const match = timeString.match(timeRegex);
      if (!match) return null;
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      if (format === '12h') {
        const period = match[3].toUpperCase();
        if (hours === 12 && period === 'AM') hours = 0;
        if (hours !== 12 && period === 'PM') hours += 12;
      }
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
      return { hours, minutes };
    },
    [format]
  );

  const isTimeInRange = (time: TimeValue): boolean => {
    const timeInMinutes = time.hours * 60 + time.minutes;
    if (minTime && timeInMinutes < minTime.hours * 60 + minTime.minutes) return false;
    if (maxTime && timeInMinutes > maxTime.hours * 60 + maxTime.minutes) return false;
    return true;
  };

  useEffect(() => {
    if (value) {
      setInputValue(formatTime(value));
      setSelectedHour(
        format === '12h' ? (value.hours === 0 ? 12 : value.hours > 12 ? value.hours - 12 : value.hours) : value.hours
      );
      setSelectedMinute(value.minutes);
      setAmPm(value.hours >= 12 ? 'PM' : 'AM');
    } else {
      setInputValue('');
    }
  }, [value, format, formatTime]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    const parsedTime = parseTime(newValue);
    if (parsedTime && isTimeInRange(parsedTime)) {
      onChange?.(parsedTime);
      setSelectedHour(
        format === '12h'
          ? parsedTime.hours === 0
            ? 12
            : parsedTime.hours > 12
              ? parsedTime.hours - 12
              : parsedTime.hours
          : parsedTime.hours
      );
      setSelectedMinute(parsedTime.minutes);
      setAmPm(parsedTime.hours >= 12 ? 'PM' : 'AM');
    } else if (!newValue) {
      onChange?.(undefined);
    }
  };

  // ─── apertura / chiusura / posizionamento — stessa architettura di DatePicker ───

  const updatePanelPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPanelPosition({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  }, []);

  const openPanel = () => {
    if (disabled) return;
    updatePanelPosition();
    setIsOpen(true);
  };

  useClickOutside([triggerRef, panelRef], () => setIsOpen(false), isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const reposition = () => updatePanelPosition();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('resize', reposition);
    document.addEventListener('scroll', reposition, true);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('resize', reposition);
      document.removeEventListener('scroll', reposition, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, updatePanelPosition]);

  const handleTimeSelect = () => {
    let finalHours = selectedHour;
    if (format === '12h') {
      if (selectedHour === 12 && amPm === 'AM') finalHours = 0;
      else if (selectedHour !== 12 && amPm === 'PM') finalHours = selectedHour + 12;
    }
    const newTime: TimeValue = { hours: finalHours, minutes: selectedMinute };
    if (isTimeInRange(newTime)) {
      onChange?.(newTime);
      setInputValue(formatTime(newTime));
      setIsOpen(false);
      inputRef.current?.focus();
    }
  };

  const handleHourChange = (newHour: number) => {
    setSelectedHour(newHour);
    setTimeout(() => handleTimeSelect(), 100);
  };

  const handleMinuteChange = (newMinute: number) => {
    setSelectedMinute(newMinute);
    setTimeout(() => handleTimeSelect(), 100);
  };

  const handleAmPmChange = (newAmPm: 'AM' | 'PM') => {
    setAmPm(newAmPm);
    setTimeout(() => handleTimeSelect(), 100);
  };

  return (
    <div className={cn('relative', fullWidth ? 'w-full' : 'w-auto', className)}>
      <div
        ref={triggerRef}
        onClick={openPanel}
        className={cn(fullWidth ? 'w-full' : 'w-auto', disabled && 'cursor-not-allowed')}
      >
        <FloatingFieldShell
          ref={inputRef}
          label={label}
          value={inputValue}
          required={required}
          size={size}
          error={error}
          helperText={helperText}
          isFocused={isFocused}
          icon={Clock}
          fullWidth={fullWidth}
          disabled={disabled}
          type='text'
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={e => {
            if ((e.key === 'Enter' || e.key === 'ArrowDown') && !isOpen) {
              e.preventDefault();
              openPanel();
            }
          }}
          placeholder={placeholder || (format === '12h' ? 'HH:MM AM/PM' : 'HH:MM')}
          {...props}
        />
      </div>

      {isOpen &&
        panelPosition &&
        createPortal(
          <div
            ref={panelRef}
            data-modal-safe-portal='true'
            style={{ position: 'fixed', top: panelPosition.top, left: panelPosition.left }}
            className='z-50'
          >
            <div
              className={cn(
                'p-4 rounded-lg border border-border-default shadow-lg bg-bg-primary',
                dropdownTextSize,
                format === '12h' ? 'min-w-[240px]' : 'min-w-[200px]'
              )}
            >
              <div className='flex gap-2'>
                <div className='flex-1'>
                  <span className='text-text-secondary text-xs font-medium mb-2 text-center block'>Ore</span>
                  <div className='max-h-32 overflow-y-auto border border-border-default rounded'>
                    {hourOptions.map(hour => (
                      <button
                        key={hour}
                        type='button'
                        onClick={() => handleHourChange(hour)}
                        className={cn(
                          'w-full px-3 py-1.5 text-center transition-colors hover:bg-bg-hover',
                          selectedHour === hour && 'bg-violet-600 text-white hover:bg-violet-700',
                          'focus:outline-none focus:ring-1 focus:ring-violet-500'
                        )}
                        disabled={disabled}
                      >
                        {hour.toString().padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className='flex-1'>
                  <span className='text-text-secondary text-xs font-medium mb-2 text-center block'>Minuti</span>
                  <div className='max-h-32 overflow-y-auto border border-border-default rounded'>
                    {minuteOptions.map(minute => (
                      <button
                        key={minute}
                        type='button'
                        onClick={() => handleMinuteChange(minute)}
                        className={cn(
                          'w-full px-3 py-1.5 text-center transition-colors hover:bg-bg-hover',
                          selectedMinute === minute && 'bg-violet-600 text-white hover:bg-violet-700',
                          'focus:outline-none focus:ring-1 focus:ring-violet-500'
                        )}
                        disabled={disabled}
                      >
                        {minute.toString().padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                </div>

                {format === '12h' && (
                  <div className='flex-1'>
                    <span className='text-text-secondary text-xs font-medium mb-2 text-center block'>AM/PM</span>
                    <div className='space-y-1'>
                      {(['AM', 'PM'] as const).map(period => (
                        <button
                          key={period}
                          type='button'
                          onClick={() => handleAmPmChange(period)}
                          className={cn(
                            'w-full px-3 py-1.5 text-center transition-colors border border-border-default rounded hover:bg-bg-hover',
                            amPm === period && 'bg-violet-600 text-white hover:bg-violet-700',
                            'focus:outline-none focus:ring-1 focus:ring-violet-500'
                          )}
                          disabled={disabled}
                        >
                          {period}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className='flex justify-center mt-4 pt-3 border-t border-border-default'>
                <button
                  type='button'
                  onClick={() => {
                    const now = new Date();
                    const currentTime: TimeValue = { hours: now.getHours(), minutes: now.getMinutes() };
                    if (isTimeInRange(currentTime)) {
                      onChange?.(currentTime);
                      setInputValue(formatTime(currentTime));
                      setIsOpen(false);
                    }
                  }}
                  disabled={disabled}
                  className={cn(
                    'px-3 py-1 text-sm font-medium rounded transition-colors',
                    'text-violet-600 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-900/50',
                    'focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1'
                  )}
                >
                  Adesso
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default TimePicker;
