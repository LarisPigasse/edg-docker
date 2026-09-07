import React from 'react';
import { CheckCircle, Clock, Ban } from 'lucide-react';
import { Button } from '@/core/components/ui';
import type { BlockedUser } from '../types';

interface BlockedUsersTableProps {
  blockedUsers: BlockedUser[];
  onUnblockUser: (userId: number) => void;
  actionLoading: boolean;
}

const BlockedUsersTable: React.FC<BlockedUsersTableProps> = ({ blockedUsers, onUnblockUser, actionLoading }) => {
  /**
   * Formatta data/ora per blockedUntil
   */
  const formatBlockedUntil = (blockedUntil: string | null): string => {
    if (!blockedUntil) {
      return 'Permanente';
    }

    const date = new Date(blockedUntil);
    const now = new Date();

    // Se è scaduto
    if (date < now) {
      return 'Scaduto (sbloccare manualmente)';
    }

    // Formatta data
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Formatta data blocco
   */
  const formatBlockedAt = (blockedAt: string): string => {
    const date = new Date(blockedAt);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (blockedUsers.length === 0) {
    return (
      <div className='bg-white rounded-lg shadow p-12 text-center'>
        <CheckCircle className='w-16 h-16 text-green-300 mx-auto mb-4' />
        <h3 className='text-lg font-semibold text-gray-900 mb-2'>Nessun utente bloccato</h3>
        <p className='text-gray-600'>Tutti gli utenti hanno accesso al sistema.</p>
      </div>
    );
  }

  return (
    <div className='bg-white rounded-lg shadow overflow-hidden'>
      <div className='overflow-x-auto'>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead className='bg-gray-50'>
            <tr>
              <th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Utente
              </th>
              <th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Motivo Blocco
              </th>
              <th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Bloccato Da
              </th>
              <th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Scadenza
              </th>
              <th scope='col' className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            {blockedUsers.map(user => {
              const isPermanent = !user.blockedUntil;
              const isExpired = user.blockedUntil && new Date(user.blockedUntil) < new Date();

              return (
                <tr key={user.id} className='hover:bg-gray-50'>
                  {/* Utente */}
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='flex items-center gap-3'>
                      <Ban className='w-5 h-5 text-red-500' />
                      <div>
                        <div className='text-sm font-medium text-gray-900'>{user.email}</div>
                        <div className='text-sm text-gray-500'>{user.role}</div>
                      </div>
                    </div>
                  </td>

                  {/* Motivo */}
                  <td className='px-6 py-4'>
                    <div className='text-sm text-gray-900 max-w-xs'>{user.blockReason || 'Nessun motivo specificato'}</div>
                  </td>

                  {/* Bloccato Da */}
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='text-sm text-gray-900'>{formatBlockedAt(user.blockedAt)}</div>
                  </td>

                  {/* Scadenza */}
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='flex items-center gap-2'>
                      {isPermanent ? (
                        <>
                          <Ban className='w-4 h-4 text-red-600' />
                          <span className='text-sm font-medium text-red-600'>Permanente</span>
                        </>
                      ) : isExpired ? (
                        <>
                          <Clock className='w-4 h-4 text-orange-600' />
                          <span className='text-sm font-medium text-orange-600'>Scaduto</span>
                        </>
                      ) : (
                        <>
                          <Clock className='w-4 h-4 text-gray-600' />
                          <span className='text-sm text-gray-900'>{formatBlockedUntil(user.blockedUntil)}</span>
                        </>
                      )}
                    </div>
                  </td>

                  {/* Azioni */}
                  <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                    <Button
                      onClick={() => onUnblockUser(user.id)}
                      disabled={actionLoading}
                      variant='ghost'
                      size='sm'
                      title='Sblocca utente'
                    >
                      <CheckCircle className='w-4 h-4 text-green-600' />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className='bg-gray-50 px-6 py-3 border-t border-gray-200'>
        <p className='text-sm text-gray-700'>
          Totale: <span className='font-medium'>{blockedUsers.length}</span> utente{blockedUsers.length !== 1 ? 'i' : ''}{' '}
          bloccat{blockedUsers.length !== 1 ? 'i' : 'o'}
        </p>
      </div>
    </div>
  );
};

export default BlockedUsersTable;
