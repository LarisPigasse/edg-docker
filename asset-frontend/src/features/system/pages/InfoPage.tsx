// src/features/system/pages/InfoPage.tsx

import React, { useState, useCallback } from 'react';
import { Monitor, Bell, List, Plus, RefreshCw, Activity } from 'lucide-react';
import Button from '@/core/components/ui/button/Button';
import { Card } from '@/core/components/layout';
import { Skeleton, useToast, Tooltip } from '@/core/components/feedback';
import { useSystem } from '../hooks/useSystem';
import { useAlertRules, useAlertHistory } from '../hooks';
import { ServiceStatusCard } from '../components/ServiceStatusCard';
import { AlertStatsCards, AlertRulesTable, AlertHistoryTable, AlertRuleForm } from '../components';
import type { AlertRule, AlertRuleFormData, AlertHistoryFilters } from '../types';
import type { ServiceHealth } from '../api/systemApi';
import { StatCard } from '@/core/components/data';

// ============================================================================
// TIPI
// ============================================================================

type Tab = 'health' | 'rules' | 'history';

/** Servizio fittizio usato solo per gli skeleton di caricamento. */
const SERVICE_PLACEHOLDER: ServiceHealth = {
  id: '',
  name: '',
  status: 'UP',
  responseTime: null,
  checkedAt: '',
};

// ============================================================================
// SECTION WRAPPER
// ============================================================================

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className='flex flex-col gap-3'>
    <div className='flex items-center gap-2'>
      <span className='text-text-secondary'>{icon}</span>
      <h2 className='text-sm font-semibold text-text-secondary uppercase tracking-wider'>{title}</h2>
    </div>
    {children}
  </div>
);

// ============================================================================
// ERROR BANNER
// ============================================================================

const ErrorBanner: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <Card variant='default' padding='md'>
    <div className='flex items-center justify-between'>
      <p className='text-sm text-red-600 dark:text-red-400'>{message}</p>
      {onRetry && (
        <Button variant='ghost' size='sm' onClick={onRetry}>
          Riprova
        </Button>
      )}
    </div>
  </Card>
);

