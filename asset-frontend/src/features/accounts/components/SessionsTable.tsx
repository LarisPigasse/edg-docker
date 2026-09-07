import React from 'react';
import { Monitor, Smartphone, Tablet, Trash2, Ban, MapPin } from 'lucide-react';
import { Badge, Button } from '@/core/components/ui';
import type { Session } from '../types';

interface SessionsTableProps {
  sessions: Session[];
  currentSessionId: number | null;
  onRevokeSession: (sessionId: number) => void;
  onBlockUser: (userId: number) => void;
  onUnblockUser: (userId: number) => void;
  actionLoading: boolean;
}

const SessionsTable: React.FC<SessionsTableProps> = ({
  sessions,
  currentSessionId,
  onRevokeSession,
  onBlockUser,
  actionLoading,
}) => {
  /**
   * Icona dispositivo
   */
  const getDeviceIcon = (deviceType: string | null) => {
    if (!deviceType) return <Monitor className='w-5 h-5 text-gray-400' />;

    const type = deviceType.toLowerCase();
    if (type.includes('mobile')) return <Smartphone className='w-5 h-5 text-blue-500' />;
    if (type.includes('tablet')) return <Tablet className='w-5 h-5 text-purple-500' />;
    return <Monitor className='w-5 h-5 text-gray-600' />;
  };

  /**
   * Formatta data relativa (passato)
   */
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Adesso';
    if (diffMins < 60) return `${diffMins} min fa`;
    if (diffHours < 24) return `${diffHours}h fa`;
    if (diffDays < 7) return `${diffDays}g fa`;

    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  /**
   * Formatta scadenza (futuro)
   */
  const formatExpiryTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    // Se è già scaduto
    if (diffMs < 0) return 'Scaduto';

    // Se scade a breve
    if (diffMins < 60) return `Tra ${diffMins} min`;
    if (diffHours < 24) return `Tra ${diffHours}h`;
    if (diffDays < 7) return `Tra ${diffDays}g`;

    // Altrimenti mostra data completa
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Location string
   */
  const getLocationString = (session: Session): string => {
    const { city, region, country } = session.geo;
    const ip = session.device.ip;

    // Rileva IP interni/localhost
    if (
      ip?.includes('172.') ||
      ip?.includes('127.') ||
      ip?.includes('::1') ||
      ip?.includes('::ffff:172.') ||
      ip?.includes('::ffff:127.')
    ) {
      return 'Localhost (development)';
    }

    const parts = [city, region, country].filter(Boolean);
    if (parts.length === 0) return 'Sconosciuta';

    return parts.join(', ');
  };

  if (sessions.length === 0) {
    return (
      <div className='bg-white rounded-lg shadow p-12 text-center'>
        <Monitor className='w-16 h-16 text-gray-300 mx-auto mb-4' />
        <h3 className='text-lg font-semibold text-gray-900 mb-2'>Nessuna sessione attiva</h3>
        <p className='text-gray-600'>Non ci sono sessioni attive al momento.</p>
      </div>
    );
  }

  return (
    <div className='bg-bg-base rounded-md shadow overflow-hidden'>
      <div className='overflow-x-auto'>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead className='bg-bg-info'>
            <tr>
              <th scope='col' className='px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider'>
                Utente
              </th>
              <th scope='col' className='px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider'>
                Dispositivo
              </th>
              <th scope='col' className='px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider'>
                Posizione
              </th>
              <th scope='col' className='px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider'>
                Ultima Attività
              </th>
              <th scope='col' className='px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider'>
                Scadenza
              </th>
              <th scope='col' className='px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider'>
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className='bg-bg-base divide-y divide-gray-200'>
            {sessions.map(session => {
              const isCurrent = session.id === currentSessionId;

              return (
                <tr key={session.id} className={isCurrent ? 'bg-blue-50' : ''}>
                  {/* Utente */}
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='flex items-center'>
                      <div>
                        <div className='flex items-center gap-2'>
                          <div className='text-sm font-medium text-gray-900'>{session.user.email}</div>
                          {isCurrent && (
                            <Badge variant='success' size='sm'>
                              Current
                            </Badge>
                          )}
                        </div>
                        <div className='text-sm text-gray-500'>{session.user.role}</div>
                      </div>
                    </div>
                  </td>

                  {/* Dispositivo */}
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='flex items-center gap-3'>
                      {getDeviceIcon(session.device.device)}
                      <div>
                        <div className='text-sm font-medium text-gray-900'>{session.device.device || 'Sconosciuto'}</div>
                        <div className='text-sm text-gray-500'>
                          {session.device.os || 'OS sconosciuto'} • {session.device.browser || 'Browser sconosciuto'}
                        </div>
                        <div className='text-xs text-gray-400 mt-1'>
                          {session.device.ip?.includes('172.') ||
                          session.device.ip?.includes('::ffff:172.') ||
                          session.device.ip?.includes('127.') ||
                          session.device.ip?.includes('::ffff:127.') ||
                          session.device.ip?.includes('::1')
                            ? 'Docker bridge: '
                            : ''}
                          {session.device.ip}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Posizione */}
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='flex items-center gap-2 text-sm text-gray-900'>
                      <MapPin className='w-4 h-4 text-gray-400' />
                      {getLocationString(session)}
                    </div>
                    {session.geo.timezone && session.geo.timezone !== 'UTC' && (
                      <div className='text-xs text-gray-500 mt-1'>{session.geo.timezone}</div>
                    )}
                  </td>

                  {/* Ultima Attività */}
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    {session.lastActivityAt
                      ? formatRelativeTime(session.lastActivityAt)
                      : formatRelativeTime(session.createdAt)}
                  </td>

                  {/* Scadenza */}
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>{formatExpiryTime(session.expiresAt)}</td>

                  {/* Azioni */}
                  <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                    <div className='flex items-center justify-end gap-2'>
                      {/* Revoke Session */}
                      {!isCurrent && (
                        <Button
                          onClick={() => onRevokeSession(session.id)}
                          disabled={actionLoading}
                          variant='ghost'
                          size='sm'
                          title='Revoca sessione'
                        >
                          <Trash2 className='w-4 h-4' />
                        </Button>
                      )}

                      {/* Block/Unblock User - Solo per utenti non-root */}
                      {session.user.role !== 'root' && (
                        <>
                          <Button
                            onClick={() => onBlockUser(session.user.id)}
                            disabled={actionLoading}
                            variant='ghost'
                            size='sm'
                            title='Blocca utente'
                          >
                            <Ban className='w-4 h-4 text-red-600' />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer con count */}
      <div className='bg-gray-50 px-6 py-3 border-t border-gray-200'>
        <p className='text-sm text-gray-700'>
          Totale: <span className='font-medium'>{sessions.length}</span> sessione{sessions.length !== 1 ? 'i' : ''} attiv
          {sessions.length !== 1 ? 'e' : 'a'}
        </p>
      </div>
    </div>
  );
};

export default SessionsTable;
