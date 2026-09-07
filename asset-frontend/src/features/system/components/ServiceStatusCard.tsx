// src/features/sistema/components/ServiceStatusCard.tsx

import React from 'react';
import { Card } from '@/core/components/layout';
import { Skeleton } from '@/core/components/feedback';
import type { ServiceHealth, ServiceStatus } from '../api/systemApi';

// ============================================================================
// HELPERS UI
// ============================================================================

const STATUS_CONFIG: Record<
  ServiceStatus,
  {
    label: string;
    textColor: string;
    cardBg: string;
  }
> = {
  UP: {
    label: 'Operativo',
    textColor: 'text-emerald-700 dark:text-emerald-900',
    cardBg: 'bg-category-layout',
  },
  DEGRADED: {
    label: 'Degradato',
    textColor: 'text-amber-700 dark:text-amber-900',
    cardBg: 'bg-category-feedback',
  },
  DOWN: {
    label: 'Non disponibile',
    textColor: 'text-red-700 dark:text-red-900',
    cardBg: 'bg-category-data',
  },
};

// ============================================================================
// COMPONENTE
// ============================================================================

interface ServiceStatusCardProps {
  service: ServiceHealth;
  loading?: boolean;
}

export const ServiceStatusCard: React.FC<ServiceStatusCardProps> = ({ service, loading }) => {
  if (loading) {
    return (
      <Card variant='default' padding='md'>
        <Skeleton className='h-4 w-32 mb-3' />
        <Skeleton className='h-6 w-24 mb-2' />
        <Skeleton className='h-3 w-20' />
      </Card>
    );
  }

  const cfg = STATUS_CONFIG[service.status];

  return (
    <Card variant='default' padding='md' className={cfg.cardBg}>
      <div className='flex items-start justify-between'>
        <div className='flex flex-col gap-1.5'>
          {/* Nome servizio */}
          <div className='flex items-center gap-2'>
            <span className='text-sm font-semibold text-text-primary'>{service.name}</span>
          </div>

          {/* Stato */}
          <div className='flex items-center gap-2'>
            <span className={`text-sm font-medium ${cfg.textColor}`}>{cfg.label}</span>
          </div>

          {/* Response time o errore */}
          {service.status === 'UP' && service.responseTime !== null && (
            <span className='text-xs text-text-secondary'>{service.responseTime} ms</span>
          )}
          {service.error && <span className='text-xs text-red-500 font-mono'>{service.error}</span>}
        </div>
      </div>
    </Card>
  );
};

export default ServiceStatusCard;
