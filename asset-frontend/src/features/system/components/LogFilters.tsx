/**
 * Sidebar filtri per logs
 */

import React, { useState, useEffect } from 'react';
import { Filter, X } from 'lucide-react';
import type { LogFilters, EventCategory, EventSeverity } from '../types';
import { EventCategory as CategoryEnum, EventSeverity as SeverityEnum } from '../types';
import { logsApi } from '../api/logsApi';
import Button from '@/core/components/ui/button/Button';
import Badge from '@/core/components/ui/badge/Badge';

interface LogFiltersProps {
  onApply: (filters: LogFilters) => void;
  currentFilters: LogFilters;
}

export const LogFiltersPanel: React.FC<LogFiltersProps> = ({ onApply, currentFilters }) => {
  const [filters, setFilters] = useState<LogFilters>(currentFilters);
  const [isOpen, setIsOpen] = useState(false);
  const [utenti, setUtenti] = useState<string[]>([]);
  const [utentiLoading, setUtentiLoading] = useState(false);

  // Carica utenti distinti quando il pannello viene aperto
  useEffect(() => {
    if (!isOpen || utenti.length > 0) return;

    const fetchUtenti = async () => {
      setUtentiLoading(true);
      try {
        const lista = await logsApi.getUtenti();
        setUtenti(lista);
      } catch (err) {
        console.error('[LogFilters] Errore caricamento utenti:', err);
      } finally {
        setUtentiLoading(false);
      }
    };

    fetchUtenti();
    // La lista utenti va ricaricata solo all'apertura del pannello,
    // non a ogni sua variazione.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleApply = () => {
    onApply(filters);
    setIsOpen(false);
  };

  const handleReset = () => {
    const emptyFilters: LogFilters = {};
    setFilters(emptyFilters);
    onApply(emptyFilters);
  };

  const hasActiveFilters = Object.keys(currentFilters).length > 0;

  const selectClass =
    'w-full px-3 py-2 bg-bg-primary text-text-primary border border-border-default rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors';

  return (
    <div className='relative'>
      {/* Filter Button */}
      <Button onClick={() => setIsOpen(!isOpen)} variant='outline' size='md' leftIcon={<Filter className='w-4 h-4' />}>
        Filtri
        {hasActiveFilters && (
          <Badge variant='info' size='xs' className='ml-2'>
            {Object.keys(currentFilters).length}
          </Badge>
        )}
      </Button>

      {/* Filters Panel */}
      {isOpen && (
        <div className='absolute top-full left-0 mt-2 w-80 bg-bg-primary rounded-lg shadow-themed-lg border border-border-default z-50'>
          {/* Header */}
          <div className='flex items-center justify-between p-4 border-b border-border-default'>
            <h3 className='font-semibold text-text-primary'>Filtri Avanzati</h3>
            <button
              onClick={() => setIsOpen(false)}
              className='text-text-secondary hover:text-text-primary transition-colors p-1 rounded hover:bg-bg-hover'
            >
              <X className='w-5 h-5' />
            </button>
          </div>

          {/* Filter Form */}
          <div className='p-4 space-y-4 max-h-96 overflow-y-auto'>
            {/* Categoria */}
            <div>
              <label className='block text-sm font-medium text-text-secondary mb-2'>Categoria</label>
              <select
                value={filters.categoria || ''}
                onChange={e => setFilters({ ...filters, categoria: (e.target.value as EventCategory) || undefined })}
                className={selectClass}
              >
                <option value=''>Tutte</option>
                {Object.values(CategoryEnum).map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Severità */}
            <div>
              <label className='block text-sm font-medium text-text-secondary mb-2'>Severità</label>
              <select
                value={filters.criticita || ''}
                onChange={e => setFilters({ ...filters, criticita: (e.target.value as EventSeverity) || undefined })}
                className={selectClass}
              >
                <option value=''>Tutte</option>
                {Object.values(SeverityEnum).map(sev => (
                  <option key={sev} value={sev}>
                    {sev}
                  </option>
                ))}
              </select>
            </div>

            {/* Esito */}
            <div>
              <label className='block text-sm font-medium text-text-secondary mb-2'>Esito</label>
              <select
                value={filters.esito || ''}
                onChange={e =>
                  setFilters({
                    ...filters,
                    esito: (e.target.value as 'successo' | 'fallito' | 'parziale') || undefined,
                  })
                }
                className={selectClass}
              >
                <option value=''>Tutti</option>
                <option value='successo'>Successo</option>
                <option value='fallito'>Fallito</option>
                <option value='parziale'>Parziale</option>
              </select>
            </div>

            {/* Utente - select dinamica dai log */}
            <div>
              <label className='block text-sm font-medium text-text-secondary mb-2'>Utente</label>
              <select
                value={filters.userId || ''}
                onChange={e => setFilters({ ...filters, userId: e.target.value || undefined })}
                disabled={utentiLoading}
                className={selectClass}
              >
                <option value=''>{utentiLoading ? 'Caricamento...' : 'Tutti'}</option>
                {utenti.map(utente => (
                  <option key={utente} value={utente}>
                    {utente}
                  </option>
                ))}
              </select>
            </div>

            {/* Data Inizio */}
            <div>
              <label className='block text-sm font-medium text-text-secondary mb-2'>Data Inizio</label>
              <input
                type='datetime-local'
                value={filters.startDate || ''}
                onChange={e => setFilters({ ...filters, startDate: e.target.value || undefined })}
                className={selectClass}
              />
            </div>

            {/* Data Fine */}
            <div>
              <label className='block text-sm font-medium text-text-secondary mb-2'>Data Fine</label>
              <input
                type='datetime-local'
                value={filters.endDate || ''}
                onChange={e => setFilters({ ...filters, endDate: e.target.value || undefined })}
                className={selectClass}
              />
            </div>
          </div>

          {/* Footer */}
          <div className='flex items-center justify-end gap-2 p-4 border-t border-border-default'>
            <Button onClick={handleReset} variant='ghost' size='sm'>
              Reset
            </Button>
            <Button onClick={handleApply} variant='primary' size='sm'>
              Applica
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogFiltersPanel;
