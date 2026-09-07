// src/core/components/form/date-picker/DatePicker.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '../../../utils';
import { useClickOutside } from '../../../hooks';
import { FloatingFieldShell } from '../floating-field-shell/FloatingFieldShell';

export type DatePickerFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
export type DatePickerSize = 'sm' | 'md' | 'lg';

interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'size'> {
  label: string;
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  format?: DatePickerFormat;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  error?: string;
  helperText?: string;
  required?: boolean;
  size?: DatePickerSize;
  fullWidth?: boolean;
  placeholder?: string;
}

/**
 * DatePicker - Componente per selezione date con calendario popup.
 * L'aspetto del campo (label, sottolineatura, padding) viene da FloatingFieldShell,
 * condivisa con TimePicker per garantire coerenza visiva perfetta nel tempo.
 * Apertura/chiusura gestite manualmente (nessuna dipendenza da Radix Popover).
 */
export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  format = 'DD/MM/YYYY',
  minDate,
  maxDate,
  disabledDates = [],
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
  const [viewDate, setViewDate] = useState(value || new Date());
  const [isFocused, setIsFocused] = useState(false);
  const [panelPosition, setPanelPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const dropdownTextSize = { sm: 'text-sm', md: 'text-base', lg: 'text-lg' }[size];

  const formatDate = React.useCallback(
    (date: Date): string => {
      if (!date || isNaN(date.getTime())) return '';
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear().toString();
      switch (format) {
        case 'MM/DD/YYYY':
          return `${month}/${day}/${year}`;
        case 'YYYY-MM-DD':
          return `${year}-${month}-${day}`;
        default:
          return `${day}/${month}/${year}`;
      }
    },
    [format]
  );

  const parseDate = React.useCallback(
    (dateString: string): Date | null => {
      if (!dateString) return null;
      let day: number, month: number, year: number;
      switch (format) {
        case 'MM/DD/YYYY': {
          const parts = dateString.split('/');
          if (parts.length !== 3) return null;
          month = parseInt(parts[0], 10);
          day = parseInt(parts[1], 10);
          year = parseInt(parts[2], 10);
          break;
        }
        case 'YYYY-MM-DD': {
          const parts = dateString.split('-');
          if (parts.length !== 3) return null;
          year = parseInt(parts[0], 10);
          month = parseInt(parts[1], 10);
          day = parseInt(parts[2], 10);
          break;
        }
        default: {
          const parts = dateString.split('/');
          if (parts.length !== 3) return null;
          day = parseInt(parts[0], 10);
          month = parseInt(parts[1], 10);
          year = parseInt(parts[2], 10);
          break;
        }
      }
      if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
      if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1000) return null;
      const date = new Date(year, month - 1, day);
      return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year ? date : null;
    },
    [format]
  );

  useEffect(() => {
    setInputValue(value ? formatDate(value) : '');
    if (value) setViewDate(value);
  }, [value, format, formatDate]);

  const isDateDisabled = (date: Date): boolean => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return disabledDates.some(disabledDate => date.toDateString() === disabledDate.toDateString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    const parsedDate = parseDate(newValue);
    if (parsedDate && !isDateDisabled(parsedDate)) {
      onChange?.(parsedDate);
      setViewDate(parsedDate);
    } else if (!newValue) {
      onChange?.(undefined);
    }
  };

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

  const handleDateSelect = (date: Date) => {
    if (isDateDisabled(date)) return;
    onChange?.(date);
    setInputValue(formatDate(date));
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setViewDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    setViewDate(prev => {
      const newDate = new Date(prev);
      newDate.setFullYear(prev.getFullYear() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const generateCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    const dayOfWeek = (firstDay.getDay() + 6) % 7;
    startDate.setDate(startDate.getDate() - dayOfWeek);
    const days = [];
    const current = new Date(startDate);
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  const days = generateCalendarDays();
  const today = new Date();
  const monthNames = [
    'Gennaio',
    'Febbraio',
    'Marzo',
    'Aprile',
    'Maggio',
    'Giugno',
    'Luglio',
    'Agosto',
    'Settembre',
    'Ottobre',
    'Novembre',
    'Dicembre',
  ];
  const dayNames = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

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
          icon={Calendar}
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
          placeholder={placeholder}
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
                'p-4 rounded-lg border border-border-default shadow-lg min-w-[280px] bg-bg-primary',
                dropdownTextSize
              )}
            >
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    onClick={() => navigateYear('prev')}
                    className='p-1 hover:bg-bg-hover rounded transition-colors'
                    disabled={disabled}
                  >
                    <ChevronLeft className='w-5 h-5 text-text-secondary' />
                  </button>
                  <button
                    type='button'
                    onClick={() => navigateMonth('prev')}
                    className='p-1 hover:bg-bg-hover rounded transition-colors'
                    disabled={disabled}
                  >
                    <ChevronLeft className='w-5 h-5 text-text-secondary' />
                  </button>
                </div>
                <div className='font-semibold text-center flex-1 text-text-primary'>
                  {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                </div>
                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    onClick={() => navigateMonth('next')}
                    className='p-1 hover:bg-bg-hover rounded transition-colors'
                    disabled={disabled}
                  >
                    <ChevronRight className='w-5 h-5 text-text-secondary' />
                  </button>
                  <button
                    type='button'
                    onClick={() => navigateYear('next')}
                    className='p-1 hover:bg-bg-hover rounded transition-colors'
                    disabled={disabled}
                  >
                    <ChevronRight className='w-5 h-5 text-text-secondary' />
                  </button>
                </div>
              </div>

              <div className='grid grid-cols-7 gap-1 mb-2'>
                {dayNames.map(day => (
                  <div key={day} className='h-8 flex items-center justify-center'>
                    <span className='text-xs font-medium text-text-secondary'>{day}</span>
                  </div>
                ))}
              </div>

              <div className='grid grid-cols-7 gap-1'>
                {days.map((day, index) => {
                  const isCurrentMonth = day.getMonth() === viewDate.getMonth();
                  const isToday = day.toDateString() === today.toDateString();
                  const isSelected = value && day.toDateString() === value.toDateString();
                  const isDisabled = isDateDisabled(day);
                  return (
                    <button
                      key={index}
                      type='button'
                      onClick={() => handleDateSelect(day)}
                      disabled={isDisabled || disabled}
                      className={cn(
                        'h-8 w-8 flex items-center justify-center rounded transition-all duration-150 text-sm font-medium',
                        isCurrentMonth ? 'text-text-primary' : 'text-text-disabled',
                        !isDisabled && !disabled && 'hover:bg-bg-hover',
                        isToday && 'bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-400',
                        isSelected && 'bg-violet-600 text-white hover:bg-violet-700',
                        isDisabled && 'opacity-50 cursor-not-allowed',
                        'focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1'
                      )}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>

              <div className='flex justify-center mt-4 pt-3 border-t border-border-default'>
                <button
                  type='button'
                  onClick={() => handleDateSelect(new Date())}
                  disabled={isDateDisabled(new Date()) || disabled}
                  className={cn(
                    'px-3 py-1 text-sm font-medium rounded transition-colors',
                    'text-violet-600 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-900/50',
                    'focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1',
                    isDateDisabled(new Date()) && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  Oggi
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default DatePicker;
