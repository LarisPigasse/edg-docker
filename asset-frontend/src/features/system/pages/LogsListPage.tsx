/**
 * Pagina principale lista logs
 * Accessibile solo a utenti root
 */

import React, { useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { useLogsList, useLogsStats } from '../hooks';
import { LogStatsCards, LogFiltersPanel, LogsTable } from '../components';
import type { LogFilters } from '../types';
import { logsApi } from '../api/logsApi';
import { downloadFile, generateExportFilename } from '../utils/logFormatters';
import { Button } from '@/core/components/ui';
import { Alert } from '@/core/components/feedback';

export const LogsListPage: React.FC = () => {
  const [filters, setFilters] = useState<LogFilters>({});

  // Data fetching hooks
  const {
    logs,
    loading: logsLoading,
    error: logsError,
    page,
    limit,
    hasMore,
    refetch,
    nextPage,
    prevPage,
    setFilters: applyFilters,
  } = useLogsList(filters);

  const { stats, loading: statsLoading } = useLogsStats(filters);

  // Export handlers
  const handleExportCsv = async () => {
    try {
      const blob = await logsApi.exportToCsv(filters);
      const filename = generateExportFilename('csv');
      downloadFile(blob, filename);
    } catch (error) {
      console.error('Export CSV failed:', error);
      alert("Errore durante l'export CSV");
    }
  };

  const handleExportJson = async () => {
    try {
      const blob = await logsApi.exportToJson(filters);
      const filename = generateExportFilename('json');
      downloadFile(blob, filename);
    } catch (error) {
      console.error('Export JSON failed:', error);
      alert("Errore durante l'export JSON");
    }
  };

  const handleApplyFilters = (newFilters: LogFilters) => {
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  return (
    <div className='min-h-full'>
      {/* Header with Stats */}
      <div className='flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6 gap-6'>
        {/* Left: Title */}
        <div className='flex-shrink-0'>
          <p className='text-page-title'>EDG Logs</p>
          <p className='mt-2 text-page-subtitle'>Monitoraggio eventi e attività del sistema</p>
        </div>

        {/* Right: Stats Cards */}
        <div className='flex-1 w-full lg:w-auto'>
          <LogStatsCards stats={stats} loading={statsLoading} />
        </div>
      </div>

      {/* Toolbar */}
      <div className='flex items-center justify-between mb-6'>
        {/* Left: Filters */}
        <div className='flex items-center gap-3'>
          <LogFiltersPanel onApply={handleApplyFilters} currentFilters={filters} />

          {/* Refresh Button */}
          <Button
            onClick={() => refetch()}
            disabled={logsLoading}
            variant='outline'
            size='md'
            leftIcon={<RefreshCw className={`w-4 h-4 ${logsLoading ? 'animate-spin' : ''}`} />}
          >
            Aggiorna
          </Button>
        </div>

        {/* Right: Export */}
        <div className='relative group'>
          <Button variant='primary' size='md' leftIcon={<Download className='w-4 h-4' />}>
            Export
          </Button>

          {/* Dropdown */}
          <div className='absolute right-0 top-full mt-2 w-48 bg-bg-primary rounded-lg shadow-themed-lg border border-border-default opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10'>
            <button
              onClick={handleExportCsv}
              className='w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-bg-hover rounded-t-lg transition-colors'
            >
              Esporta CSV
            </button>
            <button
              onClick={handleExportJson}
              className='w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-bg-hover rounded-b-lg transition-colors'
            >
              Esporta JSON
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {logsError && (
        <div className='mb-6'>
          <Alert variant='danger' title='Errore'>
            {logsError}
          </Alert>
        </div>
      )}

      {/* Logs Table */}
      <LogsTable
        logs={logs}
        loading={logsLoading}
        page={page}
        limit={limit}
        hasMore={hasMore}
        onNextPage={nextPage}
        onPrevPage={prevPage}
      />
    </div>
  );
};

export default LogsListPage;
