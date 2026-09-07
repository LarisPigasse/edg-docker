// src/core/components/data/stat-card/StatCard.tsx

import React from 'react';
import { Card } from '@/core/components/layout';
import { Skeleton } from '@/core/components/feedback';

export interface StatCardProps {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
  alert?: boolean;
  subtitle?: React.ReactNode; // ⚠️ era string — ora accetta anche contenuto composito (es. due conteggi con pesi/colori diversi)
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, loading, alert, subtitle, onClick }) => {
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
    <Card variant='default' padding='md' onClick={onClick} className={alert ? 'border border-red-300 dark:border-red-700' : ''}>
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-sm font-medium text-text-secondary'>{title}</p>
          <p className={`text-3xl font-bold mt-1 ${alert ? 'text-red-600 dark:text-red-400' : 'text-text-primary'}`}>
            {typeof value === 'number' ? value.toLocaleString('it-IT') : value}
          </p>
          {subtitle && <p className='text-sm text-text-secondary mt-0.5'>{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${color}`}>{icon}</div>
      </div>
    </Card>
  );
};

export default StatCard;
