import React, { useState, useEffect } from 'react';
import { Modal, Button } from '@/core/components/ui';
import { Select, TextArea } from '@/core/components/form';
import { Alert } from '@/core/components/feedback';
import { Ban } from 'lucide-react';
import type { BlockUserRequest, BlockDuration } from '../types';
import { BLOCK_DURATION_LABELS } from '../types';

interface BlockUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (blockData: BlockUserRequest) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const BlockUserModal: React.FC<BlockUserModalProps> = ({ isOpen, onClose, onConfirm, loading, error }) => {
  const [duration, setDuration] = useState<BlockDuration>('24h');
  const [reason, setReason] = useState('');

  // Reset form quando il modal si apre
  useEffect(() => {
    if (isOpen) {
      setDuration('24h');
      setReason('');
    }
  }, [isOpen]);

  /**
   * Gestione submit
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      return;
    }

    await onConfirm({ duration, reason: reason.trim() });
  };

  /**
   * Opzioni select durata
   */
  const durationOptions = Object.entries(BLOCK_DURATION_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='Blocca Utente'
      size='md'
      footer={
        <div className='flex items-center justify-end gap-3'>
          <Button type='button' onClick={onClose} variant='ghost' disabled={loading}>
            Annulla
          </Button>
          <Button type='submit' variant='danger' disabled={loading || !reason.trim()} onClick={handleSubmit}>
            <Ban className='w-4 h-4 mr-2' />
            {loading ? 'Blocco in corso...' : 'Blocca Utente'}
          </Button>
        </div>
      }
    >
      <div className='p-6 space-y-4'>
        {/* Warning */}
        <Alert variant='warning' title='Attenzione'>
          Bloccando questo utente, tutte le sue sessioni attive verranno revocate immediatamente e non potrà più accedere fino
          allo sblocco.
        </Alert>

        {/* Error */}
        {error && (
          <Alert variant='danger' title='Errore'>
            {error}
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* Durata blocco */}
          <Select
            label='Durata blocco'
            value={duration}
            onValueChange={value => setDuration(value as BlockDuration)}
            options={durationOptions}
            disabled={loading}
          />

          {/* Motivo */}
          <TextArea
            label='Motivo del blocco'
            value={reason}
            onChange={e => setReason(e.target.value)}
            minRows={4}
            maxRows={8}
            disabled={loading}
            required
            helperText='Il motivo verrà registrato e sarà visibile nei log di sistema.'
          />
        </form>
      </div>
    </Modal>
  );
};

export default BlockUserModal;
