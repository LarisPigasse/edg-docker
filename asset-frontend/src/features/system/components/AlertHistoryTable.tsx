/**
 * Tabella storico alert inviati con paginazione e filtri.
 */

import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Mail } from 'lucide-react';
import Table from '@/core/components/data/table/Table';
import type { TableColumn } from '@/core/components/data/table/Table';
import Badge from '@/core/components/ui/badge/Badge';
import Button from '@/core/components/ui/button/Button';
import { Card } from '@/core/components/layout';
import type { AlertHistoryEntry, AlertHistoryFilters, AlertStatus } from '../types';

// ============================================================================
// HELPERS UI
// ============================================================================

const StatusBadge: React.FC<{ status: AlertStatus }> = ({ status }) => {
  if (status === 'SENT') {
    return (
      <div className='flex items-center gap-1.5'>
        <CheckCircle className='w-4 h-4 text-emerald-500' />
        <Badge variant='success' size='xs' text='Inviato' />
      </div>
    );
  }
  return (
    <div className='flex items-center gap-1.5'>
      <XCircle className='w-4 h-4 text-red-500' />
      <Badge variant='danger' size='xs' text='Fallito' />
    </div>
  );
};

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return `${d.toLocaleDateString('it-IT')} ${d.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })}`;
};

// ============================================================================
// FILTRI
// ============================================================================

interface AlertHistoryFiltersBarProps {
  filters: AlertHistoryFilters;
  onChange: (filters: AlertHistoryFilters) => void;
}

const AlertHistoryFiltersBar: React.FC<AlertHistoryFiltersBarProps> = ({ filters, onChange }) => {
  const inputClass =
    'text-sm border border-border-default rounded-md px-3 py-1.5 ' +
    'bg-bg-primary text-text-primary ' +
    'focus:outline-none focus:ring-2 focus:ring-violet-500';

  return (
    <div className='flex flex-wrap gap-3 items-end'>
      {/* Filtro stato */}
      <div className='flex flex-col gap-1'>
        <label className='text-xs font-medium text-text-secondary'>Stato</label>
        <select
          className={inputClass}
          value={filters.status ?? ''}
          onChange={e => onChange({ ...filters, status: (e.target.value as AlertStatus) || undefined })}
        >
          <option value=''>Tutti</option>
          <option value='SENT'>Inviati</option>
          <option value='FAILED'>Falliti</option>
        </select>
      </div>

      {/* Filtro data inizio */}
      <div className='flex flex-col gap-1'>
        <label className='text-xs font-medium text-text-secondary'>Dal</label>
        <input
          type='date'
          className={inputClass}
          value={filters.startDate ?? ''}
          onChange={e => onChange({ ...filters, startDate: e.target.value || undefined })}
        />
      </div>

      {/* Filtro data fine */}
      <div className='flex flex-col gap-1'>
        <label className='text-xs font-medium text-text-secondary'>Al</label>
        <input
          type='date'
          className={inputClass}
          value={filters.endDate ?? ''}
          onChange={e => onChange({ ...filters, endDate: e.target.value || undefined })}
        />
      </div>

      {/* Reset */}
      {(filters.status || filters.startDate || filters.endDate) && (
        <Button variant='ghost' size='sm' onClick={() => onChange({})}>
          Reset filtri
        </Button>
      )}
    </div>
  );
};

// ============================================================================
// PROPS
// ============================================================================

interface AlertHistoryTableProps {
  history: AlertHistoryEntry[];
  loading?: boolean;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  filters: AlertHistoryFilters;
  onNextPage: () => void;
  onPrevPage: () => void;
  onFilters: (filters: AlertHistoryFilters) => void;
}

// ============================================================================
// COMPONENTE
// ============================================================================

export const AlertHistoryTable: React.FC<AlertHistoryTableProps> = ({
  history,
  loading,
  pagination,
  filters,
  onNextPage,
  onPrevPage,
  onFilters,
}) => {
  const columns = useMemo<TableColumn<AlertHistoryEntry>[]>(
    () => [
      // Data invio
      {
        header: 'Data',
        className: 'w-44',
        accessor: entry => <span className='text-sm text-text-primary tabular-nums'>{formatDate(entry.createdAt)}</span>,
      },

      // Nome regola
      {
        header: 'Regola',
        accessor: entry => <span className='text-sm font-medium text-text-primary'>{entry.ruleName}</span>,
      },

      // Destinatario
      {
        header: 'Destinatario',
        className: 'hidden md:table-cell w-64',
        accessor: entry => (
          <div className='flex items-center gap-1.5 text-sm text-text-secondary'>
            <Mail className='w-3.5 h-3.5' />
            <span>{entry.sentTo}</span>
          </div>
        ),
      },

      // Stato
      {
        header: 'Stato',
        className: 'w-32',
        accessor: entry => <StatusBadge status={entry.status} />,
      },

      // Errore (solo se FAILED)
      {
        header: 'Dettaglio',
        className: 'hidden lg:table-cell',
        accessor: entry =>
          entry.error ? (
            <span className='text-xs text-red-600 dark:text-red-400 font-mono'>{entry.error}</span>
          ) : (
            <span className='text-xs text-text-secondary'>—</span>
          ),
      },
    ],
    []
  );

  const { page, totalPages, total, limit } = pagination;
  const from = total === 0 ? 0 : page * limit + 1;
  const to = Math.min((page + 1) * limit, total);

  return (
    <div className='flex flex-col gap-4'>
      {/* Filtri */}
      <AlertHistoryFiltersBar filters={filters} onChange={onFilters} />

      {/* Tabella */}
      {!loading && history.length === 0 ? (
        <Card variant='default' padding='lg'>
          <div className='flex flex-col items-center justify-center py-12 text-text-secondary'>
            <Mail className='w-12 h-12 mb-3 opacity-30' />
            <p className='text-sm'>Nessun alert trovato</p>
            <p className='text-xs mt-1 opacity-70'>Gli alert inviati appariranno qui</p>
          </div>
        </Card>
      ) : (
        <Table columns={columns} data={history} isLoading={loading} keyExtractor={entry => entry._id} />
      )}

      {/* Paginazione */}
      {total > 0 && (
        <div className='flex items-center justify-between px-1'>
          <p className='text-sm text-text-secondary'>
            {from}–{to} di {total.toLocaleString()}
          </p>
          <div className='flex items-center gap-2'>
            <Button variant='ghost' size='sm' onClick={onPrevPage} disabled={page === 0}>
              <ChevronLeft className='w-4 h-4' />
            </Button>
            <span className='text-sm text-text-primary tabular-nums'>
              {page + 1} / {totalPages}
            </span>
            <Button variant='ghost' size='sm' onClick={onNextPage} disabled={page >= totalPages - 1}>
              <ChevronRight className='w-4 h-4' />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertHistoryTable;
