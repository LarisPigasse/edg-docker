import React from 'react';
import { ConfirmModal } from '@/core/components/ui';

interface UnblockConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading: boolean;
}

const UnblockConfirmModal: React.FC<UnblockConfirmModalProps> = ({ isOpen, onClose, onConfirm, loading }) => {
  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title='Sblocca Utente'
      message='Sei sicuro di voler sbloccare questo utente? Potrà accedere nuovamente al sistema.'
      confirmText='Sblocca'
      loadingText='Sblocco in corso...'
      cancelText='Annulla'
      variant='success'
      isLoading={loading}
    />
  );
};

export default UnblockConfirmModal;
