// src/core/components/feedback/error-boundary/ErrorFallback.tsx
import React from 'react';
import type { ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset?: () => void;
  showDetails?: boolean;
}

/**
 * ErrorFallback - UI di fallback mostrata quando ErrorBoundary cattura un errore
 */
const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, errorInfo, onReset, showDetails = false }) => {
  const [detailsOpen, setDetailsOpen] = React.useState(false);

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className='min-h-[400px] flex items-center justify-center p-6'>
      <div className='max-w-lg w-full text-center space-y-6'>
        {/* Icona */}
        <div className='flex justify-center'>
          <div className='w-16 h-16 rounded-full bg-gray-100 dark:bg-red-900/30 flex items-center justify-center'>
            <AlertTriangle className='w-8 h-8 text-red-600 dark:text-red-400' />
          </div>
        </div>

        {/* Titolo e descrizione */}
        <div className='space-y-2'>
          <h2 className='text-xl font-semibold text-text-primary'>Qualcosa è andato storto</h2>
          <p className='text-text-secondary'>
            Si è verificato un errore imprevisto. Puoi provare a ricaricare la pagina o tornare alla home.
          </p>
        </div>

        {/* Messaggio errore (se showDetails) */}
        {showDetails && error && (
          <div className='bg-bg-secondary rounded-lg border border-border-default overflow-hidden'>
            <button
              onClick={() => setDetailsOpen(!detailsOpen)}
              className='w-full px-4 py-3 flex items-center justify-between text-left hover:bg-bg-hover transition-colors'
            >
              <span className='text-sm font-medium text-text-primary'>Dettagli errore</span>
              {detailsOpen ? (
                <ChevronUp className='w-4 h-4 text-text-secondary' />
              ) : (
                <ChevronDown className='w-4 h-4 text-text-secondary' />
              )}
            </button>

            {detailsOpen && (
              <div className='px-4 pb-4 space-y-3'>
                {/* Error message */}
                <div className='text-left'>
                  <p className='text-xs font-medium text-text-secondary mb-1'>Errore:</p>
                  <code className='block text-xs bg-bg-primary p-2 rounded border border-border-default text-red-600 dark:text-red-400 overflow-x-auto'>
                    {error.message}
                  </code>
                </div>

                {/* Component stack */}
                {errorInfo?.componentStack && (
                  <div className='text-left'>
                    <p className='text-xs font-medium text-text-secondary mb-1'>Component Stack:</p>
                    <pre className='text-xs bg-bg-primary p-2 rounded border border-border-default text-text-secondary overflow-x-auto max-h-32'>
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Azioni */}
        <div className='flex flex-col sm:flex-row gap-3 justify-center'>
          {onReset && (
            <button
              onClick={onReset}
              className='inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors font-medium'
            >
              <RefreshCw className='w-4 h-4' />
              Riprova
            </button>
          )}

          <button
            onClick={handleReload}
            className='inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-bg-secondary border border-border-default text-text-primary hover:bg-bg-hover transition-colors font-medium'
          >
            <RefreshCw className='w-4 h-4' />
            Ricarica pagina
          </button>

          <button
            onClick={handleGoHome}
            className='inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-bg-secondary border border-border-default text-text-primary hover:bg-bg-hover transition-colors font-medium'
          >
            <Home className='w-4 h-4' />
            Torna alla Home
          </button>
        </div>

        {/* Footer info */}
        <p className='text-xs text-text-tertiary'>Se il problema persiste, contatta il supporto tecnico.</p>
      </div>
    </div>
  );
};

export default ErrorFallback;
