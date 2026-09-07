// src/core/components/layout/PageHeader/PageHeader.tsx

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Tooltip } from '@/core/components/feedback';
import { Button } from '@/core/components/ui/';

interface PageHeaderProps {
  /** Titolo principale della pagina — accetta string o ReactNode per contenuto formattato */
  title: React.ReactNode;
  /** Sottotitolo descrittivo (opzionale) — accetta string o ReactNode per contenuto formattato */
  subtitle?: React.ReactNode;
  /** Callback per il refresh — se assente, il pulsante non viene mostrato */
  onRefresh?: () => void;
  /** True mentre il dato è in caricamento (fa girare l'icona) */
  isLoading?: boolean;
  /** Slot per azioni aggiuntive (es. pulsante "Crea", "Esporta", …) */
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, onRefresh, isLoading = false, actions }) => {
  return (
    <div className='mb-6 flex items-center justify-between'>
      {/* ── Sinistra: titolo + sottotitolo ── */}
      <div>
        <h1 className='text-page-title'>{title}</h1>
        {subtitle && <p className='text-page-subtitle mt-1'>{subtitle}</p>}
      </div>

      {/* ── Destra: refresh + azioni ── */}
      {(onRefresh || actions) && (
        <div className='flex items-center gap-3'>
          {actions}
          {onRefresh && (
            <Tooltip content='Aggiorna' side='bottom'>
              <Button variant='secondary' size='md' onClick={onRefresh} disabled={isLoading}>
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
