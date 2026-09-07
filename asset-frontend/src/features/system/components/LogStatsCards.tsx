/**
 * Cards statistiche overview logs
 */

import React from 'react';
import { EventSeverity, type LogStats } from '../types';
import { Activity, AlertTriangle, AlertCircle, Info, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { Card } from '@/core/components/layout';
import { Skeleton } from '@/core/components/feedback';

interface LogStatsCardsProps {
  stats: LogStats | null;
  loading?: boolean;
}

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
          <p className='text-3xl font-bold text-text-primary mt-1'>{value.toLocaleString()}</p>
          {subtitle && <div className='mt-1'>{subtitle}</div>}
        </div>
        <div className={`p-3 rounded-full ${color}`}>{icon}</div>
      </div>
    </Card>
  );
};

export const LogStatsCards: React.FC<LogStatsCardsProps> = ({ stats, loading }) => {
  const totalEvents = stats?.total || 0;
  const criticalEvents = stats?.criticalEvents || 0;
  const errorEvents = stats?.bySeverity?.[EventSeverity.ERROR] || 0;
  const successRateOverall = stats?.successRate?.overall || 0;
  const successRateLast30Days = stats?.successRate?.last30Days || 0;
  const trend = stats?.successRate?.trend || 0;

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'>
      {/* Total Events */}
      <StatCard
        title='Eventi Totali'
        value={totalEvents}
        icon={<Activity className='w-6 h-6 text-white' />}
        color='bg-sky-500 dark:bg-sky-600'
        loading={loading}
      />

      {/* Critical Events */}
      <StatCard
        title='Eventi Critici'
        value={criticalEvents}
        icon={<AlertCircle className='w-6 h-6 text-white' />}
        color='bg-red-500 dark:bg-red-600'
        loading={loading}
      />

      {/* Errors */}
      <StatCard
        title='Errori'
        value={errorEvents}
        icon={<AlertTriangle className='w-6 h-6 text-white' />}
        color='bg-amber-500 dark:bg-amber-600'
        loading={loading}
      />

      {/* Success Rate Overall */}
      <StatCard
        title='Tasso Successo'
        value={`${successRateOverall.toFixed(1)}%`}
        icon={<Info className='w-6 h-6 text-white' />}
        color='bg-green-500 dark:bg-green-600'
        loading={loading}
      />

      {/* Success Rate Trend (Last 30 Days) */}
      <StatCard
        title='Trend 30gg'
        value={`${successRateLast30Days.toFixed(1)}%`}
        icon={
          trend > 0 ? (
            <TrendingUp className='w-6 h-6 text-white' />
          ) : trend < 0 ? (
            <TrendingDown className='w-6 h-6 text-white' />
          ) : (
            <Minus className='w-6 h-6 text-white' />
          )
        }
        color={
          trend > 0
            ? 'bg-emerald-500 dark:bg-emerald-600'
            : trend < 0
              ? 'bg-orange-500 dark:bg-orange-600'
              : 'bg-gray-500 dark:bg-gray-600'
        }
        subtitle={
          <div className='flex items-center gap-1'>
            <span
              className={`text-xs font-medium ${
                trend > 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : trend < 0
                    ? 'text-orange-600 dark:text-orange-400'
                    : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {trend > 0 ? '+' : ''}
              {trend.toFixed(1)}% vs media
            </span>
          </div>
        }
        loading={loading}
      />
    </div>
  );
};

export default LogStatsCards;
