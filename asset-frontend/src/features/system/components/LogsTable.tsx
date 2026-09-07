/**
 * Tabella principale eventi logs
 */

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import type { LogEvent } from '../types';
import { EventSeverity } from '../types';
import { formatTimestamp, getCategoryLabel, getSeverityLabel, getLogMessage, getLogUser } from '../utils/logFormatters';
import { LogDetailModal } from './LogDetailModal';
import Table from '@/core/components/data/table/Table';
import type { TableColumn } from '@/core/components/data/table/Table';
import Badge from '@/core/components/ui/badge/Badge';
import Button from '@/core/components/ui/button/Button';
import { Card } from '@/core/components/layout';

interface LogsTableProps {
  logs: LogEvent[];
  loading?: boolean;
  page: number;
  limit: number;
  hasMore: boolean;
  onNextPage: () => void;
  onPrevPage: () => void;
}

export const LogsTable: React.FC<LogsTableProps> = ({ logs, loading, page, hasMore, onNextPage, onPrevPage }) => {
  const [selectedLog, setSelectedLog] = useState<LogEvent | null>(null);

  // 📊 Definizione colonne
  const columns = useMemo<TableColumn<LogEvent>[]>(
    () => [
      {
        header: 'Timestamp',
        accessor: log => formatTimestamp(log.timestamp),
        className: 'w-40',
      },
      {
        header: 'Categoria',
        accessor: log => <Badge variant='info' size='xs' text={getCategoryLabel(log.categoria || 'LEGACY')} />,
        className: 'w-32',
      },
      {
        header: 'Severità',
        accessor: log => {
          const severityMap: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
            info: 'info',
            warning: 'warning',
            error: 'danger',
            critical: 'danger',
          };
          return (
            <Badge
              variant={severityMap[log.criticita || 'info']}
              size='xs'
              text={getSeverityLabel(log.criticita || EventSeverity.INFO)}
            />
          );
        },
        className: 'w-28',
      },
      {
        header: 'Utente',
        accessor: log => getLogUser(log),
        className: 'w-48',
      },
      {
        header: 'Messaggio',
        accessor: log => (
          <span className='truncate block max-w-md' title={getLogMessage(log)}>
            {getLogMessage(log)}
          </span>
        ),
      },
      {
        header: 'Esito',
        accessor: log => {
          const outcomeMap: Record<string, 'success' | 'warning' | 'danger'> = {
            successo: 'success',
            parziale: 'warning',
            fallito: 'danger',
          };
          return <Badge variant={outcomeMap[log.risultato.esito]} size='xs' text={log.risultato.esito} />;
        },
        className: 'w-28',
      },
      {
        header: '',
        accessor: log => (
          <button
            onClick={e => {
              e.stopPropagation();
              setSelectedLog(log);
            }}
            className='p-1.5 rounded-md text-text-secondary hover:text-violet-600 hover:bg-bg-hover transition-colors'
            title='Visualizza dettagli'
          >
            <Eye className='w-4 h-4' />
          </button>
        ),
        className: 'w-12 text-center',
      },
    ],
    []
  );

  if (loading) {
    return (
      <Card variant='default' padding='lg'>
        <div className='flex flex-col items-center justify-center py-12'>
          <div className='w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin' />
          <p className='mt-4 text-sm text-text-secondary'>Caricamento logs...</p>
        </div>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card variant='default' padding='lg'>
        <p className='text-center text-text-secondary py-8'>Nessun log trovato</p>
      </Card>
    );
  }

  return (
    <>
      <Card variant='default' padding='none'>
        {/* Table */}
        <Table<LogEvent> data={logs} columns={columns} keyExtractor={log => log._id} size='sm' hoverable />

        {/* Pagination */}
        <div className='bg-bg-secondary px-4 py-1 flex items-center justify-between border-t border-border-default'>
          <div className='text-sm text-text-secondary'>
            Pagina <span className='font-medium text-text-primary'>{page}</span>
            {' · '}
            <span className='font-medium text-text-primary'>{logs.length}</span> eventi
          </div>

          <div className='flex items-center gap-2'>
            <Button
              onClick={onPrevPage}
              disabled={page === 1}
              variant='outline'
              size='sm'
              leftIcon={<ChevronLeft className='w-4 h-4' />}
            >
              Indietro
            </Button>
            <Button
              onClick={onNextPage}
              disabled={!hasMore}
              variant='outline'
              size='sm'
              rightIcon={<ChevronRight className='w-4 h-4' />}
            >
              Avanti
            </Button>
          </div>
        </div>
      </Card>

      {/* Detail Modal */}
      <LogDetailModal log={selectedLog} isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} />
    </>
  );
};

export default LogsTable;
