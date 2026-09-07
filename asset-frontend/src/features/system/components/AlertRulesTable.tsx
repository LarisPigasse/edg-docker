/**
 * Tabella regole di alerting con toggle enable/disable e azioni CRUD.
 */

import React, { useMemo } from 'react';
import { Pencil, Trash2, Clock, AlertCircle } from 'lucide-react';
import Table from '@/core/components/data/table/Table';
import type { TableColumn } from '@/core/components/data/table/Table';
import Badge from '@/core/components/ui/badge/Badge';
import Button from '@/core/components/ui/button/Button';
import { Card } from '@/core/components/layout';
import type { AlertRule } from '../types';
import { formatConditions, formatThreshold } from '../types';

// ============================================================================
// HELPERS UI
// ============================================================================

/**
 * Badge colorato per la criticità delle condizioni.
 */
const CriticityBadge: React.FC<{ criticita?: string | null }> = ({ criticita }) => {
  if (!criticita) return <span className='text-text-secondary text-xs'>—</span>;

  const config: Record<string, { variant: 'danger' | 'warning' | 'info' | 'default'; label: string }> = {
    critical: { variant: 'danger', label: 'CRITICAL' },
    error: { variant: 'warning', label: 'ERROR' },
    warning: { variant: 'info', label: 'WARNING' },
    info: { variant: 'default', label: 'INFO' },
  };

  const cfg = config[criticita] ?? { variant: 'default' as const, label: criticita.toUpperCase() };
  return <Badge variant={cfg.variant} size='xs' text={cfg.label} />;
};

/**
 * Toggle switch visuale per lo stato enabled/disabled.
 */
const ToggleSwitch: React.FC<{
  enabled: boolean;
  loading?: boolean;
  onChange: () => void;
}> = ({ enabled, loading, onChange }) => (
  <button
    onClick={onChange}
    disabled={loading}
    className={`
      relative inline-flex h-6 w-11 items-center rounded-full
      transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
      focus:ring-violet-500
      ${enabled ? 'bg-violet-600 hover:bg-violet-700' : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'}
      ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    `}
    title={enabled ? 'Disabilita regola' : 'Abilita regola'}
  >
    <span
      className={`
        inline-block h-4 w-4 transform rounded-full bg-white shadow
        transition-transform duration-200
        ${enabled ? 'translate-x-6' : 'translate-x-1'}
      `}
    />
  </button>
);

// ============================================================================
// PROPS
// ============================================================================

interface AlertRulesTableProps {
  rules: AlertRule[];
  loading?: boolean;
  togglingId?: string | null; // ID della regola in corso di toggle
  onEdit: (rule: AlertRule) => void;
  onDelete: (rule: AlertRule) => void;
  onToggle: (rule: AlertRule) => void;
}

// ============================================================================
// COMPONENTE
// ============================================================================

export const AlertRulesTable: React.FC<AlertRulesTableProps> = ({ rules, loading, togglingId, onEdit, onDelete, onToggle }) => {
  const columns = useMemo<TableColumn<AlertRule>[]>(
    () => [
      // Stato (toggle)
      {
        header: 'Stato',
        className: 'w-20',
        accessor: rule => (
          <ToggleSwitch enabled={rule.enabled} loading={togglingId === rule._id} onChange={() => onToggle(rule)} />
        ),
      },

      // Nome + descrizione
      {
        header: 'Regola',
        accessor: rule => (
          <div>
            <p className='font-medium text-text-primary text-sm'>{rule.name}</p>
            {rule.description && <p className='text-xs text-text-secondary mt-0.5 line-clamp-1'>{rule.description}</p>}
          </div>
        ),
      },

      // Condizioni
      {
        header: 'Condizioni',
        className: 'hidden lg:table-cell',
        accessor: rule => (
          <div className='flex flex-col gap-1'>
            <span className='text-xs text-text-secondary'>{formatConditions(rule.conditions)}</span>
            {rule.conditions.criticita && <CriticityBadge criticita={rule.conditions.criticita} />}
          </div>
        ),
      },

      // Soglia
      {
        header: 'Soglia',
        className: 'hidden md:table-cell w-44',
        accessor: rule => <span className='text-sm text-text-primary'>{formatThreshold(rule.threshold)}</span>,
      },

      // Cooldown
      {
        header: 'Cooldown',
        className: 'hidden md:table-cell w-28',
        accessor: rule => (
          <div className='flex items-center gap-1 text-sm text-text-secondary'>
            <Clock className='w-3.5 h-3.5' />
            <span>{rule.cooldownMinutes} min</span>
          </div>
        ),
      },

      // Ultimo trigger
      {
        header: 'Ultimo trigger',
        className: 'hidden xl:table-cell w-40',
        accessor: rule => {
          if (!rule.lastTriggeredAt) {
            return <span className='text-xs text-text-secondary'>Mai scattata</span>;
          }
          const date = new Date(rule.lastTriggeredAt);
          return (
            <div className='flex items-center gap-1 text-xs text-text-secondary'>
              <AlertCircle className='w-3.5 h-3.5 text-amber-500' />
              <span>
                {date.toLocaleDateString('it-IT')} {date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        },
      },

      // Azioni
      {
        header: '',
        className: 'w-24',
        accessor: rule => (
          <div className='flex items-center gap-1 justify-end'>
            <Button variant='ghost' size='sm' onClick={() => onEdit(rule)} title='Modifica regola'>
              <Pencil className='w-4 h-4' />
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => onDelete(rule)}
              title='Elimina regola'
              className='text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20'
            >
              <Trash2 className='w-4 h-4' />
            </Button>
          </div>
        ),
      },
    ],
    [onEdit, onDelete, onToggle, togglingId]
  );

  if (!loading && rules.length === 0) {
    return (
      <Card variant='default' padding='lg'>
        <div className='flex flex-col items-center justify-center py-12 text-text-secondary'>
          <AlertCircle className='w-12 h-12 mb-3 opacity-30' />
          <p className='text-sm'>Nessuna regola configurata</p>
          <p className='text-xs mt-1 opacity-70'>Crea una nuova regola per iniziare a ricevere alert</p>
        </div>
      </Card>
    );
  }

  return <Table columns={columns} data={rules} isLoading={loading} keyExtractor={rule => rule._id} />;
};

export default AlertRulesTable;
