// src/features/accounts/pages/components/ViewAccountModal.tsx

import React from 'react';
import { Modal, Badge } from '@/core/components/ui';
import type { Account } from '../types';

interface ViewAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
}

// ─── helpers ────────────────────────────────────────────────────────────────

const formatDate = (dateString: string): string =>
  new Date(dateString).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const getAccountStatus = (account: Account): { label: string; variant: 'success' | 'danger' | 'info' } => {
  const isBlocked = account.blockedUntil && new Date(account.blockedUntil) > new Date();
  if (isBlocked) return { label: 'Bloccato', variant: 'danger' };
  if (!account.isActive) return { label: 'Disattivato', variant: 'info' };
  return { label: 'Attivo', variant: 'success' };
};

const accountTypeLabel: Record<string, string> = {
  operatore: 'Operatore',
  partner: 'Partner',
  cliente: 'Cliente',
  agente: 'Agente',
};

// ─── row component ───────────────────────────────────────────────────────────

const DetailRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className='flex items-start py-3 border-b border-gray-100 last:border-0'>
    <span className='w-36 shrink-0 text-sm font-medium text-gray-500'>{label}</span>
    <span className='text-sm text-gray-900 break-all'>{children}</span>
  </div>
);

// ─── main component ──────────────────────────────────────────────────────────

const ViewAccountModal: React.FC<ViewAccountModalProps> = ({ isOpen, onClose, account }) => {
  if (!account) return null;

  const status = getAccountStatus(account);
  const isBlocked = account.blockedUntil && new Date(account.blockedUntil) > new Date();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Dettaglio Account' size='md'>
      <div className='p-6 space-y-1'>
        {/* Header con email e stato */}
        <div className='flex items-center justify-between mb-4 pb-4 border-b border-gray-200'>
          <div>
            <p className='text-lg font-semibold text-gray-900'>{account.email}</p>
            <p className='text-sm text-gray-500'>ID: {account.id}</p>
          </div>
          <Badge variant={status.variant} size='sm'>
            {status.label}
          </Badge>
        </div>

        {/* Sezione: Dati principali */}
        <p className='text-xs font-semibold uppercase tracking-wider text-gray-400 pt-2 pb-1'>Dati Account</p>
        <DetailRow label='Ruolo'>
          <Badge variant='default' size='sm'>
            {account.role.name}
          </Badge>
        </DetailRow>
        <DetailRow label='Tipo Account'>{accountTypeLabel[account.accountType] ?? account.accountType}</DetailRow>
        <DetailRow label='Entity ID'>
          {account.entityId ? (
            <code className='text-xs bg-gray-100 px-1.5 py-0.5 rounded'>{account.entityId}</code>
          ) : (
            <span className='text-gray-400 italic'>Non impostato</span>
          )}
        </DetailRow>

        {/* Sezione: Stato */}
        <p className='text-xs font-semibold uppercase tracking-wider text-gray-400 pt-4 pb-1'>Stato</p>
        <DetailRow label='Attivo'>{account.isActive ? 'Sì' : 'No'}</DetailRow>

        {isBlocked && (
          <>
            <DetailRow label='Bloccato fino a'>{formatDate(account.blockedUntil!)}</DetailRow>
            <DetailRow label='Motivo blocco'>
              {account.blockReason ? (
                <span className='text-red-600'>{account.blockReason}</span>
              ) : (
                <span className='text-gray-400 italic'>Non specificato</span>
              )}
            </DetailRow>
          </>
        )}

        {/* Sezione: Date */}
        <p className='text-xs font-semibold uppercase tracking-wider text-gray-400 pt-4 pb-1'>Cronologia</p>
        <DetailRow label='Creato il'>{formatDate(account.createdAt)}</DetailRow>
        <DetailRow label='Aggiornato il'>{formatDate(account.updatedAt)}</DetailRow>
      </div>
    </Modal>
  );
};

export default ViewAccountModal;
