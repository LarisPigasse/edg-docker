// src/features/accounts/pages/AccountsPage.tsx

import React, { useState } from 'react';
import { Button, Badge, ConfirmModal } from '@/core/components/ui';
import { Alert, Spinner } from '@/core/components/feedback';
import { PageHeader, Card } from '@/core/components/layout';
import Table from '@/core/components/data/table/Table';
import type { TableColumn } from '@/core/components/data/table/Table';
import { Plus, Eye, UserX, UserCheck, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAccounts } from '../hooks/useAccounts';
import { AccountFilters, CreateAccountModal, EditAccountModal, ViewAccountModal } from '../components';
import type { Account, CreateAccountRequest, UpdateAccountRequest } from '../types';

const AccountsPage: React.FC = () => {
  const {
    accounts,
    loading,
    error,
    filters,
    pagination,
    roles,
    setFilters,
    nextPage,
    prevPage,
    refetch,
    createAccount,
    updateAccount,
    deleteAccount,
    activateAccount,
    hardDeleteAccount,
  } = useAccounts();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activateModalOpen, setActivateModalOpen] = useState(false);
  const [hardDeleteModalOpen, setHardDeleteModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // ─── helpers ────────────────────────────────────────────────────────────────

  const isAccountBlocked = (account: Account): boolean => !!account.blockedUntil && new Date(account.blockedUntil) > new Date();

  const getStatusBadge = (account: Account): React.ReactNode => {
    if (isAccountBlocked(account))
      return (
        <Badge variant='danger' size='sm'>
          Bloccato
        </Badge>
      );
    if (!account.isActive)
      return (
        <Badge variant='info' size='sm'>
          Disattivato
        </Badge>
      );
    return (
      <Badge variant='success' size='sm'>
        Attivo
      </Badge>
    );
  };

  const formatDate = (dateString: string): string =>
    new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  // ─── handlers ───────────────────────────────────────────────────────────────

  const handleCreateAccount = async (data: CreateAccountRequest) => {
    setActionLoading(true);
    try {
      await createAccount(data);
      setCreateModalOpen(false);
    } catch (err) {
      console.error('Error creating account:', err);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditAccount = async (accountId: number, data: UpdateAccountRequest) => {
    setActionLoading(true);
    try {
      await updateAccount(accountId, data);
      setEditModalOpen(false);
      setSelectedAccount(null);
    } catch (err) {
      console.error('Error updating account:', err);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!selectedAccount) return;
    setActionLoading(true);
    try {
      await deleteAccount(selectedAccount.id);
      setDeleteModalOpen(false);
      setSelectedAccount(null);
    } catch (err) {
      console.error('Error deleting account:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivateAccount = async () => {
    if (!selectedAccount) return;
    setActionLoading(true);
    try {
      await activateAccount(selectedAccount.id);
      setActivateModalOpen(false);
      setTimeout(() => setSelectedAccount(null), 0);
    } catch (err) {
      console.error('Error activating account:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleHardDeleteAccount = async () => {
    if (!selectedAccount) return;
    setActionLoading(true);
    try {
      await hardDeleteAccount(selectedAccount.id);
      setHardDeleteModalOpen(false);
      setTimeout(() => setSelectedAccount(null), 0);
    } catch (err) {
      console.error('Error hard deleting account:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // ─── colonne tabella ─────────────────────────────────────────────────────────

  const columns: TableColumn<Account>[] = [
    {
      header: 'Email',
      accessor: 'email',
      sortable: true,
    },
    {
      header: 'Ruolo',
      accessor: account => (
        <Badge variant='default' size='sm'>
          {account.role.name}
        </Badge>
      ),
      sortable: false,
    },
    {
      header: 'Tipo',
      accessor: 'accountType',
      sortable: true,
    },
    {
      header: 'Stato',
      accessor: account => getStatusBadge(account),
      sortable: false,
    },
    {
      header: 'Creato il',
      accessor: 'createdAt',
      render: account => <span className='text-body-sm'>{formatDate(account.createdAt)}</span>,
      sortable: true,
    },
  ];

  // ─── render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <PageHeader
        title='Gestione Account'
        subtitle='Visualizza e gestisci tutti gli account della piattaforma'
        onRefresh={refetch}
        isLoading={loading}
        actions={
          <Button variant='primary' leftIcon={<Plus className='w-4 h-4' />} onClick={() => setCreateModalOpen(true)}>
            Crea Account
          </Button>
        }
      />

      {error && (
        <Alert variant='danger' className='mb-6'>
          {error}
        </Alert>
      )}

      <AccountFilters currentFilters={filters} roles={roles} onApply={setFilters} />

      {loading && !accounts.length ? (
        <div className='flex items-center justify-center py-12'>
          <Spinner size='md' />
        </div>
      ) : (
        <>
          <Card variant='default' padding='none'>
            <Table
              data={accounts}
              columns={columns}
              keyExtractor={account => account.id.toString()}
              isLoading={false}
              emptyMessage='Nessun account trovato'
              size='md'
              striped
              hoverable
              rowActions={{
                enabled: true,
                mode: 'menu',
                quickActions: {
                  edit: {
                    enabled: true,
                    onEdit: account => {
                      setSelectedAccount(account);
                      setEditModalOpen(true);
                    },
                  },
                },
                actions: account => {
                  const blocked = isAccountBlocked(account);
                  const inactive = !account.isActive;
                  const neverLoggedIn = account.lastLogin === null;
                  return [
                    {
                      id: 'view',
                      label: 'Visualizza dettagli',
                      icon: <Eye className='w-4 h-4' />,
                      onClick: () => {
                        setSelectedAccount(account);
                        setViewModalOpen(true);
                      },
                    },
                    ...(!inactive && !blocked
                      ? [
                          {
                            id: 'deactivate',
                            label: 'Disattiva account',
                            icon: <UserX className='w-4 h-4' />,
                            onClick: () => {
                              setSelectedAccount(account);
                              setDeleteModalOpen(true);
                            },
                            divider: true,
                          },
                        ]
                      : []),
                    ...(inactive && !blocked
                      ? [
                          {
                            id: 'activate',
                            label: 'Riattiva account',
                            icon: <UserCheck className='w-4 h-4' />,
                            onClick: () => {
                              setSelectedAccount(account);
                              setActivateModalOpen(true);
                            },
                            divider: true,
                          },
                        ]
                      : []),
                    ...(neverLoggedIn
                      ? [
                          {
                            id: 'hard-delete',
                            label: 'Elimina definitivamente',
                            icon: <Trash2 className='w-4 h-4' />,
                            onClick: () => {
                              setSelectedAccount(account);
                              setHardDeleteModalOpen(true);
                            },
                            variant: 'danger' as const,
                            divider: true,
                          },
                        ]
                      : []),
                  ];
                },
              }}
            />

            {/* Paginazione */}
            <div className='bg-bg-secondary px-4 py-2 flex items-center justify-between border-t border-border-default'>
              <div className='text-body-sm'>
                Pagina <span className='font-medium text-text-primary'>{pagination.page + 1}</span>
                {' · '}
                <span className='font-medium text-text-primary'>{accounts.length}</span> di{' '}
                <span className='font-medium text-text-primary'>{pagination.total}</span> account
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  leftIcon={<ChevronLeft className='w-4 h-4' />}
                  onClick={prevPage}
                  disabled={pagination.page === 0 || loading}
                >
                  Indietro
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  rightIcon={<ChevronRight className='w-4 h-4' />}
                  onClick={nextPage}
                  disabled={!pagination.hasMore || loading}
                >
                  Avanti
                </Button>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* ── Modali ──────────────────────────────────────────────────────────── */}

      <CreateAccountModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onConfirm={handleCreateAccount}
        loading={actionLoading}
        roles={roles}
      />

      <ViewAccountModal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setTimeout(() => setSelectedAccount(null), 0);
        }}
        account={selectedAccount}
      />

      <EditAccountModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setTimeout(() => setSelectedAccount(null), 0);
        }}
        onConfirm={handleEditAccount}
        loading={actionLoading}
        account={selectedAccount}
        roles={roles}
      />

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setTimeout(() => setSelectedAccount(null), 0);
        }}
        onConfirm={handleDeleteAccount}
        title='Disattiva Account'
        message={`Sei sicuro di voler disattivare l'account di ${selectedAccount?.email}? L'utente non potrà più accedere al sistema.`}
        confirmText='Disattiva'
        cancelText='Annulla'
        variant='danger'
        isLoading={actionLoading}
      />

      <ConfirmModal
        isOpen={activateModalOpen}
        onClose={() => {
          setActivateModalOpen(false);
          setTimeout(() => setSelectedAccount(null), 0);
        }}
        onConfirm={handleActivateAccount}
        title='Riattiva Account'
        message={`Sei sicuro di voler riattivare l'account di ${selectedAccount?.email}? L'utente potrà nuovamente accedere al sistema.`}
        confirmText='Riattiva'
        cancelText='Annulla'
        variant='default'
        isLoading={actionLoading}
      />

      <ConfirmModal
        isOpen={hardDeleteModalOpen}
        onClose={() => {
          setHardDeleteModalOpen(false);
          setTimeout(() => setSelectedAccount(null), 0);
        }}
        onConfirm={handleHardDeleteAccount}
        title='Elimina Account Definitivamente'
        message={`Stai per eliminare in modo permanente l'account di ${selectedAccount?.email}. Questa operazione è irreversibile.`}
        confirmText='Elimina definitivamente'
        cancelText='Annulla'
        variant='danger'
        isLoading={actionLoading}
      />
    </>
  );
};

export default AccountsPage;
