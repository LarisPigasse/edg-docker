// src/features/sessions/pages/SessionsPage.tsx

import React, { useState } from 'react';
import { useSessions } from '../hooks/useSessions';
import { PageHeader } from '@/core/components/layout';
import { Tabs } from '@/core/components/navigation/';
import type { TabItem } from '@/core/components/navigation/tabs/Tabs';
import { Alert, Spinner } from '@/core/components/feedback';
import { ConfirmModal } from '@/core/components/ui';
import { getErrorMessage } from '@/core/utils';
import SessionsTable from '../components/SessionsTable';
import BlockedUsersTable from '../components/BlockedUsersTable';
import BlockUserModal from '../components/BlockUserModal';
import UnblockConfirmModal from '../components/UnblockConfirmModal';
import type { BlockUserRequest } from '../types';

const SessionsPage: React.FC = () => {
  const {
    sessions,
    blockedUsers,
    loading,
    error,
    refreshSessions,
    handleRevokeSession,
    handleBlockUser,
    handleUnblockUser,
    currentSessionId,
  } = useSessions();

  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [unblockModalOpen, setUnblockModalOpen] = useState(false);
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // ─── handlers ───────────────────────────────────────────────────────────────

  const openBlockModal = (userId: number) => {
    setSelectedUserId(userId);
    setBlockModalOpen(true);
    setActionError(null);
  };

  const openUnblockModal = (userId: number) => {
    setSelectedUserId(userId);
    setUnblockModalOpen(true);
    setActionError(null);
  };

  const confirmBlockUser = async (blockData: BlockUserRequest) => {
    if (!selectedUserId) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await handleBlockUser(selectedUserId, blockData);
      setBlockModalOpen(false);
      setTimeout(() => setSelectedUserId(null), 0);
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const confirmUnblockUser = async () => {
    if (!selectedUserId) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await handleUnblockUser(selectedUserId);
      setUnblockModalOpen(false);
      setTimeout(() => setSelectedUserId(null), 0);
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const onRevokeSession = (sessionId: number) => {
    setSelectedSessionId(sessionId);
    setRevokeModalOpen(true);
    setActionError(null);
  };

  const confirmRevokeSession = async () => {
    if (!selectedSessionId) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await handleRevokeSession(selectedSessionId);
      setRevokeModalOpen(false);
      setTimeout(() => setSelectedSessionId(null), 0);
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  // ─── tab items ───────────────────────────────────────────────────────────────

  const tabItems: TabItem[] = [
    {
      id: 'active-users',
      label: <span>Sessioni attive</span>,
      content: (
        <div>
          <h2 className='text-section-title mb-4'>Tabella delle sessioni attive</h2>
          <SessionsTable
            sessions={sessions}
            currentSessionId={currentSessionId}
            onRevokeSession={onRevokeSession}
            onBlockUser={openBlockModal}
            onUnblockUser={openUnblockModal}
            actionLoading={actionLoading}
          />
        </div>
      ),
    },
    {
      id: 'blocked-users',
      label: <span>Utenti bloccati</span>,
      content: (
        <div>
          <h2 className='text-section-title mb-4'>Tabella degli utenti bloccati</h2>
          <BlockedUsersTable blockedUsers={blockedUsers} onUnblockUser={openUnblockModal} actionLoading={actionLoading} />
        </div>
      ),
    },
  ];

  // ─── render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <PageHeader
        title='Sessioni Attive'
        subtitle={
          <>
            Monitora e gestisci le sessioni utente attive
            {' · '}
            <span className='text-text-info'>Auto-refresh ogni minuto</span>
          </>
        }
        onRefresh={refreshSessions}
        isLoading={loading}
      />

      {/* Errori */}
      {(error || actionError) && (
        <Alert variant='danger' className='mb-6'>
          {error || actionError}
        </Alert>
      )}

      {/* Loading state */}
      {loading && sessions.length === 0 && blockedUsers.length === 0 ? (
        <div className='flex items-center justify-center py-12'>
          <Spinner size='md' />
        </div>
      ) : (
        <div className='bg-bg-secondary p-3 rounded-md'>
          <Tabs items={tabItems} defaultTab='active-users' variant='pills' size='md' />
        </div>
      )}

      {/* Modali */}
      <BlockUserModal
        isOpen={blockModalOpen}
        onClose={() => setBlockModalOpen(false)}
        onConfirm={confirmBlockUser}
        loading={actionLoading}
        error={actionError}
      />

      <UnblockConfirmModal
        isOpen={unblockModalOpen}
        onClose={() => setUnblockModalOpen(false)}
        onConfirm={confirmUnblockUser}
        loading={actionLoading}
      />

      <ConfirmModal
        isOpen={revokeModalOpen}
        onClose={() => {
          setRevokeModalOpen(false);
          setTimeout(() => setSelectedSessionId(null), 0);
        }}
        onConfirm={confirmRevokeSession}
        title='Revoca Sessione'
        message="Sei sicuro di voler revocare questa sessione? L'utente verrà disconnesso da questo dispositivo."
        confirmText='Revoca'
        cancelText='Annulla'
        variant='danger'
        isLoading={actionLoading}
      />
    </>
  );
};

export default SessionsPage;
