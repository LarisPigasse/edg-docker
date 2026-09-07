/**
 * Modal dettaglio singolo evento log
 */

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { EventSeverity, type LogEvent } from '../types';
import { formatTimestamp, getCategoryLabel, getSeverityLabel, getLogMessage, getLogUser } from '../utils/logFormatters';
import Badge from '@/core/components/ui/badge/Badge';
import Button from '@/core/components/ui/button/Button';

interface LogDetailModalProps {
  log: LogEvent | null;
  isOpen: boolean;
  onClose: () => void;
}

export const LogDetailModal: React.FC<LogDetailModalProps> = ({ log, isOpen, onClose }) => {
  // Close modal on ESC
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden'; // Lock scroll

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset'; // Unlock scroll
    };
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !log) return null;

  // Mapping severità a varianti Badge
  const severityMap: Record<EventSeverity, 'success' | 'warning' | 'danger' | 'info'> = {
    [EventSeverity.INFO]: 'info',
    [EventSeverity.WARNING]: 'warning',
    [EventSeverity.ERROR]: 'danger',
    [EventSeverity.CRITICAL]: 'danger',
  };

  // Mapping esito a varianti Badge
  const outcomeMap: Record<string, 'success' | 'warning' | 'danger'> = {
    successo: 'success',
    parziale: 'warning',
    fallito: 'danger',
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center' onClick={handleBackdropClick}>
      {/* Backdrop */}
      <div className='absolute inset-0 bg-black/50 backdrop-blur-sm' />

      {/* Modal Container */}
      <div className='relative w-full max-w-4xl max-h-[90vh] mx-4 flex flex-col'>
        <div className='rounded-xl shadow-xl overflow-hidden flex flex-col bg-bg-modal border border-border-default'>
          {/* Header */}
          <div className='flex items-center justify-between p-6 border-b border-border-default flex-shrink-0'>
            <h2 className='text-xl font-semibold text-text-primary'>Dettaglio Evento</h2>
            <button onClick={onClose} className='p-2 rounded-lg hover:bg-bg-hover transition-colors' aria-label='Chiudi modal'>
              <X className='w-5 h-5 text-text-secondary' />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className='flex-1 overflow-y-auto p-6 space-y-6'>
            {/* Overview */}
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-text-secondary mb-1'>Timestamp</label>
                <p className='text-text-primary'>{formatTimestamp(log.timestamp)}</p>
              </div>

              <div>
                <label className='block text-sm font-medium text-text-secondary mb-1'>ID Evento</label>
                <p className='text-text-primary font-mono text-sm'>{log._id}</p>
              </div>

              <div>
                <label className='block text-sm font-medium text-text-secondary mb-1'>Categoria</label>
                <Badge variant='info' size='sm' text={getCategoryLabel(log.categoria || 'LEGACY')} />
              </div>

              <div>
                <label className='block text-sm font-medium text-text-secondary mb-1'>Severità</label>
                <Badge
                  variant={severityMap[log.criticita || EventSeverity.INFO]}
                  size='sm'
                  text={getSeverityLabel(log.criticita || EventSeverity.INFO)}
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-text-secondary mb-1'>Utente</label>
                <p className='text-text-primary'>{getLogUser(log)}</p>
              </div>

              <div>
                <label className='block text-sm font-medium text-text-secondary mb-1'>Esito</label>
                <Badge variant={outcomeMap[log.risultato.esito]} size='sm' text={log.risultato.esito} />
              </div>
            </div>

            {/* Message */}
            <div>
              <label className='block text-sm font-medium text-text-secondary mb-1'>Messaggio</label>
              <p className='text-text-primary'>{getLogMessage(log)}</p>
            </div>

            {/* Azione */}
            <div>
              <h3 className='text-sm font-medium text-text-primary mb-3'>Azione</h3>
              <div className='bg-bg-secondary rounded-lg p-4 space-y-2'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <span className='text-sm text-text-secondary'>Tipo:</span>
                    <span className='ml-2 text-sm text-text-primary'>{log.azione.tipo}</span>
                  </div>
                  <div>
                    <span className='text-sm text-text-secondary'>Entità:</span>
                    <span className='ml-2 text-sm text-text-primary'>{log.azione.entita}</span>
                  </div>
                  <div>
                    <span className='text-sm text-text-secondary'>ID Entità:</span>
                    <span className='ml-2 text-sm text-text-primary font-mono'>{log.azione.idEntita}</span>
                  </div>
                  <div>
                    <span className='text-sm text-text-secondary'>Operazione:</span>
                    <span className='ml-2 text-sm text-text-primary'>{log.azione.operazione}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contesto */}
            {log.contesto && (
              <div>
                <h3 className='text-sm font-medium text-text-primary mb-3'>Contesto</h3>
                <div className='bg-bg-secondary rounded-lg p-4'>
                  <pre className='text-sm text-text-primary whitespace-pre-wrap font-mono'>
                    {JSON.stringify(log.contesto, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Metadata */}
            {log.metadata && (
              <div>
                <h3 className='text-sm font-medium text-text-primary mb-3'>Metadata</h3>
                <div className='bg-bg-secondary rounded-lg p-4'>
                  <pre className='text-sm text-text-primary whitespace-pre-wrap font-mono'>
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Stato (se presente) */}
            {log.stato && (
              <div>
                <h3 className='text-sm font-medium text-text-primary mb-3'>Cambiamenti Stato</h3>
                <div className='grid grid-cols-2 gap-4'>
                  {/* Stato Precedente */}
                  {log.stato.precedente && (
                    <div>
                      <label className='block text-xs font-medium text-text-secondary mb-2'>Precedente</label>
                      <div className='bg-red-50 dark:bg-red-900/20 rounded-lg p-3'>
                        <pre className='text-xs text-text-primary whitespace-pre-wrap font-mono'>
                          {JSON.stringify(log.stato.precedente, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Stato Nuovo */}
                  {log.stato.nuovo && (
                    <div>
                      <label className='block text-xs font-medium text-text-secondary mb-2'>Nuovo</label>
                      <div className='bg-green-50 dark:bg-green-900/20 rounded-lg p-3'>
                        <pre className='text-xs text-text-primary whitespace-pre-wrap font-mono'>
                          {JSON.stringify(log.stato.nuovo, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            {log.tags && log.tags.length > 0 && (
              <div>
                <h3 className='text-sm font-medium text-text-primary mb-3'>Tags</h3>
                <div className='flex flex-wrap gap-2'>
                  {log.tags.map((tag, index) => (
                    <Badge key={index} variant='default' size='sm' text={tag} />
                  ))}
                </div>
              </div>
            )}

            {/* Raw JSON (collapsible) */}
            <details>
              <summary className='text-sm font-medium text-text-primary cursor-pointer hover:text-text-link'>
                Visualizza JSON Completo
              </summary>
              <div className='mt-3 bg-gray-900 dark:bg-gray-950 rounded-lg p-4 overflow-x-auto'>
                <pre className='text-xs text-green-400 font-mono'>{JSON.stringify(log, null, 2)}</pre>
              </div>
            </details>
          </div>

          {/* Footer */}
          <div className='flex items-center justify-end gap-3 p-6 border-t border-border-default flex-shrink-0'>
            <Button onClick={onClose} variant='outline' size='md'>
              Chiudi
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogDetailModal;