// ============================================================================
// TAB BUTTON
// ============================================================================

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon, label, count }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
      ${
        active
          ? 'border-violet-500 text-text-link-hover'
          : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-default'
      }
    `}
  >
    {icon}
    {label}
    {count !== undefined && (
      <span
        className={`
        inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-xs font-medium
        ${active ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300' : 'bg-bg-secondary text-text-secondary'}
      `}
      >
        {count}
      </span>
    )}
  </button>
);

// ============================================================================
// TAB: SALUTE DEL SISTEMA
// ============================================================================

const HealthContent: React.FC = () => {
  const { data, loading, error, lastUpdate, refetch } = useSystem();

  const stats = data?.stats;
  const services = data?.services ?? [];
  const last = data?.lastAlert;

  const lastUpdateStr = lastUpdate
    ? lastUpdate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—';

  return (
    <div className='flex flex-col gap-6'>
      {/* Timestamp + bottone aggiorna */}
      <div className='flex items-center justify-between'>
        <div className='text-xs text-text-secondary'>
          Ultimo aggiornamento: <span className='font-medium'>{lastUpdateStr}</span>
          <span className='ml-2 opacity-60'>(auto ogni 60s)</span>
        </div>
        <Tooltip content='Aggiorna' side='bottom'>
          <Button variant='secondary' size='md' onClick={refetch} disabled={loading} title='Aggiorna'>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </Tooltip>
      </div>

      {error && <ErrorBanner message={error} onRetry={refetch} />}

      {/* Servizi */}

      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3'>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <ServiceStatusCard key={i} service={SERVICE_PLACEHOLDER} loading />)
          : services.map(s => <ServiceStatusCard key={s.id} service={s} />)}
      </div>

      {/* Attività 24h */}
      <Section title='Attività ultime 24 ore' icon={<Activity className='w-4 h-4' />}>
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
          <StatCard
            title='Log totali'
            value={stats?.logs24h ?? 0}
            icon={<Activity className='w-6 h-6 text-white' />}
            color='bg-sky-500 dark:bg-sky-600'
            loading={loading}
          />
          <StatCard
            title='Eventi critici'
            value={stats?.critici24h ?? 0}
            icon={<Bell className='w-6 h-6 text-white' />}
            color={(stats?.critici24h ?? 0) > 0 ? 'bg-red-500 dark:bg-red-600' : 'bg-gray-400 dark:bg-gray-600'}
            alert={(stats?.critici24h ?? 0) > 0}
            loading={loading}
            subtitle={(stats?.critici24h ?? 0) > 0 ? 'Richiedono attenzione' : undefined}
          />
          <StatCard
            title='Errori'
            value={stats?.errori24h ?? 0}
            icon={<Bell className='w-6 h-6 text-white' />}
            color={(stats?.errori24h ?? 0) > 0 ? 'bg-amber-500 dark:bg-amber-600' : 'bg-gray-400 dark:bg-gray-600'}
            loading={loading}
          />
        </div>
      </Section>

      {/* Alerting summary */}
      <Section title='Alerting' icon={<Bell className='w-4 h-4' />}>
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
          <StatCard
            title='Regole attive'
            value={stats?.alertRules ?? 0}
            icon={<Bell className='w-6 h-6 text-white' />}
            color='bg-violet-500 dark:bg-violet-600'
            loading={loading}
          />
          <StatCard
            title='Alert ultimi 7gg'
            value={stats?.alertsWeek ?? 0}
            icon={<Bell className='w-6 h-6 text-white' />}
            color='bg-emerald-500 dark:bg-emerald-600'
            loading={loading}
          />
          <StatCard
            title='Alert falliti'
            value={stats?.alertsFailed ?? 0}
            icon={<Bell className='w-6 h-6 text-white' />}
            color={(stats?.alertsFailed ?? 0) > 0 ? 'bg-red-500 dark:bg-red-600' : 'bg-gray-400 dark:bg-gray-600'}
            alert={(stats?.alertsFailed ?? 0) > 0}
            loading={loading}
            subtitle={(stats?.alertsFailed ?? 0) > 0 ? 'Verificare email-service' : undefined}
          />
        </div>
      </Section>

      {/* Ultimo alert */}
      <Section title='Ultimo alert inviato' icon={<Bell className='w-4 h-4' />}>
        {loading ? (
          <Card variant='default' padding='md'>
            <Skeleton className='h-4 w-full mb-2' />
            <Skeleton className='h-4 w-2/3' />
          </Card>
        ) : last ? (
          <Card variant='default' padding='md'>
            <div className='flex items-center justify-between flex-wrap gap-3'>
              <div className='flex flex-col gap-1'>
                <span className='text-sm font-medium text-text-primary'>{last.ruleName}</span>
                <span className='text-xs text-text-secondary'>{last.sentTo}</span>
              </div>
              <div className='flex items-center gap-3'>
                <span
                  className={`text-sm font-medium ${
                    last.status === 'SENT' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {last.status === 'SENT' ? 'Inviato' : 'Fallito'}
                </span>
                <span className='text-xs text-text-secondary tabular-nums'>
                  {new Date(last.createdAt).toLocaleString('it-IT')}
                </span>
              </div>
            </div>
          </Card>
        ) : (
          <Card variant='default' padding='md'>
            <p className='text-sm text-text-secondary text-center py-4'>Nessun alert inviato finora</p>
          </Card>
        )}
      </Section>
    </div>
  );
};

// ============================================================================
// TAB: ALERT MANAGER (regole)
// ============================================================================

