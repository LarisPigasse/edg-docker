// =============================================================================
// ASSET MODULE — COMPONENT: ModulePlaceholder
// features/assets/components/ModulePlaceholder.tsx
// =============================================================================
//
// Pannello "sezione in preparazione". Serve a tenere il modulo navigabile
// mentre le pagine reali vengono sviluppate: appena una pagina è pronta,
// si sostituisce il placeholder e nient'altro cambia.
//

import React from 'react';
import { Construction, Circle } from 'lucide-react';
import { Card } from '@/core/components/layout';

export interface ModulePlaceholderProps {
  /** Titolo del pannello */
  title: string;
  /** Descrizione estesa di cosa ospiterà questa sezione */
  description: React.ReactNode;
  /** Elenco dei passi previsti (opzionale) */
  steps?: string[];
  /** Slot per azioni (es. link alla documentazione) */
  actions?: React.ReactNode;
}

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({ title, description, steps, actions }) => {
  return (
    <Card variant='outlined' padding='lg'>
      <div className='flex flex-col items-center text-center gap-4'>
        <div className='p-4 rounded-full bg-violet-100 dark:bg-violet-900/40'>
          <Construction className='w-8 h-8 text-violet-600 dark:text-violet-300' />
        </div>

        <div className='space-y-2 max-w-2xl'>
          <h2 className='text-xl font-semibold text-text-primary'>{title}</h2>
          <p className='text-sm text-text-secondary leading-relaxed'>{description}</p>
        </div>

        {steps && steps.length > 0 && (
          <ul className='w-full max-w-2xl mt-2 grid gap-2 text-left sm:grid-cols-2'>
            {steps.map(step => (
              <li
                key={step}
                className='flex items-start gap-2 rounded-lg border border-border-default bg-bg-secondary/50 px-3 py-2'
              >
                <Circle className='w-3 h-3 mt-1 shrink-0 text-violet-500' />
                <span className='text-sm text-text-secondary'>{step}</span>
              </li>
            ))}
          </ul>
        )}

        {actions && <div className='flex items-center gap-3 mt-2'>{actions}</div>}
      </div>
    </Card>
  );
};

export default ModulePlaceholder;
