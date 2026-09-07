/**
 * Card statistiche per il modulo Alerts.
 * Mostra: totale alert, inviati, falliti, ultimi 7 giorni, tasso successo.
 */

import React from 'react';
import { Bell, CheckCircle, XCircle, Clock, BarChart2 } from 'lucide-react';
import { Card } from '@/core/components/layout';
import { Skeleton } from '@/core/components/feedback';
import type { AlertHistoryStats } from '../types';

// ============================================================================
// STAT CARD ATOMICA
// ============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
  subtitle?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, loading, subtitle }) => {
  if (loading) {
    return (
      <Card variant='default' padding='md'>
        <div className='flex items-center justify-between'>
          <div className='flex-1'>
            <Skeleton className='h-4 w-24 mb-2' />
            <Skeleton className='h-8 w-16' />
          </div>
          <Skeleton className='h-12 w-12 rounded-full' />
        </div>
      </Card>
    );
  }

  return (
    <Card variant='default' padding='md' hover>
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-sm font-medium text-text-secondary'>{title}</p>
          <p className='text-3xl font-bold text-text-primary mt-1'>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && <div className='mt-1'>{subtitle}</div>}
        </div>
        <div className={`p-3 rounded-full ${color}`}>{icon}</div>
      </div>
    </Card>
  );
};

// ============================================================================
// COMPONENTE PRINCIPALE
// ============================================================================

interface AlertStatsCardsProps {
  stats: AlertHistoryStats | null;
  loading?: boolean;
}

export const AlertStatsCards: React.FC<AlertStatsCardsProps> = ({ stats, loading }) => {
  const total = stats?.total ?? 0;
  const sent = stats?.sent ?? 0;
  const failed = stats?.failed ?? 0;
  const recentTotal = stats?.recentTotal ?? 0;
  const successRate = stats?.successRate ?? 100;

  // Colore tasso successo: verde ≥90%, arancio ≥70%, rosso <70%
  const rateColor =
    successRate >= 90
      ? 'bg-green-500 dark:bg-green-600'
      : successRate >= 70
        ? 'bg-amber-500 dark:bg-amber-600'
        : 'bg-red-500   dark:bg-red-600';

  const rateTextColor =
    successRate >= 90
      ? 'text-green-600 dark:text-green-400'
      : successRate >= 70
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-red-600   dark:text-red-400';

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'>
      {/* Totale alert */}
      <StatCard
        title='Alert Totali'
        value={total}
        icon={<Bell className='w-6 h-6 text-white' />}
        color='bg-sky-500 dark:bg-sky-600'
        loading={loading}
      />

      {/* Alert inviati con successo */}
      <StatCard
        title='Inviati'
        value={sent}
        icon={<CheckCircle className='w-6 h-6 text-white' />}
        color='bg-emerald-500 dark:bg-emerald-600'
        loading={loading}
      />

      {/* Alert falliti */}
      <StatCard
        title='Falliti'
        value={failed}
        icon={<XCircle className='w-6 h-6 text-white' />}
        color={failed > 0 ? 'bg-red-500 dark:bg-red-600' : 'bg-gray-400 dark:bg-gray-600'}
        loading={loading}
        subtitle={
          failed > 0 ? (
            <span className='text-xs font-medium text-red-600 dark:text-red-400'>Verificare email-service</span>
          ) : null
        }
      />

      {/* Ultimi 7 giorni */}
      <StatCard
        title='Ultimi 7 giorni'
        value={recentTotal}
        icon={<Clock className='w-6 h-6 text-white' />}
        color='bg-violet-500 dark:bg-violet-600'
        loading={loading}
      />

      {/* Tasso di successo */}
      <StatCard
        title='Tasso Successo'
        value={`${successRate}%`}
        icon={<BarChart2 className='w-6 h-6 text-white' />}
        color={rateColor}
        loading={loading}
        subtitle={
          total > 0 ? (
            <span className={`text-xs font-medium ${rateTextColor}`}>
              {sent} su {total} alert
            </span>
          ) : null
        }
      />
    </div>
  );
};

export default AlertStatsCards;