const RulesContent: React.FC = () => {
  const toast = useToast();

  const { rules, loading, error, refetch, createRule, updateRule, toggleRule, deleteRule } = useAlertRules();

  const [formOpen, setFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (data: AlertRuleFormData) => {
      setFormLoading(true);
      try {
        if (editingRule) {
          await updateRule(editingRule._id, data);
          toast?.({ title: `Regola "${data.name}" aggiornata` });
        } else {
          await createRule(data);
          toast?.({ title: `Regola "${data.name}" creata` });
        }
        setFormOpen(false);
        setEditingRule(null);
      } catch (err) {
        toast?.danger({ title: err instanceof Error ? err.message : 'Errore nel salvataggio' });
      } finally {
        setFormLoading(false);
      }
    },
    [editingRule, createRule, updateRule, toast]
  );

  const handleToggle = useCallback(
    async (rule: AlertRule) => {
      setTogglingId(rule._id);
      try {
        await toggleRule(rule._id);
      } catch (err) {
        toast?.danger({ title: err instanceof Error ? err.message : 'Errore nel toggle' });
      } finally {
        setTogglingId(null);
      }
    },
    [toggleRule, toast]
  );

  const handleDelete = useCallback(
    async (rule: AlertRule) => {
      if (!window.confirm(`Eliminare la regola "${rule.name}"?\nLo storico associato verrà mantenuto.`)) return;
      try {
        await deleteRule(rule._id);
        toast?.({ title: `Regola "${rule.name}" eliminata` });
      } catch (err) {
        toast?.danger({ title: err instanceof Error ? err.message : "Errore nell'eliminazione" });
      }
    },
    [deleteRule, toast]
  );

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-center justify-between'>
        <Button variant='ghost' size='sm' onClick={refetch} disabled={loading} title='Aggiorna'>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
        <Button
          variant='primary'
          size='sm'
          onClick={() => {
            setEditingRule(null);
            setFormOpen(true);
          }}
        >
          <Plus className='w-4 h-4 mr-1.5' />
          Nuova regola
        </Button>
      </div>

      {error && <ErrorBanner message={error} onRetry={refetch} />}

      <AlertRulesTable
        rules={rules}
        loading={loading}
        togglingId={togglingId}
        onEdit={rule => {
          setEditingRule(rule);
          setFormOpen(true);
        }}
        onDelete={handleDelete}
        onToggle={handleToggle}
      />

      {formOpen && (
        <AlertRuleForm
          rule={editingRule}
          onSubmit={handleSubmit}
          onClose={() => {
            setFormOpen(false);
            setEditingRule(null);
          }}
          loading={formLoading}
        />
      )}
    </div>
  );
};

// ============================================================================
// TAB: STORICO ALERTS
// ============================================================================

const HistoryContent: React.FC = () => {
  const [historyFilters, setHistoryFilters] = useState<AlertHistoryFilters>({});

  const {
    history,
    stats,
    loading,
    statsLoading,
    error,
    pagination,
    nextPage,
    prevPage,
    setFilters: applyFilters,
    refetch,
    refetchStats,
  } = useAlertHistory(historyFilters);

  const handleFilters = useCallback(
    (filters: AlertHistoryFilters) => {
      setHistoryFilters(filters);
      applyFilters(filters);
    },
    [applyFilters]
  );

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetch(), refetchStats()]);
  }, [refetch, refetchStats]);

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex justify-end'>
        <Button variant='ghost' size='sm' onClick={handleRefresh} disabled={loading} title='Aggiorna'>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <AlertStatsCards stats={stats} loading={statsLoading} />

      {error && <ErrorBanner message={error} onRetry={handleRefresh} />}

      <AlertHistoryTable
        history={history}
        loading={loading}
        pagination={pagination}
        filters={historyFilters}
        onNextPage={nextPage}
        onPrevPage={prevPage}
        onFilters={handleFilters}
      />
    </div>
  );
};

// ============================================================================
// PAGINA PRINCIPALE
// ============================================================================

const InfoPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('health');

  return (
    <>
      {/* Header */}
      <div className='flex items-center gap-3 mb-6'>
        <div>
          <p className='text-page-title'>System Info</p>
          <p className='text-page-subtitle'>Alerts manager e salute del sistema</p>
        </div>
      </div>

      {/* Tab navigation */}
      <div className='flex border-b border-border-default mb-2'>
        <TabButton
          active={activeTab === 'health'}
          onClick={() => setActiveTab('health')}
          icon={<Monitor className='w-4 h-4' />}
          label='Salute del Sistema'
        />
        <TabButton
          active={activeTab === 'rules'}
          onClick={() => setActiveTab('rules')}
          icon={<Bell className='w-4 h-4' />}
          label='Alert Manager'
        />
        <TabButton
          active={activeTab === 'history'}
          onClick={() => setActiveTab('history')}
          icon={<List className='w-4 h-4' />}
          label='Storico Alerts'
        />
      </div>

      {/* Contenuto — ogni componente gestisce autonomamente hook e refresh */}
      {activeTab === 'health' && <HealthContent />}
      {activeTab === 'rules' && <RulesContent />}
      {activeTab === 'history' && <HistoryContent />}
    </>
  );
};

export default InfoPage;
